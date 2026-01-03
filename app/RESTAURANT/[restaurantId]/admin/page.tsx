import { redirect } from 'next/navigation';

export default function RestaurantAdminPage({ 
  params 
}: { 
  params: Promise<{ restaurantId: string }> 
}) {
  // Default redirect to admin dashboard
  redirect(`/admin/admindash`);
}