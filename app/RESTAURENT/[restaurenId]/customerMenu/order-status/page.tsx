"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

// ShadCN UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

import { useRouter } from "next/navigation";

type OrderItem = {
  title: string;
  description?: string;
  ingredients?: string[];
  imageUrl?: string;
  category?: string;
  price: number;
  quantity: number;

  inactive?: boolean;
  status?: string;
};

type OrderData = {
  tableNo: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  orderTime?: string;
  orderId?: string;
  createdAt?: any;
};

const ORDER_STATUSES = [
  { key: "pending", label: "Order Placed", icon: "📝" },
  { key: "cooking", label: "Cooking", icon: "👨‍🍳" },
  { key: "served", label: "Served", icon: "✅" },
];

export default function OrderStatusPage() {
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tableNo = urlParams.get("table");
        if (!tableNo) return;

        const q = query(
          collection(db, "orders"),
          where("tableNo", "==", tableNo),
          limit(50)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const orders = snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          }));

          orders.sort(
            (a: any, b: any) =>
              (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );

          const latest = orders[0];

          const processedOrders = orders.map((o: any) => ({
            ...o,
            inactive: o.status === "served" && o.id !== latest.id,
          }));

          // ⭐ REMOVE SERVED ORDERS COMPLETELY
          const activeOrders = processedOrders.filter(
            (o: any) => o.status !== "served"
          );

          // ⭐ MAP ONLY ACTIVE ORDERS
          const items: OrderItem[] = activeOrders.map((o: any) => ({
            title: o.title || o.foodName || "Unknown Food",
            description: o.description || "No description",
            ingredients: o.ingredients || [],
            imageUrl: o.imageUrl || "",
            category: o.category || "",
            price: o.price || 0,
            quantity: o.quantity || 1,
            inactive: false,
            status: o.status,
          }));

          const totalAmount = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          setOrder({
            tableNo,
            items,
            totalAmount,
            status: latest.status || "pending",
            orderTime: latest.createdAt
              ? new Date(latest.createdAt.seconds * 1000).toLocaleString()
              : new Date().toLocaleString(),
            orderId: latest.id,
            createdAt: latest.createdAt,
          });
        }
      } catch (err) {
        console.error("Firestore order fetch error:", err);
      }
    };

    loadOrder();
  }, []);

  const currentStatusIndex = order
    ? ORDER_STATUSES.findIndex((s) => s.key === order.status?.toLowerCase())
    : 0;

  const progressValue = ((currentStatusIndex + 1) / ORDER_STATUSES.length) * 100;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-x-hidden">
        <Card className="w-full max-w-md text-center backdrop-blur-sm bg-white/90">
          <CardContent className="p-10 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p>No order found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const router = useRouter();

  return (
    
    <main
      className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-cover bg-center bg-no-repeat relative overflow-x-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
  <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-2">
    <img
      src="/logo.png"
      alt="Golden Fork Logo"
      className="w-full h-full object-cover"
    />
  </div>
  <h1 className="text-2xl sm:text-3xl font-[cursive] text-yellow-500 drop-shadow-lg">
    Golden Fork
  </h1>
</div>

      <div className="absolute inset-0 bg-black/50" />

      <Card className="w-full max-w-md sm:max-w-lg rounded-2xl shadow-2xl backdrop-blur-md bg-white/95 relative z-10 overflow-hidden">
        <div className="flex justify-start">
          <button
            onClick={() => router.back()}
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white/80 hover:bg-white transition"
          >
            ← Back
          </button>
        </div>

        <CardHeader className="text-center space-y-2 max-w-full">
          <CardTitle className="text-2xl break-words">Order Status</CardTitle>
          <Badge variant="outline" className="mx-auto break-words">
            Order ID: {order.orderId}
          </Badge>
          <p className="text-xs text-muted-foreground break-words">
            Table {order.tableNo} • {order.orderTime}
          </p>
        </CardHeader>

        <CardContent className="space-y-5 max-w-full overflow-x-hidden">
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] sm:text-xs text-muted-foreground">
              {ORDER_STATUSES.map((s) => (
                <span key={s.key} className="truncate">
                  {s.label}
                </span>
              ))}
            </div>
            <Progress value={progressValue} />
          </div>

          <div className="text-center">
            <Badge className="text-sm px-4 py-1 break-words">
              {ORDER_STATUSES[currentStatusIndex]?.icon}{" "}
              {order.status.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          <ScrollArea className="h-[260px] sm:h-[320px] pr-2 overflow-x-hidden">
            <div className="space-y-3 max-w-full">
              {order.items.map((item, index) => (
                <Card key={index} className="p-3 rounded-xl max-w-full">
                  <div className="flex flex-col sm:flex-row gap-3 max-w-full">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full sm:w-24 h-40 sm:h-24 rounded-xl object-cover aspect-square max-w-full"
                      />
                    )}

                    <div className="flex-1 space-y-1 min-w-0 max-w-full break-words">
                      <p className="font-semibold text-base break-words">
                        {item.title}
                      </p>

                      {item.category && (
                        <p className="text-[11px] text-muted-foreground break-words">
                          Category: {item.category}
                        </p>
                      )}

                      {item.description && (
                        <p className="text-sm text-muted-foreground break-words line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {item.ingredients && (
                        <p className="text-[11px] text-muted-foreground break-words">
                          Ingredients:{" "}
                          {Array.isArray(item.ingredients)
                            ? item.ingredients.join(", ")
                            : item.ingredients}
                        </p>
                      )}

                      <p className="mt-2 font-bold text-primary text-sm break-words">
                        ₹{item.price} × {item.quantity} = ₹
                        {item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex justify-between items-center bg-primary/5 rounded-xl p-4 max-w-full">
            <span className="font-semibold truncate">Paid Amount</span>
            <span className="text-xl font-bold text-primary break-words">
              ₹{order.totalAmount}
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
