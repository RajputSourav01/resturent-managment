// lib/restaurant-service.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

// Types for restaurant data structures
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  logo?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  settings?: {
    currency: string;
    timezone: string;
    orderTypes: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Admin {
  id?: string;
  email: string;
  password: string;
  restaurantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Food {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id?: string;
  fullName: string;
  address: string;
  mobile: string;
  aadhaar?: string;
  designation: string;
  imageUrl?: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id?: string;
  title: string;
  category: string;
  total: number;
  items?: OrderItem[];
  customerInfo?: {
    name: string;
    phone: string;
    tableNumber?: number;
  };
  // Support for customerMenu format
  tableNo?: string;
  customerName?: string;
  customerPhone?: string;
  foodId?: string;
  price?: number;
  quantity?: number;
  imageUrl?: string;
  description?: string;
  ingredients?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid';
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  createdAt: any; // Firebase timestamp or Date
  updatedAt?: Date;
}

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface Table {
  id?: string;
  number: number;
  capacity: number;
  isOccupied: boolean;
  qrCode?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// No default data - restaurants start with empty food menu

// No default staff data - restaurants start with empty staff list

const getDefaultRestaurantSettings = (): Partial<Restaurant> => ({
  theme: {
    primaryColor: '#1f2937',
    secondaryColor: '#374151',
    accentColor: '#f59e0b'
  },
  settings: {
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    orderTypes: ['dine-in', 'takeaway', 'delivery']
  }
});

class RestaurantService {
  private getRestaurantPath(restaurantId: string): string {
    return `restaurants/${restaurantId}`;
  }

  private getCollectionPath(restaurantId: string, collectionName: string): string {
    return `restaurants/${restaurantId}/${collectionName}`;
  }

  // Restaurant CRUD operations
  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const restaurantDoc = {
      ...restaurantData,
      ...getDefaultRestaurantSettings(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'restaurants'), restaurantDoc);
    
    // No default data initialization - restaurant starts empty
    console.log(`Restaurant created: ${docRef.id} (empty - admin will add data)`);
    
    return docRef.id;
  }

  // Admin CRUD operations
  async createAdmin(adminData: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const adminDoc = {
      ...adminData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'admins'), adminDoc);
    return docRef.id;
  }

  async getAdminByEmail(email: string): Promise<Admin | null> {
    try {
      const q = query(
        collection(db, 'admins'),
        where('email', '==', email),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const adminDoc = querySnapshot.docs[0];
      return { id: adminDoc.id, ...adminDoc.data() } as Admin;
    } catch (error) {
      console.error('Error fetching admin:', error);
      return null;
    }
  }

  async updateAdmin(adminId: string, updateData: Partial<Admin>): Promise<boolean> {
    try {
      const docRef = doc(db, 'admins', adminId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating admin:', error);
      return false;
    }
  }

  async getRestaurant(restaurantId: string): Promise<Restaurant | null> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Restaurant;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
  }

  async updateRestaurant(restaurantId: string, updateData: Partial<Restaurant>): Promise<boolean> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return false;
    }
  }

  async deleteRestaurant(restaurantId: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return false;
    }
  }

  // Restaurant starts with empty data - admin will add food, staff, and tables as needed

  // Food CRUD operations
  async getFoods(restaurantId: string): Promise<Food[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath(restaurantId, 'foods')),
        orderBy('category'),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Food[];
    } catch (error) {
      console.error('Error fetching foods:', error);
      // Return empty array - no default data
      return [];
    }
  }

  async addFood(restaurantId: string, foodData: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const foodDoc = {
      ...foodData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(
      collection(db, this.getCollectionPath(restaurantId, 'foods')), 
      foodDoc
    );
    return docRef.id;
  }

  async updateFood(restaurantId: string, foodId: string, updateData: Partial<Food>): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'foods'), foodId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating food:', error);
      return false;
    }
  }

  async deleteFood(restaurantId: string, foodId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'foods'), foodId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting food:', error);
      return false;
    }
  }

  // Staff CRUD operations
  async getStaff(restaurantId: string): Promise<Staff[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath(restaurantId, 'staff')),
        where('isActive', '==', true),
        orderBy('fullName')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[];
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  }

  async addStaff(restaurantId: string, staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log("Adding staff to restaurant:", restaurantId, "Data:", { ...staffData, password: "***" });
    
    const staffDoc = {
      ...staffData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    const collectionPath = this.getCollectionPath(restaurantId, 'staff');
    console.log("Staff collection path:", collectionPath);
    
    const docRef = await addDoc(
      collection(db, collectionPath), 
      staffDoc
    );
    
    console.log("Staff added with ID:", docRef.id);
    return docRef.id;
  }

  async updateStaff(restaurantId: string, staffId: string, updateData: Partial<Staff>): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'staff'), staffId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating staff:', error);
      return false;
    }
  }

  async deleteStaff(restaurantId: string, staffId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'staff'), staffId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error deleting staff:', error);
      return false;
    }
  }

  // Order CRUD operations
  async getOrders(restaurantId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath(restaurantId, 'orders')),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async addOrder(restaurantId: string, orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const orderDoc = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(
      collection(db, this.getCollectionPath(restaurantId, 'orders')), 
      orderDoc
    );
    return docRef.id;
  }

  async updateOrder(restaurantId: string, orderId: string, updateData: Partial<Order>): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'orders'), orderId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  }

  async deleteOrder(restaurantId: string, orderId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'orders'), orderId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // Table operations
  async createTable(restaurantId: string, tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newTable = {
        ...tableData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.getCollectionPath(restaurantId, 'tables')), newTable);
      return docRef.id;
    } catch (error) {
      console.error('Error creating table:', error);
      throw error;
    }
  }

  async getTables(restaurantId: string): Promise<Table[]> {
    try {
      const tablesCollection = collection(db, this.getCollectionPath(restaurantId, 'tables'));
      const q = query(tablesCollection, orderBy('number', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Table));
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  }

  async getTable(restaurantId: string, tableId: string): Promise<Table | null> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'tables'), tableId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Table;
      }
      return null;
    } catch (error) {
      console.error('Error fetching table:', error);
      throw error;
    }
  }

  async updateTable(restaurantId: string, tableId: string, tableData: Partial<Omit<Table, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'tables'), tableId);
      await updateDoc(docRef, {
        ...tableData,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating table:', error);
      return false;
    }
  }

  async deleteTable(restaurantId: string, tableId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.getCollectionPath(restaurantId, 'tables'), tableId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting table:', error);
      return false;
    }
  }

  // Utility methods
  async getRestaurantStats(restaurantId: string): Promise<any> {
    try {
      const [foods, staff, orders] = await Promise.all([
        this.getFoods(restaurantId),
        this.getStaff(restaurantId),
        this.getOrders(restaurantId)
      ]);

      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const uniqueCategories = new Set(foods.map(food => food.category));

      // Generate placeholder daily data
      const daily = {
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        revenue: [100, 250, 300, 200, 150, 400, 500],
        customers: [5, 10, 15, 8, 12, 20, 25]
      };

      return {
        totalSales,
        totalInventory: foods.length,
        totalStaff: staff.length,
        totalCategories: uniqueCategories.size,
        daily,
        inventory: foods.slice(0, 10), // Limit for performance
        orders: orders.slice(0, 10) // Recent orders only
      };
    } catch (error) {
      console.error('Error fetching restaurant stats:', error);
      throw error;
    }
  }
}

const restaurantService = new RestaurantService();
export default restaurantService;
export { restaurantService };