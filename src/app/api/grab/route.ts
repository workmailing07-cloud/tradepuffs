import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { grabServerService } from "@/lib/services/server/grab.server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await grabServerService.grabNewOrder((session.user as any).id);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Something went wrong" }, 
            { status: 400 }
        );
    }
}
