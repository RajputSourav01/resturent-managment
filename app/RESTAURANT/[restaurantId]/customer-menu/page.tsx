'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import restaurantService, { Food } from '@/lib/restaurant-service';
import { ShoppingCart, Plus, Minus, Filter, Search, Star } from 'lucide-react';

const CustomerMenuContent = () => {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const tableNo = searchParams.get('table');

  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Cart functionality
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [cartTotal, setCartTotal] = useState(0);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true);
        const foodsData = await restaurantService.getFoods(restaurantId as string);
        // Only show available foods to customers
        const availableFoods = foodsData.filter(food => food.isAvailable);
        setFoods(availableFoods);
        setFilteredFoods(availableFoods);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(availableFoods.map(food => food.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching foods:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchFoods();
    }
  }, [restaurantId]);

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

  // Calculate cart total
  useEffect(() => {
    const total = Object.entries(cart).reduce((sum, [foodId, quantity]) => {
      const food = foods.find(f => f.id === foodId);
      return sum + (food ? food.price * quantity : 0);
    }, 0);
    setCartTotal(total);
  }, [cart, foods]);

  const addToCart = (foodId: string) => {
    setCart(prev => ({
      ...prev,
      [foodId]: (prev[foodId] || 0) + 1
    }));
  };

  const removeFromCart = (foodId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[foodId] > 1) {
        newCart[foodId]--;
      } else {
        delete newCart[foodId];
      }
      return newCart;
    });
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  };

  const handleOrder = () => {
    if (Object.keys(cart).length === 0) return;
    
    // Here you would typically send the order to the restaurant
    const orderItems = Object.entries(cart).map(([foodId, quantity]) => {
      const food = foods.find(f => f.id === foodId);
      return {
        foodId,
        name: food?.name,
        quantity,
        price: food?.price,
        total: (food?.price || 0) * quantity
      };
    });

    console.log('Order placed:', {
      restaurantId,
      tableNo,
      items: orderItems,
      total: cartTotal,
      timestamp: new Date()
    });

    alert(`Order placed successfully for Table ${tableNo}!\nTotal: ₹${cartTotal}\nItems: ${getCartItemCount()}`);
    setCart({});
    setShowCart(false);
  };

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Table Info */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Menu</h1>
              <p className="text-sm text-gray-600">Table {tableNo}</p>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Cart</span>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

        {/* Food Grid */}
        {filteredFoods.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {foods.length === 0 ? 'No items available' : 'No items match your search'}
            </h3>
            <p className="text-gray-500">
              {foods.length === 0 
                ? 'Please check back later for available items'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Food Image */}
                <div className="aspect-video relative overflow-hidden">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <span className="text-4xl text-orange-400">🍽️</span>
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                      {food.category}
                    </span>
                  </div>

                  {/* Rating Badge (placeholder) */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-white bg-opacity-90 text-orange-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      4.5
                    </div>
                  </div>
                </div>

                {/* Food Details */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {food.name}
                    </h3>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xl font-bold text-orange-600">₹{food.price}</p>
                      <p className="text-sm text-gray-500">Stock: {food.stock}</p>
                    </div>
                  </div>

                  {food.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {food.description}
                    </p>
                  )}

                  {/* Add to Cart Section */}
                  <div className="flex items-center justify-between">
                    {cart[food.id!] ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(food.id!)}
                          className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-medium text-lg">{cart[food.id!]}</span>
                        <button
                          onClick={() => addToCart(food.id!)}
                          className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(food.id!)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
            <div 
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Your Order</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {Object.entries(cart).map(([foodId, quantity]) => {
                      const food = foods.find(f => f.id === foodId);
                      if (!food) return null;
                      return (
                        <div key={foodId} className="flex items-center justify-between border-b pb-4">
                          <div className="flex-1">
                            <h4 className="font-medium">{food.name}</h4>
                            <p className="text-gray-500">₹{food.price} x {quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(foodId)}
                              className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
                            >
                              <Minus size={12} />
                            </button>
                            <span>{quantity}</span>
                            <button
                              onClick={() => addToCart(foodId)}
                              className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total: ₹{cartTotal}</span>
                      <span className="text-sm text-gray-500">Table {tableNo}</span>
                    </div>
                    <button
                      onClick={handleOrder}
                      className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CustomerMenuContent />
    </Suspense>
  );
}