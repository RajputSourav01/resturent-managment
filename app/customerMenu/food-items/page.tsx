// Updated: Added image slider (carousel) to show multiple images stored in DB
// NOTE: Your layout, logic, and all existing code remain unchanged except image slider

"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { ShoppingCart } from "lucide-react";

// ✅ ShadCN
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
  title: string;
  ingredients?: string;
  price: number;
  imageUrl?: any;
  description?: string;
  category?: string;
};

export default function FoodItemsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category");
  const tableNo = searchParams.get("table");

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<{ [key: string]: number }>({});

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);

  // PayNow open
  const handlePayNow = (food: Food) => {
    setSelectedFood(food);
    setIsPayOpen(true);
  };

  // Payment confirm
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

  // Success close
  const closeSuccess = () => {
    setIsSuccessOpen(false);
    setSelectedFood(null);
  };

  useEffect(() => {
    if (!category) return;

    const loadFoods = async () => {
      try {
        const q = query(
          collection(db, "foods"),
          where("category", "==", category)
        );

        const snap = await getDocs(q);

        const list: Food[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        setFoods(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFoods();
  }, [category]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }, []);

  const handleQtyChange = (id: string, value: number) => {
    setQty((prev) => ({
      ...prev,
      [id]: value < 1 ? 1 : value,
    }));
  };

  const handleOrder = async (food: Food) => {
    try {
      const quantity = qty[food.id] || 1;

      const orderData = {
        tableNo: tableNo || "Unknown",
        foodId: food.id,
        title: food.title || "Unknown Food",
        price: food.price || 0,
        imageUrl:
          food.imageUrl ||
          "https://via.placeholder.com/300x200?text=No+Image",
        category: food.category || category || "Uncategorized",
        description: food.description || "No description available",
        ingredients: (food as any)?.incredients || [],
        quantity: quantity,
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

  const addToCart = (food: Food) => {
    const quantity = qty[food.id] || 1;

    const cartItem = {
      id: food.id,
      title: food.title,
      price: food.price,
      imageUrl: food.imageUrl,
      description: food.description,
      category: food.category,
      ingredients: food.ingredients,
      quantity,
    };

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    setCartCount(updatedCart.length);

    alert("✅ Added to cart!");
  };

  const goToOrderStatus = () => {
    router.push(`/customerMenu/order-status?table=${tableNo}`);
  };

  const goToBilling = () => {
    router.push(`/customerMenu/billing?table=${tableNo}`);
  };

  // IMAGE SLIDER COMPONENT
  const ImageSlider = ({ images }: { images: string[] }) => {
    const [index, setIndex] = useState(0);

    const next = () => setIndex((i) => (i + 1) % images.length);
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

    return (
      <div className="relative w-full h-44 overflow-hidden rounded-xl">
        <img
          src={images[index]}
          className="w-full h-full object-cover"
        />

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

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative px-3 py-4 sm:p-6"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 max-w-7xl mx-auto text-white">
        {/* TOP BAR */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
              ← Back
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto bg-yellow-500 text-black hover:bg-yellow-400"
                onClick={goToOrderStatus}
              >
                Order Status
              </Button>

              <Button
                className="relative w-full sm:w-auto bg-pink-500 hover:bg-pink-400 flex items-center gap-2"
                onClick={() => router.push(`/customerMenu/cart?table=${tableNo}`)}
              >
                <ShoppingCart size={18} />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Button>

              <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400" onClick={goToBilling}>
                Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TITLE */}
        <h1 className="text-3xl font-extrabold text-center mb-8">{category} Menu</h1>

        {/* FOOD GRID */}
        {loading ? (
          <div className="text-center animate-pulse">Loading foods...</div>
        ) : foods.length === 0 ? (
          <div className="text-center text-gray-300">No foods found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {foods.map((food) => (
              <Card key={food.id} className="bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl overflow-hidden">
                <CardContent className="p-2 flex flex-col h-full">

                  {/* REPLACED STATIC IMAGE WITH SLIDER */}
                  <ImageSlider
                    images={
                      Array.isArray(food.imageUrl)
                        ? food.imageUrl
                        : [
                            food.imageUrl ||
                              "https://via.placeholder.com/300x200?text=No+Image",
                          ]
                    }
                  />

                  <Badge className="w-fit mb-2 bg-white/20">{food.category}</Badge>

                  <h3 className="text-lg text-gray-300 font-bold">{food.title}</h3>

                  <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                    {food.description || "Delicious food"}
                  </p>

                  <p className="text-sm text-gray-300 line-clamp-2 mt-1">
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
            ))}
          </div>
        )}
      </div>

      {/* PAY POPUP */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="bg-white text-black rounded-xl">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>

          {selectedFood && (
            <div className="space-y-3">
              <img
                src={selectedFood.imageUrl as string}
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
              onClick={() => router.push(`/customerMenu/order-status?table=${tableNo}`)}
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
    </main>
  );
}
