import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { staffRolesServer } from "@/lib/services/server/staff-roles.server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const roles = await staffRolesServer.listForActor((session.user as any).id);
        return NextResponse.json(roles);
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
        const body = await req.json();
        const doc = await staffRolesServer.create((session.user as any).id, {
            name: body.name,
            description: body.description,
            permissions: body.permissions,
        });
        return NextResponse.json(doc, { status: 201 });
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : msg.includes("required") || msg.includes("exists") ? 400 : 500 }
        );
    }
}
