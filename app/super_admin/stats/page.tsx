"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  collection, 
  getDocs, 
  query,
  orderBy,
  where,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  Calendar as CalendarIcon,
  Shield,
  ShieldOff,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import SuperAdminProtectedRoute from "@/components/SuperAdminProtectedRoute";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  plan?: {
    id: string;
    name: string;
    price: number;
    duration: string;
    purchasedAt?: any;
  };
  createdAt?: any;
  isBlocked?: boolean;
  blockedAt?: any;
  blockedReason?: string;
}

interface Order {
  id: string;
  title: string;
  total: number;
  price?: number; // for individual items
  quantity?: number;
  status: string;
  createdAt: any;
  restaurantId: string;
  restaurantName?: string;
}

interface DailySales {
  date: string;
  totalSales: number;
  totalOrders: number;
  restaurants: {
    [restaurantId: string]: {
      name: string;
      sales: number;
      orders: number;
    };
  };
}

interface MonthlyStats {
  month: string;
  totalSales: number;
  totalOrders: number;
  avgDailySales: number;
}

function StatsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch restaurants
      const restaurantsQuery = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));
      const restaurantsSnapshot = await getDocs(restaurantsQuery);
      
      const restaurantsList: Restaurant[] = [];
      const restaurantsMap: { [key: string]: Restaurant } = {};
      
      restaurantsSnapshot.forEach((doc) => {
        const data = doc.data();
        const restaurant = {
          id: doc.id,
          name: data.name || "Unknown Restaurant",
          address: data.address || "No address",
          phone: data.phone || "No phone",
          plan: data.plan,
          createdAt: data.createdAt,
          isBlocked: data.isBlocked || false,
          blockedAt: data.blockedAt,
          blockedReason: data.blockedReason,
        };
        restaurantsList.push(restaurant);
        restaurantsMap[doc.id] = restaurant;
      });
      
      setRestaurants(restaurantsList);

      // Fetch all orders from all restaurants
      const allOrders: Order[] = [];
      
      for (const restaurant of restaurantsList) {
        try {
          const ordersQuery = query(
            collection(db, `restaurants/${restaurant.id}/orders`),
            orderBy("createdAt", "desc")
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          
          ordersSnapshot.forEach((doc) => {
            const data = doc.data();
            // Calculate total for orders that might have individual price/quantity
            let orderTotal = data.total || 0;
            if (!orderTotal && data.price && data.quantity) {
              orderTotal = data.price * data.quantity;
            }
            
            allOrders.push({
              id: doc.id,
              title: data.title || "Unknown Order",
              total: orderTotal,
              price: data.price,
              quantity: data.quantity,
              status: data.status || "unknown",
              createdAt: data.createdAt,
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            });
          });
        } catch (error) {
          console.error(`Error fetching orders for restaurant ${restaurant.id}:`, error);
        }
      }
      
      setOrders(allOrders);
      
      // Process daily sales data
      processDailySales(allOrders, restaurantsMap);
      
      console.log("Fetched data:", {
        restaurants: restaurantsList.length,
        orders: allOrders.length,
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Block restaurant function
  const blockRestaurant = async (restaurantId: string, reason?: string) => {
    setActionLoading(restaurantId);
    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      await updateDoc(restaurantRef, {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason || "Blocked by Super Admin",
        updatedAt: new Date()
      });

      // Update local state
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, isBlocked: true, blockedAt: new Date(), blockedReason: reason || "Blocked by Super Admin" }
          : restaurant
      ));

      alert("✅ Restaurant blocked successfully!");
    } catch (error) {
      console.error("Error blocking restaurant:", error);
      alert("❌ Failed to block restaurant. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Unblock restaurant function
  const unblockRestaurant = async (restaurantId: string) => {
    setActionLoading(restaurantId);
    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      await updateDoc(restaurantRef, {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        updatedAt: new Date()
      });

      // Update local state
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, isBlocked: false, blockedAt: null, blockedReason: undefined }
          : restaurant
      ));

      alert("✅ Restaurant released successfully!");
    } catch (error) {
      console.error("Error unblocking restaurant:", error);
      alert("❌ Failed to release restaurant. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle block with confirmation
  const handleBlockRestaurant = (restaurant: Restaurant) => {
    const reason = prompt("Enter reason for blocking this restaurant:");
    if (reason !== null) { // null means user cancelled
      blockRestaurant(restaurant.id, reason);
    }
  };

  // Handle unblock with confirmation
  const handleUnblockRestaurant = (restaurant: Restaurant) => {
    if (confirm(`Are you sure you want to release "${restaurant.name}"? They will be able to login again.`)) {
      unblockRestaurant(restaurant.id);
    }
  };

  // Process orders into daily sales data
  const processDailySales = (orders: Order[], restaurantsMap: { [key: string]: Restaurant }) => {
    const dailyData: { [date: string]: DailySales } = {};
    const monthlyData: { [month: string]: MonthlyStats } = {};
    
    orders.forEach((order) => {
      // Skip orders without valid total or with certain statuses
      if (!order.total || order.total <= 0 || order.status === 'cancelled') return;
      
      // Get date from order
      let orderDate: Date;
      if (order.createdAt?.seconds) {
        orderDate = new Date(order.createdAt.seconds * 1000);
      } else if (order.createdAt?.toDate) {
        orderDate = order.createdAt.toDate();
      } else {
        orderDate = new Date(order.createdAt);
      }
      
      const dateString = orderDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const monthString = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      // Initialize daily data
      if (!dailyData[dateString]) {
        dailyData[dateString] = {
          date: dateString,
          totalSales: 0,
          totalOrders: 0,
          restaurants: {},
        };
      }
      
      // Initialize restaurant data for this date
      if (!dailyData[dateString].restaurants[order.restaurantId]) {
        dailyData[dateString].restaurants[order.restaurantId] = {
          name: restaurantsMap[order.restaurantId]?.name || "Unknown",
          sales: 0,
          orders: 0,
        };
      }
      
      // Add to daily totals
      dailyData[dateString].totalSales += order.total;
      dailyData[dateString].totalOrders += 1;
      dailyData[dateString].restaurants[order.restaurantId].sales += order.total;
      dailyData[dateString].restaurants[order.restaurantId].orders += 1;
      
      // Add to monthly totals
      if (!monthlyData[monthString]) {
        monthlyData[monthString] = {
          month: monthString,
          totalSales: 0,
          totalOrders: 0,
          avgDailySales: 0,
        };
      }
      
      monthlyData[monthString].totalSales += order.total;
      monthlyData[monthString].totalOrders += 1;
    });
    
    // Convert to arrays and sort
    const sortedDailySales = Object.values(dailyData).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const sortedMonthlyStats = Object.values(monthlyData).map(month => ({
      ...month,
      avgDailySales: month.totalSales / 30, // Approximate daily average
    })).sort((a, b) => new Date(b.month + " 1, 2024").getTime() - new Date(a.month + " 1, 2024").getTime());
    
    setDailySales(sortedDailySales);
    setMonthlyStats(sortedMonthlyStats);
  };

  useEffect(() => {
    fetchAllData();
    
    // Set default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  }, []);

  // Filter daily sales based on selected filters
  const filteredDailySales = dailySales.filter((day) => {
    // Date range filter
    if (dateRange.start && new Date(day.date) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(day.date) > new Date(dateRange.end)) return false;
    
    // Month filter
    if (selectedMonth !== "all") {
      const dayMonth = new Date(day.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (dayMonth !== selectedMonth) return false;
    }
    
    // Restaurant filter
    if (selectedRestaurant !== "all") {
      if (!day.restaurants[selectedRestaurant]) return false;
    }
    
    return true;
  });

  // Calculate totals for filtered data
  const filteredTotals = filteredDailySales.reduce(
    (acc, day) => {
      if (selectedRestaurant === "all") {
        acc.totalSales += day.totalSales;
        acc.totalOrders += day.totalOrders;
      } else if (day.restaurants[selectedRestaurant]) {
        acc.totalSales += day.restaurants[selectedRestaurant].sales;
        acc.totalOrders += day.restaurants[selectedRestaurant].orders;
      }
      return acc;
    },
    { totalSales: 0, totalOrders: 0 }
  );

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Total Sales (₹)", "Total Orders", "Restaurant Breakdown"];
    const csvContent = [
      headers.join(","),
      ...filteredDailySales.map(day => {
        const restaurantBreakdown = Object.entries(day.restaurants)
          .map(([id, data]) => `${data.name}: ₹${data.sales} (${data.orders} orders)`)
          .join(" | ");
        
        return [
          day.date,
          selectedRestaurant === "all" ? day.totalSales : (day.restaurants[selectedRestaurant]?.sales || 0),
          selectedRestaurant === "all" ? day.totalOrders : (day.restaurants[selectedRestaurant]?.orders || 0),
          `"${restaurantBreakdown}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-stats-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateSubscriptionStatus = (restaurant: Restaurant) => {
    if (!restaurant.plan?.purchasedAt) {
      return {
        status: 'No Plan',
        daysRemaining: 0,
        isExpiringSoon: false,
        isExpired: true,
        expiryDate: null
      };
    }

    const purchaseDate = restaurant.plan.purchasedAt.toDate ? restaurant.plan.purchasedAt.toDate() : new Date(restaurant.plan.purchasedAt);
    const now = new Date();
    const daysInMonth = 30; // Assuming monthly plans are 30 days
    const expiryDate = new Date(purchaseDate.getTime() + (daysInMonth * 24 * 60 * 60 * 1000));
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      status: daysRemaining > 0 ? 'Active' : 'Expired',
      daysRemaining: Math.max(0, daysRemaining),
      isExpiringSoon: daysRemaining <= 2 && daysRemaining > 0,
      isExpired: daysRemaining <= 0,
      expiryDate: expiryDate
    };
  };

  const getSubscriptionStats = () => {
    const stats = {
      total: restaurants.length,
      active: 0,
      expiringSoon: 0,
      expired: 0,
      noPlans: 0
    };

    restaurants.forEach(restaurant => {
      const subStatus = calculateSubscriptionStatus(restaurant);
      if (subStatus.status === 'No Plan') {
        stats.noPlans++;
      } else if (subStatus.isExpired) {
        stats.expired++;
      } else if (subStatus.isExpiringSoon) {
        stats.expiringSoon++;
      } else {
        stats.active++;
      }
    });

    return stats;
  };

  const subscriptionStats = getSubscriptionStats();

  // Calculate remaining days for all restaurants
  const calculateRemainingDaysData = () => {
    const remainingDaysData: {
      restaurant: Restaurant;
      remainingDays: number;
      status: string;
    }[] = [];

    restaurants.forEach(restaurant => {
      if (restaurant.plan?.purchasedAt) {
        let purchaseDate: Date;
        if (restaurant.plan.purchasedAt.toDate) {
          purchaseDate = restaurant.plan.purchasedAt.toDate();
        } else {
          purchaseDate = new Date(restaurant.plan.purchasedAt);
        }
        
        const currentDate = new Date();
        const timeDifference = currentDate.getTime() - purchaseDate.getTime();
        const daysPassed = Math.floor(timeDifference / (1000 * 3600 * 24));
        const remainingDays = Math.max(0, 30 - daysPassed); // Assuming 30 days plan
        
        let status = 'Active';
        if (remainingDays <= 0) {
          status = 'Expired';
        } else if (remainingDays <= 2) {
          status = 'Critical';
        } else if (remainingDays <= 7) {
          status = 'Warning';
        }

        remainingDaysData.push({
          restaurant,
          remainingDays,
          status
        });
      }
    });

    // Sort by remaining days (least first - most urgent)
    return remainingDaysData.sort((a, b) => a.remainingDays - b.remainingDays);
  };

  const remainingDaysData = calculateRemainingDaysData();

  const DailySalesCard = ({ day }: { day: DailySales }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-lg font-semibold">
                {formatDate(day.date)}
              </CardTitle>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {formatDate(day.date)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Total Sales</span>
              </div>
              <div className="text-lg font-bold text-green-300">
                {selectedRestaurant === "all" 
                  ? formatCurrency(day.totalSales)
                  : formatCurrency(day.restaurants[selectedRestaurant]?.sales || 0)
                }
              </div>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-400">Total Orders</span>
              </div>
              <div className="text-lg font-bold text-blue-300">
                {selectedRestaurant === "all" 
                  ? day.totalOrders
                  : day.restaurants[selectedRestaurant]?.orders || 0
                }
              </div>
            </div>
          </div>

          {/* Restaurant Breakdown */}
          {selectedRestaurant === "all" && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Restaurant Breakdown
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(day.restaurants).map(([restaurantId, data]) => (
                  <div
                    key={restaurantId}
                    className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                  >
                    <span className="text-sm truncate flex-1">{data.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400 font-medium">
                        {formatCurrency(data.sales)}
                      </span>
                      <span className="text-blue-400">
                        {data.orders} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="px-4 sm:px-6 py-4 border-b border-white/10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-purple-400" />
              <h1 className="text-lg sm:text-xl font-semibold">
                Sales Analytics & Statistics
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              disabled={loading}
              className="text-black border-white/20 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredDailySales.length === 0}
              className="text-black border-white/20 hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {loading ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
              <p className="text-gray-300">Loading sales data...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Stats Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <Card className="bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 text-sm font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-green-300">
                        {formatCurrency(filteredTotals.totalSales)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-400 text-sm font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-300">
                        {filteredTotals.totalOrders.toLocaleString()}
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-400 text-sm font-medium">Avg Order Value</p>
                      <p className="text-2xl font-bold text-purple-300">
                        {filteredTotals.totalOrders > 0 
                          ? formatCurrency(filteredTotals.totalSales / filteredTotals.totalOrders)
                          : "₹0"
                        }
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 col-span-1 md:col-span-4">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Restaurant Plan Status - Remaining Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {remainingDaysData.length > 0 ? remainingDaysData.map((item, index) => (
                        <div 
                          key={item.restaurant.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.status === 'Expired' 
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : item.status === 'Critical'
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                              : item.status === 'Warning'
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                              : 'bg-green-500/10 border-green-500/30 text-green-300'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.restaurant.name}</p>
                            <p className="text-xs opacity-70">{item.restaurant.plan?.name || 'No Plan'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {item.remainingDays === 0 ? 'EXPIRED' : `${item.remainingDays}d`}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                item.status === 'Expired' 
                                  ? 'border-red-500 text-red-300'
                                  : item.status === 'Critical'
                                  ? 'border-orange-500 text-orange-300'
                                  : item.status === 'Warning'
                                  ? 'border-yellow-500 text-yellow-300'
                                  : 'border-green-500 text-green-300'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-yellow-400 py-8">
                          <p>No restaurants with active plans found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subscription Status Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <Card className="bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 text-sm font-medium">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-green-300">
                        {subscriptionStats.active}
                      </p>
                    </div>
                    <Store className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-400 text-sm font-medium">Expiring Soon (≤2 days)</p>
                      <p className="text-2xl font-bold text-orange-300">
                        {subscriptionStats.expiringSoon}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-400 text-sm font-medium">Expired Plans</p>
                      <p className="text-2xl font-bold text-red-300">
                        {subscriptionStats.expired}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">No Plans</p>
                      <p className="text-2xl font-bold text-gray-300">
                        {subscriptionStats.noPlans}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Restaurant Subscription Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Store className="h-5 w-5" />
                    Restaurant Subscription Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {restaurants.map((restaurant) => {
                      const subStatus = calculateSubscriptionStatus(restaurant);
                      return (
                        <div
                          key={restaurant.id}
                          className={`flex items-center justify-between p-3 rounded border ${
                            restaurant.isBlocked ? 'bg-red-500/20 border-red-500/30' :
                            subStatus.isExpired ? 'bg-red-500/10 border-red-500/20' :
                            subStatus.isExpiringSoon ? 'bg-orange-500/10 border-orange-500/20' :
                            subStatus.status === 'Active' ? 'bg-green-500/10 border-green-500/20' :
                            'bg-gray-500/10 border-gray-500/20'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{restaurant.name}</p>
                              {restaurant.isBlocked && (
                                <Badge className="bg-red-600 text-white text-xs">
                                  <ShieldOff className="w-3 h-3 mr-1" />
                                  BLOCKED
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">{restaurant.address}</p>
                            {restaurant.isBlocked && restaurant.blockedReason && (
                              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {restaurant.blockedReason}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={`${
                                  restaurant.isBlocked ? 'bg-red-600 text-white' :
                                  subStatus.isExpired ? 'bg-red-600 text-white' :
                                  subStatus.isExpiringSoon ? 'bg-orange-600 text-white' :
                                  subStatus.status === 'Active' ? 'bg-green-600 text-white' :
                                  'bg-gray-600 text-white'
                                }`}
                              >
                                {restaurant.isBlocked ? 'BLOCKED' : subStatus.status}
                              </Badge>
                            </div>
                            {!restaurant.isBlocked && subStatus.status !== 'No Plan' && (
                              <p className="text-xs text-gray-300">
                                {subStatus.isExpired ? 'Expired' : `${subStatus.daysRemaining} days left`}
                              </p>
                            )}
                            {restaurant.plan && (
                              <p className="text-xs text-gray-400">
                                Plan: {restaurant.plan.name} (₹{restaurant.plan.price})
                              </p>
                            )}
                            
                            {/* Block/Unblock Actions */}
                            <div className="flex gap-1 mt-2">
                              {restaurant.isBlocked ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnblockRestaurant(restaurant)}
                                  disabled={actionLoading === restaurant.id}
                                  className="text-xs px-2 py-1 h-7 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                >
                                  {actionLoading === restaurant.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Shield className="w-3 h-3 mr-1" />
                                      Release
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBlockRestaurant(restaurant)}
                                  disabled={actionLoading === restaurant.id}
                                  className="text-xs px-2 py-1 h-7 bg-red-600 hover:bg-red-700 text-white border-red-600"
                                >
                                  {actionLoading === restaurant.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <ShieldOff className="w-3 h-3 mr-1" />
                                      Block
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Filters</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Month</label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all">All Months</SelectItem>
                          {monthlyStats.map((month) => (
                            <SelectItem key={month.month} value={month.month}>
                              {month.month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Restaurant</label>
                      <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all">All Restaurants</SelectItem>
                          {restaurants.map((restaurant) => (
                            <SelectItem key={restaurant.id} value={restaurant.id}>
                              {restaurant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Sales Data */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Daily Sales Report
                </h2>
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {filteredDailySales.length} days
                </Badge>
              </div>

              {filteredDailySales.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300 text-lg mb-2">No sales data found</p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your filters or date range
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-4">
                    {filteredDailySales.map((day, index) => (
                      <DailySalesCard key={day.date} day={day} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ProtectedStatsPage() {
  return (
    <SuperAdminProtectedRoute>
      <StatsPage />
    </SuperAdminProtectedRoute>
  );
}