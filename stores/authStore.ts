"use client";

import { create } from "zustand";
import { User, LoginDto } from "@/types";
import { authApi } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginDto) => Promise<User>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginDto) => {
    set({ isLoading: true, error: null });

    try {
      console.log("🔄 Attempting login...", credentials);
      const response = await authApi.login(credentials);
      console.log("✅ Login successful:", response);

      // ✅ 1) خزّن التوكن في cookie حتى الـ middleware يشوفه
      document.cookie = `accessToken=${response.accessToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24}`;
      console.log("🍪 Cookie set:", document.cookie);

      // ✅ 2) خزّن التوكن والمستخدم في localStorage (للـ client-side requests)
      console.log("📝 Saving to localStorage - Token:", response.accessToken ? "✅" : "❌");
      console.log("📝 Saving to localStorage - User:", response.user);

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      console.log("💾 Token saved to localStorage");
      console.log("💾 Verification - Token in storage:", localStorage.getItem("accessToken") ? "✅" : "❌");
      console.log("💾 Verification - User in storage:", localStorage.getItem("user"));

      set({
        user: response.user as any,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response.user as User;
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      const errorMessage = error.response?.data?.message || "فشل تسجيل الدخول";
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: () => {
    authApi.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  fetchUser: async () => {
    // ✅ تأكد إنك على الـ client-side
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.log("❌ No token found, user not authenticated");
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    // ✅ جيب المستخدم من localStorage فقط
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      try {
        const user = JSON.parse(storedUser);
        console.log("✅ User loaded from localStorage:", user);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        // امسح البيانات الفاسدة
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        document.cookie = "accessToken=; Max-Age=0; path=/;";
      }
    }

    // ✅ إذا ما في مستخدم محفوظ، يعني في مشكلة - وجّه للـ login
    console.log("❌ No user data in localStorage, redirecting to login");
    authApi.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  clearError: () => set({ error: null }),
}));
