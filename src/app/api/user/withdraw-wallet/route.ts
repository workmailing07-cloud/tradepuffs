import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import WithdrawWalletRequest from "@/lib/models/WithdrawWalletRequest";
import { verifyPassword } from "@/lib/password";

const DEFAULT_NETWORK = "Binance (TRC-20)";

function normalizeAddress(s: unknown): string {
    return String(s || "").trim();
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(userId).select("savedWithdrawAddress savedWithdrawNetwork");
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const hasPendingWithdrawWalletChange = Boolean(
            await WithdrawWalletRequest.exists({ userId, status: "PENDING" })
        );

        return NextResponse.json({
            savedWithdrawAddress: String(user.savedWithdrawAddress || "").trim(),
            savedWithdrawNetwork: String(user.savedWithdrawNetwork || DEFAULT_NETWORK).trim() || DEFAULT_NETWORK,
            hasPendingWithdrawWalletChange,
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const action = String(body.action || "");
        const password = String(body.password || "");
        const address = normalizeAddress(body.address);
        const network = normalizeAddress(body.network) || DEFAULT_NETWORK;

        if (!password) {
            return NextResponse.json({ error: "Wallet password (your login password) is required" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const ok = await verifyPassword(password, user.password);
        if (!ok) {
            return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
        }

        if (action === "setup") {
            const existing = String(user.savedWithdrawAddress || "").trim();
            if (existing) {
                return NextResponse.json({ error: "Withdrawal wallet is already set. Use request change instead." }, { status: 400 });
            }
            if (!address || address.length < 10) {
                return NextResponse.json({ error: "Enter a valid wallet address" }, { status: 400 });
            }
            user.savedWithdrawAddress = address;
            user.savedWithdrawNetwork = network || DEFAULT_NETWORK;
            await user.save();
            return NextResponse.json({
                success: true,
                savedWithdrawAddress: user.savedWithdrawAddress,
                savedWithdrawNetwork: user.savedWithdrawNetwork,
            });
        }

        if (action === "request_change") {
            const existing = String(user.savedWithdrawAddress || "").trim();
            if (!existing) {
                return NextResponse.json({ error: "Set your withdrawal wallet first" }, { status: 400 });
            }
            if (!address || address.length < 10) {
                return NextResponse.json({ error: "Enter a valid new wallet address" }, { status: 400 });
            }
            if (address === existing) {
                return NextResponse.json({ error: "New address must be different from your current one" }, { status: 400 });
            }
            const pending = await WithdrawWalletRequest.findOne({ userId, status: "PENDING" });
            if (pending) {
                return NextResponse.json(
                    { error: "You already have a pending wallet change request. Wait for admin approval." },
                    { status: 400 }
                );
            }
            await WithdrawWalletRequest.create({
                userId,
                newAddress: address,
                newNetwork: network || DEFAULT_NETWORK,
                status: "PENDING",
            });
            return NextResponse.json({ success: true, message: "Change request submitted for admin approval" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
