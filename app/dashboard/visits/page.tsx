'use client';

import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, Calendar } from 'lucide-react';
import { Visit, CreateVisitDto, Doctor, Patient } from '@/types';
import { visitsApi } from '@/lib/api/visits';
import { doctorsApi } from '@/lib/api/doctors';
import { patientsApi } from '@/lib/api/patients';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';
import { useConfirm } from '@/hooks/useConfirm';

export default function VisitsPage() {
  const { user } = useAuthStore();
  const { confirm, ConfirmComponent } = useConfirm();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingVisit, setViewingVisit] = useState<Visit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateVisitDto>({
    patientId: 0,
    doctorId: 0,
    visitDate: new Date().toISOString().slice(0, 16),
    diagnosis: '',
    chiefComplaint: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [visitsData, doctorsData, patientsData] = await Promise.all([
        visitsApi.getAll().catch(() => []),
        doctorsApi.getAll().catch(() => []),
        patientsApi.getAll().catch(() => []),
      ]);
      setVisits(visitsData);
      setDoctors(doctorsData);
      setPatients(patientsData);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await visitsApi.create(formData);
      toast.success('تم إضافة الزيارة بنجاح');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إضافة الزيارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذه الزيارة؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await visitsApi.delete(id);
      toast.success('تم حذف الزيارة بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل حذف الزيارة');
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const visit = await visitsApi.getOne(id);
      setViewingVisit(visit);
    } catch (error) {
      toast.error('فشل تحميل تفاصيل الزيارة');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: 0,
      doctorId: 0,
      visitDate: new Date().toISOString().slice(0, 16),
      diagnosis: '',
      chiefComplaint: '',
      notes: '',
    });
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الزيارات</h1>
          <p className="text-gray-600 mt-2">عرض وإدارة زيارات المرضى</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          إضافة زيارة
        </button>
      </div>

      {/* Visits List */}
      {visits.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا توجد زيارات في النظام</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الزيارة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المريض
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الطبيب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الزيارة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الشكوى الرئيسية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visits.map((visit) => {
                  const patient = patients.find(p => p.id === visit.patientId);
                  return (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{visit.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient?.fullName || `مريض #${visit.patientId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.doctor?.user?.fullName || `طبيب #${visit.doctorId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(visit.visitDate).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {visit.chiefComplaint || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(visit.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <Eye size={18} />
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(visit.id)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Visit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إضافة زيارة جديدة</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المريض *
                  </label>
                  <select
                    required
                    value={formData.patientId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        patientId: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value="">اختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطبيب *
                  </label>
                  <select
                    required
                    value={formData.doctorId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        doctorId: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value="">اختر طبيباً</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user.fullName} - {doctor.speciality || 'عام'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ ووقت الزيارة
                </label>
                <input
                  type="datetime-local"
                  value={formData.visitDate}
                  onChange={(e) =>
                    setFormData({ ...formData, visitDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الشكوى الرئيسية
                </label>
                <textarea
                  value={formData.chiefComplaint}
                  onChange={(e) =>
                    setFormData({ ...formData, chiefComplaint: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="سبب الزيارة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التشخيص
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="التشخيص الطبي..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الإضافة...' : 'إضافة الزيارة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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

      {/* View Visit Details Modal */}
      {viewingVisit && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                تفاصيل الزيارة #{viewingVisit.id}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">المريض</p>
                  <p className="text-base font-medium text-gray-900">
                    {patients.find(p => p.id === viewingVisit.patientId)?.fullName || `مريض #${viewingVisit.patientId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الطبيب</p>
                  <p className="text-base font-medium text-gray-900">
                    {viewingVisit.doctor?.user?.fullName || `طبيب #${viewingVisit.doctorId}`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">تاريخ الزيارة</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(viewingVisit.visitDate).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              {viewingVisit.chiefComplaint && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">الشكوى الرئيسية</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {viewingVisit.chiefComplaint}
                  </p>
                </div>
              )}

              {viewingVisit.diagnosis && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">التشخيص</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {viewingVisit.diagnosis}
                  </p>
                </div>
              )}

              {viewingVisit.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">ملاحظات</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {viewingVisit.notes}
                  </p>
                </div>
              )}

              <button
                onClick={() => setViewingVisit(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors mt-6"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmComponent />
    </div>
  );
}
