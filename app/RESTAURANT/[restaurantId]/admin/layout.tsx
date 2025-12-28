// app/restaurant/[restaurantId]/admin/layout.tsx
'use client';

import React, { useState, use } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>; // ✅ restaurantId from route
}) {
  const { restaurantId } = use(params);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar Component */}
        <AdminSidebar
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          restaurantId={restaurantId} // ✅ pass to sidebar if needed
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Mobile Header with Hamburger Menu */}
          <div className="md:hidden bg-white shadow-sm border-b p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              <div></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children} {/* pages inside this layout can now read params.restaurantId */}
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
