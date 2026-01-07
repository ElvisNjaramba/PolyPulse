import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { login as loginAPI } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔁 Load user on refresh
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("auth/profile/");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("access");
    if (token) loadUser();
    else setLoading(false);
  }, []);


    // 🔐 Login
    const login = async (data) => {
        const res = await loginAPI(data);
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        // fetch profile after login
        const profile = await api.get("auth/profile/");
        setUser(profile.data);
    };

    // 🚪 Logout
    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    // ⏳ Prevent route crash while loading
    if (loading) return null;

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
