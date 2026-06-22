'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { invoicesApi } from '@/lib/api/invoices';
import { radiologyTestsApi } from '@/lib/api/radiology-tests';
import {
  Invoice,
  InvoiceStatus,
  InvoiceItemType,
  RadiologyTest,
  AddInvoiceItemDto,
} from '@/types';
import { toast } from 'react-toastify';
import { Receipt, Search, Plus, X, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';

export default function CashierPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);


  // Add Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<AddInvoiceItemDto>({
    itemType: InvoiceItemType.OTHER,
    description: '',
    quantity: 1,
    unitPrice: 0,
    referenceId: undefined,
  });

  // Check if user is cashier
  if (user?.role !== 'CASHIER') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة للمحاسبين فقط
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
      const [invoicesData, radiologyTestsData] = await Promise.all([
        invoicesApi.getAll().catch(error => {
          console.error('خطأ في جلب الفواتير:', error);
          return [];
        }),
        radiologyTestsApi.getAll().catch(error => {
          console.error('خطأ في جلب فحوصات الأشعة:', error);
          return [];
        }),
      ]);
      setInvoices(invoicesData);
      setRadiologyTests(radiologyTestsData);
    } catch (error: any) {
      console.error('خطأ عام:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };


  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const updated = await invoicesApi.addItems(selectedInvoice.id, itemForm);
      toast.success('تم إضافة العنصر بنجاح');

      // Refresh invoices and update selected
      await fetchData();
      setSelectedInvoice(updated);
      setShowAddItemModal(false);
      resetItemForm();
    } catch (error: any) {
      console.error('خطأ في إضافة العنصر:', error);
      toast.error('فشل إضافة العنصر');
    }
  };

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      await invoicesApi.pay(invoiceId);
      toast.success('تم دفع الفاتورة بنجاح');
      await fetchData();
      if (selectedInvoice?.id === invoiceId) {
        const updated = await invoicesApi.getById(invoiceId);
        setSelectedInvoice(updated);
      }
    } catch (error: any) {
      console.error('خطأ في دفع الفاتورة:', error);
      toast.error('فشل دفع الفاتورة');
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    const confirmed = await confirm({ title: 'تأكيد الإلغاء', message: 'هل أنت متأكد من إلغاء هذه الفاتورة؟', confirmText: 'إلغاء الفاتورة', type: 'warning' });
    if (!confirmed) return;

    try {
      await invoicesApi.cancel(invoiceId);
      toast.success('تم إلغاء الفاتورة بنجاح');
      await fetchData();
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
    } catch (error: any) {
      console.error('خطأ في إلغاء الفاتورة:', error);
      toast.error('فشل إلغاء الفاتورة');
    }
  };

  const resetItemForm = () => {
    setItemForm({
      itemType: InvoiceItemType.OTHER,
      description: '',
      quantity: 1,
      unitPrice: 0,
      referenceId: undefined,
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels = {
      PENDING: 'قيد الانتظار',
      PAID: 'مدفوعة',
      CANCELLED: 'ملغاة',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getItemTypeLabel = (type: InvoiceItemType) => {
    const labels = {
      CONSULTATION: 'استشارة',
      LAB: 'مختبر',
      RADIOLOGY: 'أشعة',
      PHARMACY: 'صيدلية',
      ROOM: 'غرفة',
      OTHER: 'أخرى',
    };
    return labels[type];
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">لوحة المحاسب</h1>
              <p className="text-gray-600">إدارة الفواتير والمدفوعات</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              💡 الفواتير تُنشأ تلقائياً عند إنشاء الزيارات
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="البحث برقم الفاتورة أو اسم المريض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">جميع الفواتير</option>
            <option value={InvoiceStatus.PENDING}>قيد الانتظار</option>
            <option value={InvoiceStatus.PAID}>مدفوعة</option>
            <option value={InvoiceStatus.CANCELLED}>ملغاة</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            الفواتير ({filteredInvoices.length})
          </h2>

          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Receipt className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">لا توجد فواتير</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedInvoice?.id === invoice.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {invoice.status === InvoiceStatus.PAID ? (
                      <CheckCircle className="text-green-600" size={18} />
                    ) : (
                      <Clock className="text-yellow-600" size={18} />
                    )}
                    <span className="font-semibold text-gray-900">فاتورة #{invoice.id}</span>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المريض:</span>
                    <span className="font-medium">{invoice.patient?.fullName || `مريض #${invoice.patientId}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المبلغ الإجمالي:</span>
                    <span className="font-semibold text-blue-600">{invoice.finalAmount} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">عدد العناصر:</span>
                    <span className="font-medium">{invoice.items.length}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Invoice Details */}
        <div className="lg:sticky lg:top-6">
          {selectedInvoice ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  فاتورة #{selectedInvoice.id}
                </h2>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              {/* Patient Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">معلومات المريض</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الاسم:</span>
                    <span className="font-medium">{selectedInvoice.patient?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">تاريخ الإصدار:</span>
                    <span className="font-medium">
                      {new Date(selectedInvoice.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">عناصر الفاتورة</h3>
                  {selectedInvoice.status === InvoiceStatus.PENDING && (
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={16} />
                      <span>إضافة عنصر</span>
                    </button>
                  )}
                </div>

                {selectedInvoice.items.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">لا توجد عناصر في الفاتورة</p>
                ) : (
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mb-1">
                              {getItemTypeLabel(item.itemType)}
                            </span>
                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="block">الكمية:</span>
                            <span className="font-medium text-gray-900">{item.quantity}</span>
                          </div>
                          <div>
                            <span className="block">سعر الوحدة:</span>
                            <span className="font-medium text-gray-900">{item.unitPrice} ريال</span>
                          </div>
                          <div>
                            <span className="block">المجموع:</span>
                            <span className="font-medium text-blue-600">{item.subTotal} ريال</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">المجموع الفرعي:</span>
                    <span className="font-medium">{selectedInvoice.totalAmount} ريال</span>
                  </div>
                  {parseFloat(selectedInvoice.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">الخصم:</span>
                      <span className="font-medium text-red-600">-{selectedInvoice.discount} ريال</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-300">
                    <span className="text-gray-900">المبلغ النهائي:</span>
                    <span className="text-blue-600">{selectedInvoice.finalAmount} ريال</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedInvoice.status === InvoiceStatus.PENDING && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePayInvoice(selectedInvoice.id)}
                    disabled={selectedInvoice.items.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <DollarSign size={20} />
                    <span>تأكيد الدفع</span>
                  </button>
                  <button
                    onClick={() => handleCancelInvoice(selectedInvoice.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Receipt className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">اختر فاتورة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>


      {/* Add Item Modal */}
      {showAddItemModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">إضافة عنصر للفاتورة</h3>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع العنصر <span className="text-red-500">*</span>
                </label>
                <select
                  value={itemForm.itemType}
                  onChange={(e) => setItemForm({ ...itemForm, itemType: e.target.value as InvoiceItemType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={InvoiceItemType.CONSULTATION}>استشارة</option>
                  <option value={InvoiceItemType.LAB}>مختبر</option>
                  <option value={InvoiceItemType.RADIOLOGY}>أشعة</option>
                  <option value={InvoiceItemType.PHARMACY}>صيدلية</option>
                  <option value={InvoiceItemType.ROOM}>غرفة</option>
                  <option value={InvoiceItemType.OTHER}>أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف العنصر"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر الوحدة (ريال) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={itemForm.unitPrice}
                    onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {itemForm.itemType === InvoiceItemType.RADIOLOGY && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر فحص أشعة (اختياري)
                  </label>
                  <select
                    value={itemForm.referenceId || ''}
                    onChange={(e) => {
                      const testId = e.target.value ? parseInt(e.target.value) : undefined;
                      const test = radiologyTests.find(t => t.id === testId);
                      setItemForm({
                        ...itemForm,
                        referenceId: testId,
                        description: test?.name || itemForm.description,
                        unitPrice: test ? parseFloat(test.price.toString()) : itemForm.unitPrice,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر فحص --</option>
                    {radiologyTests.map(test => (
                      <option key={test.id} value={test.id}>
                        {test.name} - {test.price} ريال
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">المجموع:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {(itemForm.quantity * itemForm.unitPrice).toFixed(2)} ريال
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemModal(false);
                    resetItemForm();
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
