import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import dbConnect from "@/lib/mongodb";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

type AdminHistoryItem = {
    id: string;
    eventType: "USER_REGISTERED" | "TRANSACTION";
    createdAt: string;
    userName: string;
    userEmail: string;
    role: string;
    invitationCode?: string;
    invitedByCode?: string;
    txType?: "DEPOSIT" | "WITHDRAW";
    direction?: "INCOMING" | "OUTGOING";
    amount?: number;
    status?: string;
    address?: string;
    network?: string;
};

function toTimestamp(value: unknown): number {
    const t = new Date(value as string | Date).getTime();
    return Number.isFinite(t) ? t : 0;
}

function toIso(value: unknown): string {
    const t = toTimestamp(value);
    return t > 0 ? new Date(t).toISOString() : new Date(0).toISOString();
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await assertAdminPermission((session.user as any).id, "VIEW_HISTORY");
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const typeFilter = (searchParams.get("type") || "ALL").toUpperCase();
        const search = (searchParams.get("search") || "").trim();
        const includeRegistrations = typeFilter === "ALL" || typeFilter === "REGISTERED";

        const txQuery: Record<string, unknown> = {};
        if (typeFilter === "DEPOSIT" || typeFilter === "WITHDRAW") txQuery.type = typeFilter;

        if (search) {
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { invitationCode: { $regex: search, $options: "i" } },
                    { invitedByCode: { $regex: search, $options: "i" } },
                ],
            })
                .select("_id")
                .lean();
            const userIds = matchingUsers.map((u: { _id: unknown }) => u._id);

            const txSearchOr: Record<string, unknown>[] = [
                { depositAddress: { $regex: search, $options: "i" } },
                { withdrawAddress: { $regex: search, $options: "i" } },
                { withdrawNetwork: { $regex: search, $options: "i" } },
            ];
            if (userIds.length > 0) txSearchOr.push({ userId: { $in: userIds } });
            txQuery.$or = txSearchOr;
        }

        const fetches: [Promise<unknown[]>, Promise<unknown[]>] = [
            includeRegistrations
                ? User.find(search ? {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { invitationCode: { $regex: search, $options: "i" } },
                        { invitedByCode: { $regex: search, $options: "i" } },
                    ],
                } : {})
                    .select("name email role invitationCode invitedByCode createdAt")
                    .sort({ createdAt: -1 })
                    .limit(500)
                    .lean()
                : Promise.resolve([]),
            typeFilter === "ALL" || typeFilter === "DEPOSIT" || typeFilter === "WITHDRAW" || typeFilter === "REGISTERED"
                ? Transaction.find(txQuery)
                    .populate("userId", "name email role invitationCode invitedByCode")
                    .sort({ createdAt: -1 })
                    .limit(500)
                    .lean()
                : Promise.resolve([]),
        ];

        const [users, txs] = await Promise.all(fetches);

        const registerEvents: AdminHistoryItem[] = (users as Array<Record<string, unknown>>).map((u) => ({
            id: `reg-${u._id}`,
            eventType: "USER_REGISTERED",
            createdAt: toIso(u.createdAt),
            userName: (u.name as string) || "Unknown",
            userEmail: (u.email as string) || "—",
            role: (u.role as string) || "USER",
            invitationCode: (u.invitationCode as string) || "",
            invitedByCode: (u.invitedByCode as string) || "",
        }));

        const txEvents: AdminHistoryItem[] = (txs as Array<Record<string, unknown>>).map((tx) => {
            const user = tx.userId as Record<string, unknown> | null;
            return {
                id: `tx-${tx._id}`,
                eventType: "TRANSACTION",
                createdAt: toIso(tx.createdAt),
                userName: (user?.name as string) || "Unknown",
                userEmail: (user?.email as string) || "—",
                role: (user?.role as string) || "USER",
                invitationCode: (user?.invitationCode as string) || "",
                invitedByCode: (user?.invitedByCode as string) || "",
                txType: tx.type as "DEPOSIT" | "WITHDRAW",
                direction: tx.type === "DEPOSIT" ? "INCOMING" : "OUTGOING",
                amount: tx.amount as number,
                status: tx.status as string,
                address: tx.type === "DEPOSIT" ? (tx.depositAddress as string) : (tx.withdrawAddress as string),
                network: (tx.withdrawNetwork as string) || "",
            };
        });

        const events = [...registerEvents, ...txEvents]
            .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
            .slice(0, 800);

        return NextResponse.json(events);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
