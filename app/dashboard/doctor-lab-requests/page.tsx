'use client';

import { useState, useEffect } from 'react';
import { Plus, FlaskConical, X } from 'lucide-react';
import {
  LabRequest,
  CreateLabRequestDto,
  CreateLabRequestItemDto,
  Patient,
  Visit,
  LabTest,
  Doctor as DoctorType,
} from '@/types';
import { labRequestsApi } from '@/lib/api/lab-requests';
import { labTestsApi } from '@/lib/api/lab-tests';
import { patientsApi } from '@/lib/api/patients';
import { visitsApi } from '@/lib/api/visits';
import { doctorsApi } from '@/lib/api/doctors';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

export default function DoctorLabRequestsPage() {
  const { user } = useAuthStore();
  const [currentDoctorId, setCurrentDoctorId] = useState<number>(0);
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateLabRequestDto>({
    visitId: 0,
    patientId: 0,
    doctorId: 0,
    notes: '',
    items: [],
  });

  const [currentLabItem, setCurrentLabItem] = useState<CreateLabRequestItemDto>({
    testId: 0,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [patientsData, doctorsData, labTestsData] = await Promise.all([
        patientsApi.getAll().catch(() => []),
        doctorsApi.getAll().catch(() => []),
        labTestsApi.getAll().catch(() => []),
      ]);

      setPatients(patientsData);
      setLabTests(labTestsData);

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

          // Fetch doctor's lab requests using /lab-requests/my-requests endpoint
          try {
            const labRequestsData = await labRequestsApi.getMyRequests();
            setLabRequests(Array.isArray(labRequestsData) ? labRequestsData : []);
          } catch (error) {
            console.error('Error fetching lab requests:', error);
            setLabRequests([]);
          }
        }
      }
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabItem = () => {
    if (currentLabItem.testId === 0) {
      toast.error('يجب اختيار التحليل');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, currentLabItem],
    });
    setCurrentLabItem({ testId: 0, notes: '' });
  };

  const handleRemoveLabItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.items.length === 0) {
      toast.error('يجب إضافة تحليل واحد على الأقل');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use createMyRequest instead of create - doctorId is automatically set from token
      await labRequestsApi.createMyRequest({
        visitId: formData.visitId,
        notes: formData.notes,
        items: formData.items,
      });
      toast.success('تم إرسال طلب التحليل بنجاح');
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      toast.error('فشل إرسال طلب التحليل');
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
      items: [],
    });
    setCurrentLabItem({ testId: 0, notes: '' });
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
        <h1 className="text-3xl font-bold mb-2">طلبات التحاليل</h1>
        <p className="text-gray-600">عرض وإدارة طلبات التحاليل الخاصة بك</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">طلباتي</h2>
        <button
          onClick={() => {
            setFormData({
              visitId: 0,
              patientId: 0,
              doctorId: currentDoctorId,
              notes: '',
              items: [],
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          طلب تحليل جديد
        </button>
      </div>

      {labRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FlaskConical size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">لا توجد طلبات تحاليل</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد التحاليل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labRequests.map((request) => {
                const patient = patients.find((p) => p.id === request.patientId);
                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{request.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient?.fullName || `مريض #${request.patientId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{request.items?.length || 0}</td>
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

      {/* Lab Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">طلب تحليل جديد</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">الزيارة *</label>
                <select
                  required
                  value={formData.visitId || ''}
                  onChange={(e) => setFormData({ ...formData, visitId: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">اختر الزيارة</option>
                  {visits&&visits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      زيارة #{visit.id} - {visit.patient?.fullName} - {new Date(visit.visitDate).toLocaleDateString('ar-SA')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">إضافة تحليل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm mb-1">التحليل *</label>
                    <select
                      value={currentLabItem.testId || ''}
                      onChange={(e) => setCurrentLabItem({ ...currentLabItem, testId: parseInt(e.target.value) })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">اختر التحليل</option>
                      {labTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ملاحظات</label>
                    <input
                      type="text"
                      value={currentLabItem.notes}
                      onChange={(e) => setCurrentLabItem({ ...currentLabItem, notes: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="ملاحظات خاصة بالتحليل"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddLabItem}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                >
                  إضافة التحليل
                </button>

                {formData.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">التحاليل المضافة:</h4>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => {
                        const test = labTests.find((t) => t.id === item.testId);
                        return (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <div className="text-sm">
                              <strong>{test?.name}</strong>
                              {item.notes && ` - ${item.notes}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ملاحظات عامة</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
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
