'use client';

import { useState, useEffect } from 'react';
import { Plus, FlaskConical, FileText, Edit2, Trash2, Eye, X, CheckCircle } from 'lucide-react';
import {
  LabTest,
  CreateLabTestDto,
  LabRequest,
  LabRequestStatus,
  UpdateLabResultDto,
  Patient,
  Visit,
  UserRole,
} from '@/types';
import { labTestsApi } from '@/lib/api/lab-tests';
import { labRequestsApi, CreateMyLabRequestDto } from '@/lib/api/lab-requests';
import { patientsApi } from '@/lib/api/patients';
import { visitsApi } from '@/lib/api/visits';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

type TabType = 'tests' | 'requests';

export default function LabPage() {
  const { user } = useAuthStore();
  const isDoctor = user?.role === UserRole.DOCTOR;
  const isAdmin = user?.role === UserRole.ADMIN;

  const [activeTab, setActiveTab] = useState<TabType>('requests');

  // Tests state
  const [tests, setTests] = useState<LabTest[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [testFormData, setTestFormData] = useState<CreateLabTestDto>({
    name: '',
    category: '',
    price: '0',
  });

  // Requests state
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LabRequest | null>(null);
  const [editingResult, setEditingResult] = useState<{ requestId: number; itemId: number } | null>(null);
  const [resultFormData, setResultFormData] = useState<UpdateLabResultDto>({
    resultValue: '',
    unit: '',
    referenceRange: '',
    resultAt: '',
    notes: '',
  });

  const [requestFormData, setRequestFormData] = useState<CreateMyLabRequestDto>({
    visitId: 0,
    notes: '',
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<{
    testId: number;
    notes?: string;
  }>({
    testId: 0,
    notes: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب الفحوصات والطلبات (متاح للجميع)
      const [testsData, requestsData] = await Promise.all([
        labTestsApi.getAll().catch((err) => {
          console.error('خطأ في جلب الفحوصات:', err);
          return [];
        }),
        labRequestsApi.getAll().catch((err) => {
          console.error('خطأ في جلب الطلبات:', err);
          return [];
        }),
      ]);

      setTests(testsData);
      setRequests(requestsData);

      // جلب المرضى فقط للأدمن والطبيب (موظف المختبر لا يحتاجهم)
      if (isAdmin || isDoctor) {
        try {
          const patientsData = await patientsApi.getAll();
          setPatients(patientsData);
        } catch (error) {
          console.log('لا توجد صلاحية لجلب المرضى');
        }
      }

      // جلب الزيارات للطبيب فقط
      if (isDoctor) {
        try {
          const visitsData = await visitsApi.getMyVisits();
          setVisits(visitsData);
        } catch (error) {
          console.log('فشل جلب الزيارات');
        }
      }
    } catch (error: any) {
      console.error('خطأ غير متوقع في fetchData:', error);
      // لا نعرض رسالة خطأ للمستخدم لأننا نتعامل مع الأخطاء بشكل منفصل
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
        await labTestsApi.update(editingTest.id, testFormData);
        toast.success('تم تحديث التحليل بنجاح');
      } else {
        await labTestsApi.create(testFormData);
        toast.success('تم إضافة التحليل بنجاح');
      }
      await fetchData(); // تحديث البيانات أولاً
      handleCloseTestModal(); // ثم إغلاق النافذة
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTest = (test: LabTest) => {
    setEditingTest(test);
    setTestFormData({
      name: test.name,
      category: test.category || '',
      price: test.price,
    });
    setShowTestModal(true);
  };

  const handleDeleteTest = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التحليل؟')) return;

    try {
      await labTestsApi.delete(id);
      toast.success('تم حذف التحليل بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف التحليل');
    }
  };

  const handleCloseTestModal = () => {
    setShowTestModal(false);
    setEditingTest(null);
    setTestFormData({
      name: '',
      category: '',
      price: '0',
    });
  };

  // Request handlers
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requestFormData.items.length === 0) {
      toast.error('يجب إضافة تحليل واحد على الأقل');
      return;
    }

    setIsSubmitting(true);

    try {
      await labRequestsApi.createMyRequest(requestFormData);
      toast.success('تم إضافة طلب التحليل بنجاح');
      handleCloseRequestModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    if (currentItem.testId === 0) {
      toast.error('يجب اختيار التحليل');
      return;
    }

    setRequestFormData({
      ...requestFormData,
      items: [...requestFormData.items, currentItem],
    });

    setCurrentItem({
      testId: 0,
      notes: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    setRequestFormData({
      ...requestFormData,
      items: requestFormData.items.filter((_, i) => i !== index),
    });
  };

  const handleViewRequest = async (id: number) => {
    try {
      const request = await labRequestsApi.getById(id);
      setViewingRequest(request);
    } catch (error) {
      toast.error('فشل تحميل تفاصيل الطلب');
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
      await labRequestsApi.delete(id);
      toast.success('تم حذف الطلب بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف الطلب');
    }
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestFormData({
      visitId: 0,
      notes: '',
      items: [],
    });
    setCurrentItem({
      testId: 0,
      notes: '',
    });
  };

  const handleEditResult = (requestId: number, itemId: number, item: any) => {
    setEditingResult({ requestId, itemId });
    setResultFormData({
      resultValue: item.resultValue || '',
      unit: item.unit || '',
      referenceRange: item.referenceRange || '',
      resultAt: item.resultAt ? item.resultAt.split('T')[0] : '',
      notes: item.notes || '',
    });
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult) return;

    setIsSubmitting(true);

    try {
      await labRequestsApi.updateResult(editingResult.requestId, editingResult.itemId, resultFormData);
      toast.success('تم تحديث النتيجة بنجاح');
      setEditingResult(null);
      if (viewingRequest) {
        const updated = await labRequestsApi.getById(viewingRequest.id);
        setViewingRequest(updated);
      }
      fetchData();
    } catch (error: any) {
      toast.error('فشل تحديث النتيجة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId: number, newStatus: LabRequestStatus) => {
    try {
      await labRequestsApi.update(requestId, { status: newStatus });
      toast.success('تم تحديث الحالة بنجاح');
      if (viewingRequest && viewingRequest.id === requestId) {
        const updated = await labRequestsApi.getById(requestId);
        setViewingRequest(updated);
      }
      fetchData();
    } catch (error: any) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const getStatusColor = (status: LabRequestStatus) => {
    switch (status) {
      case LabRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case LabRequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case LabRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case LabRequestStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: LabRequestStatus) => {
    switch (status) {
      case LabRequestStatus.PENDING:
        return 'قيد الانتظار';
      case LabRequestStatus.IN_PROGRESS:
        return 'قيد التنفيذ';
      case LabRequestStatus.COMPLETED:
        return 'مكتمل';
      case LabRequestStatus.CANCELLED:
        return 'ملغي';
      default:
        return status;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">المختبر</h1>
            <p className="text-gray-600 mt-2">إدارة التحاليل والطلبات المخبرية</p>
          </div>
          {activeTab === 'tests' && (
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              إضافة تحليل جديد
            </button>
          )}
          {activeTab === 'requests' && isDoctor && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              إضافة طلب جديد
            </button>
          )}
        </div>
        {activeTab === 'requests' && !isDoctor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 طلبات التحاليل تُنشأ تلقائياً من قبل الطبيب عند الكشف على المريض
            </p>
          </div>
        )}
      </div>

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
            طلبات التحاليل
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
            <FlaskConical size={20} />
            إدارة التحاليل
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
            <FlaskConical className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">لا توجد تحاليل في النظام</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-full bg-purple-100">
                    <FlaskConical className="text-purple-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                    {test.category && <p className="text-sm text-gray-600">{test.category}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-sm text-gray-600">السعر: </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {parseFloat(test.price).toFixed(2)} ريال
                  </span>
                </div>

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
              </div>
            ))}
          </div>
        )
      ) : (
        /* Requests Tab */
        requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">لا توجد طلبات تحاليل في النظام</p>
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
                      عدد التحاليل
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
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewRequest(request.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="عرض التفاصيل"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTest ? 'تعديل التحليل' : 'إضافة تحليل جديد'}
              </h2>
            </div>

            <form onSubmit={handleTestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم التحليل *
                </label>
                <input
                  type="text"
                  required
                  value={testFormData.name}
                  onChange={(e) => setTestFormData({ ...testFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أدخل اسم التحليل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                <input
                  type="text"
                  value={testFormData.category}
                  onChange={(e) => setTestFormData({ ...testFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="مثال: كيمياء، دم، بول..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر (ريال) *
                </label>
                <input
                  type="text"
                  required
                  value={testFormData.price}
                  onChange={(e) => setTestFormData({ ...testFormData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingTest ? 'حفظ التعديلات' : 'إضافة التحليل'}
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

      {/* Request Modal (Doctor Only) */}
      {showRequestModal && isDoctor && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إضافة طلب تحليل جديد</h2>
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
                  {visits.map((visit) => {
                    const patient = patients.find((p) => p.id === visit.patientId);
                    return (
                      <option key={visit.id} value={visit.id}>
                        زيارة #{visit.id} - {patient?.fullName || `مريض #${visit.patientId}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة تحليل</h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التحليل *</label>
                    <select
                      value={currentItem.testId || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, testId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">اختر التحليل</option>
                      {tests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} - {parseFloat(test.price).toFixed(2)} ريال
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                    <input
                      type="text"
                      value={currentItem.notes}
                      onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إضافة التحليل للطلب
                </button>
              </div>

              {requestFormData.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    التحاليل المضافة ({requestFormData.items.length})
                  </h3>
                  <div className="space-y-2">
                    {requestFormData.items.map((item, index) => {
                      const test = tests.find((t) => t.id === item.testId);
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{test?.name}</p>
                            {item.notes && <p className="text-sm text-gray-600">ملاحظات: {item.notes}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات عامة</label>
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-2xl font-bold text-gray-900">تفاصيل طلب التحليل #{viewingRequest.id}</h2>
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
                  <p className="text-base font-medium text-gray-900">
                    {viewingRequest.doctor?.user?.fullName}
                  </p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">التحاليل والنتائج</h3>
                <div className="space-y-4">
                  {viewingRequest.items?.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {index + 1}. {item.test?.name}
                          </p>
                          {item.notes && <p className="text-sm text-gray-600 mt-1">ملاحظات: {item.notes}</p>}
                        </div>
                        {viewingRequest.status !== LabRequestStatus.COMPLETED && (
                          <button
                            onClick={() => handleEditResult(viewingRequest.id, item.id, item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit2 size={16} />
                            إضافة نتيجة
                          </button>
                        )}
                      </div>

                      {item.resultValue ? (
                        <div className="bg-white p-3 rounded border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-green-600" size={16} />
                            <span className="text-sm font-medium text-green-600">تم إدخال النتيجة</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">النتيجة: </span>
                              <span className="font-medium text-gray-900">{item.resultValue} {item.unit}</span>
                            </div>
                            {item.referenceRange && (
                              <div>
                                <span className="text-gray-600">المدى الطبيعي: </span>
                                <span className="font-medium text-gray-900">{item.referenceRange}</span>
                              </div>
                            )}
                            {item.resultAt && (
                              <div className="col-span-2">
                                <span className="text-gray-600">تاريخ النتيجة: </span>
                                <span className="font-medium text-gray-900">
                                  {new Date(item.resultAt).toLocaleString('ar-SA')}
                                </span>
                              </div>
                            )}
                          </div>
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
                  <p className="text-sm text-gray-600 mb-1">ملاحظات عامة</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingRequest.notes}</p>
                </div>
              )}

              {/* تغيير حالة الطلب */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">تغيير حالة الطلب</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(viewingRequest.id, LabRequestStatus.PENDING)}
                    disabled={viewingRequest.status === LabRequestStatus.PENDING}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewingRequest.status === LabRequestStatus.PENDING
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    قيد الانتظار
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingRequest.id, LabRequestStatus.IN_PROGRESS)}
                    disabled={viewingRequest.status === LabRequestStatus.IN_PROGRESS}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewingRequest.status === LabRequestStatus.IN_PROGRESS
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    قيد التنفيذ
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingRequest.id, LabRequestStatus.COMPLETED)}
                    disabled={viewingRequest.status === LabRequestStatus.COMPLETED}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewingRequest.status === LabRequestStatus.COMPLETED
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    مكتمل
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingRequest.id, LabRequestStatus.CANCELLED)}
                    disabled={viewingRequest.status === LabRequestStatus.CANCELLED}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewingRequest.status === LabRequestStatus.CANCELLED
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    ملغي
                  </button>
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
              <h2 className="text-2xl font-bold text-gray-900">إدخال نتيجة التحليل</h2>
            </div>

            <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النتيجة *</label>
                <input
                  type="text"
                  required
                  value={resultFormData.resultValue}
                  onChange={(e) => setResultFormData({ ...resultFormData, resultValue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أدخل النتيجة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوحدة</label>
                <input
                  type="text"
                  value={resultFormData.unit}
                  onChange={(e) => setResultFormData({ ...resultFormData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="مثال: mg/dL, mmol/L"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المدى الطبيعي</label>
                <input
                  type="text"
                  value={resultFormData.referenceRange}
                  onChange={(e) => setResultFormData({ ...resultFormData, referenceRange: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="مثال: 70-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النتيجة</label>
                <input
                  type="date"
                  value={resultFormData.resultAt}
                  onChange={(e) => setResultFormData({ ...resultFormData, resultAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
