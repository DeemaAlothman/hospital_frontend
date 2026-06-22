'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Edit2, Trash2, Clock } from 'lucide-react';
import {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentStatus,
  Patient,
  Doctor,
} from '@/types';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientsApi } from '@/lib/api/patients';
import { doctorsApi } from '@/lib/api/doctors';
import { toast } from 'react-toastify';
import { useConfirm } from '@/hooks/useConfirm';
import { useAuthStore } from '@/stores/authStore';

export default function AppointmentsPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuthStore();
  const canAddAppointment = user && ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateAppointmentDto>({
    patientId: 0,
    doctorId: 0,
    date: '',
    reason: '',
    status: AppointmentStatus.SCHEDULED,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        appointmentsApi.getAll(),
        patientsApi.getAll(),
        doctorsApi.getAll(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      ...formData,
      date: formData.date ? new Date(formData.date).toISOString() : formData.date,
    };

    try {
      if (editingAppointment) {
        await appointmentsApi.update(editingAppointment.id, submitData);
        toast.success('تم تحديث الموعد بنجاح');
      } else {
        await appointmentsApi.create(submitData);
        toast.success('تم إضافة الموعد بنجاح');
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      const msg: string = error.response?.data?.message || '';
      if (error.response?.status === 400 && msg.includes('موعد آخر')) {
        toast.error('هذا الدكتور غير متاح في الوقت المحدد، يرجى اختيار وقت آخر');
      } else {
        toast.error(msg || 'فشل العملية');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date.split('T')[0] + 'T' + appointment.date.split('T')[1].substring(0, 5),
      reason: appointment.reason || '',
      status: appointment.status,
      notes: appointment.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من حذف هذا الموعد؟', confirmText: 'حذف', type: 'danger' });
    if (!confirmed) return;

    try {
      await appointmentsApi.delete(id);
      toast.success('تم حذف الموعد بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error('فشل حذف الموعد');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setFormData({
      patientId: 0,
      doctorId: 0,
      date: '',
      reason: '',
      status: AppointmentStatus.SCHEDULED,
      notes: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'patientId' || name === 'doctorId' ? parseInt(value) : value,
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المواعيد</h1>
          <p className="text-gray-600 mt-2">عرض وإدارة جميع المواعيد الطبية</p>
        </div>
        {canAddAppointment && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            إضافة موعد جديد
          </button>
        )}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا يوجد مواعيد في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => {
            const { date: formattedDate, time } = formatDateTime(appointment.date);
            return (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                {/* Patient & Doctor Info */}
                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">المريض: </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {appointment.patient?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">الطبيب: </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {appointment.doctor?.user?.fullName}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 mb-3 text-gray-700">
                  <CalendarIcon size={16} className="text-gray-500" />
                  <span className="text-sm">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm">{time}</span>
                </div>

                {/* Reason */}
                {appointment.reason && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">السبب: </span>
                    <span className="text-sm text-gray-900">{appointment.reason}</span>
                  </div>
                )}

                {/* Actions */}
                {canAddAppointment && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(appointment)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    حذف
                  </button>
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmComponent />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAppointment ? 'تعديل الموعد' : 'إضافة موعد جديد'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Patient & Doctor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المريض *
                  </label>
                  <select
                    name="patientId"
                    required
                    value={formData.patientId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value={0}>اختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطبيب *
                  </label>
                  <select
                    name="doctorId"
                    required
                    value={formData.doctorId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value={0}>اختر الطبيب</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user?.fullName} {doctor.speciality && `- ${doctor.speciality}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التاريخ والوقت *
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة *
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value={AppointmentStatus.SCHEDULED}>مجدول / مؤكد</option>
                    <option value={AppointmentStatus.COMPLETED}>مكتمل</option>
                    <option value={AppointmentStatus.CANCELLED}>ملغي</option>
                    <option value={AppointmentStatus.NO_SHOW}>لم يحضر</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الزيارة
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="مثال: كشف دوري، متابعة، ألم..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أي ملاحظات إضافية..."
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
                    : editingAppointment
                    ? 'حفظ التعديلات'
                    : 'إضافة الموعد'}
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
    </div>
  );
}
