import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { configureCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user && "id" in session.user ? (session.user as { id?: string }).id : undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Screenshot file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or less" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const cloudinary = configureCloudinary();
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: `thetrade/payment-screenshots/${userId}`,
      resource_type: "image",
    });

    return NextResponse.json({
      secureUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload screenshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
