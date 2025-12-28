"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { user, userRole, restaurantId: authRestaurantId, loading } = useAuth();
  const restaurantId = params?.restaurantId as string;

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated and has admin role
    if (!user || userRole !== 'admin') {
      router.replace('/');
      return;
    }

    // Check if the admin has access to this specific restaurant
    if (restaurantId && authRestaurantId !== restaurantId) {
      router.replace('/');
      return;
    }

  }, [user, userRole, authRestaurantId, restaurantId, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated and authorized
  if (user && userRole === 'admin' && (!restaurantId || authRestaurantId === restaurantId)) {
    return <>{children}</>;
  }

  return null;
}
