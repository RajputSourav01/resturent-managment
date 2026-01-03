"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChefHat,
  LayoutDashboard,
  ListPlus,
  UserPlus,
  X,
  LogOut,
  User,
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  restaurantId: string;   // ✅ REQUIRED for multi-tenant
}

// 🔥 Now dynamic routes use restaurantId
const getNavItems = (restaurantId: string): NavItem[] => [
  { name: "Dashboard", href: `/RESTAURANT/${restaurantId}/admin/admindash`, icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
  { name: "Menu", href: `/RESTAURANT/${restaurantId}/menu`, icon: <ChefHat className="h-5 w-5 mr-3" /> },
  { name: "Add Food", href: `/RESTAURANT/${restaurantId}/admin/addfood`, icon: <ListPlus className="h-5 w-5 mr-3" /> },
  { name: "Add Staff", href: `/RESTAURANT/${restaurantId}/admin/addstaff`, icon: <UserPlus className="h-5 w-5 mr-3" /> },
  { name: "Add Table", href: `/RESTAURANT/${restaurantId}/admin/addTableUser`, icon: <User className="h-5 w-5 mr-3" /> },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  restaurantId,  // ✅ Now available
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = getNavItems(restaurantId);

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
      localStorage.clear();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      router.push('/');
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        <h2 className="text-lg font-bold tracking-wider">ADMIN 🛡️</h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Logout */}
      <div className="border-t p-2">
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full justify-start mb-5"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-background h-screen sticky top-0 z-10">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminSidebar;
