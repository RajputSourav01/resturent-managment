import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // your firebase config
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    // ✅ Fetch foods
    const foodsSnap = await getDocs(collection(db, "foods"));
    const foodsCount = foodsSnap.size;

    // ✅ Fetch staff
    const staffSnap = await getDocs(collection(db, "staff"));
    const staffCount = staffSnap.size;

    // ✅ Fetch recent orders
    const orderSnap = await getDocs(collection(db, "orders"));
    const orders = orderSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Calculate total sales
    const totalSales = orders.reduce(
      (sum: number, o: any) => sum + (o.total || 0),
      0
    );

    // ✅ Inventory list
    const inventory = foodsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || "Unknown",
        stock: d.stock || 0,
        category: d.category || "General",
      };
    });

    // ✅ UNIQUE CATEGORY COUNT FROM FOODS (NO DUPLICATES)
    const uniqueCategories = new Set<string>();

    foodsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        uniqueCategories.add(data.category.trim());
      }
    });

    const uniqueCategoryCount = uniqueCategories.size;

    // ✅ Daily stats fallback
    const daily = {
      dates: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      revenue: [100, 250, 300, 200, 150, 400, 500],
      customers: [5, 10, 15, 8, 12, 20, 25],
    };

    return NextResponse.json({
      totalSales,
      totalInventory: foodsCount,
      totalStaff: staffCount,

      // ✅ category count based on FOODS collection (no duplicates)
      totalCategories: uniqueCategoryCount,

      daily,
      inventory,
      orders: orders.slice(0, 10),
    });
  } catch (err) {
    console.error("Stats API Error:", err);
    return NextResponse.json(
      { message: "Failed to load stats" },
      { status: 500 }
    );
  }
}
