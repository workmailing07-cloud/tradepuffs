import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { grabServerService } from "@/lib/services/server/grab.server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await req.json();
        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        const result = await grabServerService.completeOrder(orderId, (session.user as any).id);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Something went wrong" }, 
            { status: 400 }
        );
    }
}
