import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, loginWithGoogle, loginAsGuest, logout, isFirebaseConfigured } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const login = async () => {
        const result = await loginWithGoogle();
        if (!isFirebaseConfigured) {
            setUser(result);
        }
        return result;
    };

    const guestLogin = () => {
        const guestUser = loginAsGuest();
        setUser(guestUser);
        return guestUser;
    };

    const signOut = async () => {
        await logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, guestLogin, signOut, isFirebaseConfigured }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth trebuie folosit în AuthProvider');
    }
    return context;
}
