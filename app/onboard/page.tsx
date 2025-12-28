'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import restaurantService from '@/lib/restaurant-service';
import { Check, ArrowRight, Loader2, Crown, Star, Zap, CreditCard, ShieldCheck } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  recommended?: boolean;
  icon: React.ReactNode;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1999,
    duration: 'per month',
    icon: <Star className="w-6 h-6" />,
    features: [
      'Up to 5 menu items',
      '1 kitchen staff account',
      'Basic order management',
      'Customer QR menu',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 3999,
    duration: 'per month',
    recommended: true,
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited menu items',
      '5 kitchen staff accounts',
      'Advanced analytics',
      'Custom branding',
      'Inventory management',
      'Priority support',
      'Table management'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 7999,
    duration: 'per month',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Everything in Professional',
      'Unlimited staff accounts',
      'Multi-location support',
      'Advanced reporting',
      'API access',
      '24/7 phone support',
      'Custom integrations'
    ]
  }
];

export default function RestaurantOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  
  // Form data
  const [formData, setFormData] = useState({
    // Restaurant details
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    
    // Payment details
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    
    // Admin details
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.restaurantName) newErrors.restaurantName = 'Restaurant name is required';
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.email) newErrors.email = 'Restaurant email is required';
      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }
    
    if (currentStep === 3) {
      if (!formData.cardholderName) newErrors.cardholderName = 'Cardholder name is required';
      if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
      if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
      if (!formData.cvv) newErrors.cvv = 'CVV is required';
      
      // Card number validation (basic 16 digit check)
      if (formData.cardNumber && !/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      
      // CVV validation
      if (formData.cvv && !/^\d{3,4}$/.test(formData.cvv)) {
        newErrors.cvv = 'Please enter a valid 3 or 4 digit CVV';
      }
      
      // Expiry date validation (MM/YY format)
      if (formData.expiryDate && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }
    }
    
    if (currentStep === 4) {
      if (!formData.adminName) newErrors.adminName = 'Admin name is required';
      if (!formData.adminEmail) newErrors.adminEmail = 'Admin email is required';
      if (!formData.adminPassword) newErrors.adminPassword = 'Password is required';
      if (formData.adminPassword && formData.adminPassword.length < 6) {
        newErrors.adminPassword = 'Password must be at least 6 characters';
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(step)) {
      if (step === 3) {
        // Process payment before moving to admin step
        const paymentResult = await processPayment();
        if (paymentResult) {
          setStep(step + 1);
        }
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const numericOnly = value.replace(/\s/g, '');
    const formatted = numericOnly.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const numericOnly = value.replace(/\D/g, '');
    if (numericOnly.length <= 2) return numericOnly;
    return `${numericOnly.substring(0, 2)}/${numericOnly.substring(2, 4)}`;
  };

  // Simulate Razorpay payment
  const processPayment = async (): Promise<boolean> => {
    setPaymentProcessing(true);
    
    try {
      // Simulate Razorpay payment API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll assume payment is successful
      // In real implementation, integrate with Razorpay SDK
      const selectedPlanDetails = subscriptionPlans.find(p => p.id === selectedPlan);
      
      console.log('Processing payment for:', {
        plan: selectedPlanDetails?.name,
        amount: selectedPlanDetails?.price,
        currency: 'INR',
        card: formData.cardNumber.slice(-4)
      });
      
      setPaymentSuccess(true);
      return true;
    } catch (error) {
      console.error('Payment failed:', error);
      setErrors({ payment: 'Payment processing failed. Please try again.' });
      return false;
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      // Create restaurant in Firestore
      const restaurantId = await restaurantService.createRestaurant({
        name: formData.restaurantName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        isActive: true
      });

      // Create admin account in separate collection
      await restaurantService.createAdmin({
        email: formData.adminEmail,
        password: formData.adminPassword, // In production, hash this password
        restaurantId: restaurantId,
        name: formData.restaurantName + ' Admin',
        isActive: true
      });

      // Create Firebase user for admin (for authentication)
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.adminEmail, 
        formData.adminPassword + '_admin'
      );

      // Store admin session
      localStorage.setItem(`admin_restaurant`, restaurantId);
      localStorage.setItem('admin', 'true');
      localStorage.setItem('subscription_plan', selectedPlan);

      // Redirect to admin dashboard
      router.push(`/RESTAURANT/${restaurantId}/admin/admindash`);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Restaurant Details</h2>
        <p className="text-gray-600 mt-2">Tell us about your restaurant</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant Name *
          </label>
          <input
            type="text"
            value={formData.restaurantName}
            onChange={(e) => handleInputChange('restaurantName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.restaurantName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter restaurant name"
          />
          {errors.restaurantName && <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Restaurant address"
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="10-digit phone number"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="restaurant@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of your restaurant"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Select the plan that best fits your restaurant needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${plan.recommended ? 'ring-2 ring-blue-200' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-blue-600 mb-2">{plan.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                <span className="text-gray-500 ml-1">{plan.duration}</span>
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            {selectedPlan === plan.id && (
              <div className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none" />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
        <p className="text-gray-600 mt-2">Secure payment processing with Razorpay</p>
      </div>

      {paymentSuccess ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
          <p className="text-green-600">Your subscription has been activated.</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Selected Plan: </span>
              <span className="text-blue-700">
                {subscriptionPlans.find(p => p.id === selectedPlan)?.name} - 
                ₹{subscriptionPlans.find(p => p.id === selectedPlan)?.price.toLocaleString()}/month
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={formData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter cardholder name"
              />
              {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123"
                  maxLength={4}
                />
                {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
              </div>
            </div>

            {errors.payment && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.payment}</p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Your payment information is secure and encrypted
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Account Setup</h2>
        <p className="text-gray-600 mt-2">Create your admin account to manage the restaurant</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Full Name *
          </label>
          <input
            type="text"
            value={formData.adminName}
            onChange={(e) => handleInputChange('adminName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.adminName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter admin full name"
          />
          {errors.adminName && <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Email *
          </label>
          <input
            type="email"
            value={formData.adminEmail}
            onChange={(e) => handleInputChange('adminEmail', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.adminEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="admin@email.com"
          />
          {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.adminPassword}
              onChange={(e) => handleInputChange('adminPassword', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.adminPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Minimum 6 characters"
            />
            {errors.adminPassword && <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Plan Summary:</h4>
          <div className="text-sm text-gray-600">
            <p><strong>{subscriptionPlans.find(p => p.id === selectedPlan)?.name}</strong></p>
            <p>₹{subscriptionPlans.find(p => p.id === selectedPlan)?.price.toLocaleString()} per month</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            <span>Restaurant</span>
            <span>Plan</span>
            <span>Payment</span>
            <span>Admin</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-6 py-2 rounded-lg font-medium ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={step === 3 && paymentProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {step === 3 && paymentProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    {step === 3 ? 'Pay & Continue' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}