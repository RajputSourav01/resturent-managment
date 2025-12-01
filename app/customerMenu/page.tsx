"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";

// ✅ ShadCN components (you already use these)
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
  imageUrl?: string[] | string; // we expect array (imageUrl: [..]) but allow string fallback
  description?: string;
  category?: string;
};

export default function DigitalMenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");

  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // UI states like in FoodItemsPage
  const [qty, setQty] = useState<{ [key: string]: number }>({});
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Filter & search
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // DB table validation (keeps your existing table check logic)
  const [dbTableNo, setDbTableNo] = useState<string | null>(null);

  // Fetch table keys (same logic you used before)
  useEffect(() => {
    const fetchDBTable = async () => {
      try {
        const snap = await getDocs(collection(db, "tables"));

        const tables: string[] = snap.docs
          .map((d) => {
            const data = d.data();
            const key = Object.keys(data).find((k) =>
              k.toLowerCase().includes("table")
            );
            return key ? (data as any)[key].toString() : null;
          })
          .filter(Boolean) as string[];

        if (tableParam && tables.includes(tableParam)) {
          setDbTableNo(tableParam);
        } else {
          setDbTableNo(null);
        }
      } catch (err) {
        console.error("Failed to load tables:", err);
      }
    };

    fetchDBTable();
  }, [tableParam]);

  // Load all foods and build categories
  useEffect(() => {
    const loadFoods = async () => {
      try {
        const snap = await getDocs(collection(db, "foods"));
        const list: Food[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

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

    loadFoods();
  }, []);

  // Keep cart count in sync with localStorage (per table)
  useEffect(() => {
    const cartKey = `cart_table_${dbTableNo || tableParam || "unknown"}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCartCount(cart.length);
  }, [dbTableNo, tableParam]);

  // Helpers: qty
  const handleQtyChange = (id: string, value: number) => {
    setQty((prev) => ({
      ...prev,
      [id]: value < 1 ? 1 : value,
    }));
  };

  // Order saving (same as your FoodItemsPage)
  const handleOrder = async (food: Food) => {
    try {
      const quantity = qty[food.id] || 1;

      const orderData = {
        tableNo: dbTableNo || tableParam || "Unknown",
        foodId: food.id,
        title: food.title || "Unknown Food",
        price: food.price || 0,
        imageUrl:
          Array.isArray(food.imageUrl)
            ? food.imageUrl[0]
            : food.imageUrl ||
              "https://via.placeholder.com/300x200?text=No+Image",
        category: food.category || "Uncategorized",
        description: food.description || "No description available",
        ingredients: (food as any)?.ingredients || [],
        quantity,
        total: (food.price || 0) * quantity,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);
    } catch (error) {
      console.error("Order save failed:", error);
      alert("❌ Failed to place order. Try again!");
    }
  };

  // Cart behavior (same as your FoodItemsPage)
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

  // Pay flow (open dialog)
  const handlePayNow = (food: Food) => {
    setSelectedFood(food);
    setIsPayOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedFood) return;

    handleOrder(selectedFood);

    setIsPayOpen(false);
    setTimeout(() => {
      setIsSuccessOpen(true);

      setTimeout(() => {
        const quantity = qty[selectedFood.id] || 1;
        alert(
          `✅ Order Placed\n\nFood: ${selectedFood.title}\nQty: ${quantity}\nPrice: ₹${selectedFood.price}`
        );
      }, 300);
    }, 300);
  };

  const closeSuccess = () => {
    setIsSuccessOpen(false);
    setSelectedFood(null);
  };

  // Image slider component (uses imageUrl array)
  const ImageSlider = ({ images }: { images: string[] }) => {
    const [index, setIndex] = useState(0);

    // reset index when images change
    useEffect(() => {
      setIndex(0);
    }, [images]);

    if (!images || images.length === 0) {
      return (
        <div className="relative w-full h-44 bg-gray-100/30 rounded-xl flex items-center justify-center">
          <span className="text-sm text-gray-200">No image</span>
        </div>
      );
    }

    const next = () => setIndex((i) => (i + 1) % images.length);
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

    return (
      <div className="relative w-full h-44 overflow-hidden rounded-xl">
        <img src={images[index]} className="w-full h-full object-cover" />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 py-1 rounded-full"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 py-1 rounded-full"
            >
              ›
            </button>
          </>
        )}
      </div>
    );
  };

  if (dbTableNo === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-3xl">
        ❌ Invalid Table — Not Found in Database
      </div>
    );
  }

  // Filter + search applied on title (safe checks)
  const filteredFoods = foods.filter((item) => {
    const title = (item.title || "").toString();
    const matchSearch = title.toLowerCase().includes((search || "").toLowerCase());

    const matchFilter =
      activeFilter === "ALL" ||
      (item.category || "").toString().toLowerCase() === activeFilter.toLowerCase();

    return matchSearch && matchFilter;
  });

  // UI
  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative px-3 py-8 sm:p-6"
      
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 max-w-7xl mx-auto text-white">
        {/* TOP BAR: Back + OrderStatus + Cart + Billing (kept minimal here) */}
        {/* TOP BAR: Logo + Restaurant Name + Buttons */}
<div className="mb-6">
  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">

    {/* RESTAURANT HEADER */}
    <div className="w-full sm:w-auto flex  items-center sm:items-start text-center sm:text-left">

      {/* LOGO */}
      
      <div className="relative flex justify-center mb-2 ">
        <img
          src="/logo.png"
          alt="Restaurant Logo"
          className="w-20 h-20 sm:w-16 sm:h-16 object-contain rounded-full shadow-lg animate-[float_3s_ease-in-out_infinite]"
        />
      </div>

            <div className="ml-4">
              {/* RESTAURANT NAME */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-md animate-fadeSlide">
                My Restaurant
              </h1>
        
              {/* WAVY UNDERLINE */}
              <div className="relative w-32 h-3 mt-1 mx-auto sm:mx-0">
                <svg
                  className="absolute inset-0 w-full h-full text-yellow-400 animate-wave"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 25 0, 50 5 T 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
    </div>

    {/* EXISTING BUTTONS — UNTOUCHED */}
    <div className="flex gap-3 items-center  sm:mt-0">
      <Button
        className="bg-yellow-500 text-black"
        onClick={() => router.push(`/customerMenu/order-status?table=${dbTableNo}`)}
      >
        Order Status
      </Button>

      <Button
        className="relative bg-pink-500 hover:bg-pink-400 flex items-center gap-2"
        onClick={() => router.push(`/customerMenu/cart?table=${dbTableNo}`)}
      >
        <ShoppingCart size={18} />
        Cart
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {cartCount}
          </span>
        )}
      </Button>

      <Button
        className="bg-blue-500 hover:bg-blue-400"
        onClick={() => router.push(`/customerMenu/billing?table=${dbTableNo}`)}
      >
        Billing
      </Button>
    </div>

  </div>
</div>


        {/* TITLE */}
        <h1 className="text-3xl font-extrabold text-center mb-2">Our Menu</h1>

        {/* SEARCH + FILTER */}
        <div className="max-w-3xl mx-auto mb-2">
          <input
            className="w-full p-3 rounded-xl text-black"
            placeholder="Search food by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 mb-2 px-2">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
              activeFilter === "ALL" ? "bg-yellow-400 text-black" : "bg-white/10"
            }`}
          >
            ALL
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                activeFilter === cat ? "bg-yellow-400 text-black" : "bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FOOD GRID */}
        {loading ? (
          <div className="text-center animate-pulse">Loading foods...</div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center text-gray-300">No foods found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredFoods.map((food) => {
              const imagesArray = Array.isArray(food.imageUrl)
                ? food.imageUrl
                : typeof food.imageUrl === "string" && food.imageUrl
                ? [food.imageUrl]
                : [ "https://via.placeholder.com/300x200?text=No+Image" ];

              return (
                <Card key={food.id} className="bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl overflow-hidden">
                  <CardContent className="p-2 flex flex-col h-full">
                    <ImageSlider images={imagesArray as string[]} />

                    <Badge className="w-fit mb-2 bg-white/20">{food.category}</Badge>

                    <h3 className="text-lg text-gray-100 font-bold">{food.title || "Untitled"}</h3>

                    <p className="text-sm text-gray-200 line-clamp-2 mt-1">
                      {food.description || "Delicious food"}
                    </p>

                    <p className="text-sm text-gray-200 line-clamp-2 mt-1">
                      {food.ingredients || "Fresh ingredients"}
                    </p>

                    <Separator className="my-3 bg-white/20" />

                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold text-lg">
                        ₹{(food.price || 0) * (qty[food.id] || 1)}
                      </span>

                      <Input
                        type="number"
                        min={1}
                        value={qty[food.id] || 1}
                        onChange={(e) => handleQtyChange(food.id, +e.target.value)}
                        className="w-20 bg-black/40 border-white/20 text-center text-gray-300"
                      />
                    </div>

                    <Button
                      className="mt-4 bg-green-500 text-black hover:bg-green-400"
                      onClick={() => handlePayNow(food)}
                    >
                      Place Order
                    </Button>

                    <Button
                      className="mt-4 bg-pink-500 text-black hover:bg-pink-400"
                      onClick={() => addToCart(food)}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* PAY POPUP */}
        <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
          <DialogContent className="bg-white text-black rounded-xl">
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
            </DialogHeader>

            {selectedFood && (
              <div className="space-y-3">
                <img
                  src={
                    Array.isArray(selectedFood.imageUrl)
                      ? (selectedFood.imageUrl[0] as string)
                      : (selectedFood.imageUrl as string)
                  }
                  className="w-full h-40 object-cover rounded-lg"
                />
                <p><b>Food:</b> {selectedFood.title}</p>
                <p><b>Food category:</b> {selectedFood.category}</p>
                <p><b>Food ingredients:</b> {selectedFood.ingredients}</p>
                <p><b>Price:</b> ₹{selectedFood.price}</p>
                <p><b>Quantity:</b> {qty[selectedFood.id] || 1}</p>
                <p><b>Total:</b> ₹{(selectedFood.price || 0) * (qty[selectedFood.id] || 1)}</p>

                <Button
                  className="w-full bg-green-500 text-black hover:bg-green-400"
                  onClick={confirmPayment}
                >
                  Pay Now ₹{(selectedFood.price || 0) * (qty[selectedFood.id] || 1)}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* SUCCESS POPUP */}
        <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
          <DialogContent className="bg-white text-black rounded-xl text-center">
            <DialogHeader>
              <DialogTitle>✅ Payment Successful</DialogTitle>
            </DialogHeader>

            <p className="mt-2 text-green-600 font-semibold">
              Your payment has been completed!
              You can Track Your Order
              <span
                onClick={() => router.push(`/customerMenu/order-status?table=${dbTableNo}`)}
                className="text-blue-500 underline ml-1 cursor-pointer"
              >
                here
              </span>.
            </p>

            <Button className="mt-4 bg-black text-white" onClick={closeSuccess}>
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
