import { apiClient } from "./client";
import { Room, Bed, CreateRoomDto, UpdateRoomDto, AddBedDto, QueryRoomsDto } from "@/types";

export const roomsApi = {
  // جلب جميع الغرف مع فلترة اختيارية
  getAll: async (params?: QueryRoomsDto): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>("/rooms", { params });
    return response.data;
  },

  // جلب غرفة واحدة بتفاصيلها وأسرتها
  getById: async (id: number): Promise<Room> => {
    const response = await apiClient.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  // إنشاء غرفة جديدة (ADMIN فقط)
  create: async (data: CreateRoomDto): Promise<Room> => {
    const response = await apiClient.post<Room>("/rooms", data);
    return response.data;
  },

  // تعديل غرفة (ADMIN فقط)
  update: async (id: number, data: UpdateRoomDto): Promise<Room> => {
    const response = await apiClient.patch<Room>(`/rooms/${id}`, data);
    return response.data;
  },

  // حذف غرفة (ADMIN فقط)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },

  // إضافة سرير للغرفة (ADMIN فقط)
  addBed: async (roomId: number, data: AddBedDto): Promise<Bed> => {
    const response = await apiClient.post<Bed>(`/rooms/${roomId}/beds`, data);
    return response.data;
  },

  // تبديل وضع الصيانة (ADMIN فقط)
  toggleMaintenance: async (id: number): Promise<Room> => {
    const response = await apiClient.patch<Room>(`/rooms/${id}/maintenance`);
    return response.data;
  },
};
