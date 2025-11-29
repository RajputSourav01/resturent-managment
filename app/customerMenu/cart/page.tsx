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
  <main
    className="min-h-screen bg-cover bg-center bg-no-repeat text-white p-3 sm:p-6"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
    }}
  >
    {/* Overlay */}
    <div className="absolute inset-0 bg-black/70" />

    <div className="relative max-w-5xl mx-auto z-10">

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-lg">
        <Button
          variant="outline"
          className="w-full sm:w-auto text-gray-300 border-white/30"
          onClick={() => router.back()}
        >
          ← Back
        </Button>

        <h1 className="text-xl sm:text-2xl font-bold text-center">
          🛒 Your Cart
        </h1>
      </div>

      {/* Empty State */}
      {cart.length === 0 ? (
        <div className="text-center text-gray-300 bg-white/10 rounded-xl p-8 backdrop-blur-lg">
          Your cart is empty 😔
        </div>
      ) : (
        <div className="grid gap-4">
          {cart.map((item) => (
            <Card
              key={item.id}
              className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden"
            >
              <CardContent className="flex flex-col sm:flex-row gap-4 p-4 items-center">

                {/* ✅ Updated image rendering (supports image array) */}
<img
  src={
    Array.isArray(item.imageUrl) && item.imageUrl.length > 0
      ? item.imageUrl[0]   // ← show first image
      : item.imageUrl || "https://picsum.photos/200" // fallback
  }
  className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-xl"
/>


                <div className="flex-1 w-full space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-300 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex justify-between sm:justify-start gap-4 text-sm mt-2">
                    <span>Qty: {item.quantity}</span>
                    <span className="text-yellow-400 font-bold">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>

                <Button
                  className="bg-red-500 hover:bg-red-400 w-full sm:w-auto mt-2 sm:mt-0"
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
        <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xl font-bold text-green-400">
              Total: ₹{total}
            </p>

            <Button
              className="w-full sm:w-auto bg-green-500 text-black hover:bg-green-400 font-semibold px-10 py-6 text-lg rounded-xl"
              onClick={() => setIsPayOpen(true)}
            >
              Proceed to Billing
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* ✅ PAYMENT POPUP */}
    <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
      <DialogContent className="bg-white text-black rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Confirm Payment
          </DialogTitle>
        </DialogHeader>

        <div className="text-center mt-4">
          <p className="text-lg">
            Total Payable
          </p>
          <p className="text-3xl font-extrabold text-green-600">
            ₹{total}
          </p>
        </div>

        <Button
          className="w-full bg-green-500 text-black hover:bg-green-400 mt-6 py-6 text-lg rounded-xl"
          onClick={confirmPayment}
          disabled={saving}
        >
          {saving ? "Processing..." : `Pay Now ₹${total}`}
        </Button>
      </DialogContent>
    </Dialog>

    {/* ✅ SUCCESS POPUP */}
    <Dialog
      open={isSuccessOpen}
      onOpenChange={setIsSuccessOpen}
    >
      <DialogContent className="bg-white text-black rounded-2xl text-center p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            ✅ Payment Successful
          </DialogTitle>
        </DialogHeader>

        <p className="mt-3 text-green-600 font-semibold text-lg">
          Your order has been placed successfully!
        </p>

        <Button
          className="mt-6 bg-black text-white px-10 py-6 text-lg rounded-xl"
          onClick={closeSuccess}
        >
          Track Order
        </Button>
      </DialogContent>
    </Dialog>
  </main>
);

}
