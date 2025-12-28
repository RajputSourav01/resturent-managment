'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RestaurantOnboarding from './onboard/page';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  const { user, loading, userRole, restaurantId } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, redirect to their respective dashboard
  if (user && userRole && restaurantId) {
    if (userRole === 'admin') {
      window.location.href = `/RESTAURANT/${restaurantId}`;
      return null;
    } else if (userRole === 'kitchen_staff') {
      window.location.href = `/RESTAURANT/${restaurantId}/kitchen`;
      return null;
    }
  }

  // Show onboarding if requested
  if (showOnboarding) {
    return <RestaurantOnboarding />;
  }

  // Show main home page with login options
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Restaurant Management" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Restaurant Management System
          </h1>
          <p className="text-xl text-gray-600">
            Manage your restaurant operations efficiently
          </p>
        </header>

        {/* Login Section */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mb-8">
          <LoginPage />
        </div>

        {/* Actions */}
        <div className="text-center">
          <button
            onClick={() => setShowOnboarding(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
          >
            Register New Restaurant
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-orange-600 text-4xl mb-4">👨‍💼</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Restaurant Admin
            </h3>
            <p className="text-gray-600">
              Full control over restaurant operations, staff management, and menu
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-orange-600 text-4xl mb-4">👨‍🍳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Kitchen Staff
            </h3>
            <p className="text-gray-600">
              Manage orders, update status, and coordinate kitchen operations
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-orange-600 text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Mobile Friendly
            </h3>
            <p className="text-gray-600">
              Access your restaurant data from anywhere, anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
