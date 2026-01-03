'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, HeadphonesIcon } from "lucide-react";
import LoginPage from '@/components/LoginPage';
import Link from 'next/link';

export default function Navbar() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-40 bg-white border-b w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                🍴
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">Golden Fork</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/contact">
                <Button 
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3 py-2 text-sm font-medium flex-shrink-0 flex items-center gap-1 sm:gap-2"
                >
                  <HeadphonesIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Support</span>
                </Button>
              </Link>
              
              <Button 
                onClick={() => setShowLogin(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 sm:px-4 py-2 text-sm font-medium flex-shrink-0"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= LOGIN MODAL ================= */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Restaurant Login</h2>
              <Button 
                onClick={() => setShowLogin(false)}
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <LoginPage />
            </div>
          </div>
        </div>
      )}
    </>
  );
}