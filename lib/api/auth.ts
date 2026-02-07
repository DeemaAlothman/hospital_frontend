import { apiClient } from "./client";
import { LoginDto, AuthResponse, User, RegisterDto } from "@/types";

function setAccessTokenCookie(token: string) {
  const maxAge = 60 * 60 * 24; // 1 day
  document.cookie = `accessToken=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);

    if (typeof window !== "undefined") {
      const token = response.data?.accessToken;

      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data?.user ?? null)
        );
        setAccessTokenCookie(token);
      }
    }

    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      document.cookie = "accessToken=; Max-Age=0; Path=/;";
    }
  },
};
