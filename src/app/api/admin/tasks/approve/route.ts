import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";
import { normalizeComboConfig } from "@/lib/combo-config";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await assertAdminPermission((session.user as any).id, "MANAGE_TASK_REQUESTS");
        await dbConnect();

        const { userId, comboConfig } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.taskRequestStatus = "APPROVED";
        user.comboConfig = normalizeComboConfig(comboConfig);
        // Reset progress so the user starts a fresh batch of tasks
        user.dailyTasksCompleted = 0;
        user.dailyCommission = 0;
        await user.save();

        return NextResponse.json({ message: "Tasks approved and configured" });
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
