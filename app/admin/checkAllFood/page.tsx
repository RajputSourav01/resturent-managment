'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';

interface FoodItem {
  id: string;
  title: string;
  price: number;
  category: string;
  description?: string;
  ingredients?: string;
  imageUrl?: string;
}

const AllFoodsList: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const foodsRef = collection(db, 'foods');

    const unsubscribe = onSnapshot(foodsRef, (snapshot) => {
      const foodsData: FoodItem[] = [];
      snapshot.forEach((doc) => {
        foodsData.push({
          id: doc.id,
          ...doc.data(),
        } as FoodItem);
      });

      setFoods(foodsData);
    });

    return () => unsubscribe();
  }, []);

  // Delete Food Item
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'foods', id));
      alert("Food item deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete food item.");
    }
  };

  // Edit Food Item
  const handleEdit = (id: string) => {
    router.push(`/admin/editfood?id=${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Food Items</h2>
        <p className="text-gray-600">Manage your restaurant's food menu</p>
      </div>

      {foods.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No food items available</h3>
          <p className="text-gray-500 mb-6">Start by adding some delicious items to your menu</p>
          <button
            onClick={() => router.push('/admin/addfood')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Your First Food Item
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{foods.length}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {new Set(foods.map(f => f.category)).size}
                </p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                  ₹{Math.round(foods.reduce((sum, f) => sum + f.price, 0) / foods.length)}
                </p>
                <p className="text-sm text-gray-600">Avg Price</p>
              </div>
            </div>
          </div>

          {/* Food Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {foods.map((food) => (
              <div
                key={food.id}
                className="bg-white shadow-sm rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Food Image */}
                <div className="aspect-video relative overflow-hidden">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">🍽️</span>
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                      {food.category}
                    </span>
                  </div>
                </div>

                {/* Food Details */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                      {food.title}
                    </h3>
                    <p className="text-xl font-bold text-blue-600">₹{food.price}</p>
                  </div>

                  {food.ingredients && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      <strong>Ingredients:</strong> {food.ingredients}
                    </p>
                  )}

                  {food.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {food.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(food.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 text-sm font-medium transition-colors"
                    >
                      <Pencil size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(food.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/admin/addfood')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add New Food Item
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllFoodsList;
