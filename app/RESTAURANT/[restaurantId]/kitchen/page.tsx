'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function KitchenStaffMainPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const router = useRouter();
  const { user, userRole, restaurantId: authRestaurantId } = useAuth();

  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'kitchen_staff' && authRestaurantId === restaurantId) {
        router.push(`/RESTAURANT/${restaurantId}/KitchenDash`);
      } else if (userRole === 'admin') {
        router.push(`/RESTAURANT/${restaurantId}/admin/admindash`);
      } else {
        // Unauthorized access
        router.push('/');
      }
    } else if (!user) {
      router.push('/');
    }
  }, [user, userRole, restaurantId, authRestaurantId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}