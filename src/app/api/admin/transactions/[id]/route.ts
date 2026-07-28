import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transactionServerService } from "@/lib/services/server/transaction.server";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { status } = await req.json();
        if (!status || !["COMPLETED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { id } = await params;
        const adminUserId = (session.user as any).id;
        await assertAdminPermission(adminUserId, "MANAGE_TRANSACTIONS");
        const transaction = await transactionServerService.updateTransactionStatus(
            id, 
            status as "COMPLETED" | "REJECTED", 
            adminUserId
        );

        return NextResponse.json({ message: "Success", transaction });
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json(
            { error: msg }, 
            { status: msg === "Forbidden" || msg.includes("Unauthorized") ? 403 : 400 }
        );
    }
}
