// hooks/useRestaurant.ts
import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/restaurant-service';

export interface UseRestaurantReturn {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  refreshRestaurant: () => Promise<void>;
  updateRestaurant: (data: Partial<Restaurant>) => Promise<boolean>;
}

export function useRestaurant(restaurantId: string): UseRestaurantReturn {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant data');
      }
      
      const data = await response.json();
      setRestaurant(data.restaurant);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurant');
    } finally {
      setLoading(false);
    }
  };

  const refreshRestaurant = async () => {
    await fetchRestaurant();
  };

  const updateRestaurant = async (updateData: Partial<Restaurant>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update restaurant');
      }

      // Refresh restaurant data after successful update
      await refreshRestaurant();
      return true;
    } catch (err) {
      console.error('Error updating restaurant:', err);
      setError(err instanceof Error ? err.message : 'Failed to update restaurant');
      return false;
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId]);

  return {
    restaurant,
    loading,
    error,
    refreshRestaurant,
    updateRestaurant,
  };
}