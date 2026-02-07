import { apiClient } from "./client";
import { User } from "@/types";

export interface QueryUsersDto {
  role?: string;
  search?: string;
}

export interface UserStats {
  role: string;
  count: number;
}

export const usersApi = {
  // جلب جميع المستخدمين
  getAll: async (query?: QueryUsersDto): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users", { params: query });
    return response.data;
  },

  // جلب مستخدم واحد
  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  // جلب إحصائيات حسب الدور
  getStats: async (): Promise<UserStats[]> => {
    const response = await apiClient.get<UserStats[]>("/users/stats");
    return response.data;
  },
};
