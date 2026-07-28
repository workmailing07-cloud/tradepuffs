import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { staffRolesServer } from "@/lib/services/server/staff-roles.server";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await ctx.params;
        const body = await req.json();
        const doc = await staffRolesServer.update((session.user as any).id, id, {
            name: body.name,
            description: body.description,
            permissions: body.permissions,
        });
        return NextResponse.json(doc);
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : msg === "Role not found" ? 404 : 400 }
        );
    }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await ctx.params;
        const result = await staffRolesServer.remove((session.user as any).id, id);
        return NextResponse.json(result);
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : msg.includes("Cannot delete") || msg === "Role not found" ? 400 : 500 }
        );
    }
}
