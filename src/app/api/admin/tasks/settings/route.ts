import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";
import { taskSettingsServer } from "@/lib/services/server/task-settings.server";

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Server error";
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await assertAdminPermission(userId, "MANAGE_TASK_REQUESTS");
        const data = await taskSettingsServer.getSettings();
        return NextResponse.json(data);
    } catch (error: unknown) {
        const msg = getErrorMessage(error);
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const data = await taskSettingsServer.updateForAdmin(userId, {
            requestCooldownMinutes: body.requestCooldownMinutes,
        });
        return NextResponse.json(data);
    } catch (error: unknown) {
        const msg = getErrorMessage(error);
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
