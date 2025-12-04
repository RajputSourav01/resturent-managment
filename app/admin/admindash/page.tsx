"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import CustomerFlowChart from "@/components/admin/CustomerFlowChart";
import InventoryDoughnut from "@/components/admin/InventoryDoughnut";
import { Users, ShoppingCart, ArchiveX, Tag } from "lucide-react";

//  shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import Theme from "../theme/page";


type StatsResponse = {
  totalSales: number;
  totalInventory: number;
  totalStaff: number;
  totalCategories: number;
  daily: {
    dates: string[];
    revenue: number[];
    customers: number[];
  };
  inventory: { id: string; name: string; stock: number; category: string; price: number }[];
  orders: { id: string; title: string; category: string; total: number; createdAt: string }[];
};

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/adminlogin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const res = await axios.get<StatsResponse>("/api/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load stats. Showing demo values.");
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  if (loading || loadingStats) {
    return (
      <div className="p-20 text-center">
        <Card className="max-w-sm mx-auto">
          <CardContent className="p-6">Loading dashboard…</CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  if (!stats) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalOrders = stats.orders?.length ?? 0;
  const avgDailyRevenue =
    stats.daily?.revenue?.length
      ? Math.round(
          stats.daily.revenue.reduce((a, b) => a + b, 0) /
            stats.daily.revenue.length
        )
      : 0;

  // 🔥 MOST ORDERED CALC
  const mostOrdered = (() => {
    if (!stats.orders || stats.orders.length === 0) return null;

    const map: Record<string, { title: string; count: number }> = {};

    stats.orders.forEach((o) => {
      if (!map[o.title]) map[o.title] = { title: o.title, count: 1 };
      else map[o.title].count++;
    });

    return Object.values(map).sort((a, b) => b.count - a.count)[0];
  })();

  // 🔥 DELETE ORDER
  const handleDeleteOrder = async (id: string) => {
    try {
      await axios.delete(`/api/admin/order/${id}`);
      setStats((prev) =>
        prev ? { ...prev, orders: prev.orders.filter((o) => o.id !== id) } : prev
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <AdminProtectedRoute>
    <main className="min-h-screen bg-muted/40">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <Badge variant="outline" className="text-xs sm:text-sm">
              Welcome, {user?.email}
            </Badge>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales"
            value={`₹${stats.totalSales}`}
            subtitle={`${totalOrders} orders`}
            icon={<ShoppingCart className="h-5 w-5" />}
          />

          <Link href="/admin/checkAllFood">
            <StatCard
              title="Total Inventory"
              value={stats.totalInventory}
              subtitle={`${stats.inventory.length} items`}
              icon={<ArchiveX className="h-5 w-5" />}
            />
          </Link>

          <div
            className="cursor-pointer"
            onClick={() => {
              router.push("/admin/addstaff");
              setTimeout(() => {
                window.scrollBy({ top: 300, behavior: "smooth" });
              }, 500);
            }}
          >
            <StatCard
              title="Staff Count"
              value={stats.totalStaff}
              subtitle="Active staff"
              icon={<Users className="h-5 w-5" />}
            />
          </div>

          <StatCard
            title="Food Categories"
            value={stats.totalCategories}
            subtitle="Present categories"
            icon={<Tag className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart labels={stats.daily.dates} data={stats.daily.revenue} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerFlowChart
                labels={stats.daily.dates}
                data={stats.daily.customers}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            
            {/* 🔥 MOST ORDERED PRODUCT */}
            {mostOrdered && (
              <div className="mb-4 p-4 bg-amber-50 border rounded-lg">
                <p className="text-sm font-semibold">🔥 Most Ordered Product</p>
                <p className="text-lg font-bold">{mostOrdered.title}</p>
                <p className="text-xs text-muted-foreground">
                  Ordered {mostOrdered.count} times
                </p>
              </div>
            )}

            <ScrollArea className="h-[380px] pr-4">
              <div className="space-y-3">
                {stats.orders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No recent orders
                  </div>
                ) : (
                  stats.orders.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl border bg-card p-4 hover:bg-muted transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {o.title}, {o.category}
                          </p>
                          <p className="text-xs text-muted-foreground"></p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className="text-green-600" variant="outline">
                            ₹{o.total}
                          </Badge>

                          {/* 🔥 DELETE BUTTON */}
                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
          <div>
            < Theme  />
          </div>
        {/* Summary */}
        <Card>
          <CardContent className="grid grid-cols-3 sm:grid-cols-3 gap-4 p-4 sm:p-6 text-center">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-muted-foreground">Avg Daily Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{avgDailyRevenue}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-green-600">
                {totalOrders}
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-sm text-muted-foreground">Active Items</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.inventory.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
    </AdminProtectedRoute>
  );
  
}
