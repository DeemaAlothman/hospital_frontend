import { apiClient } from './client';
import { Doctor, CreateDoctorDto, UpdateDoctorDto } from '@/types';

export interface UnassignedDoctor {
  id: number;
  fullName: string;
  email: string;
}

export const doctorsApi = {
  // جلب المستخدمين بدور DOCTOR الذين ليس لديهم ملف طبيب بعد
  getUnassigned: async (): Promise<UnassignedDoctor[]> => {
    const response = await apiClient.get<UnassignedDoctor[]>('/doctors/unassigned');
    return response.data;
  },
  // إنشاء طبيب جديد (ADMIN only)
  create: async (data: CreateDoctorDto): Promise<Doctor> => {
    const response = await apiClient.post<Doctor>('/doctors', data);
    return response.data;
  },

  // الحصول على جميع الأطباء
  getAll: async (): Promise<Doctor[]> => {
    const response = await apiClient.get<Doctor[]>('/doctors');
    return response.data;
  },

  // الحصول على طبيب واحد
  getOne: async (id: number): Promise<Doctor> => {
    const response = await apiClient.get<Doctor>(`/doctors/${id}`);
    return response.data;
  },

  // تعديل بيانات طبيب (ADMIN only)
  update: async (id: number, data: UpdateDoctorDto): Promise<Doctor> => {
    const response = await apiClient.patch<Doctor>(`/doctors/${id}`, data);
    return response.data;
  },

  // حذف طبيب (ADMIN only)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/doctors/${id}`);
  },
};
