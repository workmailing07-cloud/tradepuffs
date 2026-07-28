import { NextResponse } from "next/server";
import { authServerService } from "@/lib/services/server/auth.server";

export async function POST(req: Request) {
    try {
        const data = await req.json();

        if (!data.name || !data.email || !data.password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await authServerService.registerUser(data);
        return NextResponse.json({ message: "User created", user }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Server error" }, { status: error.message === "User already exists" ? 400 : 500 });
    }
}
