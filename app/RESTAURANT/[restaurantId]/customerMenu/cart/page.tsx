//--------------------------cart page-------------------------

"use client";

import React, { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// -----------------------------
// TYPES
// -----------------------------
type CartItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | string[];
  description?: string;
  category?: string;
  ingredients?: string;
  quantity: number;
};

export default function CartPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNo = searchParams.get("table");

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // NEW CUSTOMER INFO POPUP
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPopup, setCustomerPopup] = useState(false);

  // Restaurant Logo
  const restaurantLogo = "/logo.png"; // CHANGE THIS

  useEffect(() => {
    const cartKey = `cart_table_${tableNo || "unknown"}`;
    const data = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCart(data);
  }, [tableNo]);

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    const cartKey = `cart_table_${tableNo || "unknown"}`;
    localStorage.setItem(cartKey, JSON.stringify(updated));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // -----------------------------
  // PDF GENERATOR (jsPDF)
  // -----------------------------
  const generatePDF = async () => {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  // Convert logo to Base64
  const toBase64 = (url: string) =>
    fetch(url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );

  try {
    const logoBase64 = await toBase64(restaurantLogo);
    doc.addImage(logoBase64, "PNG", 200, 20, 150, 80);
  } catch (e) {
    console.log("Logo error:", e);
  }

  // Use standard font and UTF-8 safe
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.text("Restaurant Bill Receipt", 40, 130);

  doc.setFontSize(12);
  doc.text(`Customer: ${customerName}`, 40, 160);
  doc.text(`Phone: ${customerPhone}`, 40, 180);
  doc.text(`Table: ${tableNo}`, 40, 200);
  doc.text(`Date: ${new Date().toLocaleString()}`, 40, 220);

  doc.setLineWidth(1);
  doc.line(40, 235, 550, 235);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Items", 40, 260);

  let y = 290;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  cart.forEach((item) => {
    // Use simple template string, avoid special characters
    const line = `${item.title} x${item.quantity} — ₹${item.price * item.quantity}`;
    doc.text(line, 40, y);
    y += 20;
  });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ₹${total}`, 40, y + 30);

  doc.setTextColor(0, 128, 0);
  doc.setFontSize(28);
  doc.text("PAID ✔", 400, y + 40);

  doc.save(`Bill_Table_${tableNo}.pdf`);
};


  // -----------------------------
  // SAVE PAYMENT + CUSTOMER DETAILS
  // -----------------------------
  const saveAndProceed = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }

    setCustomerPopup(false);
    setIsPayOpen(true);
  };

  const confirmPayment = async () => {
    try {
      setSaving(true);

      // SAVE CUSTOMER INFO
      const customerRef = await addDoc(collection(db, "restaurants", restaurantId, "customers"), {
        name: customerName,
        phone: customerPhone,
        tableNo: String(tableNo),
        createdAt: serverTimestamp(),
      });

      // SAVE ITEMS TO ORDERS
      for (const item of cart) {
        await addDoc(collection(db, "restaurants", restaurantId, "orders"), {
          tableNo: String(tableNo || "Unknown"),
          customerId: customerRef.id,
          customerName: customerName,
          customerPhone: customerPhone,
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
        });
      }

      // SAVE RECEIPT
      await addDoc(collection(db, "restaurants", restaurantId, "receipts"), {
        tableNo: String(tableNo),
        customerName,
        customerPhone,
        items: cart,
        totalAmount: total,
        status: "paid",
        createdAt: serverTimestamp(),
      });

      // PDF
      generatePDF();

      const cartKey = `cart_table_${tableNo || "unknown"}`;
      localStorage.removeItem(cartKey);
      setCart([]);

      setIsPayOpen(false);
      setIsSuccessOpen(true);
    } catch (err) {
      console.error(err);
      alert("❌ Order failed!");
    } finally {
      setSaving(false);
    }
  };

  const closeSuccess = () => {
    setIsSuccessOpen(false);
    router.push(`/RESTAURANT/${restaurantId}/customerMenu/order-status?table=${tableNo}`);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white p-3 sm:p-6"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative max-w-5xl mx-auto z-10">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-lg">
          <Button variant="outline" className="w-full sm:w-auto text-gray-300 border-white/30" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-center">🛒 Your Cart</h1>
        </div>

        {/* EMPTY */}
        {cart.length === 0 ? (
          <div className="text-center text-gray-300 bg-white/10 rounded-xl p-8 backdrop-blur-lg">Your cart is empty 😔</div>
        ) : (
          <div className="grid gap-4">
            {cart.map((item) => (
              <Card key={item.id} className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden">
                <CardContent className="flex flex-col sm:flex-row gap-4 p-4 items-center">
                  <img
                    src={Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl || "https://picsum.photos/200"}
                    className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-xl"
                  />

                  <div className="flex-1 w-full space-y-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between sm:justify-start gap-4 text-sm mt-2">
                      <span>Qty: {item.quantity}</span>
                      <span className="text-yellow-400 font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  </div>

                  <Button className="bg-red-500 hover:bg-red-400 w-full sm:w-auto" onClick={() => removeItem(item.id)}>
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* TOTAL */}
        {cart.length > 0 && (
          <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xl font-bold text-green-400">Total: ₹{total}</p>

              <Button
                className="w-full sm:w-auto bg-green-500 text-black hover:bg-green-400 px-10 py-6 text-lg"
                onClick={() => setCustomerPopup(true)}
              >
                Proceed to Billing
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER INFO POPUP */}
      <Dialog open={customerPopup} onOpenChange={setCustomerPopup}>
        <DialogContent className="bg-white text-black rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Customer Details</DialogTitle>
          </DialogHeader>

          <input
            type="text"
            placeholder="Customer Name"
            className="border p-3 rounded w-full mt-3"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="border p-3 rounded w-full mt-3"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />

          <Button className="w-full bg-black text-white mt-4 py-3" onClick={saveAndProceed}>
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* PAYMENT POPUP */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="bg-white text-black rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirm Payment</DialogTitle>
          </DialogHeader>

          <div className="text-center mt-4">
            <p className="text-lg">Total Payable</p>
            <p className="text-3xl font-extrabold text-green-600">₹{total}</p>
          </div>

          <Button className="w-full bg-green-500 text-black hover:bg-green-400 py-6 text-lg" onClick={confirmPayment} disabled={saving}>
            {saving ? "Processing..." : `Pay Now ₹${total}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* SUCCESS POPUP */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white text-black rounded-2xl text-center p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">✅ Payment Successful</DialogTitle>
          </DialogHeader>

          <p className="mt-3 text-green-600 font-semibold text-lg">
            Your payment has been completed!{" "}
            <span 
              className="text-blue-600 underline cursor-pointer hover:text-blue-800 transition-colors"
              onClick={closeSuccess}
            >
              Track Order
            </span>
          </p>

          <Button className="mt-6 bg-gray-500 text-white px-10 py-6 text-lg" onClick={() => setIsSuccessOpen(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
