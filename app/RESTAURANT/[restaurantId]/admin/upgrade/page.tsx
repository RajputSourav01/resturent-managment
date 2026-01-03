'use client';

import React, { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, CreditCard, Clock, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 999,
    duration: '30 days',
    features: [
      'Up to 50 menu items',
      'Basic order management',
      'Customer support',
      'Mobile responsive design',
      'Basic analytics'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 1999,
    duration: '30 days',
    features: [
      'Unlimited menu items',
      'Advanced order management',
      'Priority customer support',
      'Custom branding',
      'Advanced analytics',
      'Staff management',
      'Table management'
    ],
    popular: true,
    badge: 'Most Popular'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 3999,
    duration: '30 days',
    features: [
      'Everything in Professional',
      'Multi-location support',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced reporting',
      'White-label solution'
    ],
    badge: 'Best Value'
  }
];

export default function UpgradePage({
  params
}: {
  params: Promise<{ restaurantId: string }>
}) {
  const { restaurantId } = use(params);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          setRestaurant(data);
          setCurrentPlan(data.plan || null);
        }
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId]);

  const handleUpgrade = async (plan: Plan) => {
    setUpgrading(plan.id);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update restaurant plan in database
      const newPlan = {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        purchasedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'restaurants', restaurantId), {
        plan: newPlan,
        updatedAt: new Date()
      });

      setCurrentPlan(newPlan);
      
      // Show success and redirect
      setTimeout(() => {
        router.push(`/RESTAURANT/${restaurantId}/admin/admindash`);
      }, 1000);
      
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const getCurrentPlanExpiryDays = () => {
    if (!currentPlan?.purchasedAt) return null;
    
    const purchaseDate = currentPlan.purchasedAt.toDate();
    const expiryDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysRemaining);
  };

  const currentPlanExpiryDays = getCurrentPlanExpiryDays();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="px-4 sm:px-6 py-4 border-b border-white/10"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-purple-400" />
            <h1 className="text-lg sm:text-xl font-semibold">
              Upgrade Your Plan
            </h1>
          </div>
        </div>
      </motion.header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Current Plan Status */}
        {currentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5" />
                  Current Plan Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {currentPlan.name} Plan
                    </p>
                    <p className="text-gray-400">
                      ₹{currentPlan.price} / {currentPlan.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={`mb-1 ${
                        currentPlanExpiryDays === 0 ? 'bg-red-600 text-white' :
                        currentPlanExpiryDays && currentPlanExpiryDays <= 2 ? 'bg-orange-600 text-white' :
                        'bg-green-600 text-white'
                      }`}
                    >
                      {currentPlanExpiryDays === 0 ? 'Expired' :
                       currentPlanExpiryDays === null ? 'Active' :
                       `${currentPlanExpiryDays} days left`}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Restaurant Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-2">
            Choose the Perfect Plan for {restaurant?.name}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select a plan that fits your restaurant's needs. All plans include our core features 
            with different limits and advanced capabilities.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full bg-white/5 border-white/10 hover:bg-white/10 transition-colors ${
                plan.popular ? 'ring-2 ring-purple-500/50' : ''
              }`}>
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-2">
                    {plan.id === 'enterprise' ? (
                      <Star className="h-6 w-6 text-yellow-400" />
                    ) : plan.id === 'pro' ? (
                      <Zap className="h-6 w-6 text-purple-400" />
                    ) : (
                      <CreditCard className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <div className="text-center mt-2">
                    <span className="text-3xl font-bold text-white">₹{plan.price.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm ml-1">/{plan.duration}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading === plan.id || (currentPlan?.id === plan.id)}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {upgrading === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : currentPlan?.id === plan.id ? (
                      'Current Plan'
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Card className="bg-white/5 border-white/10 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Need help choosing?
              </h3>
              <p className="text-gray-400 mb-4">
                Contact our support team to discuss which plan is best for your restaurant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" className="text-black border-white/20 hover:bg-white/10">
                  Contact Support
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10"
                  onClick={() => router.push(`/RESTAURANT/${restaurantId}/admin/admindash`)}
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}