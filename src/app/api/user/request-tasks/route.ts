import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { taskSettingsServer } from "@/lib/services/server/task-settings.server";

function formatWaitTime(ms: number) {
    const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
    if (totalMinutes < 60) return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hour${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} minute${minutes === 1 ? "" : "s"}` : ""}`;
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const maxTasks = Number(user.maxDailyTasks || 25);
        const completed = Number(user.dailyTasksCompleted || 0);
        const settings = await taskSettingsServer.getSettings();
        const cooldownMs = settings.requestCooldownMinutes * 60 * 1000;

        if (completed >= maxTasks) {
            const completedAt = user.lastGrabDate ? new Date(user.lastGrabDate).getTime() : 0;
            const nextAllowedAt = completedAt + cooldownMs;
            const now = Date.now();

            if (cooldownMs > 0 && completedAt > 0 && now < nextAllowedAt) {
                return NextResponse.json(
                    {
                        error: `Please wait ${formatWaitTime(nextAllowedAt - now)} before requesting new orders.`,
                        nextTaskRequestAt: new Date(nextAllowedAt).toISOString(),
                    },
                    { status: 400 }
                );
            }

            user.dailyTasksCompleted = 0;
            user.dailyCommission = 0;
            user.taskRequestStatus = "NONE";
        }

        if (user.taskRequestStatus && user.taskRequestStatus !== "NONE") {
            return NextResponse.json({ error: "Task request already exists or approved" }, { status: 400 });
        }

        user.taskRequestStatus = "PENDING";
        await user.save();

        return NextResponse.json({ message: "Task request submitted successfully" });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
