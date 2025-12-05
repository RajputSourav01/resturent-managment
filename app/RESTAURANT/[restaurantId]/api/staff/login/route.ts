export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username & password required" },
        { status: 400 }
      );
    }

    // Search username (case-insensitive)
    const staffRef = collection(db, "staff");
    const snap = await getDocs(staffRef);

    let userDoc: any = null;

    snap.forEach((doc) => {
      const data = doc.data();
      if (data.fullName?.toLowerCase() === username.toLowerCase()) {
        userDoc = { id: doc.id, ...data };
      }
    });

    if (!userDoc) {
      return NextResponse.json({ error: "Invalid username" }, { status: 401 });
    }

    // Compare password (case-sensitive)
    const isMatch = await bcrypt.compare(password, userDoc.password);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      staff: {
        id: userDoc.id,
        fullName: userDoc.fullName,
        designation: userDoc.designation,
        imageUrl: userDoc.imageUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
