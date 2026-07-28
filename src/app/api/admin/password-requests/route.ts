import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import PasswordChangeRequest from "@/lib/models/PasswordChangeRequest";
import bcrypt from "bcryptjs";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

async function assertAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) throw new Error("Unauthorized");
    await assertAdminPermission((session.user as any).id, "MANAGE_PASSWORD_REQUESTS");
    await dbConnect();
}

export async function GET() {
    try {
        await assertAdmin();
        const requests = await PasswordChangeRequest.find({ status: "PENDING" })
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });
        return NextResponse.json(requests);
    } catch (e: any) {
        const msg = e.message || "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}

export async function PATCH(req: Request) {
    try {
        await assertAdmin();
        const { id, status, adminRemark } = await req.json();
        if (!id || !status || !["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const request = await PasswordChangeRequest.findById(id);
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.status !== "PENDING") {
            return NextResponse.json({ error: "Request already processed" }, { status: 400 });
        }

        if (status === "APPROVED") {
            const user = await User.findById(request.userId);
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
            user.password = await bcrypt.hash(request.newPassword, 10);
            user.plainPassword = request.newPassword;
            await user.save();
        }

        request.status = status;
        request.adminRemark = String(adminRemark || "");
        await request.save();
        return NextResponse.json({ success: true });
    } catch (e: any) {
        const msg = e.message || "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}
