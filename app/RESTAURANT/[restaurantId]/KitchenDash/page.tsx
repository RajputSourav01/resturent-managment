"use client";

import React, { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChefHat, ClipboardList, LogOut, User,Settings , Menu as MenuIcon } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {restaurantData?.name || 'Kitchen Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  Restaurant ID: {restaurantId} | Welcome, {staffData?.staffData?.fullName || 'Staff Member'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* View Menu */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/menu`)}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <MenuIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">View Menu</h3>
            </div>
            <p className="text-gray-600">
              Browse all available menu items and check stock levels
            </p>
          </div>

          {/* Live Orders */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/LiveOrder`)}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Live Orders</h3>
            </div>
            <p className="text-gray-600">
              View and manage current orders from customers
            </p>
          </div>

          {/* Cooking Status */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/cooking_status`)}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Cooking Status</h3>
            </div>
            <p className="text-gray-600">
              Update order status and cooking progress
            </p>
          </div>

          {/* Served Status */}
          <div 
            onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/served_status`)}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Served Status</h3>
            </div>
            <p className="text-gray-600">
              Mark orders as served and completed
            </p>
          </div>

          {/* Staff Dashboard */}
          <div 
            // onClick={() => router.push(`/RESTAURANT/${restaurantId}/KitchenDash/staffdash`)}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Settings className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Settings</h3>
            </div>
            <p className="text-gray-600">
              View your profile and staff information
            </p>
          </div>

        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {staffData?.staffData?.designation || 'Staff'}
              </p>
              <p className="text-sm text-gray-600">Your Role</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {staffData?.staffData?.mobile || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Mobile</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Today's Date</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-sm text-gray-600">Status</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
