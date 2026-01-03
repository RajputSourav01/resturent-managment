// app/restaurant/[restaurantId]/admin/layout.tsx
'use client';

import React, { useState, use, useEffect } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import NotificationIcon, { Notification } from "@/components/ui/notification-icon";
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import NotificationService from '@/lib/notification-service';

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>; // ✅ restaurantId from route
}) {
  const { restaurantId } = use(params);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // First check and create subscription notifications if needed
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          await NotificationService.checkAndCreateSubscriptionNotifications(
            restaurantId, 
            restaurantDoc.data()
          );
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'restaurants', restaurantId, 'notifications');
    const notificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'));
    
    console.log(`Setting up real-time listener for restaurant: ${restaurantId}`);
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      console.log(`Received ${snapshot.docs.length} notifications from real-time listener`);
      
      const formattedNotifications: Notification[] = snapshot.docs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          console.log('Real-time notification data:', { id: doc.id, ...data });
          
          return {
            id: doc.id,
            type: data.type,
            title: data.title,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
            read: data.read || false,
            actionUrl: data.actionUrl,
            daysRemaining: data.daysRemaining,
            from: data.from
          };
        });
      
      console.log('Setting formatted notifications in state:', formattedNotifications);
      setNotifications(formattedNotifications);
    }, (error) => {
      console.error('Error in notifications real-time listener:', error);
    });
    
    return () => {
      console.log('Cleaning up notifications listener');
      unsubscribe();
    };
  }, [restaurantId]);

  const handleNotificationRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(restaurantId, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationDelete = async (notificationId: string) => {
    try {
      console.log(`Attempting to delete notification: ${notificationId} for restaurant: ${restaurantId}`);
      const success = await NotificationService.deleteNotification(restaurantId, notificationId);
      if (success) {
        // The real-time listener will automatically update the UI
        console.log('Notification deleted successfully');
      } else {
        alert('Failed to delete notification. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error occurred while deleting notification.');
    }
  };

  const handleUpgradeClick = () => {
    router.push(`/RESTAURANT/${restaurantId}/admin/upgrade`);
  };

  return (
    <AdminProtectedRoute>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar Component */}
        <AdminSidebar
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          restaurantId={restaurantId} // ✅ pass to sidebar if needed
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Mobile Header with Hamburger Menu */}
          <div className="md:hidden bg-white shadow-sm border-b p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              <NotificationIcon
                restaurantId={restaurantId}
                notifications={notifications}
                onNotificationRead={handleNotificationRead}
                onNotificationDelete={handleNotificationDelete}
                onUpgradeClick={handleUpgradeClick}
              />
            </div>
          </div>

          {/* Desktop Header with Notification */}
          <div className="hidden md:block bg-white shadow-sm border-b p-4 flex-shrink-0">
            <div className="flex items-center justify-end">
              <NotificationIcon
                restaurantId={restaurantId}
                notifications={notifications}
                onNotificationRead={handleNotificationRead}
                onNotificationDelete={handleNotificationDelete}
                onUpgradeClick={handleUpgradeClick}
              />
            </div>
          </div>

          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children} {/* pages inside this layout can now read params.restaurantId */}
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
