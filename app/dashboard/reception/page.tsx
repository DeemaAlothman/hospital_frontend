'use client';

import { useState, useEffect } from 'react';
import { Plus, UserPlus, Calendar, X, Eye, Edit2, Trash2, Clock } from 'lucide-react';
import {
  Patient,
  CreatePatientDto,
  Appointment,
  CreateAppointmentDto,
  AppointmentStatus,
  Doctor,
  Gender,
} from '@/types';
import { patientsApi } from '@/lib/api/patients';
import { appointmentsApi } from '@/lib/api/appointments';
import { doctorsApi } from '@/lib/api/doctors';
import { visitsApi } from '@/lib/api/visits';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';
import { useConfirm } from '@/hooks/useConfirm';

type ActiveBoard = 'patients' | 'appointments';

export default function ReceptionPage() {
  const { user } = useAuthStore();
  const { confirm, ConfirmComponent } = useConfirm();
  const [activeBoard, setActiveBoard] = useState<ActiveBoard>('patients');

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [patientFormData, setPatientFormData] = useState<CreatePatientDto>({
    fullName: '',
    birthDate: '',
    gender: Gender.MALE,
    phone: '',
    address: '',
    bloodType: '',
    emergencyContact: '',
  });

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentFormData, setAppointmentFormData] = useState<CreateAppointmentDto>({
    patientId: 0,
    doctorId: 0,
    date: '',
    reason: '',
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
      const [patientsData, appointmentsData, doctorsData] = await Promise.all([
        patientsApi.getAll(),
        appointmentsApi.getAll(),
        doctorsApi.getAll(),
      ]);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setDoctors(doctorsData);
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Patient handlers
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingPatient) {
        await patientsApi.update(editingPatient.id, patientFormData);
        toast.success('تم تحديث المريض بنجاح');
      } else {
        await patientsApi.create(patientFormData);
        toast.success('تم تسجيل المريض بنجاح');
      }
      handleClosePatientModal();
      fetchData();
    } catch (error: any) {
      toast.error(editingPatient ? 'فشل تحديث المريض' : 'فشل تسجيل المريض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setPatientFormData({
      fullName: patient.fullName,
      birthDate: patient.birthDate?.split('T')[0] || '',
      gender: patient.gender,
      phone: patient.phone || '',
      address: patient.address || '',
      bloodType: patient.bloodType || '',
      emergencyContact: patient.emergencyContact || '',
    });
    setShowPatientModal(true);
  };

  const handleDeletePatient = async (id: number) => {
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
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف المريض');
    }
  };

  const handleClosePatientModal = () => {
    setShowPatientModal(false);
    setEditingPatient(null);
    setPatientFormData({
      fullName: '',
      birthDate: '',
      gender: Gender.MALE,
      phone: '',
      address: '',
      bloodType: '',
      emergencyContact: '',
    });
  };

  // Appointment handlers
  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (appointmentFormData.patientId === 0 || appointmentFormData.doctorId === 0) {
      toast.error('يجب اختيار المريض والطبيب');
      setIsSubmitting(false);
      return;
    }

    const submitData = {
      ...appointmentFormData,
      date: appointmentFormData.date ? new Date(appointmentFormData.date).toISOString() : appointmentFormData.date,
    };

    try {
      if (editingAppointment) {
        await appointmentsApi.update(editingAppointment.id, submitData);
        toast.success('تم تحديث الموعد بنجاح');
      } else {
        await appointmentsApi.create(submitData);
        toast.success('تم حجز الموعد بنجاح');
      }
      handleCloseAppointmentModal();
      fetchData();
    } catch (error: any) {
      toast.error(editingAppointment ? 'فشل تحديث الموعد' : 'فشل حجز الموعد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);

    // Format appointment date safely
    let formattedDate = '';
    if (appointment.date) {
      const dateObj = new Date(appointment.date);
      formattedDate = dateObj.toISOString().slice(0, 16);
    }

    setAppointmentFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: formattedDate,
      reason: appointment.reason || '',
      notes: appointment.notes || '',
    });
    setShowAppointmentModal(true);
  };

  const handleDeleteAppointment = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await appointmentsApi.delete(id);
      toast.success('تم حذف الموعد بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف الموعد');
    }
  };

  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
    setEditingAppointment(null);
    setAppointmentFormData({
      patientId: 0,
      doctorId: 0,
      date: '',
      reason: '',
      notes: '',
    });
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case AppointmentStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case AppointmentStatus.NO_SHOW:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'مجدول / مؤكد';
      case AppointmentStatus.COMPLETED:
        return 'مكتمل';
      case AppointmentStatus.CANCELLED:
        return 'ملغي';
      case AppointmentStatus.NO_SHOW:
        return 'لم يحضر';
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

  // Check if user is receptionist
  if (user?.role !== 'RECEPTIONIST') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة لموظفي الاستقبال فقط
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">لوحة الاستقبال</h1>
        <p className="text-gray-600">إدارة تسجيل المرضى وحجز المواعيد</p>
      </div>

      {/* Board Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveBoard('patients')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeBoard === 'patients'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserPlus size={20} />
            تسجيل المرضى
          </div>
        </button>
        <button
          onClick={() => setActiveBoard('appointments')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeBoard === 'appointments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            حجز المواعيد
          </div>
        </button>
      </div>

      {/* Patients Board */}
      {activeBoard === 'patients' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">المرضى المسجلين</h2>
            <button
              onClick={() => setShowPatientModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              تسجيل مريض جديد
            </button>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <UserPlus size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا يوجد مرضى مسجلين</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الكامل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجنس</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الميلاد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">فصيلة الدم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.gender === 'MALE' ? 'ذكر' : 'أنثى'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.bloodType || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingPatient(patient)}
                            className="text-blue-600 hover:text-blue-800"
                            title="عرض التفاصيل"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEditPatient(patient)}
                            className="text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient.id)}
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

      {/* Appointments Board */}
      {activeBoard === 'appointments' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">المواعيد المحجوزة</h2>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              حجز موعد جديد
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد مواعيد محجوزة</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطبيب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ والوقت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السبب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    const doctor = doctors.find(d => d.id === appointment.doctorId);
                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient?.fullName || `مريض #${appointment.patientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doctor?.user?.fullName || `طبيب #${appointment.doctorId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            {new Date(appointment.date).toLocaleString('ar-SA')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{appointment.reason || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              className="text-green-600 hover:text-green-800"
                              title="تعديل"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="text-red-600 hover:text-red-800"
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
          )}
        </div>
      )}

      {/* Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPatient ? 'تعديل بيانات المريض' : 'تسجيل مريض جديد'}
              </h2>
              <button onClick={handleClosePatientModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePatientSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={patientFormData.fullName}
                  onChange={(e) => setPatientFormData({ ...patientFormData, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">تاريخ الميلاد *</label>
                  <input
                    type="date"
                    required
                    value={patientFormData.birthDate}
                    onChange={(e) => setPatientFormData({ ...patientFormData, birthDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">الجنس *</label>
                  <select
                    required
                    value={patientFormData.gender}
                    onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value as Gender })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value={Gender.MALE}>ذكر</option>
                    <option value={Gender.FEMALE}>أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={patientFormData.phone}
                    onChange={(e) => setPatientFormData({ ...patientFormData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">فصيلة الدم</label>
                  <input
                    type="text"
                    value={patientFormData.bloodType}
                    onChange={(e) => setPatientFormData({ ...patientFormData, bloodType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="مثال: A+"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">العنوان</label>
                <input
                  type="text"
                  value={patientFormData.address}
                  onChange={(e) => setPatientFormData({ ...patientFormData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">جهة الاتصال للطوارئ</label>
                <input
                  type="text"
                  value={patientFormData.emergencyContact}
                  onChange={(e) => setPatientFormData({ ...patientFormData, emergencyContact: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="الاسم ورقم الهاتف"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingPatient ? 'تحديث' : 'تسجيل'}
                </button>
                <button
                  type="button"
                  onClick={handleClosePatientModal}
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

      {/* View Patient Modal */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold">تفاصيل المريض</h2>
              <button onClick={() => setViewingPatient(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الاسم الكامل</p>
                  <p className="font-medium">{viewingPatient.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الجنس</p>
                  <p className="font-medium">{viewingPatient.gender === 'MALE' ? 'ذكر' : 'أنثى'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ الميلاد</p>
                  <p className="font-medium">
                    {viewingPatient.birthDate ? new Date(viewingPatient.birthDate).toLocaleDateString('ar-SA') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">رقم الهاتف</p>
                  <p className="font-medium">{viewingPatient.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">فصيلة الدم</p>
                  <p className="font-medium">{viewingPatient.bloodType || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">العنوان</p>
                  <p className="font-medium">{viewingPatient.address || '-'}</p>
                </div>
              </div>

              {viewingPatient.emergencyContact && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">جهة الاتصال للطوارئ</p>
                  <p className="font-medium bg-gray-50 p-3 rounded-lg">{viewingPatient.emergencyContact}</p>
                </div>
              )}

              <button
                onClick={() => setViewingPatient(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingAppointment ? 'تعديل الموعد' : 'حجز موعد جديد'}
              </h2>
              <button onClick={handleCloseAppointmentModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">المريض *</label>
                <select
                  required
                  value={appointmentFormData.patientId || ''}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, patientId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">اختر المريض</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">الطبيب *</label>
                <select
                  required
                  value={appointmentFormData.doctorId || ''}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, doctorId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">اختر الطبيب</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">التاريخ والوقت *</label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentFormData.date}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">سبب الزيارة</label>
                <input
                  type="text"
                  value={appointmentFormData.reason}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="مثال: كشف عام، متابعة، ألم..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ملاحظات</label>
                <textarea
                  rows={2}
                  value={appointmentFormData.notes}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingAppointment ? 'تحديث' : 'حجز'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseAppointmentModal}
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

      <ConfirmComponent />
    </div>
  );
}
