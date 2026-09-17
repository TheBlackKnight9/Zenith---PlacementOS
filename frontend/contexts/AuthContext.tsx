"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAuthSession, clearAuthSession, getStoredToken, getStoredUser } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

interface UserProfile {
  id: string;
  email: string;
  role: "STUDENT" | "TPO";
  dashboardUrl: string;
  profile?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ dashboardUrl: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate session from storage on client mount
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient.post<{ token: string; user: UserProfile }>(
      "/auth/login",
      { email, password },
      { requiresAuth: false }
    );

    setToken(data.token);
    setUser(data.user);
    setAuthSession(data.token, data.user);

    return { dashboardUrl: data.user.dashboardUrl };
  };

  const logout = () => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
