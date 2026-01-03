// app/RESTAURANT/[restaurantId]/api/admin/orders/[orderId]/route.ts
import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/restaurant-service";

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ restaurantId: string; orderId: string }> }
) {
  try {
    const { restaurantId, orderId } = await params;
    const body = await req.json();
    
    if (!restaurantId || !orderId) {
      return NextResponse.json(
        { error: "Restaurant ID and Order ID are required" },
        { status: 400 }
      );
    }

    const success = await restaurantService.updateOrder(restaurantId, orderId, body);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order updated successfully' 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ restaurantId: string; orderId: string }> }
) {
  try {
    const { restaurantId, orderId } = await params;
    
    if (!restaurantId || !orderId) {
      return NextResponse.json(
        { error: "Restaurant ID and Order ID are required" },
        { status: 400 }
      );
    }

    const success = await restaurantService.deleteOrder(restaurantId, orderId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}