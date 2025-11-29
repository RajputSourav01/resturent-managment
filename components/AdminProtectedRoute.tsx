"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const admin = localStorage.getItem("admin");

    if (!admin) {
      router.replace("/adminlogin");
    }
  }, [router]);

  return <>{children}</>;
}
