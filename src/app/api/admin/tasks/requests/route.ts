import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Server error";
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await assertAdminPermission((session.user as any).id, "MANAGE_TASK_REQUESTS");
        await dbConnect();
        const pendingUsers = await User.find({ taskRequestStatus: "PENDING" }).select("-password");

        return NextResponse.json(pendingUsers);
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminUserId = (session.user as { id?: string }).id;
        if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await assertAdminPermission(adminUserId, "MANAGE_TASK_REQUESTS");
        await dbConnect();

        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.taskRequestStatus !== "PENDING") {
            return NextResponse.json({ error: "Task request is not pending" }, { status: 400 });
        }

        user.taskRequestStatus = "NONE";
        user.comboConfig = [];
        await user.save();

        return NextResponse.json({ message: "Task request cancelled" });
    } catch (error: unknown) {
        const msg = getErrorMessage(error);
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
