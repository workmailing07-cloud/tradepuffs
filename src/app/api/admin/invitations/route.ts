import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/lib/models/User";
import dbConnect from "@/lib/mongodb";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await assertAdminPermission((session.user as any).id, "MANAGE_INVITATIONS");
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const search = (searchParams.get("search") || "").trim();
        const role = (searchParams.get("role") || "").trim().toUpperCase();
        const inviterId = (searchParams.get("inviterId") || "").trim();

        const query: Record<string, any> = {};
        if (role === "ADMIN" || role === "USER") query.role = role;
        if (inviterId) query.invitedBy = inviterId;
        if (search) {
            query.$or = [
                { invitationCode: { $regex: search, $options: "i" } },
                { invitedByCode: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const users = await User.find(query)
            .select("name email role invitationCode invitedByCode invitedBy totalInvites createdAt")
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        return NextResponse.json(users);
    } catch (error: any) {
        const msg = error.message || "Server error";
        return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
    }
}
