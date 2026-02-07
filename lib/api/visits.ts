import { apiClient } from './client';
import { Visit, CreateVisitDto, UpdateVisitDto, QueryVisitsDto } from '@/types';

export interface CreateMyVisitDto {
  patientId: number;
  visitDate?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  notes?: string;
}

export const visitsApi = {
  // إنشاء زيارة جديدة
  create: async (data: CreateVisitDto): Promise<Visit> => {
    const response = await apiClient.post<Visit>('/visits', data);
    return response.data;
  },

  // إنشاء زيارة للطبيب الحالي (لا يحتاج doctorId)
  createMyVisit: async (data: CreateMyVisitDto): Promise<Visit> => {
    const response = await apiClient.post<Visit>('/visits/my-visit', data);
    return response.data;
  },

  // الحصول على جميع الزيارات مع فلترة
  getAll: async (query?: QueryVisitsDto): Promise<Visit[]> => {
    const response = await apiClient.get<Visit[]>('/visits', { params: query });
    return response.data;
  },

  // الحصول على زيارات الطبيب الحالي
  getMyVisits: async (): Promise<Visit[]> => {
    const response = await apiClient.get<Visit[]>('/doctors/my-visits');
    return response.data;
  },

  // الحصول على زيارة واحدة
  getOne: async (id: number): Promise<Visit> => {
    const response = await apiClient.get<Visit>(`/visits/${id}`);
    return response.data;
  },

  // تعديل بيانات زيارة
  update: async (id: number, data: UpdateVisitDto): Promise<Visit> => {
    const response = await apiClient.patch<Visit>(`/visits/${id}`, data);
    return response.data;
  },

  // حذف زيارة (ADMIN only)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/visits/${id}`);
  },
};
