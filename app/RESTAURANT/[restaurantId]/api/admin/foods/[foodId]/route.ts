// app/RESTAURANT/[restaurantId]/api/admin/foods/[foodId]/route.ts
import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/restaurant-service";

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ restaurantId: string; foodId: string }> }
) {
  try {
    const { restaurantId, foodId } = await params;
    const body = await req.json();
    
    if (!restaurantId || !foodId) {
      return NextResponse.json(
        { error: "Restaurant ID and Food ID are required" },
        { status: 400 }
      );
    }

    const success = await restaurantService.updateFood(restaurantId, foodId, body);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update food item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Food item updated successfully' 
    });
  } catch (error) {
    console.error('Error updating food:', error);
    return NextResponse.json(
      { error: 'Failed to update food item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ restaurantId: string; foodId: string }> }
) {
  try {
    const { restaurantId, foodId } = await params;
    
    if (!restaurantId || !foodId) {
      return NextResponse.json(
        { error: "Restaurant ID and Food ID are required" },
        { status: 400 }
      );
    }

    const success = await restaurantService.deleteFood(restaurantId, foodId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete food item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Food item deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting food:', error);
    return NextResponse.json(
      { error: 'Failed to delete food item' },
      { status: 500 }
    );
  }
}