// app/RESTAURANT/[restaurantId]/api/admin/staff/route.ts
import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/restaurant-service";

export async function GET(req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  try {
    const { restaurantId } = await params;
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const staff = await restaurantService.getStaff(restaurantId);
    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}