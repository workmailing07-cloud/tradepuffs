import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CSRequest from "@/lib/models/CSRequest";
import dbConnect from "@/lib/mongodb";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, message, type, screenshotUrl, screenshotPublicId, depositAmount } = await req.json();
        const userId = (session.user as any).id;
        const requestType = type || "COMBO_UNLOCK";
        
        await dbConnect();

        // 1. Guard: Check for existing OPEN/IN_PROGRESS requests
        const existingRequest = await CSRequest.findOne({
            userId,
            status: { $in: ["OPEN", "IN_PROGRESS"] },
            type: requestType
        });

        if (existingRequest) {
            return NextResponse.json(
                { error: "Wait! We have received your previous request and will respond soon. ⏳" }, 
                { status: 400 }
            );
        }

        if (requestType === "DEPOSIT_HELP" && !screenshotUrl) {
            return NextResponse.json(
                { error: "Please upload your payment screenshot before submitting." },
                { status: 400 }
            );
        }

        // 2. Create the request
        const request = await CSRequest.create({
            userId,
            orderId,
            message,
            type: requestType,
            screenshotUrl: screenshotUrl || "",
            screenshotPublicId: screenshotPublicId || "",
            depositAmount: Number(depositAmount) || 0,
            status: "OPEN",
            userNotified: false
        });

        return NextResponse.json({ success: true, request });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to create request" }, 
            { status: 400 }
        );
    }
}
