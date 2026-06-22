'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { radiologyRequestsApi } from '@/lib/api/radiology-requests';
import { radiologyTestsApi } from '@/lib/api/radiology-tests';
import { invoicesApi } from '@/lib/api/invoices';
import {
  RadiologyRequest,
  RadiologyRequestStatus,
  RadiologyRequestItem,
  RadiologyTest,
  CreateRadiologyTestDto,
  Invoice,
  InvoiceStatus,
} from '@/types';
import { toast } from 'react-toastify';
import { ScanLine, Search, AlertCircle, CheckCircle, Clock, ImageIcon, FileText, Plus, Edit2, Trash2, Receipt } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';

type TabType = 'requests' | 'tests' | 'invoices';

export default function RadiologyTechPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('requests');

  // Requests state
  const [requests, setRequests] = useState<RadiologyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RadiologyRequestStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RadiologyRequest | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState<{
    itemId: number;
    imageUrl: string;
    report: string;
    notes: string;
  }>({
    itemId: 0,
    imageUrl: '',
    report: '',
    notes: '',
  });

  // Tests state
  const [tests, setTests] = useState<RadiologyTest[]>([]);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<RadiologyTest | null>(null);
  const [testFormData, setTestFormData] = useState<CreateRadiologyTestDto>({
    name: '',
    category: '',
    price: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is radiology technician
  if (user?.role !== 'RADIOLOGY_TECH') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة لفنيي الأشعة فقط
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsData, testsData, invoicesData] = await Promise.all([
        radiologyRequestsApi.getAll().catch(() => []),
        radiologyTestsApi.getAll().catch(() => []),
        invoicesApi.getAll().catch(() => []),
      ]);
      setRequests(requestsData);
      setTests(testsData);
      setInvoices(invoicesData);
    } catch (error: any) {
      console.error('خطأ في جلب البيانات:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await radiologyRequestsApi.getAll();
      setRequests(data);
    } catch (error: any) {
      console.error('خطأ في جلب الطلبات:', error);
      toast.error('فشل تحميل طلبات الأشعة');
    }
  };


  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await radiologyRequestsApi.submitResults(selectedRequest.id, {
        results: [{
          itemId: resultForm.itemId,
          imageUrl: resultForm.imageUrl || undefined,
          report: resultForm.report || undefined,
          notes: resultForm.notes || undefined,
        }],
      });
      toast.success('تم حفظ النتيجة بنجاح - سيتم تحديث الحالة تلقائياً');

      // Refresh the request details and requests list
      await fetchRequests();
      const updated = await radiologyRequestsApi.getById(selectedRequest.id);
      setSelectedRequest(updated);

      setShowResultModal(false);
      resetResultForm();
    } catch (error: any) {
      console.error('خطأ في حفظ النتيجة:', error);
      toast.error('فشل حفظ النتيجة');
    }
  };

  const openResultModal = (request: RadiologyRequest, item: RadiologyRequestItem) => {
    setSelectedRequest(request);
    setResultForm({
      itemId: item.id,
      imageUrl: item.imageUrl || '',
      report: item.report || '',
      notes: item.notes || '',
    });
    setShowResultModal(true);
  };

  const resetResultForm = () => {
    setResultForm({
      itemId: 0,
      imageUrl: '',
      report: '',
      notes: '',
    });
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
      await fetchData(); // تحديث البيانات أولاً
      handleCloseTestModal(); // ثم إغلاق النافذة
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
    const confirmed = await confirm({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من حذف هذا الفحص؟', confirmText: 'حذف', type: 'danger' });
    if (!confirmed) return;

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

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RadiologyRequestStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels = {
      PENDING: 'قيد الانتظار',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStatusIcon = (status: RadiologyRequestStatus) => {
    switch (status) {
      case RadiologyRequestStatus.PENDING:
        return <Clock className="text-yellow-600" size={18} />;
      case RadiologyRequestStatus.IN_PROGRESS:
        return <AlertCircle className="text-blue-600" size={18} />;
      case RadiologyRequestStatus.COMPLETED:
        return <CheckCircle className="text-green-600" size={18} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ScanLine className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">لوحة الأشعة</h1>
          </div>
          <p className="text-gray-600">معالجة طلبات الأشعة ورفع النتائج</p>
        </div>
        {activeTab === 'tests' && (
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            إضافة فحص جديد
          </button>
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
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt size={20} />
            الفواتير
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'requests' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="البحث برقم الطلب أو اسم المريض..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RadiologyRequestStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">جميع الحالات</option>
                <option value={RadiologyRequestStatus.PENDING}>قيد الانتظار</option>
                <option value={RadiologyRequestStatus.IN_PROGRESS}>قيد التنفيذ</option>
                <option value={RadiologyRequestStatus.COMPLETED}>مكتمل</option>
              </select>
            </div>
          </div>

          {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requests Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            طلبات الأشعة ({filteredRequests.length})
          </h2>

          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <ScanLine className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">لا توجد طلبات</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={async () => {
                  try {
                    const fullRequest = await radiologyRequestsApi.getById(request.id);
                    setSelectedRequest(fullRequest);
                  } catch (error) {
                    toast.error('فشل تحميل تفاصيل الطلب');
                  }
                }}
                className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="font-semibold text-gray-900">طلب #{request.id}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المريض:</span>
                    <span className="font-medium">{request.patient?.fullName || `مريض #${request.patientId}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الطبيب:</span>
                    <span className="font-medium">{request.doctor?.user?.fullName || `طبيب #${request.doctorId}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium">{new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">عدد الفحوصات:</span>
                    <span className="font-medium">{request.items.length}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Request Details */}
        <div className="lg:sticky lg:top-6">
          {selectedRequest ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  تفاصيل الطلب #{selectedRequest.id}
                </h2>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Patient Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">معلومات المريض</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الاسم:</span>
                    <span className="font-medium">{selectedRequest.patient?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الطبيب المعالج:</span>
                    <span className="font-medium">{selectedRequest.doctor?.user?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">تاريخ الطلب:</span>
                    <span className="font-medium">
                      {new Date(selectedRequest.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>حسابه
              </div>

              {/* Info message */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 الحالة تتحدث تلقائياً: عند إدخال أول نتيجة تصبح "قيد التنفيذ"، وعند إكمال جميع النتائج تصبح "مكتملة"
                </p>
              </div>

              {/* Radiology Tests */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">الفحوصات المطلوبة</h3>
                {selectedRequest.items && selectedRequest.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRequest.items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.test?.name}</h4>
                          {item.test?.category && (
                            <p className="text-sm text-gray-500">{item.test.category}</p>
                          )}
                        </div>
                        {item.imageUrl || item.report ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <Clock className="text-gray-400" size={20} />
                        )}
                      </div>

                      {(item.imageUrl || item.report) && (
                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                          {item.imageUrl && (
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <ImageIcon size={16} className="text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">رابط الصورة:</span>
                              </div>
                              <a
                                href={item.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline break-all"
                              >
                                {item.imageUrl}
                              </a>
                            </div>
                          )}
                          {item.report && (
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText size={16} className="text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">التقرير:</span>
                              </div>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.report}</p>
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>ملاحظات:</strong> {item.notes}
                            </p>
                          )}
                          {item.resultAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              تاريخ النتيجة: {new Date(item.resultAt).toLocaleString('ar-EG')}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => openResultModal(selectedRequest, item)}
                        disabled={selectedRequest.status === RadiologyRequestStatus.COMPLETED || selectedRequest.status === RadiologyRequestStatus.CANCELLED}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {item.imageUrl || item.report ? 'تعديل النتيجة' : 'رفع النتيجة'}
                      </button>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد فحوصات لهذا الطلب
                  </div>
                )}
              </div>

              {selectedRequest.notes && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">ملاحظات الطبيب</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <ScanLine className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">اختر طلب لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>
        </>
      ) : activeTab === 'invoices' ? (
        <div>
          <h2 className="text-2xl font-bold mb-6">فواتير الأشعة</h2>
          {invoices.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Receipt size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد فواتير</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي قسمك</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.patient?.fullName || `مريض #${invoice.patientId}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(invoice.departmentTotal ?? parseFloat(invoice.finalAmount)).toFixed(2)} ر.س
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === InvoiceStatus.PAID
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === InvoiceStatus.PENDING
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status === InvoiceStatus.PAID ? 'مدفوعة' : invoice.status === InvoiceStatus.PENDING ? 'معلقة' : 'ملغاة'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
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
      )}

      {/* Test Modal */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أدخل اسم الفحص"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                <input
                  type="text"
                  value={testFormData.category}
                  onChange={(e) => setTestFormData({ ...testFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
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

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                رفع نتيجة الفحص
              </h3>
            </div>

            <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط الصورة (URL)
                </label>
                <input
                  type="url"
                  value={resultForm.imageUrl}
                  onChange={(e) => setResultForm({ ...resultForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  أدخل رابط الصورة (يمكنك استخدام خدمة رفع صور مثل Imgur أو CloudStorage)
                </p>
              </div>

              {/* Report */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التقرير الطبي
                </label>
                <textarea
                  value={resultForm.report}
                  onChange={(e) => setResultForm({ ...resultForm, report: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب التقرير الطبي هنا..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={resultForm.notes}
                  onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>ملاحظة:</strong> يجب إدخال رابط الصورة أو التقرير الطبي على الأقل
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!resultForm.imageUrl && !resultForm.report}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  حفظ النتيجة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResultModal(false);
                    resetResultForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors"
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
