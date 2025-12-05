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

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Utensils,
  User
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import * as XLSX from "xlsx";

interface Order {
  id: string;
  title?: string;
  category?: string;
  description?: string;
  ingredients?: string;
  imageUrl?: string;
  price?: number;
  quantity?: number;
  total?: number;
  status: string;
  tableNo?: string;
  table?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: any;
}

const ServedOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication and fetch served orders
  useEffect(() => {
    const staffData = localStorage.getItem('kitchen_staff');
    
    if (!staffData) {
      router.replace('/KitchenDash');
      return;
    }
    const q = query(
      collection(db, "orders"),
      where("status", "==", "served"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Order[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching served orders:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Excel Export
  const exportExcel = () => {
    const excelData = orders.map((o) => ({
      OrderID: o.id,
      Title: o.title || "N/A",
      Category: o.category || "N/A",
      Description: o.description || "N/A",
      Price: o.price || 0,
      Quantity: o.quantity || 0,
      Total: o.total || 0,
      TableNo: o.tableNo || o.table || "N/A",
      CustomerName: o.customerName || "N/A",
      CustomerPhone: o.customerPhone || "N/A",
      ImageURL: o.imageUrl || "N/A",
      Status: o.status,
      CreatedAt: o.createdAt?.toDate?.()?.toLocaleString() || "N/A",
    }));

    const sheet = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, sheet, "Served Orders");
    XLSX.writeFile(wb, "served-orders.xlsx");
  };

  // Mark as completed
  const markAsCompleted = async (id: string) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "completed"
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Delete order
  const deleteOrder = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
          <p className="text-gray-600">Loading served orders...</p>
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
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Served Orders
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Utensils className="w-4 h-4 mr-1" />
              {orders.length} Served
            </Badge>
            <Button
              onClick={exportExcel}
              size="sm"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
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
              <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Served Orders
              </h3>
              <p className="text-gray-500">
                Orders that have been served will appear here.
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
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Served
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Order Image */}
                  {order.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={order.imageUrl} 
                        alt={order.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="space-y-3 mb-4">
                    {order.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Category:</span>
                        <Badge variant="outline" className="text-xs">{order.category}</Badge>
                      </div>
                    )}

                    {order.customerName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Customer:</span>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="text-sm font-medium">{order.customerName}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="text-sm font-medium">×{order.quantity || 1}</span>
                    </div>
                    
                    {order.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="text-sm font-medium">₹{order.price}</span>
                      </div>
                    )}
                    
                    {order.total && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-sm font-bold text-green-600">₹{order.total}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 border-t pt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.createdAt?.toDate?.()?.toLocaleString() || "Time not available"}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => markAsCompleted(order.id)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Complete
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

export default ServedOrdersPage;
