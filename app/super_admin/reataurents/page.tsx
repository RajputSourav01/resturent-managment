"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  getDoc,
  query,
  orderBy,
  where,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteUser, getAuth } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Search,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Download,
  Send,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import SuperAdminProtectedRoute from "@/components/SuperAdminProtectedRoute";

type Restaurant = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  plan: {
    id: string;
    name: string;
    price: number;
    duration: string;
    purchasedAt?: any;
  } | string;
  createdAt: any;
  ownersName?: string;
  city?: string;
  state?: string;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [notificationDialog, setNotificationDialog] = useState({
    open: false,
    restaurantId: "",
    restaurantName: ""
  });
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: ""
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [bulkNotificationDialog, setBulkNotificationDialog] = useState(false);
  const [bulkNotificationForm, setBulkNotificationForm] = useState({
    title: "",
    message: ""
  });
  const [sendingBulkNotification, setSendingBulkNotification] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const router = useRouter();

  // Fetch restaurants from Firestore
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const restaurantsList: Restaurant[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        restaurantsList.push({
          id: doc.id,
          name: data.name || "Unknown",
          address: data.address || "No address",
          phone: data.phone || "No phone",
          email: data.email || "No email",
          plan: data.plan || "No plan",
          createdAt: data.createdAt,
          ownersName: data.ownersName,
          city: data.city,
          state: data.state,
        });
      });
      
      setRestaurants(restaurantsList);
      setFilteredRestaurants(restaurantsList);
      console.log("Fetched restaurants:", restaurantsList);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Filter restaurants based on search term
  useEffect(() => {
    const filtered = restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.phone.includes(searchTerm) ||
      restaurant.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  }, [searchTerm, restaurants]);

  // Delete restaurant with all related data
  const handleDelete = async (restaurantId: string) => {
    setDeleteLoading(restaurantId);
    console.log(`Starting deletion process for restaurant: ${restaurantId}`);
    
    try {
      let totalDeleted = 0;
      
      // Collections to delete from within restaurant
      const subCollections = [
        'orders',
        'staff', 
        'foods',
        'notifications',
        'themeSettings',
        'tables',
        'admins'
      ];

      // Delete all subcollections
      for (const collectionName of subCollections) {
        try {
          console.log(`Checking subcollection: ${collectionName}`);
          const subCollectionRef = collection(db, "restaurants", restaurantId, collectionName);
          const snapshot = await getDocs(subCollectionRef);
          
          console.log(`Found ${snapshot.docs.length} documents in ${collectionName}`);
          
          if (snapshot.docs.length > 0) {
            // Delete all documents in subcollection
            const deletePromises = snapshot.docs.map(docSnapshot => {
              console.log(`Deleting document: ${docSnapshot.id} from ${collectionName}`);
              return deleteDoc(doc(db, "restaurants", restaurantId, collectionName, docSnapshot.id));
            });
            
            await Promise.all(deletePromises);
            totalDeleted += snapshot.docs.length;
            console.log(`✅ Successfully deleted ${snapshot.docs.length} documents from ${collectionName}`);
          }
        } catch (error) {
          console.error(`❌ Error deleting ${collectionName}:`, error);
          // Continue with other collections even if one fails
        }
      }

      // Delete admin records associated with this restaurant from main admins collection
      try {
        console.log(`Checking main admins collection for restaurantId: ${restaurantId}`);
        const adminsQuery = query(collection(db, "admins"), where("restaurantId", "==", restaurantId));
        const adminsSnapshot = await getDocs(adminsQuery);
        
        console.log(`Found ${adminsSnapshot.docs.length} admin records in main collection`);
        
        // Store admin emails for potential Firebase Auth user deletion
        const adminEmails: string[] = [];
        
        if (adminsSnapshot.docs.length > 0) {
          const deleteAdminPromises = adminsSnapshot.docs.map(adminDoc => {
            const adminData = adminDoc.data();
            console.log(`Deleting admin: ${adminDoc.id} (${adminData.email})`);
            if (adminData.email) {
              adminEmails.push(adminData.email);
            }
            return deleteDoc(doc(db, "admins", adminDoc.id));
          });
          
          await Promise.all(deleteAdminPromises);
          totalDeleted += adminsSnapshot.docs.length;
          console.log(`✅ Successfully deleted ${adminsSnapshot.docs.length} admin records`);
        }
        
        // Note: Firebase Auth user deletion requires admin SDK on backend
        if (adminEmails.length > 0) {
          console.log(`📧 Admin emails that may need Auth user cleanup: ${adminEmails.join(', ')}`);
        }
      } catch (error) {
        console.error("❌ Error deleting admin records:", error);
      }

      // Finally, delete the main restaurant document
      try {
        console.log(`Deleting main restaurant document: ${restaurantId}`);
        await deleteDoc(doc(db, "restaurants", restaurantId));
        console.log(`✅ Successfully deleted main restaurant document`);
      } catch (error) {
        console.error("❌ Error deleting main restaurant document:", error);
        throw error; // This is critical, so throw the error
      }
      
      // Update state
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      setFilteredRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      
      console.log(`🎉 Restaurant deletion completed! Total documents deleted: ${totalDeleted + 1}`);
      alert(`Restaurant "${restaurantId}" and all related data deleted successfully!\nTotal documents deleted: ${totalDeleted + 1}`);
      
    } catch (error) {
      console.error("💥 Critical error during restaurant deletion:", error);
      alert(`Failed to delete restaurant: ${error instanceof Error ? error.message : 'Unknown error'}. Please check console for details.`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Open notification dialog
  const handleSendNotification = (restaurantId: string, restaurantName: string) => {
    setNotificationDialog({
      open: true,
      restaurantId,
      restaurantName
    });
    setNotificationForm({
      title: "",
      message: ""
    });
  };

  // Send notification to restaurant admin
  const handleSubmitNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      alert("Please fill in both title and message fields.");
      return;
    }

    setSendingNotification(true);
    try {
      // Add notification to restaurant's notifications subcollection
      const notificationRef = collection(db, "restaurants", notificationDialog.restaurantId, "notifications");
      await addDoc(notificationRef, {
        restaurantId: notificationDialog.restaurantId,
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim(),
        type: "admin_message",
        from: "Super Admin",
        createdAt: Timestamp.now(),
        read: false,
        priority: "normal"
      });
      
      console.log(`Notification saved successfully for restaurant: ${notificationDialog.restaurantId}`);

      alert(`Notification sent successfully to ${notificationDialog.restaurantName}!`);
      
      // Close dialog and reset form
      setNotificationDialog({ open: false, restaurantId: "", restaurantName: "" });
      setNotificationForm({ title: "", message: "" });
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification. Please try again.");
    } finally {
      setSendingNotification(false);
    }
  };

  // Send notification to all restaurants
  const handleBulkSendNotification = async () => {
    if (!bulkNotificationForm.title.trim() || !bulkNotificationForm.message.trim()) {
      alert("Please fill in both title and message fields.");
      return;
    }

    if (!confirm(`Are you sure you want to send this notification to all ${restaurants.length} restaurants?`)) {
      return;
    }

    setSendingBulkNotification(true);
    setBulkProgress({ current: 0, total: restaurants.length });

    let successCount = 0;
    let failureCount = 0;

    try {
      for (let i = 0; i < restaurants.length; i++) {
        const restaurant = restaurants[i];
        setBulkProgress({ current: i + 1, total: restaurants.length });

        try {
          const notificationRef = collection(db, "restaurants", restaurant.id, "notifications");
          await addDoc(notificationRef, {
            restaurantId: restaurant.id,
            title: bulkNotificationForm.title.trim(),
            message: bulkNotificationForm.message.trim(),
            type: "admin_message",
            from: "Super Admin",
            createdAt: Timestamp.now(),
            read: false,
            priority: "normal"
          });
          
          successCount++;
          console.log(`Bulk notification sent to restaurant: ${restaurant.name}`);
        } catch (error) {
          failureCount++;
          console.error(`Failed to send notification to restaurant: ${restaurant.name}`, error);
        }

        // Small delay to prevent overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Show results
      const message = `Bulk notification complete!\n✅ Successful: ${successCount}\n❌ Failed: ${failureCount}`;
      alert(message);
      
      // Close dialog and reset form
      setBulkNotificationDialog(false);
      setBulkNotificationForm({ title: "", message: "" });
    } catch (error) {
      console.error("Error during bulk notification:", error);
      alert("Failed to send bulk notifications. Please try again.");
    } finally {
      setSendingBulkNotification(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  // Export to CSV
  // Test function to check restaurant data before deletion
  const checkRestaurantData = async (restaurantId: string) => {
    console.log(`🔍 Checking data for restaurant: ${restaurantId}`);
    
    try {
      // Check main restaurant document
      const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
      console.log(`Main restaurant exists: ${restaurantDoc.exists()}`);
      if (restaurantDoc.exists()) {
        console.log("Restaurant data:", restaurantDoc.data());
      }
      
      // Check subcollections
      const subCollections = ['orders', 'staff', 'foods', 'notifications', 'themeSettings', 'tables', 'admins'];
      
      for (const collectionName of subCollections) {
        const subCollectionRef = collection(db, "restaurants", restaurantId, collectionName);
        const snapshot = await getDocs(subCollectionRef);
        console.log(`${collectionName}: ${snapshot.docs.length} documents`);
      }
      
      // Check main admins collection
      const adminsQuery = query(collection(db, "admins"), where("restaurantId", "==", restaurantId));
      const adminsSnapshot = await getDocs(adminsQuery);
      console.log(`Main admins collection: ${adminsSnapshot.docs.length} documents`);
      
    } catch (error) {
      console.error("Error checking restaurant data:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ["Restaurant ID", "Name", "Address", "Phone", "Email", "Plan", "Owner", "City", "State", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredRestaurants.map(restaurant => [
        restaurant.id,
        `"${restaurant.name}"`,
        `"${restaurant.address}"`,
        restaurant.phone,
        restaurant.email,
        getPlanName(restaurant.plan),
        `"${restaurant.ownersName || 'N/A'}"`,
        `"${restaurant.city || 'N/A'}"`,
        `"${restaurant.state || 'N/A'}"`,
        restaurant.createdAt ? new Date(restaurant.createdAt.seconds * 1000).toLocaleDateString() : "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restaurants-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const getPlanName = (plan: any): string => {
    if (typeof plan === 'object' && plan && plan.name) {
      return plan.name;
    }
    return typeof plan === 'string' ? plan : 'No plan';
  };

  const getPlanBadgeColor = (plan: any) => {
    const planName = getPlanName(plan).toLowerCase();
    switch (planName) {
      case "enterprise": return "bg-purple-100 text-purple-800 border-purple-200";
      case "professional": return "bg-blue-100 text-blue-800 border-blue-200";
      case "starter": return "bg-green-100 text-green-800 border-green-200";
      case "premium": return "bg-purple-100 text-purple-800 border-purple-200";
      case "pro": return "bg-blue-100 text-blue-800 border-blue-200";
      case "basic": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <SuperAdminProtectedRoute>
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
              <Store className="h-6 w-6 text-emerald-400" />
              <h1 className="text-lg sm:text-xl font-semibold">
                Restaurants Management
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkNotificationDialog(true)}
              disabled={restaurants.length === 0}
              className="text-black border-white/20 hover:bg-white/10"
            >
              <Users className="h-4 w-4 mr-2" />
              Notify to All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRestaurants}
              disabled={loading}
              className="text-black border-white/20 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredRestaurants.length === 0}
              className="text-black border-white/20 hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Search and Stats */}
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
                placeholder="Search by name, email, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>Total: {restaurants.length}</span>
              <span>Filtered: {filteredRestaurants.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Restaurants Table/Cards */}
        {loading ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-400" />
              <p className="text-gray-300">Loading restaurants...</p>
            </CardContent>
          </Card>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300 text-lg mb-2">No restaurants found</p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? "Try adjusting your search terms" : "No restaurants have been registered yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Desktop Table Header */}
            <div className="hidden lg:block">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-300">
                    <div>Restaurant ID</div>
                    <div>Name</div>
                    <div>Address</div>
                    <div>Phone</div>
                    <div>Email</div>
                    <div>Plan</div>
                    <div>Created</div>
                    <div className="text-center">Actions</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Restaurant Items */}
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3">
                {filteredRestaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Desktop Row */}
                    <Card className="hidden lg:block bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-8 gap-4 items-center text-sm">
                          <div className="font-mono text-xs bg-white/10 px-2 py-1 rounded truncate">
                            {restaurant.id}
                          </div>
                          <div className="font-medium truncate">{restaurant.name}</div>
                          <div className="text-gray-300 truncate" title={restaurant.address}>
                            {restaurant.address}
                          </div>
                          <div className="text-gray-300">{restaurant.phone}</div>
                          <div className="text-gray-300 truncate" title={restaurant.email}>
                            {restaurant.email}
                          </div>
                          <div>
                            <Badge className={getPlanBadgeColor(restaurant.plan)}>
                              {getPlanName(restaurant.plan)}
                            </Badge>
                          </div>
                          <div className="text-gray-300">{formatDate(restaurant.createdAt)}</div>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendNotification(restaurant.id, restaurant.name)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2"
                              title="Send Notification"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                                  disabled={deleteLoading === restaurant.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    Are you sure you want to delete "{restaurant.name}"? This will permanently delete:
                                    <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                                      <li>Restaurant information</li>
                                      <li>All orders and order history</li>
                                      <li>Staff members and their data</li>
                                      <li>Food menu items</li>
                                      <li>Admin accounts and credentials</li>
                                      <li>All notifications</li>
                                      <li>Theme settings and customizations</li>
                                      <li>Table configurations</li>
                                    </ul>
                                    <p className="mt-3 font-medium text-red-400">This action cannot be undone.</p>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(restaurant.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mobile Card */}
                    <Card className="lg:hidden bg-white/5 border-white/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">
                              {restaurant.name}
                            </CardTitle>
                            <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                              ID: {restaurant.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge className={getPlanBadgeColor(restaurant.plan)}>
                              {getPlanName(restaurant.plan)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendNotification(restaurant.id, restaurant.name)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 flex-shrink-0"
                              title="Send Notification"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 flex-shrink-0"
                                  disabled={deleteLoading === restaurant.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-slate-700 text-white mx-4">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    Are you sure you want to delete "{restaurant.name}"? This will permanently delete:
                                    <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                                      <li>Restaurant information</li>
                                      <li>All orders and order history</li>
                                      <li>Staff members and their data</li>
                                      <li>Food menu items</li>
                                      <li>Admin accounts and credentials</li>
                                      <li>All notifications</li>
                                      <li>Theme settings and customizations</li>
                                      <li>Table configurations</li>
                                    </ul>
                                    <p className="mt-3 font-medium text-red-400">This action cannot be undone.</p>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(restaurant.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 break-words">{restaurant.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-300">{restaurant.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-300 truncate">{restaurant.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-300">{formatDate(restaurant.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </main>

      {/* Notification Dialog */}
      <Dialog open={notificationDialog.open} onOpenChange={(open) => 
        setNotificationDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Send Notification to {notificationDialog.restaurantName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title" className="text-white">
                Title
              </Label>
              <Input
                id="notification-title"
                placeholder="Enter notification title..."
                value={notificationForm.title}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={sendingNotification}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-message" className="text-white">
                Message
              </Label>
              <Textarea
                id="notification-message"
                placeholder="Enter your message..."
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                disabled={sendingNotification}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setNotificationDialog({ open: false, restaurantId: "", restaurantName: "" })}
              className="text-black border-white/20 hover:bg-white/10"
              disabled={sendingNotification}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitNotification}
              disabled={sendingNotification || !notificationForm.title.trim() || !notificationForm.message.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendingNotification ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Notification Dialog */}
      <Dialog open={bulkNotificationDialog} onOpenChange={setBulkNotificationDialog}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Send Notification to All Restaurants ({restaurants.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-notification-title" className="text-white">
                Title
              </Label>
              <Input
                id="bulk-notification-title"
                placeholder="Enter notification title..."
                value={bulkNotificationForm.title}
                onChange={(e) => setBulkNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={sendingBulkNotification}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-notification-message" className="text-white">
                Message
              </Label>
              <Textarea
                id="bulk-notification-message"
                placeholder="Enter your message..."
                value={bulkNotificationForm.message}
                onChange={(e) => setBulkNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                disabled={sendingBulkNotification}
              />
            </div>
            
            {/* Progress Indicator */}
            {sendingBulkNotification && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Sending notifications...</span>
                  <span>{bulkProgress.current} / {bulkProgress.total}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-200" 
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setBulkNotificationDialog(false)}
              className="text-black border-white/20 hover:bg-white/10"
              disabled={sendingBulkNotification}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSendNotification}
              disabled={sendingBulkNotification || !bulkNotificationForm.title.trim() || !bulkNotificationForm.message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingBulkNotification ? `Sending... (${bulkProgress.current}/${bulkProgress.total})` : `Send to All ${restaurants.length} Restaurants`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </SuperAdminProtectedRoute>
  );
}