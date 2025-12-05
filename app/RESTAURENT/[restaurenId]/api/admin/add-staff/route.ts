import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import bcrypt from 'bcryptjs';  // ⭐ ADD THIS

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Read fields
    const fullName = formData.get('fullName')?.toString() || '';
    const address = formData.get('address')?.toString() || '';
    const mobile = formData.get('mobile')?.toString() || '';
    const aadhaar = formData.get('aadhaar')?.toString() || '';
    const designation = formData.get('designation')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (!fullName.trim() || !mobile.trim()) {
      return NextResponse.json(
        { error: 'fullName and mobile are required' },
        { status: 400 }
      );
    }

    // ⭐ HASH password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle Image Upload
    const imageFile = formData.get('image') as File | null;
    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      imageUrl = await new Promise<string>((resolve, reject) => {
        const up = cloudinary.uploader.upload_stream(
          { folder: 'staff' },
          (err, result) => {
            if (err) return reject(err);
            resolve(result!.secure_url);
          }
        );
        streamifier.createReadStream(buffer).pipe(up);
      });
    }

    // Save to Firestore
    const staffCollection = process.env.STAFF_COLLECTION || 'staff';
    const docRef = await addDoc(collection(db, staffCollection), {
      fullName,
      address,
      mobile,
      aadhaar,
      designation,
      imageUrl,
      password: hashedPassword, // ⭐ STORE HASHED PASSWORD
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (error: any) {
    console.error('Error in add-staff route:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
