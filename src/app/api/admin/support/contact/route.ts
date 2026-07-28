import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supportConfigServer } from "@/lib/services/server/support-config.server";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await assertAdminPermission(userId, "MANAGE_CS");
        const data = await supportConfigServer.getPublicContact();
        return NextResponse.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
        const data = await supportConfigServer.updateForAdmin(userId, {
            telegramUsername: body.telegramUsername,
        });
        return NextResponse.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const data = await supportConfigServer.deleteForAdmin(userId);
        return NextResponse.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
