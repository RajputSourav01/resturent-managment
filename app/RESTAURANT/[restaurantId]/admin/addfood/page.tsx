'use client';

import React, { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  DocumentData,
  DocumentReference,
} from 'firebase/firestore';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

/* ======================
   TYPES
   ====================== */
interface FoodFormData {
  title: string;
  price: number;
  category: string;
  ingredients: string;
  description: string;
  imageUrl: string[];
}

const initialFormData: FoodFormData = {
  title: '',
  price: 0,
  category: 'Main Course',
  ingredients: '',
  description: '',
  imageUrl: [''],
};

const defaultCategories = ['Main Course', 'Appetizer', 'Dessert', 'Beverage'];

/* ==========================================
   MAIN COMPONENT — NOW MULTI TENANT
   ========================================== */
interface AddFoodFormProps {
  params: Promise<{ restaurantId: string }>;
}

export default function AddFoodForm({ params }: AddFoodFormProps) {
  const { restaurantId } = use(params); // ⭐ GET TENANT ID

  const [formData, setFormData] = useState<FoodFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [foods, setFoods] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] =
    useState<string[]>(defaultCategories);

  const [hasScrolled, setHasScrolled] = useState(false);

  /* ==========================================
     🔥 FETCH FOODS FROM THIS RESTAURANT ONLY
     ========================================== */
  useEffect(() => {
    if (!restaurantId) return;

    const foodsRef = collection(
      db,
      'restaurants',
      restaurantId,
      'foods' // ⭐ TENANT ISOLATION
    );

    const unsubscribe = onSnapshot(foodsRef, (snapshot) => {
      const foodsData: Record<string, any> = {};
      const categoriesSet = new Set(defaultCategories);

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        foodsData[docSnap.id] = { id: docSnap.id, ...data };

        if (data.category) {
          categoriesSet.add(data.category);
        }
      });

      setFoods(foodsData);
      setAvailableCategories(Array.from(categoriesSet));
    });

    return () => unsubscribe();
  }, [restaurantId]);

  /* ==========================================
     INPUT HANDLERS
     ========================================== */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    const updated = [...formData.imageUrl];
    updated[index] = value;

    setFormData((prev) => ({
      ...prev,
      imageUrl: updated,
    }));
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: [...prev.imageUrl, ''],
    }));
  };

  const removeImageField = (index: number) => {
    const updated = formData.imageUrl.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      imageUrl: updated.length ? updated : [''],
    }));
  };

  /* ==========================================
     SUBMIT (ADD / UPDATE)
     ========================================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const foodsRef = collection(
      db,
      'restaurants',
      restaurantId,
      'foods' // ⭐ MULTI TENANT PATH
    );

    try {
      if (editingId) {
  const ref = doc(
    db,
    'restaurants',
    restaurantId,
    'foods',
    editingId
  );

  await setDoc(ref, {
    name: formData.title,
    description: formData.description,
    price: formData.price,
    category: formData.category,
    image: formData.imageUrl[0] || 'https://via.placeholder.com/300',
    stock: 100,
    isAvailable: true,
    updatedAt: new Date(),
  }, { merge: true });

  setMessage('✅ Food item updated successfully!');
  setEditingId(null);
}
 else {
        await addDoc(foodsRef, {
          name: formData.title,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          image: formData.imageUrl[0] || 'https://via.placeholder.com/300',
          stock: 100,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        setMessage(`✅ Food item "${formData.title}" added!`);
      }

      setFormData(initialFormData);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to save food.');
    }

    setLoading(false);
  };

  /* ==========================================
     DELETE
     ========================================== */
  const deleteFood = async (id: string) => {
    try {
      await deleteDoc(
        doc(db, 'restaurants', restaurantId, 'foods', id) // ⭐ TENANT BASED DELETE
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ==========================================
     START EDIT
     ========================================== */
  const startEdit = (id: string, data: any) => {
    setEditingId(id);

    setFormData({
      title: data.name || data.title,
      price: data.price,
      category: data.category,
      ingredients: data.ingredients || '',
      description: data.description,
      imageUrl: Array.isArray(data.image) ? data.image : [data.image || data.imageUrl],
    });
  };

  /* ==========================================
     IMAGE SLIDER
     ========================================== */
  const [sliderIndex, setSliderIndex] = useState<Record<string, number>>({});

  const nextImage = (id: string, total: number) => {
    setSliderIndex((prev) => ({
      ...prev,
      [id]: ((prev[id] ?? 0) + 1) % total,
    }));
  };

  const prevImage = (id: string, total: number) => {
    setSliderIndex((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) === 0 ? total - 1 : (prev[id] ?? 0) - 1,
    }));
  };

  /* ==========================================
     CATEGORY HELPERS
     ========================================== */
  const foodsByCategory = (cat: string) =>
    Object.entries(foods).filter(([_, food]: any) => food.category === cat);

  const getCategoryCount = (cat: string) =>
    Object.values(foods).filter((food: any) => food.category === cat).length;

  /* ==========================================
     UI RETURN
     ========================================== */
  return (
    <AdminProtectedRoute>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

        {/* -------- FORM -------- */}
        <div className="bg-white shadow-sm rounded-lg border p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6">
            {editingId ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* IMAGE URLS */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Image URLs *
              </label>

              {formData.imageUrl.map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) =>
                      handleImageChange(index, e.target.value)
                    }
                    className="flex-1 p-3 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="px-3 bg-red-500 text-white rounded-lg"
                  >
                    X
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addImageField}
                className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                + Add More
              </button>
            </div>

            {/* TITLE */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Food Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Chicken Biryani"
                className="w-full p-3 border rounded-lg"
              />
            </div>

            {/* PRICE + CATEGORY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  min={1}
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* INGREDIENTS */}
            <div>
              <label className="block text-sm mb-2">Ingredients</label>
              <input
                type="text"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            {/* MESSAGE */}
            {message && (
              <p
                className={`text-sm font-medium ${
                  message.startsWith('✅')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
            >
              {loading
                ? 'Saving...'
                : editingId
                ? 'Update Food'
                : 'Add Food'}
            </button>
          </form>
        </div>

        {/* CATEGORIES */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Food Categories</h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableCategories.map((cat) => (
              <div
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);

                  if (!hasScrolled) {
                    setHasScrolled(true);
                    setTimeout(() => {
                      window.scrollBy({
                        top: 600,
                        behavior: 'smooth',
                      });
                    }, 200);
                  }
                }}
                className={`cursor-pointer p-4 rounded-lg text-center shadow-sm border ${
                  selectedCategory === cat
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                    : 'bg-white hover:bg-blue-50'
                }`}
              >
                <h3 className="font-semibold">{cat}</h3>
                <p className="text-gray-500 text-sm">
                  {getCategoryCount(cat)} items
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SHOW FOODS */}
        {selectedCategory && (
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{selectedCategory}</h2>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setHasScrolled(false);
                }}
                className="text-gray-600"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {foodsByCategory(selectedCategory).map(([id, food]: any) => {
                const total = food.imageUrl?.length || 1;
                const index = sliderIndex[id] ?? 0;

                return (
                  <div
                    key={id}
                    className="border rounded-lg shadow-sm bg-white"
                  >
                    {/* IMAGE SLIDER */}
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={food.imageUrl[index]}
                        className="w-full h-full object-cover"
                      />

                      {total > 1 && (
                        <>
                          <button
                            onClick={() => prevImage(id, total)}
                            className="absolute left-2 top-1/2 bg-black/40 text-white px-2 py-1 rounded"
                          >
                            ‹
                          </button>
                          <button
                            onClick={() => nextImage(id, total)}
                            className="absolute right-2 top-1/2 bg-black/40 text-white px-2 py-1 rounded"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg">
                        {food.title}
                      </h3>

                      <p className="text-blue-600 font-bold text-lg mb-2">
                        ₹{food.price}
                      </p>

                      {food.ingredients && (
                        <p className="text-xs text-gray-500 mb-2">
                          <strong>Ingredients: </strong>
                          {food.ingredients}
                        </p>
                      )}

                      {food.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {food.description}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            startEdit(id, food);
                            setTimeout(() => {
                              window.scrollTo({
                                top: 0,
                                behavior: 'smooth',
                              });
                            }, 200);
                          }}
                          className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-md"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteFood(id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
}


