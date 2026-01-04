"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogOut,
  Store,
  Users,
  BarChart3,
  ShieldCheck,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Trash2,
  Download,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SuperAdminProtectedRoute from "@/components/SuperAdminProtectedRoute";

function SuperAdminDashboardComponent() {
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Get admin data from localStorage  
    try {
      const storedAdminData = localStorage.getItem('superAdminData');
      if (storedAdminData) {
        const parsedData = JSON.parse(storedAdminData);
        setAdminData(parsedData);
        console.log("Loaded admin data:", parsedData);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch Restaurants
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setRestaurants(list);
    });
    return () => unsub();
  }, []);

  // Fetch Contact Submissions
  useEffect(() => {
    console.log("🔥 Setting up contact submissions listener...");
    const q = query(collection(db, "contact_submissions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      console.log("📡 Firebase snapshot received, docs count:", snapshot.size);
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 Processing doc:", { docId: doc.id, data });
        list.push({ 
          id: doc.id, // Firebase document ID  
          firebaseId: doc.id, // Backup reference
          ...data 
        });
      });
      setContactSubmissions(list);
      console.log("📊 Total contact submissions loaded:", list.length);
      console.log("📋 Full submissions array:", list);
    });
    return () => unsub();
  }, []);

  // Delete Contact Submission - Simplified approach
  const deleteContactSubmission = async (submissionToDelete: any) => {
    console.log("🗑️ Delete function called with:", submissionToDelete);
    
    if (!confirm("Are you sure you want to delete this contact submission?")) {
      console.log("❌ User cancelled deletion");
      return;
    }
    
    try {
      // Use the actual Firebase document ID, not the manual ID field
      const docId = submissionToDelete.firebaseId || submissionToDelete.id;
      console.log("🔥 Attempting to delete document with Firebase ID:", docId);
      console.log("📋 Available IDs - firebaseId:", submissionToDelete.firebaseId, "manual id:", submissionToDelete.id);
      
      if (!docId) {
        console.error("❌ No document ID found!");
        alert("Error: Cannot delete - no document ID found");
        return;
      }
      
      // Delete from Firebase
      const docRef = doc(db, "contact_submissions", docId);
      await deleteDoc(docRef);
      
      console.log("✅ Successfully deleted document with ID:", docId);
      
      // Show success message
      alert("Contact submission deleted successfully!");
      
    } catch (error) {
      console.error("❌ Error deleting submission:", error);
      console.error("📋 Submission object was:", submissionToDelete);
      alert(`Failed to delete submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (contactSubmissions.length === 0) {
      alert("No data to export!");
      return;
    }

    const csvData = [
      ['Name', 'Email', 'Phone', 'Subject', 'Category', 'Urgency', 'Message', 'Status', 'Date'],
      ...contactSubmissions.map(submission => [
        submission.name || '',
        submission.email || '',
        submission.phone || '',
        submission.subject || '',
        submission.category || '',
        submission.urgency || '',
        submission.message || '',
        submission.status || 'new',
        submission.createdAt?.toDate ? submission.createdAt.toDate().toLocaleDateString() : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `contact_submissions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem('superAdminData');
    // Redirect to login
    router.push('/super_admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-4 border-b border-white/10"
      >
        {/* Title centered with badge */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h1 className="text-lg md:text-xl font-semibold">
            Super Admin Dashboard
          </h1>
          <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
            Admin Panel
          </Badge>
        </div>

        {/* Bottom row - Welcome message left, Logout right */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {!loading && adminData && (
              <p className="text-sm text-gray-300">
                Welcome, <span className="font-semibold text-white">{adminData.name || adminData.email || "Super Admin"}</span>
              </p>
            )}
          </div>
          
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </motion.header>

      {/* Content */}
      <main className="px-6 py-10 max-w-7xl mx-auto">
        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <DashboardCard
            title="View Restaurants"
            description="Manage all registered restaurants"
            icon={<Store className="h-6 w-6" />}
            accent="from-emerald-500 to-green-600"
            onClick={() => router.push('/super_admin/reataurents')}
          />

          <DashboardCard
            title="Admins & Staff"
            description="Monitor restaurant admins & staff"
            icon={<Users className="h-6 w-6" />}
            accent="from-blue-500 to-indigo-600"
            onClick={() => router.push('/super_admin/adm&staf')}
          />

          <DashboardCard
            title="System Analytics"
            description="Track growth, usage & performance"
            icon={<BarChart3 className="h-6 w-6" />}
            accent="from-purple-500 to-fuchsia-600"
            onClick={() => router.push('/super_admin/stats')}
          />
        </motion.div>

        {/* Contact Submissions Section */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-white/5 border border-white/10 rounded-2xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Support Queries: ({contactSubmissions.length})
                  </CardTitle>
                  <p className="text-sm text-gray-300 mt-1">Manage customer inquiries and support requests</p>
                </div>
                <Button 
                  onClick={exportToExcel}
                  disabled={contactSubmissions.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-black hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-gray-300 w-[120px]">Name</TableHead>
                      <TableHead className="text-gray-300 w-[200px]">Email</TableHead>
                      <TableHead className="text-gray-300 w-[120px]">Phone</TableHead>
                      <TableHead className="text-gray-300 w-[200px]">Subject</TableHead>
                      <TableHead className="text-gray-300 w-[120px]">Category</TableHead>
                      <TableHead className="text-gray-300 w-[100px]">Urgency</TableHead>
                      <TableHead className="text-gray-300 w-[300px]">Message</TableHead>
                      <TableHead className="text-gray-300 w-[150px]">Date</TableHead>
                      <TableHead className="text-gray-300 w-[80px]">Status</TableHead>
                      <TableHead className="text-gray-300 w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <MessageSquare className="h-12 w-12 text-gray-400" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-300 mb-1">No Contact Submissions</h3>
                              <p className="text-gray-500">When customers submit contact forms, they'll appear here.</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      contactSubmissions.slice(0, 10).map((submission, index) => (
                        <TableRow key={submission.id} className="border-white/10 hover:bg-white/5">
                          {/* Name */}
                          <TableCell className="font-medium text-white">
                            <div className="max-w-[120px]">
                              <p className="truncate" title={submission.name}>
                                {submission.name || 'Unknown'}
                              </p>
                            </div>
                          </TableCell>
                          
                          {/* Email */}
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="truncate text-blue-400" title={submission.email}>
                                {submission.email || 'No email'}
                              </p>
                            </div>
                          </TableCell>
                          
                          {/* Phone */}
                          <TableCell className="text-gray-300">
                            <div className="max-w-[120px]">
                              <p className="truncate" title={submission.phone}>
                                {submission.phone || '-'}
                              </p>
                            </div>
                          </TableCell>
                          
                          {/* Subject */}
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="truncate font-medium text-gray-200" title={submission.subject}>
                                {submission.subject || 'No subject'}
                              </p>
                            </div>
                          </TableCell>
                          
                          {/* Category */}
                          <TableCell>
                            <Badge variant="secondary" className="text-xs bg-white/10 text-white border-white/20">
                              {submission.category || 'General'}
                            </Badge>
                          </TableCell>
                          
                          {/* Urgency */}
                          <TableCell>
                            <Badge 
                              variant={
                                submission.urgency === 'critical' ? 'destructive' :
                                submission.urgency === 'high' ? 'default' :
                                submission.urgency === 'medium' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {submission.urgency || 'Low'}
                            </Badge>
                          </TableCell>
                          
                          {/* Message */}
                          <TableCell>
                            <div className="max-w-[300px]">
                              <p className="truncate text-gray-300" title={submission.message}>
                                {submission.message || 'No message'}
                              </p>
                            </div>
                          </TableCell>
                          
                          {/* Date */}
                          <TableCell className="text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {submission.createdAt?.toDate ? 
                                  submission.createdAt.toDate().toLocaleDateString('en-IN', {
                                    year: '2-digit',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Unknown'
                                }
                              </span>
                            </div>
                          </TableCell>
                          
                          {/* Status */}
                          <TableCell>
                            <Badge 
                              variant={submission.status === 'resolved' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {submission.status || 'New'}
                            </Badge>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                console.log("Delete button clicked for submission:", submission);
                                deleteContactSubmission(submission);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                              title="Delete submission"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {contactSubmissions.length > 10 && (
                <div className="p-4 border-t border-white/10">
                  <p className="text-xs text-gray-400 text-center">
                    Showing 10 of {contactSubmissions.length} submissions. Export to see all data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Control Center */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-white/5 border border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <div className="h-3 w-3 bg-white rounded"></div>
                </div>
                Platform Control Center
              </CardTitle>
              <p className="text-gray-300">Monitor and manage platform-wide settings</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* System Status */}
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-400">System Status</h3>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-2xl font-bold text-green-300">Online</p>
                  <p className="text-xs text-green-400">All services operational</p>
                </div>
                
                {/* Total Restaurants */}
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-400">Total Restaurants</h3>
                    <Store className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-300">{restaurants.length}</p>
                  <p className="text-xs text-blue-400">Active platforms</p>
                </div>
                
                {/* Support Requests */}
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-orange-400">Support Requests</h3>
                    <MessageSquare className="h-4 w-4 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-orange-300">{contactSubmissions.length}</p>
                  <p className="text-xs text-orange-400">Pending responses</p>
                </div>
                
                {/* Database Status */}
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-purple-400">Database</h3>
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <p className="text-2xl font-bold text-purple-300">Active</p>
                  <p className="text-xs text-purple-400">Real-time sync enabled</p>
                </div>
                
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" className="border-white/20 text-black hover:bg-white/10">
                    <Download className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-black hover:bg-white/10">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Notifications
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-black hover:bg-white/10">
                    <Plus className="h-4 w-4 mr-2" />
                    System Maintenance
                  </Button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-300 leading-relaxed">
                  As a Super Admin, you have complete authority over restaurant
                  onboarding, package control, admin permissions, system analytics,
                  and overall platform stability. Use this dashboard to ensure smooth
                  operations and scalable growth.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
        />
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-white/10">{icon}</div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-sm text-gray-300">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <SuperAdminProtectedRoute>
      <SuperAdminDashboardComponent />
    </SuperAdminProtectedRoute>
  );
}
