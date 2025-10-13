import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setUser(null);
    try {
      const decoded = jwtDecode(token);
      const res = await fetch(
        `http://localhost:5000/api/auth/user/${decoded.id}`
      );
      const data = await res.json();
      setUser(data.user);
      console.log("User fetched:", data.user);
    } catch (err) {
      console.error("Token or fetch error:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};
