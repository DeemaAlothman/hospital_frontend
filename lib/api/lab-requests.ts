import { apiClient } from './client';
import {
  LabRequest,
  CreateLabRequestDto,
  UpdateLabRequestDto,
  UpdateLabResultDto,
  QueryLabRequestsDto,
} from '@/types';

export interface CreateMyLabRequestDto {
  visitId: number;
  notes?: string;
  items: {
    testId: number;
    notes?: string;
  }[];
}

export const labRequestsApi = {
  // جلب جميع طلبات التحاليل
  getAll: async (query?: QueryLabRequestsDto): Promise<LabRequest[]> => {
    const response = await apiClient.get<LabRequest[]>('/lab-requests', { params: query });
    return response.data;
  },

  // جلب طلبات التحاليل الخاصة بالطبيب
  getMyRequests: async (): Promise<LabRequest[]> => {
    const response = await apiClient.get<LabRequest[]>('/lab-requests/my-requests');
    return response.data;
  },

  // جلب طلب تحليل واحد
  getById: async (id: number): Promise<LabRequest> => {
    const response = await apiClient.get<LabRequest>(`/lab-requests/${id}`);
    return response.data;
  },

  // إضافة طلب تحليل جديد
  create: async (data: CreateLabRequestDto): Promise<LabRequest> => {
    const response = await apiClient.post<LabRequest>('/lab-requests', data);
    return response.data;
  },

  // إضافة طلب تحليل من الطبيب
  createMyRequest: async (data: CreateMyLabRequestDto): Promise<LabRequest> => {
    const response = await apiClient.post<LabRequest>('/lab-requests/my-request', data);
    return response.data;
  },

  // تعديل طلب تحليل
  update: async (id: number, data: UpdateLabRequestDto): Promise<LabRequest> => {
    const response = await apiClient.patch<LabRequest>(`/lab-requests/${id}`, data);
    return response.data;
  },

  // تحديث نتيجة تحليل
  updateResult: async (requestId: number, itemId: number, data: UpdateLabResultDto): Promise<any> => {
    const response = await apiClient.patch(`/lab-requests/${requestId}/items/${itemId}`, data);
    return response.data;
  },

  // حذف طلب تحليل
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/lab-requests/${id}`);
  },
};
