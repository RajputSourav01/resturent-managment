"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import restaurantService, { Restaurant, Food, Staff, Order } from "@/lib/restaurant-service";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import CustomerFlowChart from "@/components/admin/CustomerFlowChart";
import InventoryDoughnut from "@/components/admin/InventoryDoughnut";
import { 
  Users, 
  ShoppingCart, 
  ArchiveX, 
  Tag, 
  Settings, 
  LogOut, 
  Store,
  CreditCard,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Theme from "@/app/RESTAURANT/[restaurantId]/admin/theme/page";
import TableManagement from "@/components/admin/TableManagement";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

export default function AdminDashboardPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/RESTAURANT/${restaurantId}/adminlogin`);
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        // Fetch data directly using restaurant service
        const [foods, staff, orders] = await Promise.all([
          restaurantService.getFoods(restaurantId),
          restaurantService.getStaff(restaurantId),
          restaurantService.getOrders(restaurantId)
        ]);

        setRawOrders(orders); // Store raw orders for reference
        
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        const totalInventory = foods.reduce((sum, food) => sum + food.stock, 0);
        const categories = [...new Set(foods.map(food => food.category))];

        // Generate real daily data for charts based on orders
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        // Calculate real revenue and customer data from orders
        const revenue = dates.map(date => {
          const dayOrders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? 
              order.createdAt.toDate().toISOString().split('T')[0] :
              new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === date;
          });
          return dayOrders.reduce((sum, order) => sum + order.total, 0);
        });

        const customers = dates.map(date => {
          const dayOrders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? 
              order.createdAt.toDate().toISOString().split('T')[0] :
              new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === date;
          });
          // Count unique customers per day based on tableNo or customerName
          const uniqueCustomers = new Set(dayOrders.map(order => order.tableNo || order.customerName || 'unknown'));
          return uniqueCustomers.size;
        });

        setStats({
          totalSales,
          totalInventory,
          totalStaff: staff.length,
          totalCategories: categories.length,
          daily: { dates, revenue, customers },
          inventory: foods.map(food => ({
            id: food.id || '',
            name: food.name,
            stock: food.stock,
            category: food.category,
            price: food.price
          })),
          orders: orders.map(order => ({
            id: order.id || '',
            title: order.title,
            category: order.category,
            total: order.total,
            createdAt: order.createdAt.toDate ? 
              order.createdAt.toDate().toISOString() : 
              new Date(order.createdAt).toISOString()
          })).reverse() // Show newest orders first
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load stats. Please check your connection.");
      } finally {
        setLoadingStats(false);
      }
    }
    
    if (restaurantId) {
      loadStats();
    }
  }, [restaurantId]);

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

  const totalOrders = stats?.orders?.length ?? 0;

  const avgDailyRevenue =
    stats?.daily?.revenue?.length
      ? Math.round(stats.daily.revenue.reduce((a, b) => a + b, 0) / stats.daily.revenue.length)
      : 0;

  const mostOrdered = (() => {
    if (!stats?.orders?.length) return null;
    const map: Record<string, { title: string; count: number }> = {};
    stats.orders.forEach((o) => {
      map[o.title] = map[o.title] ? { title: o.title, count: map[o.title].count + 1 } : { title: o.title, count: 1 };
    });
    return Object.values(map).sort((a, b) => b.count - a.count)[0];
  })();

  const handleDeleteOrder = async (id: string) => {
    try {
      // Use restaurant service to delete order
      await restaurantService.deleteOrder(restaurantId, id);
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
            <CardContent className="flex justify-between p-6">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <Badge variant="outline">Welcome, {user?.email}</Badge>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            <StatCard title="Total Sales" value={`₹${stats?.totalSales ?? 0}`} subtitle={`${totalOrders} orders`} icon={<ShoppingCart />} />

            <Link href={`/RESTAURANT/${restaurantId}/admin/checkAllFood`}>
              <StatCard title="Total Inventory" value={stats?.totalInventory ?? 0} subtitle={`${stats?.inventory?.length ?? 0} items`} icon={<ArchiveX />} />
            </Link>

            <div onClick={() => router.push(`/RESTAURANT/${restaurantId}/admin/addstaff`)}>
              <StatCard title="Staff Count" value={stats?.totalStaff ?? 0} subtitle="Active staff" icon={<Users />} />
            </div>

            <StatCard title="Categories" value={stats?.totalCategories ?? 0} subtitle="Food categories" icon={<Tag />} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart labels={stats?.daily?.dates ?? []} data={stats?.daily?.revenue ?? []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerFlowChart labels={stats?.daily?.dates ?? []} data={stats?.daily?.customers ?? []} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {mostOrdered && (
                <div className="p-4 bg-yellow-50 border rounded-lg mb-4">
                  <p className="text-sm font-semibold">🔥 Most Ordered Product</p>
                  <p className="text-lg font-bold">{mostOrdered.title}</p>
                  <p className="text-xs text-muted-foreground">{mostOrdered.count} orders</p>
                </div>
              )}

              <ScrollArea className="h-[380px] pr-4">
                {(stats?.orders?.length ?? 0) === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No orders</div>
                ) : (
                  stats?.orders?.map((o) => (
                    <div key={o.id} className="border rounded-xl p-4 hover:bg-muted mb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{o.title}</p>
                          <p className="text-xs text-muted-foreground">{o.category}</p>
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            <p>Table: {(rawOrders.find(order => order.id === o.id)?.tableNo) || 'N/A'}</p>
                            <p>Customer: {(rawOrders.find(order => order.id === o.id)?.customerName) || 'N/A'}</p>
                            <p>Time: {new Date(o.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline">₹{o.total}</Badge>
                          <Badge variant={(rawOrders.find(order => order.id === o.id)?.status === 'paid') ? 'default' : 'secondary'}>
                            {(rawOrders.find(order => order.id === o.id)?.status) || 'pending'}
                          </Badge>

                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Theme */}
          <Theme restaurantId={restaurantId} />

          {/* Table Management */}
          <TableManagement restaurantId={restaurantId} />

          {/* Summary */}
          <Card>
            <CardContent className="grid grid-cols-3 gap-4 p-6 text-center">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm">Avg Daily Revenue</p>
                <p className="text-2xl font-bold">₹{avgDailyRevenue}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-sm">Active Items</p>
                <p className="text-2xl font-bold">{stats?.inventory?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminProtectedRoute>
  );
}
