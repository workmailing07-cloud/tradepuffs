import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DepositAddress from "@/lib/models/DepositAddress";

// Returns the active deposit address for the current user.
// User-specific address takes priority over the global one.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        // 1. Look for a user-specific active address first
        const userAddress = await DepositAddress.findOne({
            userId,
            isActive: true,
        }).sort({ createdAt: -1 });

        if (userAddress) {
            return NextResponse.json({ address: userAddress.address, network: userAddress.network });
        }

        // 2. Fall back to global address (userId: null)
        const globalAddress = await DepositAddress.findOne({
            userId: null,
            isActive: true,
        }).sort({ createdAt: -1 });

        if (!globalAddress) {
            return NextResponse.json({ address: null, network: "TRON (TRC-20)" });
        }

        return NextResponse.json({ address: globalAddress.address, network: globalAddress.network });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}
