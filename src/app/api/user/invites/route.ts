import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const me = await User.findById(userId).select("invitationCode totalInvites");
        if (!me) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const invites = await User.find({ invitedBy: userId })
            .select("name email invitationCode createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            invitationCode: me.invitationCode || "",
            totalInvites: Number(me.totalInvites || 0),
            invites,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}
