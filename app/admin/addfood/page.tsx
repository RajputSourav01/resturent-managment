// components/admin/AddFoodForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

interface FoodFormData {
  title: string;
  price: number;
  category: string;
  ingredients: string;
  description: string;
  imageUrl: string;
}

const initialFormData: FoodFormData = {
  title: '',
  price: 0,
  category: 'Main Course',
  ingredients: '',
  description: '',
  imageUrl: '',
};

const categories = ['Main Course', 'Appetizer', 'Dessert', 'Beverage'];

const AddFoodForm: React.FC = () => {
  const [formData, setFormData] = useState<FoodFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [foods, setFoods] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(categories);

  /* --------------------------- FETCH FOODS --------------------------- */
  useEffect(() => {
    const foodsRef = collection(db, 'foods');

    const unsubscribe = onSnapshot(foodsRef, (snapshot) => {
      const foodsData: Record<string, any> = {};
      const categoriesSet = new Set(categories);

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
  }, []);

  /* --------------------------- FORM INPUT CHANGE --------------------------- */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  /* --------------------------- SUBMIT FORM --------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!formData.title.trim() || !formData.imageUrl || formData.price <= 0) {
      setMessage('❌ Please fill all required fields correctly.');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        // UPDATE FOOD
        const updateRef = doc(db, 'foods', editingId);
        await updateDoc(updateRef, { ...formData });

        setMessage('✅ Food item updated successfully!');
        setEditingId(null);
      } else {
        // ADD FOOD
        const foodsRef = collection(db, 'foods');
        await addDoc(foodsRef, {
          ...formData,
          createdAt: new Date(),
        });

        setMessage(`✅ Food item "${formData.title}" added!`);
      }

      setFormData(initialFormData);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to save food.');
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------- DELETE FOOD --------------------------- */
  const deleteFood = async (id: string) => {
    try {
      const delRef = doc(db, 'foods', id);
      await deleteDoc(delRef);
    } catch (err) {
      console.error(err);
    }
  };

  /* --------------------------- START EDIT --------------------------- */
  const startEdit = (id: string, data: any) => {
    setEditingId(id);
    setFormData({
      title: data.title || '',
      price: data.price || 0,
      category: data.category || 'Main Course',
      ingredients: data.ingredients || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
    });
  };

  /* --------------------------- GROUP BY CATEGORY --------------------------- */
  const foodsByCategory = (cat: string) =>
    Object.entries(foods).filter(([_, food]: any) => food.category === cat);

  /* --------------------------- GET CATEGORY COUNT --------------------------- */
  const getCategoryCount = (cat: string) =>
    Object.values(foods).filter((food: any) => food.category === cat).length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

      {/* --------------------- FORM ---------------------- */}
      <div className="bg-white shadow-sm rounded-lg border p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-semibold mb-6">
          {editingId ? 'Edit Food Item' : 'Add New Food Item'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image URL and Title */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL *</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Title *</label>
              <input
                type="text"
                placeholder="e.g., Chicken Biryani"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
              <input
                type="number"
                placeholder="299"
                name="price"
                value={formData.price}
                min={1}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
            <input
              type="text"
              placeholder="e.g., Rice, Chicken, Spices, Yogurt"
              name="ingredients"
              value={formData.ingredients}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe your delicious food item..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {message && (
            <p
              className={`text-sm font-medium ${
                message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : editingId ? 'Update Food' : 'Add Food'}
          </button>
        </form>
      </div>

      {/* --------------------- CATEGORY BLOCKS ---------------------- */}
      <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">Food Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {availableCategories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer p-4 rounded-lg text-center shadow-sm border hover:shadow-md transition-all
                ${selectedCategory === cat ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white hover:bg-blue-50'}
              `}
            >
              <h3 className="font-semibold text-sm sm:text-base">{cat}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {getCategoryCount(cat)} items
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------- SHOW RELATED FOODS ---------------------- */}
      {selectedCategory && (
        <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">
              {selectedCategory} Items
            </h2>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Clear Selection
            </button>
          </div>

          {foodsByCategory(selectedCategory).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">🍽️</p>
              <p>No food available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foodsByCategory(selectedCategory).map(([id, food]: any) => (
                <div key={id} className="border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
                  {/* Food Image */}
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={food.imageUrl}
                      className="w-full h-full object-cover"
                      alt={food.title}
                    />
                  </div>

                  {/* Food Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{food.title}</h3>
                    <p className="text-blue-600 font-bold text-lg mb-2">₹{food.price}</p>
                    
                    {food.ingredients && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        <strong>Ingredients:</strong> {food.ingredients}
                      </p>
                    )}
                    
                    {food.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {food.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(id, food)}
                        className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFood(id)}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddFoodForm;
