import { apiClient } from './client';
import { Prescription, CreatePrescriptionDto, UpdatePrescriptionDto, QueryPrescriptionsDto } from '@/types';

export interface CreateMyPrescriptionDto {
  visitId: number;
  patientId: number;
  doctorId: number;
  notes?: string;
  items: {
    medicineId: number;
    dosage: string;
    frequency?: string;
    duration?: string;
  }[];
}

export const prescriptionsApi = {
  // جلب جميع الوصفات
  getAll: async (query?: QueryPrescriptionsDto): Promise<Prescription[]> => {
    const response = await apiClient.get<Prescription[]>('/prescriptions', { params: query });
    return response.data;
  },

  // جلب الوصفات الخاصة بالطبيب
  getMyPrescriptions: async (): Promise<Prescription[]> => {
    const response = await apiClient.get<Prescription[]>('/prescriptions/my-prescriptions');
    return response.data;
  },

  // جلب وصفة واحدة
  getById: async (id: number): Promise<Prescription> => {
    const response = await apiClient.get<Prescription>(`/prescriptions/${id}`);
    return response.data;
  },

  // إضافة وصفة جديدة
  create: async (data: CreatePrescriptionDto): Promise<Prescription> => {
    const response = await apiClient.post<Prescription>('/prescriptions', data);
    return response.data;
  },

  // إضافة وصفة من الطبيب
  createMyPrescription: async (data: CreateMyPrescriptionDto): Promise<Prescription> => {
    const response = await apiClient.post<Prescription>('/prescriptions', data);
    return response.data;
  },

  // تعديل وصفة
  update: async (id: number, data: UpdatePrescriptionDto): Promise<Prescription> => {
    const response = await apiClient.patch<Prescription>(`/prescriptions/${id}`, data);
    return response.data;
  },

  // حذف وصفة
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/prescriptions/${id}`);
  },
};
