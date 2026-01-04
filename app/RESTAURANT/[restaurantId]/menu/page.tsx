'use client';

import React, { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import restaurantService, { Food } from '@/lib/restaurant-service';
import { Pencil, Trash2, Plus, Filter } from 'lucide-react';

interface MenuPageProps {
  params: Promise<{ restaurantId: string }>;
}

const MenuPage: React.FC<MenuPageProps> = ({ params }) => {
  const { restaurantId } = use(params);
  const router = useRouter();
  const { user, userRole, restaurantId: authRestaurantId } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user has access to this restaurant
  const hasAccess = authRestaurantId === restaurantId && (userRole === 'admin' || userRole === 'kitchen_staff');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (!hasAccess) {
      router.push('/');
      return;
    }

    const fetchFoods = async () => {
      try {
        setLoading(true);
        const foodsData = await restaurantService.getFoods(restaurantId);
        setFoods(foodsData);
        setFilteredFoods(foodsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(foodsData.map(food => food.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching foods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [restaurantId, hasAccess, router]);

  // Filter foods based on category and search term
  useEffect(() => {
    let filtered = foods;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(food => food.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFoods(filtered);
  }, [foods, selectedCategory, searchTerm]);

  const handleDelete = async (foodId: string) => {
    if (!isAdmin) return;
    
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      await restaurantService.deleteFood(restaurantId, foodId);
      setFoods(foods.filter(food => food.id !== foodId));
      alert("Food item deleted successfully!");
    } catch (error) {
      console.error('Error deleting food:', error);
      alert("Failed to delete food item.");
    }
  };

  const handleEdit = (foodId: string) => {
    if (!isAdmin) return;
    router.push(`/RESTAURANT/${restaurantId}/admin/addfood?id=${foodId}`);
  };

  const handleAddNew = () => {
    if (!isAdmin) return;
    router.push(`/RESTAURANT/${restaurantId}/admin/addfood`);
  };

  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <button
      onClick={() => router.back()}
      className="px-4 py-2 rounded bg-gray-800 text-white"
    >
      ← Back
    </button>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Restaurant Menu
              </h2>
              <p className="text-gray-600">
                {isAdmin ? 'Manage your restaurant\'s food menu' : 'View available menu items'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Add New Item
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredFoods.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {foods.length === 0 ? 'No food items available' : 'No items match your search'}
            </h3>
            <p className="text-gray-500 mb-6">
              {foods.length === 0 
                ? 'Start by adding some delicious items to your menu'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {isAdmin && foods.length === 0 && (
              <button
                onClick={handleAddNew}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Add Your First Food Item
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{foods.length}</p>
                  <p className="text-sm text-gray-600">Total Items</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{categories.length}</p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                    ₹{Math.round(foods.reduce((sum, f) => sum + f.price, 0) / foods.length)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Price</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                    {foods.filter(f => f.isAvailable).length}
                  </p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className={`bg-white shadow-sm rounded-lg border overflow-hidden hover:shadow-md transition-shadow ${
                    !food.isAvailable ? 'opacity-60' : ''
                  }`}
                >
                  {/* Food Image */}
                  <div className="aspect-video relative overflow-hidden">
                    {food.image ? (
                      <img
                        src={Array.isArray(food.image) ? food.image[0] : food.image}
                        alt={food.name}
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

                    {/* Availability Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        food.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {food.isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Food Details */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {food.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <p className="text-xl font-bold text-orange-600">₹{food.price}</p>
                        <p className="text-sm text-gray-500">Stock: {food.stock}</p>
                      </div>
                    </div>

                    {food.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {food.description}
                      </p>
                    )}

                    {/* Action Buttons - Only for Admin */}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(food.id!)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium transition-colors"
                        >
                          <Pencil size={14} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(food.id!)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuPage;