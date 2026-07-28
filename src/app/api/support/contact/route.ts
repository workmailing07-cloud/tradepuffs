import { NextResponse } from "next/server";
import { supportConfigServer } from "@/lib/services/server/support-config.server";

export async function GET() {
    try {
        const data = await supportConfigServer.getPublicContact();
        return NextResponse.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
