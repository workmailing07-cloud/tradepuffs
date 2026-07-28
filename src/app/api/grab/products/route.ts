import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

function shuffled<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const products = await Product.find({ isActive: true }).select("name image").lean();
        if (!products.length) return NextResponse.json([]);

        const randomized = shuffled(products);
        const minCount = Math.min(8, randomized.length);
        const maxCount = Math.min(12, randomized.length);
        const take = minCount === maxCount
            ? minCount
            : Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

        return NextResponse.json(randomized.slice(0, take));
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
    }
}
