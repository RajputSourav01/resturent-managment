// app/RESTAURANT/[restaurantId]/api/admin/orders/route.ts
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

    const orders = await restaurantService.getOrders(restaurantId);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
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

    const { title, category, total, items, customerInfo, orderType } = body;

    if (!title || !total || !items || !orderType) {
      return NextResponse.json(
        { error: "Title, total, items, and order type are required" },
        { status: 400 }
      );
    }

    const orderId = await restaurantService.addOrder(restaurantId, {
      title,
      category: category || 'General',
      total: Number(total),
      items,
      customerInfo,
      status: 'pending',
      orderType
    });

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Order created successfully' 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}