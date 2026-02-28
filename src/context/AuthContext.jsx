import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, loginWithGoogle, logout } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        return await loginWithGoogle();
    };

    const signOut = async () => {
        await logout();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signOut }}>
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
