"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function StaffLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const staffData = localStorage.getItem('kitchen_staff');
    if (staffData) {
      // Already logged in, redirect to dashboard
      router.push('/KitchenDash/staffdash');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // SUCCESS → Store staff data in localStorage
      localStorage.setItem('kitchen_staff', JSON.stringify(data.staff));
      
      // Redirect to dashboard
      router.push("/KitchenDash/staffdash");
    } catch (error) {
      setLoading(false);
      setError("Login failed. Please try again.");
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-400 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/20 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/30"
      >
        <motion.h2
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-center text-white mb-6"
        >
          Staff Login
        </motion.h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <input
              className="w-full p-3 rounded-xl bg-white/70 focus:ring-4 focus:ring-blue-300 border border-white/40"
              placeholder="Enter username (staff name)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </motion.div>

          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <input
              type="password"
              className="w-full p-3 rounded-xl bg-white/70 focus:ring-4 focus:ring-blue-300 border border-white/40"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </motion.div>

          {error && (
            <p className="text-red-200 text-center text-sm mt-2">{error}</p>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg mt-2 transition"
          >
            {loading ? "Checking..." : "Login"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
