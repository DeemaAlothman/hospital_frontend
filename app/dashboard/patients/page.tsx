'use client';

import { useState, useEffect } from 'react';
import { Plus, User as UserIcon, Edit2, Trash2 } from 'lucide-react';
import { Patient, CreatePatientDto, UpdatePatientDto, Gender } from '@/types';
import { patientsApi } from '@/lib/api/patients';
import { toast } from 'react-toastify';
import { useConfirm } from '@/hooks/useConfirm';

export default function PatientsPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePatientDto>({
    fullName: '',
    gender: Gender.MALE,
    birthDate: '',
    phone: '',
    address: '',
    bloodType: '',
    emergencyContact: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error: any) {
      toast.error('فشل تحميل المرضى');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingPatient) {
        await patientsApi.update(editingPatient.id, formData);
        toast.success('تم تحديث بيانات المريض بنجاح');
      } else {
        await patientsApi.create(formData);
        toast.success('تم إضافة المريض بنجاح');
      }
      handleCloseModal();
      fetchPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      fullName: patient.fullName,
      gender: patient.gender,
      birthDate: patient.birthDate.split('T')[0],
      phone: patient.phone || '',
      address: patient.address || '',
      bloodType: patient.bloodType || '',
      emergencyContact: patient.emergencyContact || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا المريض؟ سيتم حذف جميع البيانات المرتبطة به.',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await patientsApi.delete(id);
      toast.success('تم حذف المريض بنجاح');
      fetchPatients();
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 409) {
        toast.error('لا يمكن حذف المريض لوجود سجلات طبية مرتبطة به');
      } else if (status === 404) {
        toast.error('المريض غير موجود');
      } else {
        toast.error('فشل حذف المريض');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      fullName: '',
      gender: Gender.MALE,
      birthDate: '',
      phone: '',
      address: '',
      bloodType: '',
      emergencyContact: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المرضى</h1>
          <p className="text-gray-600 mt-2">عرض وإدارة جميع المرضى في النظام</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          إضافة مريض جديد
        </button>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <UserIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا يوجد مرضى في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-full ${
                  patient.gender === Gender.MALE ? 'bg-blue-100' : 'bg-pink-100'
                }`}>
                  <UserIcon className={
                    patient.gender === Gender.MALE ? 'text-blue-600' : 'text-pink-600'
                  } size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {patient.fullName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {calculateAge(patient.birthDate)} سنة - {patient.gender === Gender.MALE ? 'ذكر' : 'أنثى'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {patient.phone && (
                  <div>
                    <span className="text-sm text-gray-600">الهاتف: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {patient.phone}
                    </span>
                  </div>
                )}
                {patient.bloodType && (
                  <div>
                    <span className="text-sm text-gray-600">فصيلة الدم: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {patient.bloodType}
                    </span>
                  </div>
                )}
                {patient.address && (
                  <div>
                    <span className="text-sm text-gray-600">العنوان: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {patient.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(patient)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={16} />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(patient.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPatient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              {/* Gender & Birth Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الجنس *
                  </label>
                  <select
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value={Gender.MALE}>ذكر</option>
                    <option value={Gender.FEMALE}>أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ الميلاد *
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Phone & Blood Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    فصيلة الدم
                  </label>
                  <input
                    type="text"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    placeholder="A+, B-, O+, AB+..."
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أدخل العنوان الكامل"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جهة الاتصال في حالات الطوارئ
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="الاسم ورقم الهاتف"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'جاري الحفظ...'
                    : editingPatient
                    ? 'حفظ التعديلات'
                    : 'إضافة المريض'}
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
