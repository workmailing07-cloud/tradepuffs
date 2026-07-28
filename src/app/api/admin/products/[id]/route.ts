import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

async function assertAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) throw new Error("Unauthorized");
    await assertAdminPermission((session.user as any).id, "MANAGE_PRODUCTS");
    await dbConnect();
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        await assertAdmin();
        const { id } = await ctx.params;
        const body = await req.json();
        const update: Record<string, unknown> = {};
        if (typeof body.name === "string") update.name = body.name.trim();
        if (typeof body.image === "string") update.image = body.image.trim();
        if (typeof body.isActive === "boolean") update.isActive = body.isActive;
        const product = await Product.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
        return NextResponse.json(product);
    } catch (e: any) {
        const msg = e.message || "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : msg === "Product not found" ? 404 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        await assertAdmin();
        const { id } = await ctx.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        const msg = e.message || "Server error";
        const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : msg === "Product not found" ? 404 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}
