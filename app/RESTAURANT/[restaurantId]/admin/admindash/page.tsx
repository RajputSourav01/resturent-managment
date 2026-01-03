"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import restaurantService, { Restaurant, Food, Staff, Order } from "@/lib/restaurant-service";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import CustomerFlowChart from "@/components/admin/CustomerFlowChart";
import InventoryDoughnut from "@/components/admin/InventoryDoughnut";
import { 
  Users, 
  ShoppingCart, 
  ArchiveX, 
  Tag, 
  Settings, 
  LogOut, 
  Store,
  CreditCard,
  Crown,
  Calendar,
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Theme from "@/app/RESTAURANT/[restaurantId]/admin/theme/page";
import TableManagement from "@/components/admin/TableManagement";
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type StatsResponse = {
  totalSales: number;
  totalInventory: number;
  totalStaff: number;
  totalCategories: number;
  daily: {
    dates: string[];
    revenue: number[];
    customers: number[];
  };
  inventory: { id: string; name: string; stock: number; category: string; price: number }[];
  orders: { id: string; title: string; category: string; total: number; createdAt: string }[];
};

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
    icon: <Zap className="w-5 h-5" />,
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
    icon: <Crown className="w-5 h-5" />,
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
    icon: <TrendingUp className="w-5 h-5" />,
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

// Active Days Card Component
function ActiveDaysCard({ restaurantData }: { restaurantData: Restaurant | null }) {
  const calculateActiveDays = () => {
    // Use plan purchase date if available, otherwise fall back to restaurant creation date
    const referenceDate = restaurantData?.plan?.purchasedAt || restaurantData?.createdAt;
    if (!referenceDate) return 0;
    
    let startDate: Date;
    
    // Handle Firestore Timestamp
    if (referenceDate && typeof referenceDate === 'object' && 'toDate' in referenceDate) {
      startDate = (referenceDate as any).toDate();
    }
    // Handle Date object
    else if (referenceDate instanceof Date) {
      startDate = referenceDate;
    }
    // Handle string date
    else if (typeof referenceDate === 'string') {
      startDate = new Date(referenceDate);
    }
    // Handle timestamp number
    else if (typeof referenceDate === 'number') {
      startDate = new Date(referenceDate);
    }
    // Fallback
    else {
      console.log('Reference date data:', referenceDate);
      return 0;
    }
    
    // Validate the date
    if (isNaN(startDate.getTime())) {
      console.log('Invalid date:', referenceDate);
      return 0;
    }
    
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - startDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    
    // If there's an active plan, show remaining days out of 30
    if (restaurantData?.plan?.purchasedAt) {
      const remainingDays = 30 - daysDifference;
      return Math.max(0, remainingDays);
    }
    
    // For restaurants without plans, show days since creation
    return Math.max(0, daysDifference);
  };

  const calculatePlanExpiry = () => {
    if (!restaurantData?.plan?.purchasedAt) return null;
    
    let purchaseDate: Date;
    
    // Handle Firestore Timestamp
    if (restaurantData.plan.purchasedAt && typeof restaurantData.plan.purchasedAt === 'object' && 'toDate' in restaurantData.plan.purchasedAt) {
      purchaseDate = (restaurantData.plan.purchasedAt as any).toDate();
    }
    // Handle Date object
    else if (restaurantData.plan.purchasedAt instanceof Date) {
      purchaseDate = restaurantData.plan.purchasedAt;
    }
    // Handle string date
    else if (typeof restaurantData.plan.purchasedAt === 'string') {
      purchaseDate = new Date(restaurantData.plan.purchasedAt);
    }
    // Handle timestamp number
    else if (typeof restaurantData.plan.purchasedAt === 'number') {
      purchaseDate = new Date(restaurantData.plan.purchasedAt);
    }
    // Fallback
    else {
      return null;
    }
    
    // Validate the date
    if (isNaN(purchaseDate.getTime())) {
      return null;
    }
    
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1); // Add 1 month
    
    const currentDate = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
    
    return { expiryDate, daysRemaining };
  };

  const activeDays = calculateActiveDays();
  const planExpiry = calculatePlanExpiry();
  
  // Debug logging
  React.useEffect(() => {
    if (restaurantData) {
      console.log('Restaurant Data:', restaurantData);
      console.log('Created At:', restaurantData.createdAt);
      console.log('Type of createdAt:', typeof restaurantData.createdAt);
      console.log('Active Days:', activeDays);
    }
  }, [restaurantData, activeDays]);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Restaurant Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
        {/* Active Days */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {restaurantData?.plan?.purchasedAt ? 'Remaining Days' : 'Active Days'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700">{activeDays}</p>
              <p className="text-xs text-gray-500">
                {restaurantData?.plan?.purchasedAt ? (
                  `Plan expires in ${activeDays} days`
                ) : (
                  `Since ${(() => {
                    if (!restaurantData?.createdAt) return 'N/A';
                    
                    let date: Date;
                    if (restaurantData.createdAt && typeof restaurantData.createdAt === 'object' && 'toDate' in restaurantData.createdAt) {
                      date = (restaurantData.createdAt as any).toDate();
                    } else if (restaurantData.createdAt instanceof Date) {
                      date = restaurantData.createdAt;
                    } else {
                      date = new Date(restaurantData.createdAt);
                    }
                    
                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                  })()}`
                )}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Plan Status */}
        {restaurantData?.plan && (
          <div className={`p-4 rounded-lg ${
            planExpiry?.daysRemaining && planExpiry.daysRemaining < 7 
              ? 'bg-gradient-to-r from-red-50 to-pink-50' 
              : 'bg-gradient-to-r from-green-50 to-emerald-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-lg font-semibold text-gray-800">{restaurantData.plan.name}</p>
                {planExpiry && (
                  <p className={`text-xs ${
                    planExpiry.daysRemaining < 7 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {planExpiry.daysRemaining > 0 
                      ? `${planExpiry.daysRemaining} days remaining`
                      : 'Plan expired'
                    }
                  </p>
                )}
              </div>
              <Badge 
                variant={planExpiry?.daysRemaining && planExpiry.daysRemaining < 7 ? "destructive" : "default"}
                className="text-xs"
              >
                ₹{restaurantData.plan.price}/{restaurantData.plan.duration?.replace('per ', '')}
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Avg/Day</p>
            <p className="text-sm font-semibold text-gray-700">
              {activeDays > 0 ? Math.round(activeDays / 7) : 0} wk
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="text-sm font-semibold text-green-600">Active</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Plan Update Card Component
function PlanUpdateCard({ 
  restaurantData, 
  restaurantId, 
  onPlanUpdate 
}: { 
  restaurantData: Restaurant | null;
  restaurantId: string;
  onPlanUpdate: (newPlan: any) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plan' | 'payment' | 'processing'>('plan');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    upiId: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');

  const currentPlan = restaurantData?.plan;

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    setPaymentStep('payment');
  };

  const handlePaymentSubmit = async () => {
    setPaymentStep('processing');
    setLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate payment success
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        await handlePlanUpdate();
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('❌ Payment failed. Please try again.');
      setPaymentStep('payment');
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setUpgradeDialogOpen(false);
    setPaymentStep('plan');
    setSelectedPlan('');
    setPaymentData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      upiId: ''
    });
  };

  const handlePlanUpdate = async () => {
    if (!selectedPlan || !restaurantId) return;

    try {
      const selectedPlanDetails = subscriptionPlans.find(p => p.id === selectedPlan);
      if (!selectedPlanDetails) throw new Error('Plan not found');

      const newPlanData = {
        id: selectedPlanDetails.id,
        name: selectedPlanDetails.name,
        price: selectedPlanDetails.price,
        duration: selectedPlanDetails.duration,
        purchasedAt: new Date()
      };

      // Update restaurant plan in database
      const success = await restaurantService.updateRestaurant(restaurantId, {
        plan: newPlanData
      });

      if (success) {
        onPlanUpdate(newPlanData);
        resetDialog();
        alert('✅ Plan upgraded and payment successful!');
      } else {
        throw new Error('Failed to update plan');
      }
    } catch (error) {
      console.error('Plan update error:', error);
      alert('❌ Failed to update plan. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          Subscription Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
        {/* Current Plan Display */}
        {currentPlan ? (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-xl font-bold text-purple-700">{currentPlan.name}</p>
              </div>
              <Crown className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="text-xs">
                ₹{currentPlan.price}/{currentPlan.duration?.replace('per ', '')}
              </Badge>
              {currentPlan.purchasedAt && (
                <p className="text-xs text-gray-500">
                  Since {(() => {
                    let date: Date;
                    if (currentPlan.purchasedAt && typeof currentPlan.purchasedAt === 'object' && 'toDate' in currentPlan.purchasedAt) {
                      date = (currentPlan.purchasedAt as any).toDate();
                    } else if (currentPlan.purchasedAt instanceof Date) {
                      date = currentPlan.purchasedAt;
                    } else {
                      date = new Date(currentPlan.purchasedAt);
                    }
                    
                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                  })()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">No active plan</p>
          </div>
        )}

        {/* Plan Options */}
        <div className="grid grid-cols-1 gap-2">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                currentPlan?.id === plan.id 
                  ? 'border-purple-200 bg-purple-50' 
                  : 'border-gray-200 bg-white hover:border-purple-200'
              } ${plan.recommended ? 'border-orange-200 bg-orange-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{plan.name}</p>
                    <p className="text-xs text-gray-600">₹{plan.price}/{plan.duration?.replace('per ', '')}</p>
                  </div>
                </div>
                {plan.recommended && (
                  <Badge variant="default" className="text-xs">
                    Recommended
                  </Badge>
                )}
                {currentPlan?.id === plan.id && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade Button */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>
                {paymentStep === 'plan' && 'Select Your Plan'}
                {paymentStep === 'payment' && 'Payment Details'}
                {paymentStep === 'processing' && 'Processing Payment'}
              </DialogTitle>
            </DialogHeader>
            
            {/* Step 1: Plan Selection */}
            {paymentStep === 'plan' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Plan
                  </label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-2">
                            {plan.icon}
                            <span>{plan.name} - ₹{plan.price}/{plan.duration?.replace('per ', '')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlan && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-sm mb-2">Features:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {subscriptionPlans
                        .find(p => p.id === selectedPlan)
                        ?.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                            {feature}
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetDialog}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!selectedPlan}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {paymentStep === 'payment' && (
              <div className="space-y-4">
                {/* Plan Summary */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Monthly subscription
                      </p>
                    </div>
                    <p className="font-bold text-purple-600">
                      ₹{subscriptionPlans.find(p => p.id === selectedPlan)?.price}
                    </p>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="text-xs h-8"
                    >
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('upi')}
                      className="text-xs h-8"
                    >
                      UPI
                    </Button>
                    <Button
                      variant={paymentMethod === 'netbanking' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('netbanking')}
                      className="text-xs h-8"
                    >
                      Net Banking
                    </Button>
                  </div>
                </div>

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cardHolder" className="text-xs">Cardholder Name</Label>
                      <Input
                        id="cardHolder"
                        placeholder="John Doe"
                        value={paymentData.cardholderName}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber" className="text-xs">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentData.cardNumber}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="expiry" className="text-xs">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={paymentData.expiryDate}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv" className="text-xs">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={paymentData.cvv}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === 'upi' && (
                  <div>
                    <Label htmlFor="upiId" className="text-xs">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="user@paytm"
                      value={paymentData.upiId}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, upiId: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === 'netbanking' && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      You will be redirected to your bank's website
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentStep('plan')}
                    className="flex-1"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Pay ₹{subscriptionPlans.find(p => p.id === selectedPlan)?.price}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {paymentStep === 'processing' && (
              <div className="space-y-4 text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="font-medium">Processing Your Payment...</p>
                <p className="text-sm text-gray-600">Please wait while we confirm your payment</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/RESTAURANT/${restaurantId}/adminlogin`);
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        // Fetch data directly using restaurant service
        const [foods, staff, orders, restaurant] = await Promise.all([
          restaurantService.getFoods(restaurantId),
          restaurantService.getStaff(restaurantId),
          restaurantService.getOrders(restaurantId),
          restaurantService.getRestaurant(restaurantId)
        ]);

        setRestaurantData(restaurant);

        // Fetch admin data using current user's email
        if (user?.email) {
          try {
            const admin = await restaurantService.getAdminByEmail(user.email);
            if (admin && admin.restaurantId === restaurantId) {
              setAdminData(admin);
            }
          } catch (adminError) {
            console.error("Failed to fetch admin data:", adminError);
          }
        }

        setRawOrders(orders); // Store raw orders for reference
        
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        const totalInventory = foods.reduce((sum, food) => sum + food.price, 0);
        const categories = [...new Set(foods.map(food => food.category))];

        // Generate real daily data for charts based on orders
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        // Calculate real revenue and customer data from orders
        const revenue = dates.map(date => {
          const dayOrders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? 
              order.createdAt.toDate().toISOString().split('T')[0] :
              new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === date;
          });
          return dayOrders.reduce((sum, order) => sum + order.total, 0);
        });

        const customers = dates.map(date => {
          const dayOrders = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? 
              order.createdAt.toDate().toISOString().split('T')[0] :
              new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === date;
          });
          // Count unique customers per day based on tableNo or customerName
          const uniqueCustomers = new Set(dayOrders.map(order => order.tableNo || order.customerName || 'unknown'));
          return uniqueCustomers.size;
        });

        setStats({
          totalSales,
          totalInventory,
          totalStaff: staff.length,
          totalCategories: categories.length,
          daily: { dates, revenue, customers },
          inventory: foods.map(food => ({
            id: food.id || '',
            name: food.name,
            stock: food.stock,
            category: food.category,
            price: food.price
          })),
          orders: orders.map(order => ({
            id: order.id || '',
            title: order.title,
            category: order.category,
            total: order.total,
            createdAt: order.createdAt.toDate ? 
              order.createdAt.toDate().toISOString() : 
              new Date(order.createdAt).toISOString()
          })).reverse() // Show newest orders first
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load stats. Please check your connection.");
      } finally {
        setLoadingStats(false);
      }
    }
    
    if (restaurantId) {
      loadStats();
    }
  }, [restaurantId]);

  // Real-time listener for restaurant blocking status
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = onSnapshot(
      doc(db, "restaurants", restaurantId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.isBlocked) {
            // Restaurant has been blocked, logout immediately
            alert('Your restaurant has been blocked by Super Admin. You will be logged out.');
            
            // Clear any stored authentication data
            localStorage.removeItem('adminSession');
            
            // Sign out from Firebase
            signOut(auth).then(() => {
              // Redirect to login page
              router.push(`/RESTAURANT/${restaurantId}/adminlogin`);
            }).catch((error) => {
              console.error('Error signing out:', error);
              // Force redirect even if signout fails
              router.push(`/RESTAURANT/${restaurantId}/adminlogin`);
            });
          }
        }
      },
      (error) => {
        console.error("Error listening to restaurant status:", error);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [restaurantId, router]);

  if (loading || loadingStats) {
    return (
      <div className="p-20 text-center">
        <Card className="max-w-sm mx-auto">
          <CardContent className="p-6">Loading dashboard…</CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const totalOrders = stats?.orders?.length ?? 0;

  const avgDailyRevenue =
    stats?.daily?.revenue?.length
      ? Math.round(stats.daily.revenue.reduce((a, b) => a + b, 0) / stats.daily.revenue.length)
      : 0;

  const mostOrdered = (() => {
    if (!stats?.orders?.length) return null;
    const map: Record<string, { title: string; count: number }> = {};
    stats.orders.forEach((o) => {
      map[o.title] = map[o.title] ? { title: o.title, count: map[o.title].count + 1 } : { title: o.title, count: 1 };
    });
    return Object.values(map).sort((a, b) => b.count - a.count)[0];
  })();

  const handleDeleteOrder = async (id: string) => {
    try {
      // Use restaurant service to delete order
      await restaurantService.deleteOrder(restaurantId, id);
      setStats((prev) =>
        prev ? { ...prev, orders: prev.orders.filter((o) => o.id !== id) } : prev
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <AdminProtectedRoute>
      <main className="min-h-screen bg-muted/40 w-full overflow-x-hidden">
        <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Header */}
          <Card className="w-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      {restaurantData?.name || 'Loading...'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs font-mono bg-blue-100 text-blue-800">
                        ID: {restaurantId}
                      </Badge>
                      <span className="text-xs text-gray-500">Admin Dashboard</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm self-start sm:self-center">
                    Welcome, {adminData?.name || user?.email || 'Admin'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="w-full">
                <StatCard title="Total Sales" value={`₹${stats?.totalSales ?? 0}`} subtitle={`${totalOrders} orders`} icon={<ShoppingCart />} />
              </div>

              <Link href={`/RESTAURANT/${restaurantId}/menu`} className="w-full block">
                <StatCard title="Total Inventory" value={`₹${stats?.totalInventory ?? 0}`} subtitle={`${stats?.inventory?.length ?? 0} items`} icon={<ArchiveX />} />
              </Link>

              <div onClick={() => router.push(`/RESTAURANT/${restaurantId}/admin/addstaff`)} className="w-full cursor-pointer">
                <StatCard title="Staff Count" value={stats?.totalStaff ?? 0} subtitle="Active staff" icon={<Users />} />
              </div>

              <div className="w-full">
                <StatCard title="Categories" value={stats?.totalCategories ?? 0} subtitle="Food categories" icon={<Tag />} />
              </div>
            </div>
          </div>

          {/* Active Days & Plan Update Cards */}
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Active Days Tracking Card */}
              <ActiveDaysCard restaurantData={restaurantData} />
              
              {/* Plan Update Card */}
              <PlanUpdateCard restaurantData={restaurantData} restaurantId={restaurantId} onPlanUpdate={(newPlan) => {
                setRestaurantData(prev => prev ? { ...prev, plan: newPlan } : null);
              }} />
            </div>
          </div>

          {/* Charts */}
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="w-full">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Sales Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="w-full h-[200px] sm:h-[250px] lg:h-[300px] overflow-hidden">
                    <SalesChart labels={stats?.daily?.dates ?? []} data={stats?.daily?.revenue ?? []} />
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Customer Flow</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="w-full h-[200px] sm:h-[250px] lg:h-[300px] overflow-hidden">
                    <CustomerFlowChart labels={stats?.daily?.dates ?? []} data={stats?.daily?.customers ?? []} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Orders */}
          <Card className="w-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {mostOrdered && (
                <div className="p-3 sm:p-4 bg-yellow-50 border rounded-lg mb-4">
                  <p className="text-xs sm:text-sm font-semibold">🔥 Most Ordered Product</p>
                  <p className="text-sm sm:text-base font-bold break-words">{mostOrdered.title}</p>
                  <p className="text-xs text-muted-foreground">{mostOrdered.count} orders</p>
                </div>
              )}

              <ScrollArea className="h-[300px] sm:h-[350px] w-full">
                <div className="space-y-3 pr-2">
                  {(stats?.orders?.length ?? 0) === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No orders</div>
                  ) : (
                    stats?.orders?.map((o) => (
                      <div key={o.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted transition-colors w-full">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base break-words leading-tight">{o.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{o.category}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500">
                            <div className="truncate">Table: {(rawOrders.find(order => order.id === o.id)?.tableNo) || 'N/A'}</div>
                            <div className="truncate">Customer: {(rawOrders.find(order => order.id === o.id)?.customerName) || 'N/A'}</div>
                            <div className="truncate">Time: {new Date(o.createdAt).toLocaleTimeString()}</div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">₹{o.total}</Badge>
                              <Badge variant={(rawOrders.find(order => order.id === o.id)?.status === 'paid') ? 'default' : 'secondary'} className="text-xs">
                                {(rawOrders.find(order => order.id === o.id)?.status) || 'pending'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Theme */}
          <div className="w-full">
            <Theme restaurantId={restaurantId} />
          </div>

          {/* Summary */}
          <Card className="w-full">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Avg Daily Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">₹{avgDailyRevenue}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Total Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">{totalOrders}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700 mb-1">Active Items</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">{stats?.inventory?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminProtectedRoute>
  );
}
