'use client';

import { useState, useEffect } from 'react';
import { Plus, Pill, FileText, Eye, Edit2, Trash2, X, Check } from 'lucide-react';
import {
  Medicine,
  CreateMedicineDto,
  Prescription,
  PrescriptionStatus,
} from '@/types';
import { medicinesApi } from '@/lib/api/medicines';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

type ActiveSection = 'medicines' | 'prescriptions';

export default function PharmacyPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<ActiveSection>('prescriptions');

  // Medicines
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [medicineFormData, setMedicineFormData] = useState<CreateMedicineDto>({
    name: '',
    category: '',
    stock: 0,
    price: '0',
    expirationDate: '',
  });

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب الأدوية والوصفات فقط (الصيدلي لا يحتاج المرضى)
      const [medicinesData, prescriptionsData] = await Promise.all([
        medicinesApi.getAll().catch(error => {
          console.error('خطأ في جلب الأدوية:', error);
          return [];
        }),
        prescriptionsApi.getAll().catch(error => {
          console.error('خطأ في جلب الوصفات:', error);
          return [];
        }),
      ]);

      setMedicines(medicinesData);
      setPrescriptions(prescriptionsData);
    } catch (error: any) {
      console.error('خطأ عام:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Medicine handlers
  const handleMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMedicine) {
        await medicinesApi.update(editingMedicine.id, medicineFormData);
        toast.success('تم تحديث الدواء بنجاح');
      } else {
        await medicinesApi.create(medicineFormData);
        toast.success('تم إضافة الدواء بنجاح');
      }
      handleCloseMedicineModal();
      fetchData();
    } catch (error: any) {
      toast.error(editingMedicine ? 'فشل تحديث الدواء' : 'فشل إضافة الدواء');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setMedicineFormData({
      name: medicine.name,
      category: medicine.category || '',
      stock: medicine.stock,
      price: medicine.price,
      expirationDate: medicine.expirationDate?.split('T')[0] || '',
    });
    setShowMedicineModal(true);
  };

  const handleDeleteMedicine = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدواء؟')) return;

    try {
      await medicinesApi.delete(id);
      toast.success('تم حذف الدواء بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف الدواء');
    }
  };

  const handleCloseMedicineModal = () => {
    setShowMedicineModal(false);
    setEditingMedicine(null);
    setMedicineFormData({
      name: '',
      category: '',
      stock: 0,
      price: '0',
      expirationDate: '',
    });
  };

  const isExpiringSoon = (expirationDate?: string): boolean => {
    if (!expirationDate) return false;
    const expiry = new Date(expirationDate);
    const today = new Date();
    const monthsUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsUntilExpiry <= 3 && monthsUntilExpiry > 0;
  };

  const isExpired = (expirationDate?: string): boolean => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const isLowStock = (quantity: number): boolean => {
    return quantity < 10;
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case PrescriptionStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case PrescriptionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'نشطة';
      case PrescriptionStatus.COMPLETED:
        return 'مكتملة';
      case PrescriptionStatus.CANCELLED:
        return 'ملغاة';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  // Check if user is pharmacist
  if (user?.role !== 'PHARMACIST') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة للصيادلة فقط
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">لوحة الصيدلية</h1>
        <p className="text-gray-600">إدارة الأدوية وصرف الوصفات الطبية</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('prescriptions')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeSection === 'prescriptions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={20} />
            الوصفات الطبية
          </div>
        </button>
        <button
          onClick={() => setActiveSection('medicines')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeSection === 'medicines'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Pill size={20} />
            إدارة الأدوية
          </div>
        </button>
      </div>

      {/* Prescriptions Section */}
      {activeSection === 'prescriptions' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">الوصفات الطبية للصرف</h2>

          {prescriptions.filter(p => p.status === PrescriptionStatus.ACTIVE).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد وصفات طبية نشطة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prescriptions
                .filter(p => p.status === PrescriptionStatus.ACTIVE)
                .map((prescription) => {
                  return (
                    <div key={prescription.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">
                            {prescription.patient?.fullName || `مريض #${prescription.patientId}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(prescription.date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(prescription.status)}`}>
                          {getStatusLabel(prescription.status)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">الأدوية المطلوبة:</p>
                        <ul className="space-y-1">
                          {prescription.items?.map((item) => {
                            const medicine = medicines.find((m) => m.id === item.medicineId);
                            return (
                              <li key={item.id} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <div>
                                  <span className="font-medium">{medicine?.name || `دواء #${item.medicineId}`}</span>
                                  <span className="text-gray-600"> - {item.dosage}</span>
                                  {item.frequency && <span className="text-gray-500 block text-xs">{item.frequency}</span>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {prescription.notes && (
                        <div className="mb-4 p-2 bg-yellow-50 rounded text-sm">
                          <p className="text-gray-700">📝 {prescription.notes}</p>
                        </div>
                      )}

                      <button
                        onClick={() => setViewingPrescription(prescription)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Eye size={18} />
                        عرض التفاصيل وصرف
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Medicines Section */}
      {activeSection === 'medicines' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">الأدوية المتوفرة</h2>
            <button
              onClick={() => setShowMedicineModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              إضافة دواء جديد
            </button>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Pill size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد أدوية</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicines.map((medicine) => (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{medicine.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{medicine.category || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`${
                            isLowStock(medicine.stock)
                              ? 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium'
                              : ''
                          }`}
                        >
                          {medicine.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{parseFloat(medicine.price).toFixed(2)} ريال</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {medicine.expirationDate ? (
                          <span
                            className={`${
                              isExpired(medicine.expirationDate)
                                ? 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
                                : isExpiringSoon(medicine.expirationDate)
                                ? 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium'
                                : ''
                            }`}
                          >
                            {new Date(medicine.expirationDate).toLocaleDateString('ar-SA')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMedicine(medicine)}
                            className="text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(medicine.id)}
                            className="text-red-600 hover:text-red-800"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medicine Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}</h2>
              <button onClick={handleCloseMedicineModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleMedicineSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم الدواء *</label>
                <input
                  type="text"
                  required
                  value={medicineFormData.name}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الفئة</label>
                <input
                  type="text"
                  value={medicineFormData.category}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="مثال: مسكنات، مضادات حيوية..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الكمية</label>
                  <input
                    type="number"
                    min="0"
                    value={medicineFormData.stock}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">السعر (ريال) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={medicineFormData.price}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label>
                <input
                  type="date"
                  value={medicineFormData.expirationDate}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, expirationDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingMedicine ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseMedicineModal}
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

      {/* View Prescription Modal */}
      {viewingPrescription && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">تفاصيل الوصفة الطبية</h2>
              <button onClick={() => setViewingPrescription(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">المريض</p>
                  <p className="font-medium">
                    {viewingPrescription.patient?.fullName || `مريض #${viewingPrescription.patientId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">التاريخ</p>
                  <p className="font-medium">
                    {new Date(viewingPrescription.date).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">الأدوية المطلوبة:</p>
                <div className="space-y-2">
                  {viewingPrescription.items?.map((item) => {
                    const medicine = medicines.find((m) => m.id === item.medicineId);
                    return (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{medicine?.name || `دواء #${item.medicineId}`}</p>
                            <p className="text-sm text-gray-600">الجرعة: {item.dosage}</p>
                            {item.frequency && <p className="text-sm text-gray-600">التكرار: {item.frequency}</p>}
                            {item.duration && <p className="text-sm text-gray-600">المدة: {item.duration}</p>}
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-gray-600">المتوفر: {medicine?.stock || 0}</p>
                            <p className="text-sm font-medium">{medicine ? parseFloat(medicine.price).toFixed(2) : '0.00'} ريال</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {viewingPrescription.notes && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>ملاحظات الطبيب:</strong> {viewingPrescription.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    // Here you would mark as dispensed/completed
                    toast.success('تم صرف الوصفة بنجاح');
                    setViewingPrescription(null);
                    fetchData();
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  تأكيد الصرف
                </button>
                <button
                  onClick={() => setViewingPrescription(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
