import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transactionServerService } from "@/lib/services/server/transaction.server";
import dbConnect from "@/lib/mongodb";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await assertAdminPermission((session.user as any).id, "MANAGE_TRANSACTIONS");
        await dbConnect();

        const transactions = await transactionServerService.getPendingTransactions();
        return NextResponse.json(transactions);
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : 500 }
        );
    }
}
