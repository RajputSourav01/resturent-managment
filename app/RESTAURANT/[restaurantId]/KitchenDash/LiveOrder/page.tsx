"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// ⭐ CHANGE — animated check icon
import { CheckCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  tableNo: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  category?: string;
  imageUrl?: string;
};

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and start fetching data immediately
    const staffData = localStorage.getItem('kitchen_staff');
    
    if (!staffData) {
      router.replace('/KitchenDash');
      return;
    }
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  // Show loading screen while checking authentication or loading data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Loading kitchen dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
        🍳 Kitchen Dashboard
      </h1>

      {orders.length === 0 ? (
        <p className="text-center py-10 text-gray-400">No orders yet</p>
      ) : (
        <ScrollArea className="w-full overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
              {orders.map((o) => (
                <Card
                  key={o.id}
                  className="bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden"
                >
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-4">
                    <div className="flex flex-col sm:flex-row sm:gap-6 items-start">
                      <CardTitle className="text-gray-300 font-bold mb-1 sm:mb-0">
                        Table #{o.tableNo}
                      </CardTitle>
                      {o.category && (
                        <Badge className="bg-white/20 text-sm">{o.category}</Badge>
                      )}
                    </div>

                    <div className="flex gap-2 sm:gap-3 items-center">

  {/* ✔ Hide cooking button when served */}
  {o.status !== "cooking" && o.status !== "served" && (
    <Button
      size="sm"
      className="bg-yellow-500 text-black hover:bg-yellow-400"
      onClick={() => updateStatus(o.id, "cooking")}
    >
      Cooking
    </Button>
  )}

  {/* ✔ When served → show only animated tick */}
  {o.status === "served" ? (
    <div className="flex items-center">
      <CheckCircle
        className="text-green-400 animate-bounce"
        size={36}
      />
    </div>
  ) : (
    <Button
      size="sm"
      className="bg-green-500 text-black hover:bg-green-400"
      onClick={() => updateStatus(o.id, "served")}
    >
      Served
    </Button>
  )}

</div>

                  </CardHeader>

                  <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-t border-white/10">
                    {o.imageUrl && (
                      <img
                        src={o.imageUrl}
                        alt={o.title}
                        className="w-full sm:w-24 h-24 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="font-semibold text-gray-300 underline">
                        {o.title}
                      </p>
                      <p className="text-sm text-gray-300">Qty: {o.quantity}</p>
                      <p className="text-sm text-gray-300">Price: ₹{o.price}</p>
                      <p className="text-green-400 font-bold text-lg">
                        Total: ₹{o.total}
                      </p>
                      <Badge
                        className={`capitalize ${
                          o.status === "served"
                            ? "bg-green-600"
                            : o.status === "cooking"
                            ? "bg-yellow-600"
                            : "bg-gray-500"
                        } w-fit mt-1`}
                      >
                        {o.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
