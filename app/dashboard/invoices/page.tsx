'use client';

import { useState, useEffect } from 'react';
import { invoicesApi } from '@/lib/api/invoices';
import { patientsApi } from '@/lib/api/patients';
import { Invoice, Patient, InvoiceStatus, InvoiceItemType } from '@/types';
import { toast } from 'react-toastify';
import { Receipt, X, Eye, DollarSign, Ban } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';

export default function InvoicesPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | ''>('');

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = filterStatus ? { status: filterStatus } : undefined;

      // جلب الفواتير والمرضى بشكل منفصل مع معالجة الأخطاء
      const [invoicesData, patientsData] = await Promise.all([
        invoicesApi.getAll(queryParams).catch(error => {
          console.error('خطأ في جلب الفواتير:', error);
          return [];
        }),
        patientsApi.getAll().catch(error => {
          console.error('خطأ في جلب المرضى:', error);
          return [];
        }),
      ]);

      setInvoices(invoicesData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };


  const handlePay = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الدفع',
      message: 'هل أنت متأكد من تسجيل دفع هذه الفاتورة؟ سيتم تحويل حالتها إلى "مدفوعة".',
      confirmText: 'تسجيل الدفع',
      cancelText: 'إلغاء',
      type: 'info',
    });

    if (!confirmed) return;

    try {
      await invoicesApi.pay(id);
      toast.success('تم تسجيل الدفع بنجاح');
      setShowDetailsModal(false);
      fetchData();
      if (selectedInvoice && selectedInvoice.id === id) {
        const updatedInvoice = await invoicesApi.getById(id);
        setSelectedInvoice(updatedInvoice);
      }
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast.error('حدث خطأ أثناء تسجيل الدفع');
    }
  };

  const handleCancel = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الإلغاء',
      message: 'هل أنت متأكد من إلغاء هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'إلغاء الفاتورة',
      cancelText: 'تراجع',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await invoicesApi.cancel(id);
      toast.success('تم إلغاء الفاتورة بنجاح');
      fetchData();
      if (selectedInvoice && selectedInvoice.id === id) {
        setShowDetailsModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error canceling invoice:', error);
      toast.error('حدث خطأ أثناء إلغاء الفاتورة');
    }
  };

  const handleViewDetails = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoicesApi.getById(invoice.id);
      setSelectedInvoice(fullInvoice);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل الفاتورة');
    }
  };


  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case InvoiceStatus.PAID:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.PENDING:
        return 'قيد الانتظار';
      case InvoiceStatus.PAID:
        return 'مدفوعة';
      case InvoiceStatus.CANCELLED:
        return 'ملغاة';
      default:
        return status;
    }
  };

  const getItemTypeText = (type: InvoiceItemType): string => {
    switch (type) {
      case InvoiceItemType.CONSULTATION:
        return 'استشارة';
      case InvoiceItemType.LAB:
        return 'مختبر';
      case InvoiceItemType.RADIOLOGY:
        return 'أشعة';
      case InvoiceItemType.PHARMACY:
        return 'صيدلية';
      case InvoiceItemType.ROOM:
        return 'غرفة';
      case InvoiceItemType.OTHER:
        return 'أخرى';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
        <div className="text-sm text-gray-600">
          <p className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            💡 الفواتير تُنشأ تلقائياً عند إنشاء الزيارات
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700">تصفية حسب الحالة</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 w-64 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="">الكل</option>
          <option value={InvoiceStatus.PENDING}>قيد الانتظار</option>
          <option value={InvoiceStatus.PAID}>مدفوعة</option>
          <option value={InvoiceStatus.CANCELLED}>ملغاة</option>
        </select>
      </div>

      {/* Invoices Table */}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المجموع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الخصم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ النهائي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{invoice.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.patient?.fullName || `مريض #${invoice.patientId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(invoice.totalAmount).toFixed(2)} ريال</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(invoice.discount).toFixed(2)} ريال</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{parseFloat(invoice.finalAmount).toFixed(2)} ريال</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(invoice)}
                          className="text-blue-600 hover:text-blue-800"
                          title="عرض التفاصيل"
                        >
                          <Eye size={18} />
                        </button>
                        {invoice.status === InvoiceStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handlePay(invoice.id)}
                              className="text-purple-600 hover:text-purple-800"
                              title="تسجيل الدفع"
                            >
                              <DollarSign size={18} />
                            </button>
                            <button
                              onClick={() => handleCancel(invoice.id)}
                              className="text-red-600 hover:text-red-800"
                              title="إلغاء"
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


      {/* Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">تفاصيل الفاتورة #{selectedInvoice.id}</h2>
              <button onClick={() => { setShowDetailsModal(false); setSelectedInvoice(null); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">المريض</p>
                <p className="font-medium">
                  {selectedInvoice.patient?.fullName || `مريض #${selectedInvoice.patientId}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الحالة</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                  {getStatusText(selectedInvoice.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleString('ar-SA')}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">أصناف الفاتورة</h3>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">النوع</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الوصف</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الكمية</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">سعر الوحدة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {getItemTypeText(item.itemType)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{parseFloat(item.unitPrice).toFixed(2)} ريال</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{parseFloat(item.subTotal).toFixed(2)} ريال</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد أصناف في هذه الفاتورة</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">المجموع:</span>
                <span className="font-medium">{parseFloat(selectedInvoice.totalAmount).toFixed(2)} ريال</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">الخصم:</span>
                <span className="font-medium text-red-600">-{parseFloat(selectedInvoice.discount).toFixed(2)} ريال</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>المبلغ النهائي:</span>
                <span className="text-green-600">{parseFloat(selectedInvoice.finalAmount).toFixed(2)} ريال</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {selectedInvoice.status === InvoiceStatus.PENDING && (
                <>
                  <button
                    onClick={() => handlePay(selectedInvoice.id)}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <DollarSign size={18} />
                    تسجيل الدفع
                  </button>
                  <button
                    onClick={() => handleCancel(selectedInvoice.id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Ban size={18} />
                    إلغاء الفاتورة
                  </button>
                </>
              )}
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedInvoice(null); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
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
