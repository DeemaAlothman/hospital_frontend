import { apiClient } from './client';
import { RadiologyTest, CreateRadiologyTestDto, UpdateRadiologyTestDto } from '@/types';

export const radiologyTestsApi = {
  // جلب جميع فحوصات الأشعة
  getAll: async (): Promise<RadiologyTest[]> => {
    const response = await apiClient.get<RadiologyTest[]>('/radiology/tests');
    return response.data;
  },

  // جلب فحص واحد
  getById: async (id: number): Promise<RadiologyTest> => {
    const response = await apiClient.get<RadiologyTest>(`/radiology/tests/${id}`);
    return response.data;
  },

  // إضافة فحص جديد
  create: async (data: CreateRadiologyTestDto): Promise<RadiologyTest> => {
    const response = await apiClient.post<RadiologyTest>('/radiology/tests', data);
    return response.data;
  },

  // تعديل فحص
  update: async (id: number, data: UpdateRadiologyTestDto): Promise<RadiologyTest> => {
    const response = await apiClient.patch<RadiologyTest>(`/radiology/tests/${id}`, data);
    return response.data;
  },

  // حذف فحص
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/radiology/tests/${id}`);
  },
};
