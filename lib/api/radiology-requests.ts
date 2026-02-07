import { apiClient } from './client';
import {
  RadiologyRequest,
  CreateRadiologyRequestDto,
  SubmitRadiologyResultDto,
  QueryRadiologyRequestsDto,
  UpdateRadiologyRequestDto,
} from '@/types';

export interface CreateMyRadiologyRequestDto {
  visitId: number;
  notes?: string;
}

export interface AddRadiologyTestsDto {
  testIds: number[];
}

export const radiologyRequestsApi = {
  // جلب جميع طلبات الأشعة
  getAll: async (query?: QueryRadiologyRequestsDto): Promise<RadiologyRequest[]> => {
    const response = await apiClient.get<RadiologyRequest[]>('/radiology-requests', { params: query });
    return response.data;
  },

  // جلب طلبات الأشعة الخاصة بالطبيب
  getMyRequests: async (): Promise<RadiologyRequest[]> => {
    const response = await apiClient.get<RadiologyRequest[]>('/radiology-requests/my-requests');
    return response.data;
  },

  // جلب طلب أشعة واحد
  getById: async (id: number): Promise<RadiologyRequest> => {
    const response = await apiClient.get<RadiologyRequest>(`/radiology-requests/${id}`);
    return response.data;
  },

  // إضافة طلب أشعة جديد
  create: async (data: CreateRadiologyRequestDto): Promise<RadiologyRequest> => {
    const response = await apiClient.post<RadiologyRequest>('/radiology-requests', data);
    return response.data;
  },

  // إضافة طلب أشعة من الطبيب
  createMyRequest: async (data: CreateMyRadiologyRequestDto): Promise<RadiologyRequest> => {
    const response = await apiClient.post<RadiologyRequest>('/radiology-requests/my-request', data);
    return response.data;
  },

  // تعديل طلب أشعة
  update: async (id: number, data: UpdateRadiologyRequestDto): Promise<RadiologyRequest> => {
    const response = await apiClient.patch<RadiologyRequest>(`/radiology-requests/${id}`, data);
    return response.data;
  },

  // إضافة فحوصات لطلب موجود
  addTests: async (id: number, data: AddRadiologyTestsDto): Promise<RadiologyRequest> => {
    const response = await apiClient.post<RadiologyRequest>(`/radiology-requests/${id}/items`, data);
    return response.data;
  },

  // تقديم نتائج الفحوصات
  submitResults: async (id: number, data: SubmitRadiologyResultDto): Promise<RadiologyRequest> => {
    const response = await apiClient.post<RadiologyRequest>(`/radiology-requests/${id}/results`, data);
    return response.data;
  },
};
