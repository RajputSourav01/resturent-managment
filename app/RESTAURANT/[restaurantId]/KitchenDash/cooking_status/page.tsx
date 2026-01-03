"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  orderBy,
  updateDoc,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  Clock, 
  ChefHat, 
  CheckCircle,
  RefreshCw 
} from "lucide-react";
import * as XLSX from "xlsx";
import { useRouter, useParams } from "next/navigation";

interface Order {
  id: string;
  title?: string;
  tableNo?: string;
  table?: string;
  items?: any[];
  status: string;
  createdAt: any;
  customerName?: string;
  price?: number;
  quantity?: number;
  total?: number;
  imageUrl?: string;
}

const CookingOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { restaurantId }: any = useParams();

  useEffect(() => {
    // Check authentication and start fetching data immediately
    const staffData = localStorage.getItem('kitchen_staff');
    
    if (!staffData) {
      router.replace('/KitchenDash');
      return;
    }

    // Real-time listener for restaurant blocking status
    const unsubscribeBlocking = onSnapshot(
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
            return;
          }
        }
      },
      (error) => {
        console.error("Error listening to restaurant status:", error);
      }
    );

    //  FIXED — moved query inside try/catch for index handling
    let q;
    try {
      q = query(
        collection(db, "restaurants", restaurantId, "orders"),
        where("status", "==", "cooking"),
        orderBy("createdAt", "desc")
      ); //  FIXED
    } catch (err) {
      console.error("⚠️ Firestore index missing. Create the index.", err);
      setLoading(false);
      return;
    }

    // ⭐ FIXED — snapshot error handling
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });

        setOrders(list);
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Firestore query failed (index missing!)", error); // ⭐ FIXED
        setLoading(false);
      }
    );

    return () => {
      unsub();
      unsubscribeBlocking();
    };
  }, []);

  // Download Excel
  const downloadExcel = () => {
    const data = orders.map((o) => ({
      OrderID: o.id,
      FoodTitle: o.title || "N/A",
      Table: o.tableNo || o.table || "N/A",
      CustomerName: o.customerName || "N/A",
      Quantity: o.quantity || 0,
      Price: o.price || 0,
      Total: o.total || 0,
      Status: o.status,
      CreatedAt: o.createdAt?.toDate?.()?.toLocaleString() || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Cooking Orders");
    XLSX.writeFile(workbook, "cooking-orders.xlsx");
  };

  const markAsServed = async (id: string) => {
    try {
      await updateDoc(doc(db, "restaurants", restaurantId, "orders", id), {
        status: "served",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const deleteOrder = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "restaurants", restaurantId, "orders", id));
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-600">Loading cooking orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Cooking Orders
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              {orders.length} Orders
            </Badge>
            <Button
              onClick={downloadExcel}
              size="sm"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Orders Cooking
              </h3>
              <p className="text-gray-500">
                All orders are either completed or waiting to be started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 mb-1">
                        {order.title || "Order Item"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          Table {order.tableNo || order.table || "N/A"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Cooking
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {order.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={order.imageUrl} 
                        alt={order.title}
                        className="w-full h-40 sm:h-44 lg:h-40 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {order.customerName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Customer:</span>
                        <span className="text-sm font-medium">{order.customerName}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="text-sm font-medium">×{order.quantity || 1}</span>
                    </div>
                    
                    {order.total && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-sm font-bold text-green-600">₹{order.total}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 border-t pt-2">
                      {order.createdAt?.toDate?.()?.toLocaleString() || "Time not available"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => markAsServed(order.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Served
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteOrder(order.id)}
                      className="px-3"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookingOrdersPage;
