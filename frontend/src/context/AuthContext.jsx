import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { login as loginAPI } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Load user on refresh (if token exists)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setLoading(false);
        return;
      }

      // Set default Authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      try {
        const res = await api.get("auth/profile/");
        setUser(res.data);
      } catch {
        // If token is invalid, clear storage
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 🔐 Login
  const login = async (data) => {
    try {
      const res = await loginAPI(data);
      const { access, refresh } = res.data;

      // Save tokens
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      // Set default Authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      // Fetch user profile
      const profileRes = await api.get("auth/profile/");
      setUser(profileRes.data);

      return profileRes.data; // optional, for chaining
    } catch (error) {
      // Clear anything if login fails
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      throw error; // re-throw for the login component to handle
    }
  };

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    delete api.defaults.headers.common["Authorization"];
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