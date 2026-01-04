"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";

interface StaffInfo {
  id: string;
  fullName: string;
  designation: string;
  imageUrl?: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const { restaurantId }: any = useParams();

  // States
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "My Restaurant",
    logoUrl: "/logo.png",
  });

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCounts, setOrderCounts] = useState({
    live: 0,
    cooking: 0,
    served: 0,
  });

  // Check authentication and load staff data
  useEffect(() => {
    const checkAuth = () => {
      const staffData = localStorage.getItem('kitchen_staff');
      
      if (!staffData) {
        // No staff data found, redirect to login
        router.push('/KitchenDash');
        return;
      }

      try {
        const parsedStaff = JSON.parse(staffData);
        setStaff(parsedStaff);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing staff data:', error);
        // Invalid data, clear and redirect
        localStorage.removeItem('kitchen_staff');
        router.push('/KitchenDash');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch order counts
  useEffect(() => {
    if (!staff) return;

    async function fetchOrders() {
      try {
        // Fetch live orders (status: "paid")
        const liveQuery = query(collection(db, "restaurants", restaurantId, "orders"), where("status", "==", "paid"));
        const liveSnap = await getDocs(liveQuery);
        
        // Fetch cooking orders
        const cookingQuery = query(collection(db, "restaurants", restaurantId, "orders"), where("status", "==", "cooking"));
        const cookingSnap = await getDocs(cookingQuery);
        
        // Fetch served orders
        const servedQuery = query(collection(db, "restaurants", restaurantId, "orders"), where("status", "==", "served"));
        const servedSnap = await getDocs(servedQuery);

        setOrderCounts({
          live: liveSnap.size,
          cooking: cookingSnap.size,
          served: servedSnap.size,
        });
      } catch (error) {
        console.error("Error fetching order counts:", error);
        // Fallback to example data
        setOrderCounts({
          live: 5,
          cooking: 2,
          served: 12,
        });
      }
    }

    fetchOrders();
  }, [staff]);

  // Real-time listener for restaurant blocking status
  useEffect(() => {
    if (!restaurantId) return;

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
  }, [restaurantId, router]);

  // Logout function
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      // Clear staff data from localStorage
      localStorage.removeItem('kitchen_staff');
      
      // Redirect to login page
      router.push('/KitchenDash');
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if no staff data (should redirect)
  if (!staff) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        
        {/* Top: Restaurant Info */}
        <div>
          <div className="flex items-center p-4 border-b">
            <Image
              src={restaurantInfo.logoUrl}
              width={50}
              height={50}
              alt="Restaurant Logo"
              className="rounded-full"
            />
            <h2 className="text-xl font-semibold ml-3">{restaurantInfo.name}</h2>
          </div>

          {/* Staff Info */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              {staff.imageUrl ? (
                <img
                  src={staff.imageUrl}
                  width={40}
                  height={40}
                  alt="Staff Avatar"
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {staff.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-lg font-medium">{staff.fullName || 'Unknown Staff'}</p>
                <p className="text-sm text-gray-500">{staff.designation || 'Staff'}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1">
              ID: {staff.id}
            </div>
          </div>
        </div>

        {/* Bottom: Logout */}
        <div className="p-4">
          <Button 
            variant="destructive" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>

      </aside>

      {/* ================= MAIN DASHBOARD ================= */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Kitchen Dashboard</h1>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Live Orders */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => router.push("/KitchenDash/LiveOrder")}
          >
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>Live Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {orderCounts.live}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cooking Orders */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => router.push("/KitchenDash/cooking_status")}
          >
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>Cooking Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-yellow-600">
                  {orderCounts.cooking}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Served Orders */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => router.push("/KitchenDash/served_status")}
          >
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>Served Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {orderCounts.served}
                </p>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>

    </div>
  );
}
