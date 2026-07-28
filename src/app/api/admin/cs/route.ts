import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import CSRequest from "@/lib/models/CSRequest";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        await assertAdminPermission((session.user as any).id, "MANAGE_CS");

        const requests = await CSRequest.find({ status: "OPEN" })
            .populate("userId", "name email balance")
            .populate("orderId")
            .sort({ createdAt: -1 });

        return NextResponse.json(requests);
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        await assertAdminPermission((session.user as any).id, "MANAGE_CS");

        const { id, status, adminRemark } = await req.json();
        if (!["RESOLVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid request status" }, { status: 400 });
        }

        const request = await CSRequest.findById(id);
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        request.status = status;
        request.adminRemark = adminRemark;
        await request.save();

        // If the request was for COMBO_UNLOCK, we should authorize the order
        if (request.type === "COMBO_UNLOCK" && status === "RESOLVED" && request.orderId) {
            const GrabOrder = (await import("@/lib/models/GrabOrder")).default;
            const order = await GrabOrder.findById(request.orderId);
            if (order) {
                const required = Math.max(0, Number(order.requiredDeposit) || 0);
                order.depositedAmount = required;
                order.isAdminAuthorized = true;
                await order.save();
            }
            
            // Also notify user by resetting status? (Implicitly they will see the submit button now)
            const targetUser = await User.findById(request.userId);
            if (targetUser) {
                targetUser.status = "ACTIVE";
                await targetUser.save();
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
