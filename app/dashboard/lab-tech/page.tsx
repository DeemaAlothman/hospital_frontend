'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { labRequestsApi } from '@/lib/api/lab-requests';
import {
  LabRequest,
  LabRequestStatus,
  UpdateLabResultDto,
} from '@/types';
import { toast } from 'react-toastify';
import { FlaskConical, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function LabTechPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LabRequestStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [resultForm, setResultForm] = useState<UpdateLabResultDto>({
    resultValue: '',
    unit: '',
    referenceRange: '',
    resultAt: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  // Check if user is lab technician
  if (user?.role !== 'LAB_TECH') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة لفنيي المختبر فقط
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await labRequestsApi.getAll();
      setRequests(data);
    } catch (error: any) {
      console.error('خطأ في جلب الطلبات:', error);
      toast.error('فشل تحميل طلبات التحاليل');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: number, status: LabRequestStatus) => {
    try {
      await labRequestsApi.update(requestId, { status });
      toast.success('تم تحديث حالة الطلب بنجاح');
      await fetchRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await labRequestsApi.getById(requestId);
        setSelectedRequest(updated);
      }
    } catch (error: any) {
      console.error('خطأ في تحديث الحالة:', error);
      toast.error('فشل تحديث حالة الطلب');
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedItem) return;

    try {
      await labRequestsApi.updateResult(selectedRequest.id, selectedItem.id, resultForm);
      toast.success('تم حفظ النتيجة بنجاح');

      // Refresh the request details
      const updated = await labRequestsApi.getById(selectedRequest.id);
      setSelectedRequest(updated);

      // Check if all items have results, then auto-update status to COMPLETED
      const allCompleted = updated.items.every(item => item.resultValue);
      if (allCompleted && updated.status !== LabRequestStatus.COMPLETED) {
        await updateRequestStatus(updated.id, LabRequestStatus.COMPLETED);
      }

      setShowResultModal(false);
      resetResultForm();
    } catch (error: any) {
      console.error('خطأ في حفظ النتيجة:', error);
      toast.error('فشل حفظ النتيجة');
    }
  };

  const openResultModal = (request: LabRequest, item: any) => {
    setSelectedRequest(request);
    setSelectedItem(item);
    setResultForm({
      resultValue: item.resultValue || '',
      unit: item.unit || '',
      referenceRange: item.referenceRange || '',
      resultAt: item.resultAt ? new Date(item.resultAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      notes: item.notes || '',
    });
    setShowResultModal(true);
  };

  const resetResultForm = () => {
    setSelectedItem(null);
    setResultForm({
      resultValue: '',
      unit: '',
      referenceRange: '',
      resultAt: new Date().toISOString().slice(0, 16),
      notes: '',
    });
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: LabRequestStatus) => {
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

  const getStatusIcon = (status: LabRequestStatus) => {
    switch (status) {
      case LabRequestStatus.PENDING:
        return <Clock className="text-yellow-600" size={18} />;
      case LabRequestStatus.IN_PROGRESS:
        return <AlertCircle className="text-blue-600" size={18} />;
      case LabRequestStatus.COMPLETED:
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">لوحة المختبر</h1>
        </div>
        <p className="text-gray-600">معالجة طلبات التحاليل وإدخال النتائج</p>
      </div>

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
            onChange={(e) => setStatusFilter(e.target.value as LabRequestStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">جميع الحالات</option>
            <option value={LabRequestStatus.PENDING}>قيد الانتظار</option>
            <option value={LabRequestStatus.IN_PROGRESS}>قيد التنفيذ</option>
            <option value={LabRequestStatus.COMPLETED}>مكتمل</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            طلبات التحاليل ({filteredRequests.length})
          </h2>

          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FlaskConical className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">لا توجد طلبات</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
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
                    <span className="text-gray-600">عدد التحاليل:</span>
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
                </div>
              </div>

              {/* Status Actions */}
              {selectedRequest.status !== LabRequestStatus.COMPLETED && selectedRequest.status !== LabRequestStatus.CANCELLED && (
                <div className="mb-6 flex gap-3">
                  {selectedRequest.status === LabRequestStatus.PENDING && (
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, LabRequestStatus.IN_PROGRESS)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      بدء العمل
                    </button>
                  )}
                  {selectedRequest.status === LabRequestStatus.IN_PROGRESS && (
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, LabRequestStatus.COMPLETED)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      وضع علامة مكتمل
                    </button>
                  )}
                </div>
              )}

              {/* Lab Tests */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">التحاليل المطلوبة</h3>
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
                        {item.resultValue ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <Clock className="text-gray-400" size={20} />
                        )}
                      </div>

                      {item.resultValue ? (
                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">النتيجة:</span>
                              <span className="font-medium mr-2">
                                {item.resultValue} {item.unit}
                              </span>
                            </div>
                            {item.referenceRange && (
                              <div>
                                <span className="text-gray-600">المدى المرجعي:</span>
                                <span className="font-medium mr-2">{item.referenceRange}</span>
                              </div>
                            )}
                          </div>
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
                      ) : null}

                      <button
                        onClick={() => openResultModal(selectedRequest, item)}
                        disabled={selectedRequest.status === LabRequestStatus.COMPLETED || selectedRequest.status === LabRequestStatus.CANCELLED}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {item.resultValue ? 'تعديل النتيجة' : 'إدخال النتيجة'}
                      </button>
                    </div>
                  ))}
                </div>
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
              <FlaskConical className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">اختر طلب لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                إدخال نتيجة التحليل: {selectedItem.test?.name}
              </h3>
            </div>

            <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
              {/* Result Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النتيجة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resultForm.resultValue}
                  onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل قيمة النتيجة"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوحدة
                </label>
                <input
                  type="text"
                  value={resultForm.unit}
                  onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: mg/dL, %"
                />
              </div>

              {/* Reference Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدى المرجعي
                </label>
                <input
                  type="text"
                  value={resultForm.referenceRange}
                  onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: 70-100"
                />
              </div>

              {/* Result Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ النتيجة
                </label>
                <input
                  type="datetime-local"
                  value={resultForm.resultAt}
                  onChange={(e) => setResultForm({ ...resultForm, resultAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={resultForm.notes}
                  onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
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
    </div>
  );
}
