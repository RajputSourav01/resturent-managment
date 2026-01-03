"use client";

import React, { ReactNode, useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import jsPDF from "jspdf";
import restaurantService from "@/lib/restaurant-service";

// ShadCN
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Food = {
  [x: string]: ReactNode;
  id: string;
  title?: string;
  ingredients?: string;
  price?: number;
  imageUrl?: string[] | string;
  description?: string;
  category?: string;
};
// Theme Settings Type
type ThemeSettings = {
  themeImgUrl?: string;
  colorPicker?: string;
  restaurantName?: string;
  logoUrl?: string;
  seasonalVideoUrl?: string;
};

export default function DigitalMenu({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");

  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState<{ [key: string]: number }>({});
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [dbTableNo, setDbTableNo] = useState<string | null>(null);

  /* ---------------------- CUSTOMER POPUP ---------------------- */
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  /* ------------------------------------------------------------ */
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Theme Settings State--------------------------------------------------
  const [theme, setTheme] = useState<ThemeSettings>({
    themeImgUrl: "",
    colorPicker: "#000000",
    restaurantName: "Golden Fork",
    logoUrl: "/logo.png",
    seasonalVideoUrl:
      "https://cdn.pixabay.com/video/2025/01/16/252951_large.mp4",
  });
  //  fetch theme settings from Firestore (if needed) ----------------
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const snap = await getDocs(collection(db, "restaurants", restaurantId, "themeSettings"));

        if (!snap.empty) {
          const data = snap.docs[0].data() as ThemeSettings;

          setTheme({
            themeImgUrl: data.themeImgUrl || "",
            colorPicker: data.colorPicker || "#000000",
            restaurantName: data.restaurantName || "Golden Fork",
            logoUrl: data.logoUrl || "/logo.png",
            seasonalVideoUrl:
              data.seasonalVideoUrl ||
              "https://cdn.pixabay.com/video/2025/01/16/252951_large.mp4",
          });
        }
      } catch (err) {
        console.error("Failed to load theme settings:", err);
      }
    };

    loadTheme();
  }, []);
  /* ---------------------- FETCH TABLE & FOODS ---------------------- */

  useEffect(() => {
    const fetchDBTable = async () => {
      try {
        // Use restaurant-specific table collection
        const tables = await restaurantService.getTables(restaurantId);
        const tableNumbers = tables.map(table => table.number.toString());

        if (tableParam && tableNumbers.includes(tableParam)) {
          setDbTableNo(tableParam);
        } else {
          setDbTableNo(null);
        }
      } catch (err) {
        console.error("Failed to load tables:", err);
        setDbTableNo(null);
      }
    };

    if (restaurantId && tableParam) {
      fetchDBTable();
    }
  }, [tableParam, restaurantId]);

  useEffect(() => {
    const loadFoods = async () => {
      try {
        // Use restaurant-specific food collection
        const foodData = await restaurantService.getFoods(restaurantId);
        
        // Convert restaurant service Food interface to component Food type
        const list: Food[] = foodData.map((food) => {
          let images: string[] = [];
          
          // First try to get images from 'images' field (new multiple images format)
          if (Array.isArray(food.images) && food.images.length > 0) {
            images = food.images.filter(url => url && url.trim() !== '');
          }
          // Fallback to 'image' field (backward compatibility)
          else if (food.image) {
            if (Array.isArray(food.image)) {
              images = food.image.filter(url => url && url.trim() !== '');
            } else {
              images = [food.image];
            }
          }
          
          // If no valid images found, use placeholder
          if (images.length === 0) {
            images = ["https://via.placeholder.com/300x200?text=No+Image"];
          }

          return {
            id: food.id!,
            title: food.name,
            ingredients: food.description || "",
            price: food.price,
            imageUrl: images,
            description: food.description,
            category: food.category,
          };
        });

        setFoods(list);
        const uniq = [
          ...new Set(list.map((f) => (f.category || "").toString().trim())),
        ].filter(Boolean);

        setCategories(uniq as string[]);
      } catch (err) {
        console.error("Failed to load foods:", err);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      loadFoods();
    }
  }, [restaurantId]);

  useEffect(() => {
    const cartKey = `cart_table_${dbTableNo || tableParam || "unknown"}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCartCount(cart.length);
  }, [dbTableNo, tableParam]);

  /* ---------------------- HANDLE QTY ---------------------- */
  const handleQtyChange = (id: string, value: number) => {
    setQty((prev) => ({
      ...prev,
      [id]: value < 1 ? 1 : value,
    }));
  };

  const incrementQty = (id: string) => {
    setQty((prev) => ({
      ...prev,
      [id]: (prev[id] || 1) + 1,
    }));
  };

  const decrementQty = (id: string) => {
    setQty((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) - 1),
    }));
  };

  const toggleReadMore = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  /* ---------------------- HANDLE ORDER SAVE ---------------------- */
  const handleOrder = async (food: Food) => {
    try {
      const quantity = qty[food.id] || 1;

      const orderData = {
        tableNo: dbTableNo || tableParam || "Unknown",
        foodId: food.id,
        title: food.title || "Unknown Food",
        price: food.price || 0,
        imageUrl: Array.isArray(food.imageUrl)
          ? food.imageUrl[0]
          : food.imageUrl ||
            "https://via.placeholder.com/300x200?text=No+Image",
        category: food.category || "Uncategorized",
        description: food.description || "No description available",
        ingredients: (food as any)?.ingredients || [],
        quantity,
        customerName: customerName,
        customerPhone: customerPhone,
        total: (food.price || 0) * quantity,
        status: "paid",
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "restaurants", restaurantId, "orders"), orderData);

      return { id: ref.id, data: orderData };
    } catch (error) {
      console.error("Order save failed:", error);
      alert("❌ Failed to place order. Try again!");
      return null;
    }
  };

  /* ---------------------- ADD TO CART ---------------------- */
  const addToCart = (food: Food) => {
    const quantity = qty[food.id] || 1;

    const cartItem = {
      id: food.id,
      title: food.title,
      price: food.price,
      imageUrl: Array.isArray(food.imageUrl) ? food.imageUrl[0] : food.imageUrl,
      description: food.description,
      category: food.category,
      ingredients: food.ingredients,
      quantity,
    };

    const cartKey = `cart_table_${dbTableNo || tableParam || "unknown"}`;
    const existingCart = JSON.parse(localStorage.getItem(cartKey) || "[]");

    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));

    setCartCount(updatedCart.length);

    alert("✅ Added to cart!");
  };

  /* ---------------------- PAY BUTTON ---------------------- */
  const handlePayNow = (food: Food) => {
    setSelectedFood(food);
    setShowCustomerPopup(true);
  };

  /* ---------------------- CUSTOMER SAVE ---------------------- */
  const saveCustomerToDB = async () => {
    try {
      await addDoc(collection(db, "restaurants", restaurantId, "customers"), {
        name: customerName,
        phone: customerPhone,
        tableNo: dbTableNo || tableParam || "Unknown",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  const saveCustomerAndContinue = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please fill both fields");
      return;
    }

    localStorage.setItem(
      "customer_info",
      JSON.stringify({ name: customerName, phone: customerPhone })
    );

    await saveCustomerToDB();

    setShowCustomerPopup(false);
    setIsPayOpen(true);
  };

  /* ---------------------- SAVE RECEIPT JSON TO FIRESTORE ---------------------- */
  const saveReceiptToDB = async (receipt: any) => {
    try {
      await addDoc(collection(db, "restaurants", restaurantId, "receipts"), {
        ...receipt,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save receipt:", err);
    }
  };

  /* ---------------------- HELPER: FETCH IMAGE AS DATA URL ---------------------- */
  const fetchImageAsDataUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to fetch image:", err);
      return null;
    }
  };

  /* ---------------------- GENERATE COMPACT BEAUTIFUL PDF RECEIPT ---------------------- */
  const generateReceiptPDF = async (
    orderId: string,
    orderData: any,
    items: any[],
    total: number
  ) => {
    // Create a compact responsive PDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200], // Receipt size like thermal printer
      orientation: 'portrait'
    });

    const pageWidth = doc.internal.pageSize.width;
    let currentY = 5;
    const margin = 3;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors (RGB values for jsPDF)
    const primaryColor = [0, 0, 0]; // Black
    const accentColor = [0, 100, 0]; // Dark Green

    // Header with Logo and Restaurant Name
    try {
      const logoData = await fetchImageAsDataUrl(theme.logoUrl || "/logo.png");
      if (logoData) {
        // Center the logo
        const logoSize = 15;
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(logoData, "PNG", logoX, currentY, logoSize, logoSize);
        currentY += logoSize + 2;
      }
    } catch (error) {
      console.log("Logo loading error:", error);
    }

    // Restaurant Name - Centered
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const restaurantName = theme.restaurantName || "Restaurant";
    const nameWidth = doc.getTextWidth(restaurantName);
    doc.text(restaurantName, (pageWidth - nameWidth) / 2, currentY);
    currentY += 6;

    // Receipt Title
    doc.setFontSize(8);
    const receiptTitle = "ORDER RECEIPT";
    const titleWidth = doc.getTextWidth(receiptTitle);
    doc.text(receiptTitle, (pageWidth - titleWidth) / 2, currentY);
    currentY += 6;

    // Separator Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Order Details - Compact Format
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    const orderInfo = [
      `Order ID: ${orderId.slice(-8)}`, // Show only last 8 characters
      `Customer: ${orderData.customerName || 'N/A'}`,
      `Phone: ${orderData.customerPhone || 'N/A'}`,
      `Table: ${orderData.tableNo || 'N/A'}`,
      `${new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    ];

    orderInfo.forEach(line => {
      doc.text(line, margin, currentY);
      currentY += 3.5;
    });

    currentY += 2;

    // Separator Line
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Items Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text("ITEM", margin, currentY);
    doc.text("QTY", pageWidth - 30, currentY);
    doc.text("AMT", pageWidth - 15, currentY);
    currentY += 4;

    // Separator Line
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;

    // Items List
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    
    let subtotal = 0;
    items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      // Item name (wrap if too long)
      let itemName = item.title || 'Unknown Item';
      if (itemName.length > 25) {
        itemName = itemName.substring(0, 22) + '...';
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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text("TOTAL:", margin, currentY);
    doc.text(`₹${total}`, pageWidth - 15, currentY);
    currentY += 5;

    // Payment Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    const paidText = "✓ PAID";
    const paidWidth = doc.getTextWidth(paidText);
    doc.text(paidText, (pageWidth - paidWidth) / 2, currentY);
    currentY += 8;

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const footerText = "Thank you for dining with us!";
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, currentY);

    // Save with clean filename
    const cleanRestaurantName = theme.restaurantName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Restaurant';
    const filename = `${cleanRestaurantName}_Receipt_${orderId.slice(-6)}.pdf`;
    doc.save(filename);
  };

  /* ---------------------- CONFIRM PAYMENT ---------------------- */
  const confirmPayment = async () => {
    if (!selectedFood) return;

    // Save order and get id + data
    const saved = await handleOrder(selectedFood);
    if (!saved) return;

    const { id: orderId, data: orderData } = saved;
    const items = [
      {
        title: orderData.title,
        quantity: orderData.quantity,
        price: orderData.price,
      },
    ];

    const total = orderData.total;

    // Save receipt JSON to Firestore (option 3)
    const receipt = {
      orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableNo: orderData.tableNo,
      items,
      total,
    };

    await saveReceiptToDB(receipt);

    // Generate PDF and auto-download (option 1 using jsPDF)
    await generateReceiptPDF(orderId, orderData, items, total);

    setIsPayOpen(false);
    setTimeout(() => {
      setIsSuccessOpen(true);

      setTimeout(() => {
        const quantity = qty[selectedFood.id] || 1;
        alert(
          `✅ Order Placed

Food: ${selectedFood.title}
Qty: ${quantity}
Price: ₹${selectedFood.price}`
        );
      }, 300);
    }, 300);
  };

  const closeSuccess = () => {
    setIsSuccessOpen(false);
    setSelectedFood(null);
  };

  /* ---------------------- IMAGE SLIDER ---------------------- */
  const ImageSlider = ({ images }: { images: string[] }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => setIndex(0), [images]);

    if (!images || images.length === 0) {
      return (
        <div className="relative w-full h-44 bg-gray-200 rounded-xl flex items-center justify-center">
          <span className="text-sm text-gray-500">No image</span>
        </div>
      );
    }

    const next = () => setIndex((i) => (i + 1) % images.length);
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

    return (
      <div className="relative w-full h-44 overflow-hidden rounded-xl shadow-lg group">
        <img
          src={images[index]}
          className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
          alt={`food-${index + 1}`}
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
          }}
        />

        {images.length > 1 && (
          <>
            {/* Left arrow button */}
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-8 h-8 rounded-full shadow-lg transition-all duration-200 opacity-60 group-hover:opacity-100 flex items-center justify-center"
              aria-label="Previous image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>

            {/* Right arrow button */}
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-8 h-8 rounded-full shadow-lg transition-all duration-200 opacity-60 group-hover:opacity-100 flex items-center justify-center"
              aria-label="Next image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>

            {/* Image indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    i === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            {index + 1}/{images.length}
          </div>
        )}
      </div>
    );
  };

  if (dbTableNo === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-red-600 p-6">
        <div className="max-w-lg text-center">
          <h2 className="text-2xl font-extrabold">❌ Invalid Table</h2>
          <p className="mt-2 text-black">
            Please scan the QR which is have on table.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------- FILTER FOODS ---------------------- */
  const filteredFoods = foods.filter((item) => {
    const title = (item.title || "").toString();
    const matchSearch = title
      .toLowerCase()
      .includes((search || "").toLowerCase());

    const matchFilter =
      activeFilter === "ALL" ||
      (item.category || "").toString().toLowerCase() ===
        activeFilter.toLowerCase();

    return matchSearch && matchFilter;
  });

  return (
    <>
      {/* Mobile-optimized background styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-bg {
            background-attachment: scroll !important;
            background-size: cover !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-bg {
            background-attachment: fixed !important;
          }
        }
      `}</style>
      
      <main
        className="min-h-screen relative w-full bg-cover bg-center bg-no-repeat mobile-bg"
        style={{
          backgroundImage: theme.themeImgUrl
            ? `url(${theme.themeImgUrl})`
            : undefined,
          color: theme.colorPicker,
        }}
      >
      {/* Mobile responsive overlay for better content readability */}
      {theme.themeImgUrl && (
        <div className="absolute inset-0 bg-black/20 sm:bg-black/15 md:bg-black/10 z-0" />
      )}
      <div className="relative mt-5 z-10 w-full">
        {/* Header */}
        <header className="flex sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="ml-2 flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-2xl flex-shrink-0 border-2 border-white/20 bg-white/10">
              <img src={theme.logoUrl} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-black text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-[cursive]"
                  style={{ color: theme.colorPicker }}
                >
                  {theme.restaurantName}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 mr-2">
            {/* Desktop buttons: visible on md+ */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() =>
                  router.push(`/RESTAURANT/${restaurantId}/customerMenu/order-status?table=${dbTableNo}`)
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-black font-semibold shadow"
              >
                Order Status
              </button>

              <button
                onClick={() =>
                  router.push(`/RESTAURANT/${restaurantId}/customerMenu/cart?table=${dbTableNo}`)
                }
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-black font-semibold shadow"
              >
                <ShoppingCart size={16} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile hamburger: visible on mobile only */}
            <div className="md:hidden relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-200 shadow"
              >
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border rounded-lg shadow-lg flex flex-col z-20 min-w-max">
                  <button
                    onClick={() => {
                      router.push(
                        `/RESTAURANT/${restaurantId}/customerMenu/order-status?table=${dbTableNo}`
                      );
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left hover:bg-gray-100 text-sm whitespace-nowrap"
                  >
                    Order Status
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/RESTAURANT/${restaurantId}/customerMenu/cart?table=${dbTableNo}`);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left hover:bg-gray-100 flex items-center justify-between text-sm whitespace-nowrap"
                  >
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ml-2">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Hero / Video banner */}
        <section className="mb-6 mx-2 sm:mx-0">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <video
              src={theme.seasonalVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-[60vh] sm:h-[70vh] object-cover"
            />
            <div className="p-4 bg-gradient-to-t from-white/90 to-transparent ml-3">
              <h2 className="text-black text-xl sm:text-2xl font-bold">
                Seasonal Specials
              </h2>
              <p className="text-black/70 mt-1 text-sm">
                Curated just for today — fresh, bold and unforgettable.
              </p>
            </div>
          </div>
        </section>

        {/* Search + Filters */}
        <section className="mb-6 mx-2 sm:mx-0">
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <div className="relative">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dishes, e.g. Pizza, Pasta..."
                  className="w-full rounded-2xl py-3 px-4 bg-white/90 backdrop-blur-sm text-black placeholder:text-black/50 shadow-lg border border-white/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm shadow-lg backdrop-blur-sm ${
                  activeFilter === "ALL"
                    ? "bg-orange-500 text-black border border-orange-600"
                    : "bg-white/90 text-black border border-white/30"
                }`}
              >
                ALL
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm shadow-lg backdrop-blur-sm ${
                    activeFilter === cat
                      ? "bg-orange-500 text-black border border-orange-600"
                      : "bg-white/90 text-black border border-white/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Menu Grid */}
        <section className="mb-8 mx-2 sm:mx-0">
          <div className="flex justify-center items-center ">
            <span className="text-sm text-black/70 font-medium mb-4" style={{ color: theme.colorPicker }} >
              Digital Menu
            </span>
          </div>
          {loading ? (
            <div className="text-center py-20 text-black/60 animate-pulse">
              Loading menu...
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-20 text-black/60">No food found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredFoods.map((food) => {
                // Handle multiple image formats
                let imagesArray: string[] = [];
                
                if (Array.isArray(food.imageUrl)) {
                  // Already an array of images
                  imagesArray = (food.imageUrl as string[]).filter(url => url && url.trim() !== '');
                } else if (food.imageUrl && typeof food.imageUrl === 'string') {
                  // Single image URL
                  imagesArray = [food.imageUrl];
                } else {
                  // Fallback to placeholder
                  imagesArray = ["https://via.placeholder.com/300x200?text=No+Image"];
                }
                
                // Ensure we have at least one image
                if (imagesArray.length === 0) {
                  imagesArray = ["https://via.placeholder.com/300x200?text=No+Image"];
                }

                const isExpanded = expandedCards[food.id] || false;
                const description = food.description || "";
                const ingredients = food.ingredients || "";
                const showReadMore = description.length > 100 || ingredients;

                return (
                  <article
                    key={food.id}
                    className="bg-white/90 sm:bg-white/85 backdrop-blur-md rounded-2xl border border-gray-200 overflow-hidden shadow-lg flex flex-col"
                  >
                    <Card className="bg-transparent shadow-none rounded-none p-0 flex flex-col">
                      <CardContent className="p-4 flex flex-col gap-3">
                        {/* Fixed height image container */}
                        <div className="h-44 flex-shrink-0">
                          <ImageSlider images={imagesArray} />
                        </div>

                        {/* Price and Category */}
                        <div className="flex items-center justify-between flex-shrink-0">
                          <div>
                            <Badge className="bg-gray-200 text-black py-1 px-3 rounded-full text-xs">
                              {food.category || "General"}
                            </Badge>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-black/60">Price</div>
                            <div className="text-lg font-bold text-orange-500">
                              ₹{(food.price || 0) * (qty[food.id] || 1)}
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-black text-lg font-extrabold flex-shrink-0">
                          {food.title || "Untitled"}
                        </h3>

                        {/* Description and Ingredients with Read More */}
                        <div className="flex-grow">
                          <div className="text-black/70 text-sm">
                            {description && (
                              <div className="mb-2">
                                <strong>Description: </strong>
                                <span
                                  className={`${
                                    !isExpanded ? "line-clamp-2" : "block"
                                  }`}
                                >
                                  {!isExpanded && description.length > 100
                                    ? `${description.substring(0, 100)}...`
                                    : description}
                                </span>
                              </div>
                            )}
                            {isExpanded && ingredients && (
                              <div className="mt-3 whitespace-pre-line">
                                <strong>Ingredients: </strong>
                                {ingredients}
                              </div>
                            )}
                          </div>

                          {showReadMore && (
                            <button
                              onClick={() => toggleReadMore(food.id)}
                              className="text-orange-500 text-sm font-semibold hover:underline mt-2 block"
                            >
                              {isExpanded ? "see less" : "see more.."}
                            </button>
                          )}
                        </div>

                        <Separator className="border-gray-200 " />

                        {/* Quantity and Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 ">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-gray-100  rounded-lg p-1 w-full sm:w-auto">
                            <button
                              onClick={() => decrementQty(food.id)}
                              className="w-8 h-8 flex items-center px-2 py-2 justify-center bg-white text-black rounded-md font-bold hover:bg-gray-200 transition-colors"
                            >
                              -
                            </button>
                            <span className="flex-1 sm:w-8 text-center px-2 py-2 text-black font-semibold">
                              {qty[food.id] || 1}
                            </span>
                            <button
                              onClick={() => incrementQty(food.id)}
                              className="w-8 h-8 flex items-center justify-center px-2 py-2 bg-white text-black rounded-md font-bold hover:bg-gray-200 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 w-full sm:flex-1">
                            <Button
                              className="flex-1 rounded-xl bg-orange-500 text-black px-2 py-2 font-bold hover:bg-orange-600 transition-colors text-xs sm:text-sm"
                              onClick={() => handlePayNow(food)}
                            >
                              Order
                            </Button>

                            <Button
                              className="rounded-xl bg-gray-200 px-3 py-2 text-black font-semibold hover:bg-gray-300 transition-colors text-xs sm:text-sm"
                              onClick={() => addToCart(food)}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer / Notes */}
        <footer className="text-center text-black/60 mt-6">
          <p className="text-sm">
            Thank you for dining with us — enjoy your meal 🍽️
          </p>
        </footer>

        {/* ---------------------- CUSTOMER DETAILS POPUP ---------------------- */}
        <Dialog open={showCustomerPopup} onOpenChange={setShowCustomerPopup}>
          <DialogContent className="bg-white rounded-2xl p-6 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-black">
                Enter Your Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-3">
              <Input
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border p-3 rounded-lg text-black"
              />

              <Input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="border p-3 rounded-lg text-black"
              />

              <Button
                className="w-full bg-orange-500 text-black rounded-lg font-bold"
                onClick={saveCustomerAndContinue}
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ---------------------- PAYMENT POPUP ---------------------- */}
        <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
          <DialogContent className="bg-white rounded-2xl p-6 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-black">
                Confirm Payment
              </DialogTitle>
            </DialogHeader>

            {selectedFood && (
              <div className="space-y-3 mt-3 text-black">
                <img
                  src={
                    Array.isArray(selectedFood.imageUrl)
                      ? selectedFood.imageUrl[0]
                      : (selectedFood.imageUrl as string)
                  }
                  className="w-full h-44 object-cover rounded-lg"
                  alt={selectedFood.title as string}
                />
                <p className="text-sm">
                  <b>Food:</b> {selectedFood.title}
                </p>
                <p className="text-sm">
                  <b>Category:</b> {selectedFood.category}
                </p>
                <p className="text-sm">
                  <b>Ingredients:</b> {selectedFood.ingredients}
                </p>
                <p className="text-sm">
                  <b>Quantity:</b> {qty[selectedFood.id] || 1}
                </p>
                <p className="text-sm font-bold">
                  <b>Total:</b> ₹
                  {(selectedFood.price || 0) * (qty[selectedFood.id] || 1)}
                </p>

                <Button
                  className="w-full bg-orange-500 text-black rounded-lg font-bold"
                  onClick={confirmPayment}
                >
                  Pay Now ₹
                  {(selectedFood.price || 0) * (qty[selectedFood.id] || 1)}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ---------------------- SUCCESS POPUP ---------------------- */}
        <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
          <DialogContent className="bg-white text-black text-center rounded-2xl p-6 max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                ✅ Payment Successful
              </DialogTitle>
            </DialogHeader>

            <p className="mt-2 text-green-600 font-semibold">
              Your payment has been completed!
              <span
                onClick={() =>
                  router.push(`/RESTAURANT/${restaurantId}/customerMenu/order-status?table=${dbTableNo}`)
                }
                className="text-orange-600 underline ml-1 cursor-pointer"
              >
                Track Order
              </span>
            </p>

            <Button
              className="mt-4 bg-black text-white rounded-lg"
              onClick={closeSuccess}
            >
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </main>
    </>
  );
}
