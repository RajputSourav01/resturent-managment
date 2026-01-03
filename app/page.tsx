'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RestaurantOnboarding from './onboard/page';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import FeatureUnderstandingSection from '@/components/Feature';

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

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col overflow-x-hidden">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="bg-gradient-to-br from-yellow-50 to-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
          <Badge className="mb-4 sm:mb-6 bg-yellow-100 text-yellow-700 text-xs sm:text-sm">
            Restaurant Automation System
          </Badge>

          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mx-auto max-w-4xl">
            Make Your Restaurant <br className="hidden sm:block" />
            <span className="text-yellow-500">Fully Digital</span> with Golden Fork
          </h1>

          <p className="mt-4 sm:mt-6 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed px-2">
            Golden Fork provides a complete restaurant management solution —
            from QR-based digital menu to live kitchen tracking, staff management,
            billing, and analytics.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-center max-w-md sm:max-w-none mx-auto">
            <Button 
              onClick={() => setShowOnboarding(true)}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 text-sm sm:text-base font-medium"
            >
              Get Started
            </Button>
            <Button variant="outline" className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="w-full py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-8 sm:mb-12">
            Everything Your Restaurant Needs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((item, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-4 sm:p-5 lg:p-6 h-full">
                  <div className="flex items-start gap-3 h-full">
                    <CheckCircle className="text-yellow-500 mt-1 h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 leading-tight">{item.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-8 sm:mb-12">
            How Golden Fork Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 text-center shadow-sm h-full flex flex-col"
              >
                <div className="text-3xl sm:text-4xl font-bold text-yellow-500 mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-3 leading-tight">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ================= FEATURE UNDERSTANDING SECTION ================= */}
      <section className="py-12 sm:py-16 lg:py-20 w-full">
        <FeatureUnderstandingSection onGetStarted={() => setShowOnboarding(true)} />
      </section>

      {/* ================= CTA ================= */}
      <section className="py-12 sm:py-16 lg:py-20 bg-yellow-500 text-black w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
            Upgrade Your Restaurant Today
          </h2>
          <p className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8">
            Join restaurants that are growing faster with Golden Fork's digital
            automation system.
          </p>
          <Button 
            onClick={() => setShowOnboarding(true)}
            className="bg-black text-white hover:bg-gray-900 px-6 py-3 text-sm sm:text-base font-medium"
          >
            Register Your Restaurant
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const features = [
  {
    title: "Admin Dashboard",
    description:
      "Manage food items, staff, tables, categories, orders, and restaurant settings from a powerful admin panel.",
  },
  {
    title: "Kitchen Live Orders",
    description:
      "Kitchen staff can track live orders with cooking, ready, and served status in real time.",
  },
  {
    title: "QR Code Digital Menu",
    description:
      "Generate unique QR codes for each table so customers can view menu and order instantly.",
  },
  {
    title: "Customer Ordering & Payment",
    description:
      "Customers can order food, track status, and pay bills directly from their phone.",
  },
  {
    title: "Menu Customization",
    description:
      "Customize customer menu theme, categories, food items, and pricing easily.",
  },
  {
    title: "Reports & Analytics",
    description:
      "Track most selling food, orders, revenue, and performance with detailed reports.",
  },
];

const steps = [
  {
    title: "Register Restaurant",
    description:
      "Create your restaurant account and choose a suitable automation package.",
  },
  {
    title: "Setup & Customize",
    description:
      "Add food, tables, staff, categories, and customize your digital menu.",
  },
  {
    title: "Go Digital",
    description:
      "Generate QR codes, accept orders, manage kitchen, and grow your business.",
  },
];
