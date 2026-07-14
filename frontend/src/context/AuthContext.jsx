import { createContext, useContext, useState, useEffect } from "react";
import { loginAdmin, logoutAdmin, getProfile } from "../api/adminApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await getProfile();
            if (res.data.success) {
                setUser(res.data.user);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const res = await loginAdmin(credentials);
        if (res.data.success) {
            setUser(res.data.user);
        }
        return res.data;
    };

    const logout = async () => {
        try {
            await logoutAdmin();
        } catch {
            // continue even if api fails
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
