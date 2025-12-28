'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { restaurantService } from '@/lib/restaurant-service';
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react';
import bcrypt from 'bcryptjs';

interface StaffLoginPageProps {
  params: Promise<{ restaurantId: string }>;
}

export default function StaffLoginPage({ params }: StaffLoginPageProps) {
  const { restaurantId } = use(params);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    mobile: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.mobile) {
      setError('Mobile number is required');
      return false;
    }
    
    if (!/^\d{10}$/.test(formData.mobile.replace(/\s/g, ''))) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    return true;
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch restaurant staff to validate credentials
      const staffList = await restaurantService.getStaff(restaurantId);
      
      // Find staff member by mobile number
      const staffMember = staffList.find(staff => 
        staff.mobile === formData.mobile && staff.isActive
      );
      
      if (!staffMember) {
        throw new Error('Staff member not found or inactive');
      }

      // Verify password (assuming passwords are hashed with bcryptjs)
      const isValidPassword = await bcrypt.compare(formData.password, staffMember.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Create a temporary Firebase user for kitchen staff
      // For demo purposes, we'll create a unique email
      const staffEmail = `staff_${staffMember.id}@${restaurantId}.kitchen`;
      
      try {
        // Try to sign in first (if account already exists)
        await signInWithEmailAndPassword(auth, staffEmail, formData.password);
      } catch (signInError: any) {
        // If user doesn't exist, create one
        if (signInError.code === 'auth/user-not-found') {
          await createUserWithEmailAndPassword(auth, staffEmail, formData.password);
        } else {
          throw signInError;
        }
      }

      // Store staff information in localStorage
      localStorage.setItem('kitchen_staff', JSON.stringify({
        staffId: staffMember.id,
        restaurantId: restaurantId,
        fullName: staffMember.fullName,
        designation: staffMember.designation,
        mobile: staffMember.mobile
      }));
      
      // Redirect to kitchen dashboard
      router.push(`/RESTAURANT/${restaurantId}/KitchenDash`);
      
    } catch (error: any) {
      console.error('Staff login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message === 'Staff member not found or inactive') {
        errorMessage = 'Invalid mobile number. Please check with your admin.';
      } else if (error.message === 'Invalid password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-orange-100">
            <ChefHat className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Kitchen Staff Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access the kitchen dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form onSubmit={handleStaffLogin} className="space-y-6">
            {/* Mobile Number Input */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                required
                placeholder="Enter your 10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                maxLength={10}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Logging in...
                </>
              ) : (
                'Login to Kitchen'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Kitchen staff access only
            </p>
            <p className="text-xs text-gray-500">
              Having trouble logging in? Contact your restaurant admin.
            </p>
          </div>
          
          {/* Admin Login Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push(`/RESTAURANT/${restaurantId}/adminlogin`)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Admin Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}