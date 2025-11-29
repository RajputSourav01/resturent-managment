'use client';

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect 
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Your Firebase Auth instance

// 1. Define the Context Type
interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase Auth State Listener
        // This function subscribes to the user's login status.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup: Unsubscribe when the component unmounts
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {/* Render children only after the initial auth check is complete 
              to prevent flickering or unauthorized access during loading.
            */}
            {loading ? <div>Loading application...</div> : children}
        </AuthContext.Provider>
    );
};

// 4. Custom Hook to use the Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};