import { apiClient } from "./client";
import { Patient, CreatePatientDto, UpdatePatientDto } from "@/types";

export const patientsApi = {
  // جلب جميع المرضى
  getAll: async (): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>("/patients");
    return response.data;
  },

  // جلب مريض واحد
  getById: async (id: number): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  // إضافة مريض جديد
  create: async (data: CreatePatientDto): Promise<Patient> => {
    const response = await apiClient.post<Patient>("/patients", data);
    return response.data;
  },

  // تعديل مريض
  update: async (id: number, data: UpdatePatientDto): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  // حذف مريض
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },
};
