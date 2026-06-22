'use client';

import { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, Plus, X } from 'lucide-react';
import {
  Prescription,
  PrescriptionStatus,
  Patient,
  Visit,
  Medicine,
  UserRole,
} from '@/types';
import { prescriptionsApi, CreateMyPrescriptionDto } from '@/lib/api/prescriptions';
import { patientsApi } from '@/lib/api/patients';
import { visitsApi } from '@/lib/api/visits';
import { medicinesApi } from '@/lib/api/medicines';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';
import { useConfirm } from '@/hooks/useConfirm';

interface PrescriptionItemFormData {
  medicineId: number;
  dosage: string;
  frequency?: string;
  duration?: string;
}

export default function PrescriptionsPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuthStore();
  const isDoctor = user?.role === UserRole.DOCTOR;

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateMyPrescriptionDto>({
    visitId: 0,
    patientId: 0,
    doctorId: 0,
    notes: '',
    items: [],
  });
  const [currentItem, setCurrentItem] = useState<PrescriptionItemFormData>({
    medicineId: 0,
    dosage: '',
    frequency: '',
    duration: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch prescriptions and patients for everyone
      const [prescriptionsData, patientsData] = await Promise.all([
        prescriptionsApi.getAll(),
        patientsApi.getAll(),
      ]);

      setPrescriptions(prescriptionsData);
      setPatients(patientsData);

      // Fetch visits and medicines only if user is a doctor
      if (isDoctor) {
        const [visitsData, medicinesData] = await Promise.all([
          visitsApi.getMyVisits(),
          medicinesApi.getAll(),
        ]);
        setVisits(visitsData);
        setMedicines(medicinesData);
      }
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: number) => {
    const confirmed = await confirm({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من حذف هذه الوصفة؟', confirmText: 'حذف', type: 'danger' });
    if (!confirmed) return;

    try {
      await prescriptionsApi.delete(id);
      toast.success('تم حذف الوصفة بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف الوصفة');
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const prescription = await prescriptionsApi.getById(id);
      setViewingPrescription(prescription);
    } catch (error) {
      toast.error('فشل تحميل تفاصيل الوصفة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      toast.error('يجب إضافة دواء واحد على الأقل');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Sending prescription data:', formData);
      await prescriptionsApi.createMyPrescription(formData);
      toast.success('تم إضافة الوصفة بنجاح');
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('❌ Prescription error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'فشل إضافة الوصفة';

      if (errorMessage.includes('No pending invoice')) {
        toast.error('⚠️ يجب إنشاء فاتورة للمريض أولاً قبل إضافة الوصفة الطبية');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    if (currentItem.medicineId === 0) {
      toast.error('يجب اختيار الدواء');
      return;
    }
    if (!currentItem.dosage) {
      toast.error('يجب إدخال الجرعة');
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, currentItem],
    });

    setCurrentItem({
      medicineId: 0,
      dosage: '',
      frequency: '',
      duration: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      visitId: 0,
      patientId: 0,
      doctorId: 0,
      notes: '',
      items: [],
    });
    setCurrentItem({
      medicineId: 0,
      dosage: '',
      frequency: '',
      duration: '',
    });
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الوصفات الطبية</h1>
            <p className="text-gray-600 mt-2">عرض وإدارة جميع الوصفات الطبية</p>
          </div>
          {isDoctor && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              إضافة وصفة جديدة
            </button>
          )}
        </div>
        {!isDoctor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 الوصفات الطبية تُنشأ تلقائياً من قبل الطبيب عند الكشف على المريض
            </p>
          </div>
        )}
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا توجد وصفات طبية في النظام</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الوصفة
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
                    عدد الأدوية
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
                {prescriptions.map((prescription) => {
                  const patient = patients.find((p) => p.id === prescription.patientId);
                  return (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{prescription.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient?.fullName || prescription.patient?.fullName || `مريض #${prescription.patientId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prescription.doctor?.user?.fullName || `طبيب #${prescription.doctorId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(prescription.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prescription.items?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            prescription.status
                          )}`}
                        >
                          {getStatusLabel(prescription.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(prescription.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(prescription.id)}
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
      )}


      {/* View Prescription Details Modal */}
      {viewingPrescription && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                تفاصيل الوصفة #{viewingPrescription.id}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">المريض</p>
                  <p className="text-base font-medium text-gray-900">
                    {viewingPrescription.patient?.fullName ||
                      patients.find((p) => p.id === viewingPrescription.patientId)?.fullName ||
                      `مريض #${viewingPrescription.patientId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الطبيب</p>
                  <p className="text-base font-medium text-gray-900">
                    {viewingPrescription.doctor?.user?.fullName || `طبيب #${viewingPrescription.doctorId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">التاريخ</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(viewingPrescription.date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      viewingPrescription.status
                    )}`}
                  >
                    {getStatusLabel(viewingPrescription.status)}
                  </span>
                </div>
              </div>

              {/* Medicines List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">الأدوية</h3>
                <div className="space-y-3">
                  {viewingPrescription.items?.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">
                          {index + 1}. {item.medicine?.name || `دواء #${item.medicineId}`}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">الجرعة: </span>
                          <span className="text-gray-900 font-medium">{item.dosage}</span>
                        </div>
                        {item.frequency && (
                          <div>
                            <span className="text-gray-600">التكرار: </span>
                            <span className="text-gray-900 font-medium">{item.frequency}</span>
                          </div>
                        )}
                        {item.duration && (
                          <div>
                            <span className="text-gray-600">المدة: </span>
                            <span className="text-gray-900 font-medium">{item.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {viewingPrescription.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">ملاحظات</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {viewingPrescription.notes}
                  </p>
                </div>
              )}

              <button
                onClick={() => setViewingPrescription(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prescription Modal (Doctor Only) */}
      {showModal && isDoctor && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إضافة وصفة طبية جديدة</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الزيارة *</label>
                <select
                  required
                  value={formData.visitId || ''}
                  onChange={(e) => {
                    const visitId = parseInt(e.target.value);
                    const visit = visits.find((v) => v.id === visitId);
                    if (visit) {
                      setFormData({
                        ...formData,
                        visitId,
                        patientId: visit.patientId,
                        doctorId: visit.doctorId,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
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

              {formData.visitId > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">المريض: </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {patients.find((p) => p.id === formData.patientId)?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">الطبيب: </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.fullName}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة دواء</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الدواء *</label>
                    <select
                      value={currentItem.medicineId || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, medicineId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    >
                      <option value="">اختر الدواء</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الجرعة *</label>
                    <input
                      type="text"
                      value={currentItem.dosage}
                      onChange={(e) => setCurrentItem({ ...currentItem, dosage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="مثال: حبة واحدة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التكرار</label>
                    <input
                      type="text"
                      value={currentItem.frequency}
                      onChange={(e) => setCurrentItem({ ...currentItem, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="مثال: 3 مرات يومياً"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المدة</label>
                    <input
                      type="text"
                      value={currentItem.duration}
                      onChange={(e) => setCurrentItem({ ...currentItem, duration: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      placeholder="مثال: 7 أيام"
                    />
                  </div>

                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  إضافة الدواء للوصفة
                </button>
              </div>

              {formData.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    الأدوية المضافة ({formData.items.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => {
                      const medicine = medicines.find((m) => m.id === item.medicineId);
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {medicine?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              الجرعة: {item.dosage}
                              {item.frequency && ` | التكرار: ${item.frequency}`}
                              {item.duration && ` | المدة: ${item.duration}`}
                            </p>
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
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة الوصفة'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
      <ConfirmComponent />
    </div>
  );
}
