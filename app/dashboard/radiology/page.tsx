'use client';

import { useState, useEffect } from 'react';
import { Plus, ScanLine, FileText, Edit2, Trash2, Eye, X, Image as ImageIcon } from 'lucide-react';
import {
  RadiologyTest,
  CreateRadiologyTestDto,
  RadiologyRequest,
  CreateRadiologyRequestDto,
  RadiologyRequestStatus,
  Patient,
  Doctor,
  Visit,
  UserRole,
} from '@/types';
import { radiologyTestsApi } from '@/lib/api/radiology-tests';
import { radiologyRequestsApi, CreateMyRadiologyRequestDto } from '@/lib/api/radiology-requests';
import { patientsApi } from '@/lib/api/patients';
import { doctorsApi } from '@/lib/api/doctors';
import { visitsApi } from '@/lib/api/visits';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

type TabType = 'tests' | 'requests';

export default function RadiologyPage() {
  const { user } = useAuthStore();
  const isDoctor = user?.role === UserRole.DOCTOR;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRadiologyStaff = user?.role === UserRole.RADIOLOGY_TECH;

  const [activeTab, setActiveTab] = useState<TabType>('requests');

  // Tests state
  const [tests, setTests] = useState<RadiologyTest[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<RadiologyTest | null>(null);
  const [testFormData, setTestFormData] = useState<CreateRadiologyTestDto>({
    name: '',
    category: '',
    price: 0,
  });

  // Requests state
  const [requests, setRequests] = useState<RadiologyRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<RadiologyRequest | null>(null);
  const [editingResult, setEditingResult] = useState<{ requestId: number; itemId: number } | null>(null);
  const [resultFormData, setResultFormData] = useState<{
    imageUrl: string;
    report: string;
    notes: string;
  }>({
    imageUrl: '',
    report: '',
    notes: '',
  });

  const [requestFormData, setRequestFormData] = useState<CreateMyRadiologyRequestDto>({
    visitId: 0,
    notes: '',
  });

  const [selectedTests, setSelectedTests] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tests and requests (available to all roles)
      const [testsData, requestsData] = await Promise.all([
        radiologyTestsApi.getAll().catch(() => []),
        radiologyRequestsApi.getAll().catch(() => []),
      ]);

      setTests(testsData);
      setRequests(requestsData);

      // Fetch patients only if user has permission (admin, doctor)
      if (isAdmin || isDoctor) {
        try {
          const patientsData = await patientsApi.getAll();
          setPatients(patientsData);
        } catch (error) {
          setPatients([]);
        }
      }

      // Fetch doctor's visits if doctor
      if (isDoctor) {
        try {
          const visitsData = await visitsApi.getMyVisits();
          setVisits(visitsData);
        } catch (error) {
          setVisits([]);
        }
      }

      // Fetch doctors list for display purposes (if allowed)
      if (isAdmin || isDoctor) {
        try {
          const doctorsData = await doctorsApi.getAll();
          setDoctors(doctorsData);
        } catch (error) {
          setDoctors([]);
        }
      }
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Test handlers
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTest) {
        await radiologyTestsApi.update(editingTest.id, testFormData);
        toast.success('تم تحديث الفحص بنجاح');
      } else {
        await radiologyTestsApi.create(testFormData);
        toast.success('تم إضافة الفحص بنجاح');
      }
      handleCloseTestModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTest = (test: RadiologyTest) => {
    setEditingTest(test);
    setTestFormData({
      name: test.name,
      category: test.category || '',
      price: test.price,
    });
    setShowTestModal(true);
  };

  const handleDeleteTest = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفحص؟')) return;

    try {
      await radiologyTestsApi.delete(id);
      toast.success('تم حذف الفحص بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف الفحص');
    }
  };

  const handleCloseTestModal = () => {
    setShowTestModal(false);
    setEditingTest(null);
    setTestFormData({
      name: '',
      category: '',
      price: 0,
    });
  };

  // Request handlers
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTests.length === 0) {
      toast.error('يجب إضافة فحص واحد على الأقل');
      return;
    }

    setIsSubmitting(true);

    try {
      // الخطوة 1: إنشاء الطلب (فارغ)
      const newRequest = await radiologyRequestsApi.createMyRequest(requestFormData);

      // الخطوة 2: إضافة الفحوصات للطلب
      await radiologyRequestsApi.addTests(newRequest.id, { testIds: selectedTests });

      toast.success('تم إضافة طلب الأشعة بنجاح مع الفحوصات');
      handleCloseRequestModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleAddTest = (testId: number) => {
    if (testId === 0) {
      toast.error('يجب اختيار الفحص');
      return;
    }

    // Check if already added
    if (selectedTests.includes(testId)) {
      toast.error('هذا الفحص مضاف بالفعل');
      return;
    }

    setSelectedTests([...selectedTests, testId]);
  };

  const handleRemoveTest = (testId: number) => {
    setSelectedTests(selectedTests.filter(id => id !== testId));
  };

  const handleViewRequest = async (id: number) => {
    try {
      const request = await radiologyRequestsApi.getById(id);
      setViewingRequest(request);
    } catch (error) {
      toast.error('فشل تحميل تفاصيل الطلب');
    }
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestFormData({
      visitId: 0,
      notes: '',
    });
    setSelectedTests([]);
  };

  const handleEditResult = (requestId: number, itemId: number, item: any) => {
    setEditingResult({ requestId, itemId });
    setResultFormData({
      imageUrl: item.imageUrl || '',
      report: item.report || '',
      notes: item.notes || '',
    });
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult) return;

    setIsSubmitting(true);

    try {
      await radiologyRequestsApi.submitResults(editingResult.requestId, {
        results: [{
          itemId: editingResult.itemId,
          ...resultFormData,
        }],
      });
      toast.success('تم تحديث النتيجة بنجاح');
      setEditingResult(null);
      if (viewingRequest) {
        const updated = await radiologyRequestsApi.getById(viewingRequest.id);
        setViewingRequest(updated);
      }
      fetchData();
    } catch (error: any) {
      toast.error('فشل تحديث النتيجة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId: number, newStatus: RadiologyRequestStatus) => {
    try {
      await radiologyRequestsApi.update(requestId, { status: newStatus });
      toast.success('تم تحديث الحالة بنجاح');
      if (viewingRequest && viewingRequest.id === requestId) {
        const updated = await radiologyRequestsApi.getById(requestId);
        setViewingRequest(updated);
      }
      fetchData();
    } catch (error: any) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const getStatusColor = (status: RadiologyRequestStatus) => {
    switch (status) {
      case RadiologyRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case RadiologyRequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case RadiologyRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case RadiologyRequestStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: RadiologyRequestStatus) => {
    switch (status) {
      case RadiologyRequestStatus.PENDING:
        return 'قيد الانتظار';
      case RadiologyRequestStatus.IN_PROGRESS:
        return 'قيد التنفيذ';
      case RadiologyRequestStatus.COMPLETED:
        return 'مكتمل';
      case RadiologyRequestStatus.CANCELLED:
        return 'ملغي';
      default:
        return status;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">قسم الأشعة</h1>
          <p className="text-gray-600 mt-2">إدارة فحوصات الأشعة والطلبات</p>
        </div>
        {activeTab === 'tests' ? (
          (isAdmin || isRadiologyStaff) && (
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              إضافة فحص جديد
            </button>
          )
        ) : (
          isDoctor && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              إضافة طلب جديد
            </button>
          )
        )}
      </div>

      {/* Info messages */}
      {activeTab === 'requests' && !isDoctor && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            💡 طلبات الأشعة تُنشأ تلقائياً من قبل الطبيب عند الكشف على المريض
          </p>
        </div>
      )}
      {activeTab === 'tests' && isRadiologyStaff && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            💡 الفحوصات يتم إضافتها من قبل الإدارة فقط. يمكنك عرض الفحوصات المتاحة وإدخال النتائج للطلبات
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={20} />
            طلبات الأشعة
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'tests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ScanLine size={20} />
            إدارة الفحوصات
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'tests' ? (
        /* Tests Tab */
        tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ScanLine className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">لا توجد فحوصات في النظام</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <ScanLine className="text-indigo-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                    {test.category && <p className="text-sm text-gray-600">{test.category}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-sm text-gray-600">السعر: </span>
                  <span className="text-lg font-semibold text-gray-900">{parseFloat(String(test.price)).toFixed(2)} ريال</span>
                </div>

                {isAdmin && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditTest(test)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 size={16} />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Requests Tab */
        requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">لا توجد طلبات أشعة في النظام</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المريض
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطبيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عدد الفحوصات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => {
                    const patient = patients.find((p) => p.id === request.patientId);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{request.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient?.fullName || request.patient?.fullName || `مريض #${request.patientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.doctor?.user?.fullName || `طبيب #${request.doctorId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewRequest(request.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Test Modal - Similar structure to Lab */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTest ? 'تعديل الفحص' : 'إضافة فحص جديد'}
              </h2>
            </div>

            <form onSubmit={handleTestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفحص *</label>
                <input
                  type="text"
                  required
                  value={testFormData.name}
                  onChange={(e) => setTestFormData({ ...testFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أدخل اسم الفحص"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                <input
                  type="text"
                  value={testFormData.category}
                  onChange={(e) => setTestFormData({ ...testFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="مثال: أشعة مقطعية، رنين مغناطيسي..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر (ريال) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={testFormData.price}
                  onChange={(e) => setTestFormData({ ...testFormData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingTest ? 'حفظ التعديلات' : 'إضافة الفحص'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseTestModal}
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

      {/* Request Modal */}
      {showRequestModal && isDoctor && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إضافة طلب أشعة جديد</h2>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الزيارة *</label>
                <select
                  required
                  value={requestFormData.visitId || ''}
                  onChange={(e) => setRequestFormData({ ...requestFormData, visitId: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">اختر الزيارة</option>
                  {visits && visits.map((visit) => {
                    const patient = patients.find((p) => p.id === visit.patientId);
                    return (
                      <option key={visit.id} value={visit.id}>
                        زيارة #{visit.id} - {patient?.fullName} - {new Date(visit.visitDate).toLocaleDateString('ar-SA')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">اختر الفحوصات المطلوبة *</label>

                {/* Test Selection */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={0}
                    onChange={(e) => handleAddTest(parseInt(e.target.value))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value={0}>اختر فحص لإضافته</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.name} - {parseFloat(String(test.price)).toFixed(2)} ريال
                      </option>
                    ))}
                  </select>
                </div>

                {/* Added Tests */}
                {selectedTests.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-sm font-medium text-gray-700">الفحوصات المضافة ({selectedTests.length}):</p>
                    {selectedTests.map((testId) => {
                      const test = tests.find((t) => t.id === testId);
                      return (
                        <div key={testId} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                          <span className="flex-1 text-sm">
                            {test?.name} - {parseFloat(String(test?.price || 0)).toFixed(2)} ريال
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(testId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={requestFormData.notes}
                  onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة الطلب'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseRequestModal}
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

      {/* View Request Modal with Results */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">تفاصيل طلب الأشعة #{viewingRequest.id}</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">المريض</p>
                  <p className="text-base font-medium text-gray-900">
                    {viewingRequest.patient?.fullName || patients.find((p) => p.id === viewingRequest.patientId)?.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الطبيب</p>
                  <p className="text-base font-medium text-gray-900">{viewingRequest.doctor?.user?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">التاريخ</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(viewingRequest.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewingRequest.status)}`}>
                    {getStatusLabel(viewingRequest.status)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">الفحوصات والنتائج</h3>
                <div className="space-y-4">
                  {viewingRequest.items?.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {index + 1}. {item.test?.name}
                          </p>
                        </div>
                        {viewingRequest.status !== RadiologyRequestStatus.COMPLETED && (
                          <button
                            onClick={() => handleEditResult(viewingRequest.id, item.id, item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <ImageIcon size={16} />
                            إضافة نتيجة
                          </button>
                        )}
                      </div>

                      {item.report || item.imageUrl ? (
                        <div className="bg-white p-3 rounded border border-green-200 space-y-2">
                          {item.imageUrl && (
                            <div>
                              <span className="text-sm text-gray-600">رابط الصورة: </span>
                              <a
                                href={item.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                عرض الصورة
                              </a>
                            </div>
                          )}
                          {item.report && (
                            <div>
                              <span className="text-sm text-gray-600">التقرير: </span>
                              <p className="text-sm text-gray-900 mt-1">{item.report}</p>
                            </div>
                          )}
                          {item.resultAt && (
                            <div>
                              <span className="text-sm text-gray-600">تاريخ النتيجة: </span>
                              <span className="text-sm text-gray-900">
                                {new Date(item.resultAt).toLocaleString('ar-SA')}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">لم يتم إدخال النتيجة بعد</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingRequest.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">ملاحظات</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingRequest.notes}</p>
                </div>
              )}

              {/* رسالة توضيحية عن تحديث الحالة التلقائي */}
              <div className="border-t pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    💡 الحالة تتحدث تلقائياً: عند إدخال أول نتيجة تصبح "قيد التنفيذ"، وعند إكمال جميع النتائج تصبح "مكتملة"
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingRequest(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {editingResult && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إدخال نتيجة الفحص</h2>
            </div>

            <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط الصورة</label>
                <input
                  type="url"
                  value={resultFormData.imageUrl}
                  onChange={(e) => setResultFormData({ ...resultFormData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التقرير *</label>
                <textarea
                  required
                  value={resultFormData.report}
                  onChange={(e) => setResultFormData({ ...resultFormData, report: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أدخل تقرير الفحص..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={resultFormData.notes}
                  onChange={(e) => setResultFormData({ ...resultFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ النتيجة'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
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
    </div>
  );
}
