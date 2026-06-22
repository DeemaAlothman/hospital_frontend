import { apiClient } from "./client";
import {
  RoomReservation,
  CreateRoomReservationDto,
  UpdateRoomReservationDto,
  QueryRoomReservationsDto,
} from "@/types";

export const roomReservationsApi = {
  // جلب جميع الحجوزات مع فلترة اختيارية
  getAll: async (params?: QueryRoomReservationsDto): Promise<RoomReservation[]> => {
    const response = await apiClient.get<RoomReservation[]>("/room-reservations", { params });
    return response.data;
  },

  // جلب حجز واحد بتفاصيله
  getById: async (id: number): Promise<RoomReservation> => {
    const response = await apiClient.get<RoomReservation>(`/room-reservations/${id}`);
    return response.data;
  },

  // إنشاء حجز جديد (ADMIN | RECEPTIONIST | NURSE)
  create: async (data: CreateRoomReservationDto): Promise<RoomReservation> => {
    const response = await apiClient.post<RoomReservation>("/room-reservations", data);
    return response.data;
  },

  // تعديل ملاحظات أو تاريخ الانتهاء (ADMIN | RECEPTIONIST | NURSE)
  update: async (id: number, data: UpdateRoomReservationDto): Promise<RoomReservation> => {
    const response = await apiClient.patch<RoomReservation>(`/room-reservations/${id}`, data);
    return response.data;
  },

  // تفعيل الحجز: RESERVED → ACTIVE (ADMIN | NURSE)
  activate: async (id: number): Promise<RoomReservation> => {
    const response = await apiClient.patch<RoomReservation>(`/room-reservations/${id}/activate`);
    return response.data;
  },

  // إنهاء الحجز: ACTIVE → COMPLETED (ADMIN | NURSE | RECEPTIONIST)
  complete: async (id: number): Promise<RoomReservation> => {
    const response = await apiClient.patch<RoomReservation>(`/room-reservations/${id}/complete`);
    return response.data;
  },

  // إلغاء الحجز: RESERVED/ACTIVE → CANCELLED (ADMIN | RECEPTIONIST)
  cancel: async (id: number): Promise<RoomReservation> => {
    const response = await apiClient.patch<RoomReservation>(`/room-reservations/${id}/cancel`);
    return response.data;
  },
};
