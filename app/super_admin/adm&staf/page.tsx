"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  collection, 
  getDocs, 
  deleteDoc,
  doc,
  query,
  orderBy,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Users,
  UserCheck,
  Crown,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  Store,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import SuperAdminProtectedRoute from "@/components/SuperAdminProtectedRoute";

interface Admin {
  id: string;
  email: string;
  name: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantPhone?: string;
  restaurantAddress?: string;
  isActive: boolean;
  createdAt: any;
}

interface Staff {
  id: string;
  fullName: string;
  mobile: string;
  designation: string;
  address: string;
  restaurantId: string;
  restaurantName?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: any;
}

interface Restaurant {
  id: string;
  name: string;
  phone: string;
  address: string;
}

function AdminStaffPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState("admins");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // First fetch restaurants
      const restaurantsQuery = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));
      const restaurantsSnapshot = await getDocs(restaurantsQuery);
      
      const restaurantsList: Restaurant[] = [];
      const restaurantsMap: { [key: string]: Restaurant } = {};
      
      restaurantsSnapshot.forEach((doc) => {
        const data = doc.data();
        const restaurant = {
          id: doc.id,
          name: data.name || "Unknown Restaurant",
          phone: data.phone || "No phone",
          address: data.address || "No address",
        };
        restaurantsList.push(restaurant);
        restaurantsMap[doc.id] = restaurant;
      });
      
      setRestaurants(restaurantsList);

      // Fetch admins
      const adminsQuery = query(collection(db, "admins"), orderBy("createdAt", "desc"));
      const adminsSnapshot = await getDocs(adminsQuery);
      
      const adminsList: Admin[] = [];
      adminsSnapshot.forEach((doc) => {
        const data = doc.data();
        const restaurant = restaurantsMap[data.restaurantId];
        adminsList.push({
          id: doc.id,
          email: data.email || "No email",
          name: data.name || "Unknown Admin",
          restaurantId: data.restaurantId,
          restaurantName: restaurant?.name || "Unknown Restaurant",
          restaurantPhone: restaurant?.phone || "No phone",
          restaurantAddress: restaurant?.address || "No address",
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
        });
      });
      
      setAdmins(adminsList);

      // Fetch all staff from all restaurants
      const staffList: Staff[] = [];
      
      for (const restaurant of restaurantsList) {
        try {
          const staffQuery = query(
            collection(db, `restaurants/${restaurant.id}/staff`),
            orderBy("createdAt", "desc")
          );
          const staffSnapshot = await getDocs(staffQuery);
          
          staffSnapshot.forEach((doc) => {
            const data = doc.data();
            staffList.push({
              id: doc.id,
              fullName: data.fullName || "Unknown Staff",
              mobile: data.mobile || "No mobile",
              designation: data.designation || "Staff",
              address: data.address || "No address",
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              imageUrl: data.imageUrl,
              isActive: data.isActive !== false,
              createdAt: data.createdAt,
            });
          });
        } catch (error) {
          console.error(`Error fetching staff for restaurant ${restaurant.id}:`, error);
        }
      }
      
      setStaff(staffList);
      
      console.log("Fetched data:", {
        restaurants: restaurantsList.length,
        admins: adminsList.length,
        staff: staffList.length,
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter data based on search term
  useEffect(() => {
    const filteredAdminsList = admins.filter((admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.restaurantPhone?.includes(searchTerm) ||
      admin.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAdmins(filteredAdminsList);

    const filteredStaffList = staff.filter((staffMember) =>
      staffMember.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.mobile.includes(searchTerm) ||
      staffMember.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStaff(filteredStaffList);
  }, [searchTerm, admins, staff]);

  // Export to CSV
  const exportToCSV = (type: 'admins' | 'staff') => {
    if (type === 'admins') {
      const headers = ["Admin ID", "Name", "Email", "Restaurant Name", "Restaurant Phone", "Restaurant Address", "Status", "Created At"];
      const csvContent = [
        headers.join(","),
        ...filteredAdmins.map(admin => [
          admin.id,
          `"${admin.name}"`,
          admin.email,
          `"${admin.restaurantName}"`,
          admin.restaurantPhone,
          `"${admin.restaurantAddress}"`,
          admin.isActive ? "Active" : "Inactive",
          admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString() : "N/A"
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admins-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      const headers = ["Staff ID", "Name", "Mobile", "Designation", "Address", "Restaurant Name", "Status", "Created At"];
      const csvContent = [
        headers.join(","),
        ...filteredStaff.map(staffMember => [
          staffMember.id,
          `"${staffMember.fullName}"`,
          staffMember.mobile,
          `"${staffMember.designation}"`,
          `"${staffMember.address}"`,
          `"${staffMember.restaurantName}"`,
          staffMember.isActive ? "Active" : "Inactive",
          staffMember.createdAt ? new Date(staffMember.createdAt.seconds * 1000).toLocaleDateString() : "N/A"
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staff-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  // Delete Admin
  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    setDeleteLoading(adminId);
    console.log(`Starting deletion process for admin: ${adminId} (${adminEmail})`);
    
    try {
      // Delete from main admins collection
      await deleteDoc(doc(db, "admins", adminId));
      console.log(`✅ Successfully deleted admin from main collection: ${adminId}`);
      
      // Update state
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      setFilteredAdmins(prev => prev.filter(admin => admin.id !== adminId));
      
      console.log(`🎉 Admin deletion completed: ${adminEmail}`);
      alert(`Admin "${adminEmail}" deleted successfully!`);
      
    } catch (error) {
      console.error("💥 Error deleting admin:", error);
      alert(`Failed to delete admin: ${error instanceof Error ? error.message : 'Unknown error'}. Please check console for details.`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Delete Staff
  const handleDeleteStaff = async (staffId: string, staffName: string, restaurantId: string) => {
    setDeleteLoading(staffId);
    console.log(`Starting deletion process for staff: ${staffId} (${staffName}) from restaurant: ${restaurantId}`);
    
    try {
      // Delete from restaurant's staff subcollection
      await deleteDoc(doc(db, "restaurants", restaurantId, "staff", staffId));
      console.log(`✅ Successfully deleted staff from restaurant subcollection: ${staffId}`);
      
      // Update state
      setStaff(prev => prev.filter(staff => staff.id !== staffId));
      setFilteredStaff(prev => prev.filter(staff => staff.id !== staffId));
      
      console.log(`🎉 Staff deletion completed: ${staffName}`);
      alert(`Staff member "${staffName}" deleted successfully!`);
      
    } catch (error) {
      console.error("💥 Error deleting staff:", error);
      alert(`Failed to delete staff: ${error instanceof Error ? error.message : 'Unknown error'}. Please check console for details.`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const AdminCard = ({ admin }: { admin: Admin }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <CardContent className="p-4">
            <div className="grid grid-cols-8 gap-4 items-center text-sm">
              <div className="font-mono text-xs bg-white/10 px-2 py-1 rounded truncate">
                {admin.id}
              </div>
              <div className="font-medium">{admin.name}</div>
              <div className="text-gray-300 truncate" title={admin.email}>
                {admin.email}
              </div>
              <div className="font-medium text-blue-300">
                {admin.restaurantName}
              </div>
              <div className="text-gray-300">{admin.restaurantPhone}</div>
              <div className="text-gray-300">{formatDate(admin.createdAt)}</div>
              <div>
                <Badge className={admin.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {admin.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                      disabled={deleteLoading === admin.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete admin "{admin.name}" ({admin.email})? 
                        This will permanently remove their access to the restaurant admin panel.
                        <p className="mt-2 font-medium text-red-400">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Admin
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold truncate flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {admin.name}
                </CardTitle>
                <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                  ID: {admin.id}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge className={admin.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {admin.isActive ? "Active" : "Inactive"}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 flex-shrink-0"
                      disabled={deleteLoading === admin.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-700 text-white mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete admin "{admin.name}" ({admin.email})? 
                        This will permanently remove their access to the restaurant admin panel.
                        <p className="mt-2 font-medium text-red-400">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Admin
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{admin.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="font-medium text-blue-300">{admin.restaurantName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span>{admin.restaurantPhone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-300 line-clamp-2">{admin.restaurantAddress}</span>
            </div>
            <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
              Created: {formatDate(admin.createdAt)}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );

  const StaffCard = ({ staffMember }: { staffMember: Staff }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <CardContent className="p-4">
            <div className="grid grid-cols-9 gap-4 items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  {staffMember.imageUrl ? (
                    <img 
                      src={staffMember.imageUrl} 
                      alt={staffMember.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <UserCheck className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="font-mono text-xs bg-white/10 px-2 py-1 rounded truncate">
                  {staffMember.id}
                </div>
              </div>
              <div className="font-medium">{staffMember.fullName}</div>
              <div className="text-gray-300">{staffMember.mobile}</div>
              <div className="text-gray-300">{staffMember.designation}</div>
              <div className="font-medium text-blue-300">
                {staffMember.restaurantName}
              </div>
              <div className="text-gray-300">{formatDate(staffMember.createdAt)}</div>
              <div>
                <Badge className={staffMember.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {staffMember.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                      disabled={deleteLoading === staffMember.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete staff member "{staffMember.fullName}" ({staffMember.designation}) 
                        from {staffMember.restaurantName}? This will permanently remove their access and data.
                        <p className="mt-2 font-medium text-red-400">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteStaff(staffMember.id, staffMember.fullName, staffMember.restaurantId)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Staff
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  {staffMember.imageUrl ? (
                    <img 
                      src={staffMember.imageUrl} 
                      alt={staffMember.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <UserCheck className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">
                    {staffMember.fullName}
                  </CardTitle>
                  <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                    ID: {staffMember.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge className={staffMember.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {staffMember.isActive ? "Active" : "Inactive"}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 flex-shrink-0"
                      disabled={deleteLoading === staffMember.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-700 text-white mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete staff member "{staffMember.fullName}" ({staffMember.designation}) 
                        from {staffMember.restaurantName}? This will permanently remove their access and data.
                        <p className="mt-2 font-medium text-red-400">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteStaff(staffMember.id, staffMember.fullName, staffMember.restaurantId)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Staff
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="font-medium">{staffMember.mobile}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span>{staffMember.designation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="font-medium text-blue-300">{staffMember.restaurantName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-300 line-clamp-2">{staffMember.address}</span>
            </div>
            <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
              Created: {formatDate(staffMember.createdAt)}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="px-4 sm:px-6 py-4 border-b border-white/10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              <h1 className="text-lg sm:text-xl font-semibold">
                Admin & Staff Management
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              disabled={loading}
              className="text-black border-white/20 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Search and Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, restaurant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-white/10">
                <TabsTrigger value="admins" className="data-[state=active]:bg-white/20">
                  <Crown className="h-4 w-4 mr-2" />
                  Admins ({filteredAdmins.length})
                </TabsTrigger>
                <TabsTrigger value="staff" className="data-[state=active]:bg-white/20">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Staff ({filteredStaff.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center justify-between mt-10 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(activeTab as 'admins' | 'staff')}
                  disabled={activeTab === 'admins' ? filteredAdmins.length === 0 : filteredStaff.length === 0}
                  className="text-black   border-white/20 hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <div className="text-sm text-gray-300">
                  Total Restaurants: {restaurants.length}
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <Card className="bg-white/5 border-white/10 mt-6">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                  <p className="text-gray-300">Loading data...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <TabsContent value="admins" className="mt-6">
                  {/* Desktop Table Header */}
                  <div className="hidden lg:block mb-4">
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-300">
                          <div>Admin ID</div>
                          <div>Name</div>
                          <div>Email</div>
                          <div>Restaurant</div>
                          <div>Phone</div>
                          <div>Created</div>
                          <div>Status</div>
                          <div className="text-center">Actions</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {filteredAdmins.length === 0 ? (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-8 text-center">
                        <Crown className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-300 text-lg mb-2">No admins found</p>
                        <p className="text-gray-400 text-sm">
                          {searchTerm ? "Try adjusting your search terms" : "No admin accounts have been created yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-3">
                        {filteredAdmins.map((admin, index) => (
                          <AdminCard key={admin.id} admin={admin} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="staff" className="mt-6">
                  {/* Desktop Table Header */}
                  <div className="hidden lg:block mb-4">
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-300">
                          <div>Staff ID</div>
                          <div>Name</div>
                          <div>Mobile</div>
                          <div>Designation</div>
                          <div>Restaurant</div>
                          <div>Created</div>
                          <div>Status</div>
                          <div className="text-center">Actions</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {filteredStaff.length === 0 ? (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-8 text-center">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-300 text-lg mb-2">No staff found</p>
                        <p className="text-gray-400 text-sm">
                          {searchTerm ? "Try adjusting your search terms" : "No staff members have been added yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-3">
                        {filteredStaff.map((staffMember, index) => (
                          <StaffCard key={staffMember.id} staffMember={staffMember} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

export default function ProtectedAdminStaffPage() {
  return (
    <SuperAdminProtectedRoute>
      <AdminStaffPage />
    </SuperAdminProtectedRoute>
  );
}