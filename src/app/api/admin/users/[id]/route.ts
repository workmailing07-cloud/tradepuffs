import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminUsersServer } from "@/lib/services/server/admin-users.server";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await adminUsersServer.assertManageUsers((session.user as any).id);

        const { id } = await ctx.params;
        const user = await adminUsersServer.getById(id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json(user);
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const adminId = (session.user as any).id;
        await adminUsersServer.assertManageUsers(adminId);

        const { id } = await ctx.params;
        const body = await req.json();
        const result = await adminUsersServer.update(id, adminId, {
            name: body.name,
            email: body.email,
            password: body.password,
            role: body.role,
            staffRole: body.staffRole,
            balance: body.balance,
            status: body.status,
            maxDailyTasks: body.maxDailyTasks,
            dailyTasksCompleted: body.dailyTasksCompleted,
            taskRequestStatus: body.taskRequestStatus,
        });
        return NextResponse.json(result);
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : msg === "User not found" ? 404 : 400 }
        );
    }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const adminId = (session.user as any).id;
        await adminUsersServer.assertManageUsers(adminId);

        const { id } = await ctx.params;
        const result = await adminUsersServer.deleteUser(id, adminId);
        return NextResponse.json(result);
    } catch (e: any) {
        const msg = e.message || "Server error";
        return NextResponse.json(
            { error: msg },
            { status: msg === "Forbidden" ? 403 : msg === "User not found" ? 404 : 400 }
        );
    }
}
