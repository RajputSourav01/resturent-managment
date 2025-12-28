import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/restaurant-service";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import bcrypt from "bcryptjs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  try {
    const { restaurantId } = await params;
    const formData = await req.formData();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const fullName = formData.get("fullName")?.toString() || "";
    const address = formData.get("address")?.toString() || "";
    const mobile = formData.get("mobile")?.toString() || "";
    const aadhaar = formData.get("aadhaar")?.toString() || "";
    const designation = formData.get("designation")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    console.log("Add staff data:", { fullName, mobile, designation, password: password ? "***" : "empty" });

    if (!fullName.trim() || !mobile.trim() || !password.trim()) {
      return NextResponse.json(
        { error: "fullName, mobile and password are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle Image Upload to Cloudinary
    const imageFile = formData.get("image") as File | null;
    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      imageUrl = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: "staff" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result!.secure_url);
          }
        );
        streamifier.createReadStream(buffer).pipe(upload);
      });
    }

    // Add staff using restaurant service
    const staffId = await restaurantService.addStaff(restaurantId, {
      fullName,
      address,
      mobile,
      aadhaar,
      designation,
      imageUrl,
      password: hashedPassword
    });

    return NextResponse.json({ ok: true, id: staffId });
  } catch (error: any) {
    console.error("Add staff error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
