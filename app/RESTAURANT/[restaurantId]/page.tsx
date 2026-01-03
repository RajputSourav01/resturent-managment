'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Restaurant } from '@/lib/restaurant-service';
import restaurantService from '@/lib/restaurant-service';

export default function RestaurantMainPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const router = useRouter();
  const { user, userRole, restaurantId: authRestaurantId } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      
      try {
        const restaurantData = await restaurantService.getRestaurant(restaurantId);
        setRestaurant(restaurantData);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    // Redirect based on user role
    if (user && userRole && restaurantId) {
      if (userRole === 'admin' && authRestaurantId === restaurantId) {
        router.push(`/RESTAURANT/${restaurantId}/admin/admindash`);
      } else if (userRole === 'kitchen_staff') {
        router.push(`/RESTAURANT/${restaurantId}/KitchenDash`);
      } else {
        // Unauthorized access
        router.push('/');
      }
    } else if (!user) {
      router.push('/');
    }
  }, [user, userRole, restaurantId, authRestaurantId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}