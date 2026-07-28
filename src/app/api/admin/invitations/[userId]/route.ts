import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/lib/models/User";
import dbConnect from "@/lib/mongodb";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await assertAdminPermission((session.user as any).id, "MANAGE_INVITATIONS");
        await dbConnect();

        const { userId } = await ctx.params;
        const user = await User.findById(userId).select("name email invitationCode role totalInvites");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const directInvites = await User.find({ invitedBy: userId })
            .select("name email role invitationCode invitedByCode totalInvites createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ user, directInvites });
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
