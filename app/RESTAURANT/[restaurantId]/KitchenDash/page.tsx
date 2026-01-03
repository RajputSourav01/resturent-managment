"use client";

import React, { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChefHat, ClipboardList, LogOut, User,Settings , Menu as MenuIcon } from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function KitchenDashboard({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const router = useRouter();
  const { user, userRole, restaurantId: authRestaurantId } = useAuth();
  const [staffData, setStaffData] = useState<any>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);

  // Check if user has access to this restaurant
  const hasAccess = authRestaurantId === restaurantId && userRole === 'kitchen_staff';

  useEffect(() => {
    if (!hasAccess && user) {
      router.push('/');
      return;
    }

    if (!user) {
      router.push('/');
      return;
    }

    // Get staff data from localStorage
    const staffInfo = localStorage.getItem('kitchen_staff');
    if (staffInfo) {
      setStaffData(JSON.parse(staffInfo));
    }

    // Fetch restaurant data
    const fetchRestaurantData = async () => {
      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId);
        const restaurantSnap = await getDoc(restaurantRef);
        if (restaurantSnap.exists()) {
          setRestaurantData(restaurantSnap.data());
        }
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
      }
    };

    if (restaurantId) {
      fetchRestaurantData();
    }
  }, [hasAccess, user, router]);

  // Real-time listener for restaurant blocking status
  useEffect(() => {
    if (!restaurantId || !hasAccess) return;

    const unsubscribe = onSnapshot(
      doc(db, "restaurants", restaurantId),
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.isBlocked) {
            // Restaurant has been blocked, logout immediately
            alert('Your restaurant has been blocked by Super Admin. You will be logged out.');
            
            // Use Firebase signOut to properly clear authentication
            try {
              const { signOut } = await import('firebase/auth');
              const { auth } = await import('@/lib/firebase');
              await signOut(auth);
            } catch (error) {
              console.error('Error signing out:', error);
            }
            
            // Clear all localStorage data
            localStorage.clear();
            
            // Redirect to home page
            router.push('/');
          }
        }
      },
      (error) => {
        console.error("Error listening to restaurant status:", error);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [restaurantId, hasAccess, router]);

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
      localStorage.clear();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      router.push('/');
    }
  };

  if (!hasAccess || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 mt-4">
            <div className="flex items-center min-w-0 flex-1">
              <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  {restaurantData?.name || 'Kitchen Dashboard'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  Welcome, {staffData?.staffData?.fullName || 'Staff Member'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs sm:text-sm lg:text-base flex-shrink-0"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* View Menu */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/menu`)}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
                <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 ml-3 sm:ml-4">View Menu</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Browse all available menu items and check stock levels
            </p>
          </div>

          {/* Live Orders */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/LiveOrder`)}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 ml-3 sm:ml-4">Live Orders</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage current orders from customers
            </p>
          </div>

          {/* Cooking Status */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/cooking_status`)}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 ml-3 sm:ml-4">Cooking Status</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Update order status and cooking progress
            </p>
          </div>

          {/* Served Status */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/served_status`)}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 ml-3 sm:ml-4">Served Status</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Mark orders as served and completed
            </p>
          </div>

          {/* Staff Dashboard */}
          <div 
            // onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/staffdash`)}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 ml-3 sm:ml-4">Settings</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              View your profile and staff information
            </p>
          </div>

        </div>

        {/* Quick Stats */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Information</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {staffData?.staffData?.designation || 'Staff'}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Your Role</p>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Today's Date</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-green-600">Active</p>
              <p className="text-xs sm:text-sm text-gray-600">Status</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
