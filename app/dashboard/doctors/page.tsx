'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { Doctor, CreateDoctorDto } from '@/types';
import { doctorsApi, UnassignedDoctor } from '@/lib/api/doctors';
import { toast } from 'react-toastify';
import { useConfirm } from '@/hooks/useConfirm';

export default function DoctorsPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UnassignedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateDoctorDto>({
    userId: 0,
    speciality: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [doctorsData, unassignedData] = await Promise.all([
        doctorsApi.getAll(),
        doctorsApi.getUnassigned(),
      ]);
      setDoctors(doctorsData);
      setAvailableUsers(unassignedData);
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = fetchData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await doctorsApi.create(formData);
      toast.success('تم إضافة الطبيب بنجاح');
      setShowModal(false);
      setFormData({ userId: 0, speciality: '' });
      fetchDoctors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا الطبيب؟ سيتم حذف جميع البيانات المرتبطة به.',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await doctorsApi.delete(id);
      toast.success('تم حذف الطبيب بنجاح');
      fetchDoctors();
    } catch (error: any) {
      toast.error('فشل حذف الطبيب');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ userId: 0, speciality: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأطباء</h1>
          <p className="text-gray-600 mt-2">
            عرض وإدارة جميع الأطباء في النظام
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          إضافة طبيب
        </button>
      </div>

      {/* Doctors Grid */}
      {doctors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <User className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا يوجد أطباء في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {doctor.user?.fullName}
                  </h3>
                  <p className="text-sm text-gray-600">{doctor.user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {doctor.speciality && (
                  <div>
                    <span className="text-sm text-gray-600">التخصص: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {doctor.speciality}
                    </span>
                  </div>
                )}
                {doctor.user?.phone && (
                  <div>
                    <span className="text-sm text-gray-600">الهاتف: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {doctor.user.phone}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                إضافة طبيب جديد
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المستخدم *
                </label>
                <select
                  required
                  value={formData.userId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, userId: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="">اختر المستخدم</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} — {u.email}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    لا يوجد مستخدمون بدور DOCTOR غير مسجلين كأطباء
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التخصص
                </label>
                <input
                  type="text"
                  value={formData.speciality}
                  onChange={(e) =>
                    setFormData({ ...formData, speciality: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="مثال: طب الأطفال، جراحة، باطنية"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة الطبيب'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmComponent />
    </div>
  );
}
