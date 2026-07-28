import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import CSRequest from "@/lib/models/CSRequest";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        
        // Find any resolved/rejected CS requests that the user hasn't been notified of yet
        const notifications = await CSRequest.find({
            userId: (session.user as any).id,
            status: { $in: ["RESOLVED", "REJECTED"] },
            userNotified: false
        }).sort({ updatedAt: -1 });

        return NextResponse.json(notifications);
    } catch (error: any) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await req.json();
        
        await dbConnect();
        await CSRequest.findByIdAndUpdate(id, { userNotified: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
