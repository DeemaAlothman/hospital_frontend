import { apiClient } from "./client";
import { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from "@/types";

export interface QueryAppointmentsDto {
  doctorId?: number;
  patientId?: number;
  status?: string;
}

export const appointmentsApi = {
  // جلب جميع المواعيد
  getAll: async (query?: QueryAppointmentsDto): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>("/appointments", { params: query });
    return response.data;
  },

  // جلب موعد واحد
  getById: async (id: number): Promise<Appointment> => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  // إضافة موعد جديد
  create: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>("/appointments", data);
    return response.data;
  },

  // تعديل موعد
  update: async (id: number, data: UpdateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  // حذف موعد
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },
};
