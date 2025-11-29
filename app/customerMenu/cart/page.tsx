"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type CartItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  ingredients?: string;
  quantity: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNo = searchParams.get("table");

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ Save all cart items after payment
  const confirmPayment = async () => {
    try {
      setSaving(true);

      for (const item of cart) {
        const orderData = {
          tableNo: tableNo || "Unknown",
          foodId: item.id,
          title: item.title,
          price: item.price,
          imageUrl: item.imageUrl || "",
          category: item.category || "",
          description: item.description || "",
          ingredients: item.ingredients || "",
          quantity: item.quantity,
          total: item.price * item.quantity,
          status: "pending",
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "orders"), orderData);
      }

      localStorage.removeItem("cart");
      setCart([]);

      setIsPayOpen(false);
      setTimeout(() => {
        setIsSuccessOpen(true);
      }, 300);
    } catch (err) {
      alert("❌ Order failed. Try again!");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const closeSuccess = () => {
    setIsSuccessOpen(false);
    router.push(`/customerMenu/order-status?table=${tableNo}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-5xl mx-auto">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">🛒 Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <p className="text-center text-gray-400">Your cart is empty</p>
        ) : (
          <div className="grid gap-4">
            {cart.map((item) => (
              <Card
                key={item.id}
                className="bg-white/10 border-white/20"
              >
                <CardContent className="flex flex-col sm:flex-row gap-4 p-4">

                  <img
                    src={
                      item.imageUrl ||
                      "https://via.placeholder.com/150"
                    }
                    className="w-full sm:w-32 h-32 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-bold">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {item.description}
                    </p>
                    <p className="text-sm">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-yellow-400 font-bold">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>

                  <Button
                    className="bg-red-500 hover:bg-red-400"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </Button>

                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cart Total */}
        {cart.length > 0 && (
          <div className="mt-6 text-right">
            <p className="text-xl font-bold text-green-400">
              Total: ₹{total}
            </p>

            <Button
              className="mt-4 bg-green-500 text-black hover:bg-green-400"
              onClick={() => setIsPayOpen(true)}
            >
              Proceed to Billing
            </Button>
          </div>
        )}
      </div>

      {/* ✅ PAYMENT CONFIRM POPUP */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="bg-white text-black rounded-xl">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>

          <p className="mt-2">Total Amount: <b>₹{total}</b></p>

          <Button
            className="w-full bg-green-500 text-black hover:bg-green-400 mt-4"
            onClick={confirmPayment}
            disabled={saving}
          >
            {saving ? "Processing..." : `Pay Now ₹${total}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ✅ SUCCESS POPUP */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white text-black rounded-xl text-center">
          <DialogHeader>
            <DialogTitle>✅ Payment Successful</DialogTitle>
          </DialogHeader>

          <p className="mt-2 text-green-600 font-semibold">
            Your order has been placed successfully!
          </p>

          <Button
            className="mt-4 bg-black text-white"
            onClick={closeSuccess}
          >
            Track Order
          </Button>
        </DialogContent>
      </Dialog>

    </main>
  );
}
