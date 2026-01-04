export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

export async function POST(req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  try {
    const { restaurantId } = await params;
    const { mobile, password } = await req.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { error: "Mobile & password required" },
        { status: 400 }
      );
    }

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Check if restaurant is blocked
    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (restaurantSnap.exists() && restaurantSnap.data()?.isBlocked) {
        return NextResponse.json(
          { error: "Restaurant is temporarily blocked. Please contact support for assistance." },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Error checking restaurant status:", error);
    }

    // Search mobile in restaurant-specific staff collection
    const staffRef = collection(db, "restaurants", restaurantId, "staff");
    const q = query(
      staffRef, 
      where("mobile", "==", mobile),
      where("isActive", "==", true)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid mobile number or staff inactive" }, { status: 401 });
    }

    const userDoc = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

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
        restaurantId: restaurantId
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
