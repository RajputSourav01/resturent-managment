'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import restaurantService from '@/lib/restaurant-service';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'admin' | 'staff'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshUserData } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      // First, check if admin exists in our admin collection
      const adminData = await restaurantService.getAdminByEmail(email);
      
      if (!adminData) {
        setError('Admin not found with this email');
        return;
      }

      // Verify password (in production, use proper bcrypt comparison)
      if (adminData.password !== password) {
        setError('Invalid password');
        return;
      }

      // Check if restaurant ID matches (if provided)
      if (restaurantId && restaurantId !== adminData.restaurantId) {
        setError('Restaurant ID does not match your account');
        return;
      }

      // Get or create Firebase Auth user for this admin
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password + '_admin');
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          // Create Firebase auth user if doesn't exist
          userCredential = await createUserWithEmailAndPassword(auth, email, password + '_admin');
        } else {
          throw authError;
        }
      }

      // Store admin session
      localStorage.setItem('admin', 'true');
      localStorage.setItem('admin_restaurant', adminData.restaurantId);
      
      await refreshUserData();
      
      // Redirect will be handled by the parent component
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!restaurantId || !mobile || !password) {
        setError('Please fill all fields');
        return;
      }

      // Use API route for staff login with proper password validation
      const response = await fetch(`/RESTAURANT/${restaurantId}/api/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Login failed');
        return;
      }

      const staffData = result.staff;

      // Create anonymous auth session for staff
      const tempEmail = `staff_${mobile}_${restaurantId}@temp.com`;
      const tempPassword = 'temp123456';

      try {
        await signInWithEmailAndPassword(auth, tempEmail, tempPassword);
      } catch {
        // If temp account doesn't exist, create it
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
      }

      // Store staff session
      localStorage.setItem('kitchen_staff', JSON.stringify({
        staffId: staffData.id,
        restaurantId: restaurantId,
        staffData: staffData
      }));

      await refreshUserData();
      
      // Redirect will be handled by the parent component
    } catch (error: any) {
      console.error('Staff login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Login</h2>
        <p className="text-gray-600 mt-2">Access your restaurant dashboard</p>
      </div>

      {/* Login Type Selector */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => {
            setLoginType('admin');
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            loginType === 'admin'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Restaurant Admin
        </button>
        <button
          onClick={() => {
            setLoginType('staff');
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            loginType === 'staff'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Kitchen Staff
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Admin Login Form */}
      {loginType === 'admin' && (
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="admin@restaurant.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter password"
              required
            />
          </div>

          <div>
            <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant ID (optional)
            </label>
            <input
              type="text"
              id="restaurantId"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Restaurant ID for verification"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      )}

      {/* Staff Login Form */}
      {loginType === 'staff' && (
        <form onSubmit={handleStaffLogin} className="space-y-4">
          <div>
            <label htmlFor="staff-restaurant-id" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant ID
            </label>
            <input
              type="text"
              id="staff-restaurant-id"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter Restaurant ID"
              required
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div>
            <label htmlFor="staff-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="staff-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter password"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Demo password: demo123
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login as Staff'}
          </button>
        </form>
      )}
    </div>
  );
}