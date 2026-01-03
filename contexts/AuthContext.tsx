'use client';

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect 
} from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

// Define user roles
export type UserRole = 'admin' | 'kitchen_staff' | 'super_admin';

// Define auth user with additional properties
export interface AuthUser extends User {
    role?: UserRole;
    restaurantId?: string;
    staffId?: string;
}

// Enhanced Auth Context Type
interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    userRole: UserRole | null;
    restaurantId: string | null;
    isAdmin: boolean;
    isKitchenStaff: boolean;
    refreshUserData: () => Promise<void>;
    forceLogout: () => Promise<void>;
}

// Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // Force logout function
    const forceLogout = async () => {
        try {
            await signOut(auth);
            // Clear localStorage
            localStorage.removeItem('admin');
            localStorage.removeItem('admin_restaurant');
            localStorage.removeItem('kitchen_staff');
            
            // Reset state
            setUser(null);
            setUserRole(null);
            setRestaurantId(null);
            
            console.log('User logged out due to database validation failure');
        } catch (error) {
            console.error('Error during force logout:', error);
        }
    };

    // Validate admin exists in database
    const validateAdminExists = async (email: string, adminRestaurantId: string): Promise<boolean> => {
        try {
            const adminsQuery = query(
                collection(db, 'admins'),
                where('email', '==', email),
                where('restaurantId', '==', adminRestaurantId)
            );
            const adminSnapshot = await getDocs(adminsQuery);
            
            if (adminSnapshot.empty) {
                console.log('Admin not found in database:', email, adminRestaurantId);
                return false;
            }

            const adminData = adminSnapshot.docs[0].data();
            if (adminData.isActive === false) {
                console.log('Admin account is inactive:', email);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating admin:', error);
            return false;
        }
    };

    // Validate staff exists in database
    const validateStaffExists = async (staffId: string, staffRestaurantId: string): Promise<boolean> => {
        try {
            const staffDoc = await getDoc(doc(db, 'restaurants', staffRestaurantId, 'staff', staffId));
            
            if (!staffDoc.exists()) {
                console.log('Staff not found in database:', staffId, staffRestaurantId);
                return false;
            }

            const staffData = staffDoc.data();
            if (staffData.isActive === false) {
                console.log('Staff account is inactive:', staffId);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating staff:', error);
            return false;
        }
    };

    const refreshUserData = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            // Check if user is admin (has restaurant ownership)
            const adminRestaurantId = localStorage.getItem('admin_restaurant');
            const isAdminFlag = localStorage.getItem('admin') === 'true';
            
            if (isAdminFlag && adminRestaurantId && currentUser.email) {
                // Validate admin exists in database
                const adminExists = await validateAdminExists(currentUser.email, adminRestaurantId);
                
                if (!adminExists) {
                    console.log('Admin validation failed - forcing logout');
                    await forceLogout();
                    return;
                }

                setUserRole('admin');
                setRestaurantId(adminRestaurantId);
                setUser({ 
                    ...currentUser, 
                    role: 'admin', 
                    restaurantId: adminRestaurantId 
                } as AuthUser);
                return;
            }

            // Check if user is kitchen staff
            const kitchenStaffData = localStorage.getItem('kitchen_staff');
            if (kitchenStaffData) {
                const staffData = JSON.parse(kitchenStaffData);
                
                // Validate staff exists in database
                const staffExists = await validateStaffExists(staffData.staffId, staffData.restaurantId);
                
                if (!staffExists) {
                    console.log('Staff validation failed - forcing logout');
                    await forceLogout();
                    return;
                }

                setUserRole('kitchen_staff');
                setRestaurantId(staffData.restaurantId);
                setUser({ 
                    ...currentUser, 
                    role: 'kitchen_staff', 
                    restaurantId: staffData.restaurantId,
                    staffId: staffData.staffId
                } as AuthUser);
                return;
            }

            // Default case - no specific role found
            setUserRole(null);
            setRestaurantId(null);
            setUser({ ...currentUser } as AuthUser);

        } catch (error) {
            console.error('Error fetching user data:', error);
            setUserRole(null);
            setRestaurantId(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            
            if (currentUser) {
                // Set basic user first
                setUser({ ...currentUser } as AuthUser);
                
                // Then fetch additional user data
                await refreshUserData();
            } else {
                // Clear all user data when logged out
                setUser(null);
                setUserRole(null);
                setRestaurantId(null);
                
                // Clear localStorage
                localStorage.removeItem('admin');
                localStorage.removeItem('admin_restaurant');
                localStorage.removeItem('kitchen_staff');
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const contextValue: AuthContextType = {
        user,
        loading,
        userRole,
        restaurantId,
        isAdmin: userRole === 'admin',
        isKitchenStaff: userRole === 'kitchen_staff',
        refreshUserData,
        forceLogout
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading application...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

// Custom Hook to use the Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};