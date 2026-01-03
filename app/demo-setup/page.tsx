'use client';

import { useState } from 'react';
import restaurantService from '@/lib/restaurant-service';

export default function DemoSetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createDemoAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First, create a demo restaurant if it doesn't exist
      const restaurantId = await restaurantService.createRestaurant({
        name: 'Demo Restaurant',
        address: '123 Demo Street, Demo City',
        phone: '+91 9999999999',
        email: 'demo@restaurant.com',
        description: 'A demo restaurant for testing',
        isActive: true
      });

      // Create admin account
      await restaurantService.createAdmin({
        email: 'admin@demo.com',
        password: 'admin123',
        restaurantId: restaurantId,
        name: 'Demo Admin',
        isActive: true
      });

      setMessage(`Demo admin created successfully! 
      Restaurant ID: ${restaurantId}
      Admin Email: admin@demo.com
      Password: admin123`);
      
    } catch (error: any) {
      console.error('Error creating demo admin:', error);
      setMessage('Error creating demo admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Demo Setup</h1>
        
        <button
          onClick={createDemoAdmin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? 'Creating...' : 'Create Demo Admin'}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message}</pre>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
          <p><strong>Usage:</strong></p>
          <p>1. Click "Create Demo Admin" to set up a demo restaurant and admin account</p>
          <p>2. Go back to home page and login with the provided credentials</p>
          <p>3. Use Restaurant ID if prompted</p>
        </div>
      </div>
    </div>
  );
}