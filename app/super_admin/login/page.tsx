"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log("Attempting login with:", { email: email.trim(), password });
      
      const q = query(
        collection(db, "superadmin"),
        where("email", "==", email.trim()),
        where("password", "==", password.trim())
      );

      const snap = await getDocs(q);
      console.log("Query result:", { empty: snap.empty, size: snap.size });

      if (snap.empty) {
        setError("Invalid email or password");
      } else {
        const adminData = snap.docs[0].data();
        console.log("✅ Super Admin Logged In", adminData);
        
        // Store admin data in localStorage
        localStorage.setItem('superAdminData', JSON.stringify(adminData));
        
        // Navigate to dashboard
        router.push("/super_admin/Dashboard");
      }
    } catch (e) {
      console.error("Login error:", e);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl shadow-2xl bg-white/95 backdrop-blur border border-white/10">
          <CardContent className="p-8 md:p-10">
            {/* Header */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
                <Shield className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Super Admin Login
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Restricted system access for administrators
              </p>
            </motion.div>

            {/* Form */}
            <div className="space-y-5">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <Button
                  className="w-full h-11 rounded-xl text-base"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Login Securely"
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-slate-400 mt-6"
        >
          © {new Date().getFullYear()} Secure Admin Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
