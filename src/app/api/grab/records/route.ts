import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import GrabOrder from "@/lib/models/GrabOrder";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        // Return all statuses so the UI can split into Incomplete / Complete tabs
        const records = await GrabOrder.find({
            userId,
            status: { $in: ["PENDING", "COMPLETED", "CANCELLED"] },
        })
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json(records);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
