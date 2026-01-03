// app/RESTAURANT/[restaurantId]/api/admin/foods/route.ts
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

    const foods = await restaurantService.getFoods(restaurantId);
    return NextResponse.json({ foods });
  } catch (error) {
    console.error('Error fetching foods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  try {
    const { restaurantId } = await params;
    const body = await req.json();
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const { name, description, price, category, image, stock } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    const foodId = await restaurantService.addFood(restaurantId, {
      name,
      description,
      price: Number(price),
      category,
      image,
      stock: Number(stock) || 0,
      isAvailable: true
    });

    return NextResponse.json({ 
      success: true, 
      foodId,
      message: 'Food item added successfully' 
    });
  } catch (error) {
    console.error('Error adding food:', error);
    return NextResponse.json(
      { error: 'Failed to add food item' },
      { status: 500 }
    );
  }
}