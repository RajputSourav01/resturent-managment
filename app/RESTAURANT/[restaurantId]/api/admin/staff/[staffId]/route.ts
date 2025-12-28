// app/RESTAURANT/[restaurantId]/api/admin/staff/[staffId]/route.ts
import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/restaurant-service";

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ restaurantId: string; staffId: string }> }
) {
  try {
    const { restaurantId, staffId } = await params;
    const body = await req.json();
    
    if (!restaurantId || !staffId) {
      return NextResponse.json(
        { error: "Restaurant ID and Staff ID are required" },
        { status: 400 }
      );
    }

    const success = await restaurantService.updateStaff(restaurantId, staffId, body);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update staff member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Staff member updated successfully' 
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ restaurantId: string; staffId: string }> }
) {
  try {
    const { restaurantId, staffId } = await params;
    
    if (!restaurantId || !staffId) {
      return NextResponse.json(
        { error: "Restaurant ID and Staff ID are required" },
        { status: 400 }
      );
    }

    const success = await restaurantService.deleteStaff(restaurantId, staffId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete staff member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Staff member deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}