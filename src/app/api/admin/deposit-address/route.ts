import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DepositAddress from "@/lib/models/DepositAddress";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

async function assertAdmin(session: any) {
    if (!session || !(session.user as any).id) throw new Error("Unauthorized");
    await assertAdminPermission((session.user as any).id, "MANAGE_DEPOSIT_ADDRESSES");
    await dbConnect();
}

// GET  /api/admin/deposit-address  → list all active addresses
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        await assertAdmin(session);

        const addresses = await DepositAddress.find({ isActive: true })
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        return NextResponse.json(addresses);
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}

// POST /api/admin/deposit-address  → create or update address (global or per-user)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        await assertAdmin(session);

        const { address, network, userId } = await req.json();
        if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 });

        // Deactivate any previous active address for the same scope
        await DepositAddress.updateMany(
            { userId: userId || null, isActive: true },
            { $set: { isActive: false } }
        );

        const newAddress = await DepositAddress.create({
            address,
            network: network || "TRON (TRC-20)",
            userId: userId || null,
            isActive: true,
        });

        return NextResponse.json(newAddress);
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}

// DELETE /api/admin/deposit-address?id=xxx → deactivate one address
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        await assertAdmin(session);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        await DepositAddress.findByIdAndUpdate(id, { isActive: false });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}
