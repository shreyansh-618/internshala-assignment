"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, displayName) => {
    try {
      const response = await apiService.register({
        email,
        password,
        displayName,
      });

      setUser(response.user);
      return response;
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
      return response;
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Clear user state even if API call fails
      setUser(null);
    }
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("shopeasy-token");

      if (token) {
        try {
          const response = await apiService.getProfile();
          setUser(response.user);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("shopeasy-token");
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const value = {
    user,
    signup,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
