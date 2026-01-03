import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/restaurant-service";

export async function GET(req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  if (!restaurantId) {
    return NextResponse.json(
      { message: "Missing restaurantId" },
      { status: 400 }
    );
  }

  try {
    const stats = await restaurantService.getRestaurantStats(restaurantId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Stats API Error:", err);
    
    // Return fallback demo data if stats loading fails
    const fallbackStats = {
      totalSales: 0,
      totalInventory: 0,
      totalStaff: 0,
      totalCategories: 0,
      daily: {
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        revenue: [0, 0, 0, 0, 0, 0, 0],
        customers: [0, 0, 0, 0, 0, 0, 0]
      },
      inventory: [],
      orders: []
    };
    
    return NextResponse.json(fallbackStats);
  }
}
