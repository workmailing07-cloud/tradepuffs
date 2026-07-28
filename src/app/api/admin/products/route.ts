import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

async function assertAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) throw new Error("Unauthorized");
    await assertAdminPermission((session.user as any).id, "MANAGE_PRODUCTS");
    await dbConnect();
    return User.findById((session.user as any).id);
}

export async function GET(req: Request) {
    try {
        await assertAdmin();
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("search") || "").trim();
        const query: Record<string, unknown> = {};
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: "i" } },
                { image: { $regex: q, $options: "i" } },
            ];
        }
        const products = await Product.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json(products);
    } catch (e: any) {
        const msg = e.message || "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await assertAdmin();
        const body = await req.json();
        const name = String(body.name || "").trim();
        const image = String(body.image || "").trim();
        if (!name || !image) {
            return NextResponse.json({ error: "Name and image are required" }, { status: 400 });
        }
        const product = await Product.create({
            name,
            image,
            isActive: body.isActive !== false,
            createdBy: admin._id,
        });
        return NextResponse.json(product, { status: 201 });
    } catch (e: any) {
        const msg = e.message || "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}
