import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminUsersServer } from "@/lib/services/server/admin-users.server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await adminUsersServer.assertManageUsers((session.user as any).id);

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const limit = parseInt(searchParams.get("limit") || "200", 10);

        const users = await adminUsersServer.list(search, role || undefined, limit);
        return NextResponse.json(users);
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await adminUsersServer.assertManageUsers((session.user as any).id);

        const body = await req.json();
        const created = await adminUsersServer.create((session.user as any).id, {
            name: body.name,
            email: body.email,
            password: body.password,
            role: body.role,
            staffRole: body.staffRole,
            balance: body.balance,
            status: body.status,
            inviterInvitationCode: body.inviterInvitationCode,
        });
        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : msg.includes("already") || msg.includes("required") ? 400 : 500 }
        );
    }
}
