"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

// ✅ ShadCN
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Category = {
  name: string;
  imageUrl?: string;
};

export default function DigitalMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNo = searchParams.get("table");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snap = await getDocs(collection(db, "foods"));

        const categoryMap = new Map<string, { name: string; images: string[] }>();

        snap.docs.forEach((doc) => {
          const data = doc.data();

          if (data?.category) {
            const key = data.category.trim().toLowerCase();

            if (!categoryMap.has(key)) {
              categoryMap.set(key, {
                name: data.category,
                images: [],
              });
            }

            if (data.imageUrl) {
              categoryMap.get(key)?.images.push(data.imageUrl);
            }
          }
        });

        const uniqueCategories: Category[] = Array.from(categoryMap.values()).map(
          (cat) => ({
            name: cat.name,
            imageUrl:
              cat.images.length > 0
                ? cat.images[Math.floor(Math.random() * cat.images.length)]
                : "",
          })
        );

        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryClick = (name: string) => {
    router.push(
      `/customerMenu/food-items?category=${encodeURIComponent(
        name
      )}&table=${tableNo || "unknown"}`
    );
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836')",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative w-full max-w-7xl text-white flex flex-col items-center">
         <h1 className="text-center text-3xl sm:text-5xl font-extrabold mb-20 animate-pulse">
          Golden Fork
        </h1>
        <h2 className="text-center text-3xl sm:text-5xl font-extrabold mb-20 animate-pulse">
          Our Digital Menu
        </h2>

        {loading ? (
          <div className="text-center py-20 text-lg animate-bounce">
            Loading menu...
          </div>
        ) : (
          <div className="w-full flex justify-center mb-20">
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 place-items-center">
              {categories.map((cat, i) => (
                <Card
                  key={i}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="w-full max-w-[160px] group bg-white/10 backdrop-blur-xl rounded-3xl p-3 text-center
                    shadow-2xl hover:scale-110 hover:-rotate-1 transition-all duration-500 cursor-pointer
                    border border-white/20"
                >
                  <CardContent className="p-0">
                    <div className="h-28 w-full overflow-hidden rounded-2xl mb-2">
                      <img
                        src={
                          cat.imageUrl ||
                          "https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
                        }
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-125 transition-transform duration-700"
                      />
                    </div>

                    <CardHeader className="p-0 text-center">
                      
                      <Badge className="mx-auto mt-1 bg-white/20">{cat.name}</Badge>
                    </CardHeader>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
