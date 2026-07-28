import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import WithdrawWalletRequest from "@/lib/models/WithdrawWalletRequest";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

async function assertAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as { id?: string }).id) throw new Error("Unauthorized");
    await assertAdminPermission((session.user as { id: string }).id, "MANAGE_WITHDRAW_WALLET_REQUESTS");
    await dbConnect();
}

export async function GET() {
    try {
        await assertAdmin();
        const requests = await WithdrawWalletRequest.find({ status: "PENDING" })
            .populate("userId", "name email savedWithdrawAddress savedWithdrawNetwork")
            .sort({ createdAt: -1 });
        return NextResponse.json(requests);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
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

        const request = await WithdrawWalletRequest.findById(id);
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.status !== "PENDING") {
            return NextResponse.json({ error: "Request already processed" }, { status: 400 });
        }

        if (status === "APPROVED") {
            const user = await User.findById(request.userId);
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
            user.savedWithdrawAddress = String(request.newAddress || "").trim();
            user.savedWithdrawNetwork = String(request.newNetwork || "").trim() || "Binance (TRC-20)";
            await user.save();
        }

        request.status = status;
        request.adminRemark = String(adminRemark || "");
        await request.save();
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}
