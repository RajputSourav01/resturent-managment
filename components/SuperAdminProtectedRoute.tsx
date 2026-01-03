'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function SuperAdminProtectedRoute({ children }: SuperAdminProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const superAdminData = localStorage.getItem('superAdminData');
        
        if (!superAdminData) {
          console.log('No super admin data found, redirecting to login...');
          router.push('/super_admin/login');
          return;
        }

        const adminData = JSON.parse(superAdminData);
        
        // Check if the admin data has required fields
        if (!adminData.email || !adminData.password) {
          console.log('Invalid super admin data, redirecting to login...');
          localStorage.removeItem('superAdminData');
          router.push('/super_admin/login');
          return;
        }

        console.log('Super admin authenticated successfully');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error checking super admin authentication:', error);
        localStorage.removeItem('superAdminData');
        router.push('/super_admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-white/70">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // The redirect will happen in useEffect
  }

  return <>{children}</>;
}