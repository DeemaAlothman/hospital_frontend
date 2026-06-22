'use client';

import { useState, useEffect } from 'react';
import { Plus, ScanLine, X } from 'lucide-react';
import {
  RadiologyRequest,
  CreateRadiologyRequestDto,
  Patient,
  Visit,
  RadiologyTest,
  Doctor as DoctorType,
} from '@/types';
import { radiologyRequestsApi } from '@/lib/api/radiology-requests';
import { radiologyTestsApi } from '@/lib/api/radiology-tests';
import { patientsApi } from '@/lib/api/patients';
import { doctorsApi } from '@/lib/api/doctors';
import { visitsApi } from '@/lib/api/visits';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

export default function DoctorRadiologyRequestsPage() {
  const { user } = useAuthStore();
  const [currentDoctorId, setCurrentDoctorId] = useState<number>(0);
  const [radiologyRequests, setRadiologyRequests] = useState<RadiologyRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateRadiologyRequestDto>({
    visitId: 0,
    patientId: 0,
    doctorId: 0,
    notes: '',
  });

  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [patientsData, doctorsData, radiologyTestsData] = await Promise.all([
        patientsApi.getAll().catch(() => []),
        doctorsApi.getAll().catch(() => []),
        radiologyTestsApi.getAll().catch(() => []),
      ]);

      setPatients(patientsData);
      setRadiologyTests(radiologyTestsData);

      // Find current doctor's ID
      if (user) {
        const currentDoctor = doctorsData.find((d) => d.userId === user.id);
        if (currentDoctor) {
          setCurrentDoctorId(currentDoctor.id);

          // Fetch doctor's visits using /doctors/my-visits endpoint
          try {
            const visitsData = await visitsApi.getMyVisits();
            setVisits(Array.isArray(visitsData) ? visitsData : []);
          } catch (error) {
            console.error('Error fetching visits:', error);
            setVisits([]);
          }

          // Fetch doctor's radiology requests using /radiology-requests/my-requests endpoint
          try {
            const radiologyRequestsData = await radiologyRequestsApi.getMyRequests();
            setRadiologyRequests(Array.isArray(radiologyRequestsData) ? radiologyRequestsData : []);
          } catch (error) {
            console.error('Error fetching radiology requests:', error);
            setRadiologyRequests([]);
          }
        }
      }
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRadiologyTest = (testId: number) => {
    setSelectedRadiologyTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRadiologyTests.length === 0) {
      toast.error('يجب اختيار فحص واحد على الأقل');
      return;
    }

    setIsSubmitting(true);

    try {
      // الخطوة 1: إنشاء الطلب (فارغ)
      const newRequest = await radiologyRequestsApi.createMyRequest({
        visitId: formData.visitId,
        notes: formData.notes,
      });

      console.log('✅ تم إنشاء الطلب:', newRequest);

      // الخطوة 2: إضافة الفحوصات المختارة
      const updatedRequest = await radiologyRequestsApi.addTests(newRequest.id, {
        testIds: selectedRadiologyTests,
      });

      console.log('✅ تم إضافة الفحوصات:', updatedRequest);

      toast.success('تم إرسال طلب الأشعة بنجاح مع الفحوصات');
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('❌ خطأ في إنشاء طلب الأشعة:', error);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.message || 'فشل إرسال طلب الأشعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      visitId: 0,
      patientId: 0,
      doctorId: currentDoctorId,
      notes: '',
    });
    setSelectedRadiologyTests([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  // Check if user is doctor
  if (user?.role !== 'DOCTOR') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة للأطباء فقط
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">طلبات الأشعة</h1>
        <p className="text-gray-600">عرض وإدارة طلبات الأشعة الخاصة بك</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">طلباتي</h2>
        <button
          onClick={() => {
            setFormData({
              visitId: 0,
              patientId: 0,
              doctorId: currentDoctorId,
              notes: '',
            });
            setSelectedRadiologyTests([]);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          طلب أشعة جديد
        </button>
      </div>

      {radiologyRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ScanLine size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">لا توجد طلبات أشعة</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الفحوصات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {radiologyRequests.map((request) => {
                const patient = patients.find((p) => p.id === request.patientId);
                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{request.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient?.fullName || `مريض #${request.patientId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.items?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {request.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Radiology Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">طلب أشعة جديد</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">الزيارة *</label>
                <select
                  required
                  value={formData.visitId || ''}
                  onChange={(e) => setFormData({ ...formData, visitId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">اختر الزيارة</option>
                  {visits&&visits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      زيارة #{visit.id} - {visit.patient?.fullName} - {new Date(visit.visitDate).toLocaleDateString('ar-SA')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">فحوصات الأشعة المطلوبة *</label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {radiologyTests.map((test) => (
                    <label key={test.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRadiologyTests.includes(test.id)}
                        onChange={() => handleToggleRadiologyTest(test.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="flex-1">{test.name}</span>
                      <span className="text-sm text-gray-600">{parseFloat(String(test.price)).toFixed(2)} ريال</span>
                    </label>
                  ))}
                </div>
                {selectedRadiologyTests.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    تم اختيار {selectedRadiologyTests.length} فحص
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ملاحظات</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
