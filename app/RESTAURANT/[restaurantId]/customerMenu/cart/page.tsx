//--------------------------cart page-------------------------

"use client";

import React, { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, getDocs } from "firebase/firestore";

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

// Theme Settings Type
type ThemeSettings = {
  themeImgUrl?: string;
  colorPicker?: string;
  restaurantName?: string;
  logoUrl?: string;
  seasonalVideoUrl?: string;
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

  // Theme Settings State
  const [theme, setTheme] = useState<ThemeSettings>({
    themeImgUrl: "",
    colorPicker: "#000000",
    restaurantName: "Restaurant",
    logoUrl: "/logo.png",
    seasonalVideoUrl: "",
  });

  // Load theme settings
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const snap = await getDocs(collection(db, "restaurants", restaurantId, "themeSettings"));
        if (!snap.empty) {
          const data = snap.docs[0].data() as ThemeSettings;
          setTheme({
            themeImgUrl: data.themeImgUrl || "",
            colorPicker: data.colorPicker || "#000000",
            restaurantName: data.restaurantName || "Restaurant",
            logoUrl: data.logoUrl || "/logo.png",
            seasonalVideoUrl: data.seasonalVideoUrl || "",
          });
        }
      } catch (err) {
        console.error("Failed to load theme settings:", err);
      }
    };
    if (restaurantId) {
      loadTheme();
    }
  }, [restaurantId]);

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
  // COMPACT MOBILE-RESPONSIVE PDF GENERATOR 
  // -----------------------------
  const generatePDF = async () => {
    // Create a compact responsive PDF like thermal receipt
    const doc = new jsPDF({
      unit: "mm",
      format: [80, 250], // Thermal receipt size - mobile friendly
      orientation: "portrait",
    });

    const pageWidth = doc.internal.pageSize.width;
    let currentY = 5;
    const margin = 3;

    // Colors
    const primaryColor = [0, 0, 0]; // Black
    const accentColor = [0, 100, 0]; // Dark Green

    // Logo Helper Function
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

    // Header with Logo and Restaurant Name
    try {
      const logoBase64 = await toBase64(theme.logoUrl || "/logo.png");
      if (logoBase64) {
        // Center the logo
        const logoSize = 15;
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(logoBase64, "PNG", logoX, currentY, logoSize, logoSize);
        currentY += logoSize + 2;
      }
    } catch (error) {
      console.log("Logo loading error:", error);
    }

    // Restaurant Name - Centered
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const restaurantName = theme.restaurantName || "Restaurant";
    const nameWidth = doc.getTextWidth(restaurantName);
    doc.text(restaurantName, (pageWidth - nameWidth) / 2, currentY);
    currentY += 6;

    // Bill Title
    doc.setFontSize(8);
    const billTitle = "RESTAURANT BILL";
    const titleWidth = doc.getTextWidth(billTitle);
    doc.text(billTitle, (pageWidth - titleWidth) / 2, currentY);
    currentY += 6;

    // Separator Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Customer Details - Compact Format
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    const customerInfo = [
      `Customer: ${customerName || "N/A"}`,
      `Phone: ${customerPhone || "N/A"}`,
      `Table: ${tableNo || "N/A"}`,
      `${new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    ];

    customerInfo.forEach((line) => {
      doc.text(line, margin, currentY);
      currentY += 3.5;
    });

    currentY += 2;

    // Separator Line
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Items Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("ITEM", margin, currentY);
    doc.text("QTY", pageWidth - 30, currentY);
    doc.text("AMT", pageWidth - 15, currentY);
    currentY += 4;

    // Separator Line
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;

    // Items List
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    let subtotal = 0;
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      // Item name (truncate if too long)
      let itemName = item.title || "Unknown Item";
      if (itemName.length > 25) {
        itemName = itemName.substring(0, 22) + "...";
      }

      doc.text(itemName, margin, currentY);
      currentY += 3;

      // Quantity and amount on same line
      doc.text(`${item.quantity} x ₹${item.price}`, margin + 2, currentY);
      doc.text(`₹${itemTotal}`, pageWidth - 15, currentY);
      currentY += 4;
    });

    // Separator Line
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 3;

    // Total Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TOTAL:", margin, currentY);
    doc.text(`₹${total}`, pageWidth - 15, currentY);
    currentY += 5;

    // Payment Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    const paidText = "✓ PAID";
    const paidWidth = doc.getTextWidth(paidText);
    doc.text(paidText, (pageWidth - paidWidth) / 2, currentY);
    currentY += 8;

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const footerText = "Thank you for dining with us!";
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, currentY);

    // Save with clean filename
    const cleanRestaurantName = theme.restaurantName?.replace(/[^a-zA-Z0-9]/g, "_") || "Restaurant";
    const filename = `${cleanRestaurantName}_Bill_Table_${tableNo}.pdf`;
    doc.save(filename);
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
