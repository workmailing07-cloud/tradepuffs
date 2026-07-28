import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transactionServerService } from "@/lib/services/server/transaction.server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type, amount, depositAddress, withdrawAddress, withdrawNetwork } = await req.json();
        const userId = (session.user as any).id;

        if (!type || !amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const result = await transactionServerService.processTransaction(
            userId, type, amount, depositAddress, withdrawAddress, withdrawNetwork
        );
        return NextResponse.json({ message: "Success", ...result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Server error" }, { status: error.message === "User not found" ? 404 : 400 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const transactions = await transactionServerService.getRecentTransactions((session.user as any).id);
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
