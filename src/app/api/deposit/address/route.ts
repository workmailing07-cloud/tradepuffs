import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CUSTOMER_DEPOSIT_ADDRESS =
    "TAhBdywfRAbxUjxYNdCEVMb6oyyzcAMiuq";

const CUSTOMER_DEPOSIT_NETWORK =
    "TRON (TRC-20)";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !(session.user as any)?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Customer-facing deposit address.
        // Admin-managed DepositAddress records are NOT queried here.
        return NextResponse.json(
            {
                address: CUSTOMER_DEPOSIT_ADDRESS,
                network: CUSTOMER_DEPOSIT_NETWORK,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate, proxy-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                },
            }
        );
    } catch (error) {
        console.error("Customer deposit address error:", error);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
