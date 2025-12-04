"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function KitchenDashboard() {
  const router = useRouter();

  // States
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "My Restaurant",
    logoUrl: "/logo.png",
  });

  const [staff, setStaff] = useState({
    fullName: "John Doe",
    designation: "Kitchen Staff",
  });

  const [orderCounts, setOrderCounts] = useState({
    live: 0,
    cooking: 0,
    served: 0,
  });

  // TODO: Replace with actual Firestore Queries
  useEffect(() => {
    async function fetchOrders() {
      // Example Firestore logic (replace accordingly)
      // const ordersRef = collection(db, "restaurants/123/orders");

      setOrderCounts({
        live: 5,
        cooking: 2,
        served: 12,
      });
    }

    fetchOrders();
  }, []);

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
            <p className="text-lg font-medium">{staff.fullName}</p>
            <p className="text-sm text-gray-500">{staff.designation}</p>
          </div>
        </div>

        {/* Bottom: Logout */}
        <div className="p-4">
          <Button variant="destructive" className="w-full">
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
                <CardTitle>Live Orders</CardTitle>
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
