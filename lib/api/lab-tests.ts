import { apiClient } from './client';
import { LabTest, CreateLabTestDto, UpdateLabTestDto } from '@/types';

export const labTestsApi = {
  // جلب جميع التحاليل
  getAll: async (): Promise<LabTest[]> => {
    const response = await apiClient.get<LabTest[]>('/lab/tests');
    return response.data;
  },

  // جلب تحليل واحد
  getById: async (id: number): Promise<LabTest> => {
    const response = await apiClient.get<LabTest>(`/lab/tests/${id}`);
    return response.data;
  },

  // إضافة تحليل جديد
  create: async (data: CreateLabTestDto): Promise<LabTest> => {
    const response = await apiClient.post<LabTest>('/lab/tests', data);
    return response.data;
  },

  // تعديل تحليل
  update: async (id: number, data: UpdateLabTestDto): Promise<LabTest> => {
    const response = await apiClient.patch<LabTest>(`/lab/tests/${id}`, data);
    return response.data;
  },

  // حذف تحليل
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/lab/tests/${id}`);
  },
};
