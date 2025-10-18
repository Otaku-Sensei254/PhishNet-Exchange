import React, { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Reusable user fetcher — also used after payments
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/user/${decoded.id}`
      );
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("userData", JSON.stringify(data.user)); // persist
      } else {
        setUser(null);
        localStorage.removeItem("userData");
      }
    } catch (err) {
      console.error("⚠️ Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Load user on mount (from token)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
