import { apiClient } from './client';
import { Medicine, CreateMedicineDto, UpdateMedicineDto } from '@/types';

export const medicinesApi = {
  // جلب جميع الأدوية
  getAll: async (): Promise<Medicine[]> => {
    const response = await apiClient.get<Medicine[]>('/medicines');
    return response.data;
  },

  // جلب دواء واحد
  getById: async (id: number): Promise<Medicine> => {
    const response = await apiClient.get<Medicine>(`/medicines/${id}`);
    return response.data;
  },

  // إضافة دواء جديد
  create: async (data: CreateMedicineDto): Promise<Medicine> => {
    const response = await apiClient.post<Medicine>('/medicines', data);
    return response.data;
  },

  // تعديل دواء
  update: async (id: number, data: UpdateMedicineDto): Promise<Medicine> => {
    const response = await apiClient.patch<Medicine>(`/medicines/${id}`, data);
    return response.data;
  },

  // حذف دواء
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/medicines/${id}`);
  },
};
