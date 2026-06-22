'use client';

import { useState, useEffect } from 'react';
import { Plus, CalendarCheck, Edit2, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import {
  RoomReservation,
  ReservationType,
  ReservationStatus,
  Room,
  BedStatus,
  Patient,
  Doctor,
  UserRole,
} from '@/types';
import { roomReservationsApi } from '@/lib/api/room-reservations';
import { roomsApi } from '@/lib/api/rooms';
import { patientsApi } from '@/lib/api/patients';
import { doctorsApi } from '@/lib/api/doctors';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-toastify';
import { useConfirm } from '@/hooks/useConfirm';

const RESERVATION_TYPE_LABELS: Record<ReservationType, string> = {
  PATIENT_STAY: 'إقامة مريض',
  SURGERY: 'عملية جراحية',
  CONSULTATION: 'استشارة',
};

const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  RESERVED: 'محجوز',
  ACTIVE: 'نشط',
  COMPLETED: 'منتهي',
  CANCELLED: 'ملغي',
};

const defaultCreateForm = {
  roomId: 0,
  bedId: 0,
  patientId: 0,
  doctorId: 0,
  visitId: 0,
  reservationType: ReservationType.PATIENT_STAY,
  startDate: '',
  endDate: '',
  notes: '',
};

export default function RoomReservationsPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuthStore();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isReceptionist = user?.role === UserRole.RECEPTIONIST;
  const isNurse = user?.role === UserRole.NURSE;

  const canCreate = isAdmin || isReceptionist || isNurse;
  const canActivate = (r: RoomReservation) =>
    r.status === ReservationStatus.RESERVED && (isAdmin || isNurse);
  const canComplete = (r: RoomReservation) =>
    r.status === ReservationStatus.ACTIVE && (isAdmin || isNurse || isReceptionist);
  const canCancel = (r: RoomReservation) =>
    (r.status === ReservationStatus.RESERVED || r.status === ReservationStatus.ACTIVE) &&
    (isAdmin || isReceptionist);
  const canEdit = (r: RoomReservation) =>
    (r.status === ReservationStatus.RESERVED || r.status === ReservationStatus.ACTIVE) &&
    (isAdmin || isReceptionist || isNurse);

  const [reservations, setReservations] = useState<RoomReservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<RoomReservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [editForm, setEditForm] = useState({ endDate: '', notes: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resData, roomsData, patientsData, doctorsData] = await Promise.all([
        roomReservationsApi.getAll(),
        roomsApi.getAll(),
        patientsApi.getAll(),
        doctorsApi.getAll(),
      ]);
      setReservations(resData);
      setRooms(roomsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const data = await roomReservationsApi.getAll();
      setReservations(data);
    } catch {
      toast.error('فشل تحميل الحجوزات');
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterType && r.reservationType !== filterType) return false;
    return true;
  });

  // الأسرة المتاحة للغرفة المختارة
  const availableBeds =
    rooms
      .find((r) => r.id === createForm.roomId)
      ?.beds?.filter((b) => b.status === BedStatus.AVAILABLE) || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.roomId) {
      toast.error('يرجى اختيار الغرفة');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        roomId: createForm.roomId,
        reservationType: createForm.reservationType,
        startDate: new Date(createForm.startDate).toISOString(),
      };
      if (createForm.bedId) payload.bedId = createForm.bedId;
      if (createForm.patientId) payload.patientId = createForm.patientId;
      if (createForm.doctorId) payload.doctorId = createForm.doctorId;
      if (createForm.visitId) payload.visitId = createForm.visitId;
      if (createForm.endDate) payload.endDate = new Date(createForm.endDate).toISOString();
      if (createForm.notes) payload.notes = createForm.notes;

      await roomReservationsApi.create(payload);
      toast.success('تم إنشاء الحجز بنجاح');
      setShowCreateModal(false);
      setCreateForm(defaultCreateForm);
      fetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إنشاء الحجز');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;
    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (editForm.endDate) payload.endDate = new Date(editForm.endDate).toISOString();
      if (editForm.notes !== undefined) payload.notes = editForm.notes;
      await roomReservationsApi.update(editingReservation.id, payload);
      toast.success('تم تحديث الحجز بنجاح');
      setShowEditModal(false);
      setEditingReservation(null);
      fetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الحجز');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: number) => {
    const confirmed = await confirm({ title: 'تفعيل الحجز', message: 'هل تريد تفعيل هذا الحجز؟ سيصبح المريض داخل الغرفة فعلياً.', confirmText: 'تفعيل', type: 'info' });
    if (!confirmed) return;
    try {
      await roomReservationsApi.activate(id);
      toast.success('تم تفعيل الحجز بنجاح');
      fetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تفعيل الحجز');
    }
  };

  const handleComplete = async (id: number) => {
    const confirmed = await confirm({ title: 'إنهاء الحجز', message: 'هل تريد إنهاء هذا الحجز وتصريح المريض؟', confirmText: 'إنهاء', type: 'warning' });
    if (!confirmed) return;
    try {
      await roomReservationsApi.complete(id);
      toast.success('تم تصريح المريض وإنهاء الحجز بنجاح');
      fetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إنهاء الحجز');
    }
  };

  const handleCancel = async (id: number) => {
    const confirmed = await confirm({ title: 'إلغاء الحجز', message: 'هل تريد إلغاء هذا الحجز؟', confirmText: 'إلغاء الحجز', type: 'danger' });
    if (!confirmed) return;
    try {
      await roomReservationsApi.cancel(id);
      toast.success('تم إلغاء الحجز');
      fetchReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إلغاء الحجز');
    }
  };

  const openEditModal = (reservation: RoomReservation) => {
    setEditingReservation(reservation);
    setEditForm({
      endDate: reservation.endDate
        ? reservation.endDate.slice(0, 16)
        : '',
      notes: reservation.notes || '',
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.RESERVED:
        return 'bg-blue-100 text-blue-800';
      case ReservationStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case ReservationStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case ReservationStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
    }
  };

  const getTypeColor = (type: ReservationType) => {
    switch (type) {
      case ReservationType.PATIENT_STAY:
        return 'bg-blue-100 text-blue-700';
      case ReservationType.SURGERY:
        return 'bg-purple-100 text-purple-700';
      case ReservationType.CONSULTATION:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">حجوزات الغرف</h1>
          <p className="text-gray-600 mt-2">إدارة حجوزات وإقامة المرضى</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            حجز جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">كل الحالات</option>
          {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">كل الأنواع</option>
          {Object.entries(RESERVATION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center">
          {filteredReservations.length} حجز
        </span>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CalendarCheck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا توجد حجوزات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReservations.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400">حجز #{res.id}</p>
                  <h3 className="text-lg font-bold text-gray-900">
                    غرفة {res.room?.roomNumber || res.roomId}
                  </h3>
                  {res.bed && (
                    <p className="text-sm text-gray-500">سرير {res.bed.bedNumber}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    res.status
                  )}`}
                >
                  {RESERVATION_STATUS_LABELS[res.status]}
                </span>
              </div>

              {/* Type Badge */}
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getTypeColor(
                  res.reservationType
                )}`}
              >
                {RESERVATION_TYPE_LABELS[res.reservationType]}
              </span>

              {/* Patient & Doctor */}
              <div className="space-y-1 mb-3 text-sm">
                {res.patient && (
                  <div>
                    <span className="text-gray-500">المريض: </span>
                    <span className="font-medium text-gray-900">
                      {res.patient.fullName}
                    </span>
                  </div>
                )}
                {res.doctor && (
                  <div>
                    <span className="text-gray-500">الطبيب: </span>
                    <span className="font-medium text-gray-900">
                      {res.doctor.user?.fullName}
                    </span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-1 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">تاريخ البدء: </span>
                  <span className="text-gray-900">{formatDate(res.startDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">تاريخ الانتهاء: </span>
                  <span className="text-gray-900">{formatDate(res.endDate)}</span>
                </div>
              </div>

              {/* Notes */}
              {res.notes && (
                <p className="text-sm text-gray-500 mb-3 italic">{res.notes}</p>
              )}

              {/* Action Buttons */}
              {(canActivate(res) || canComplete(res) || canCancel(res) || canEdit(res)) && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  {canActivate(res) && (
                    <button
                      onClick={() => handleActivate(res.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    >
                      <PlayCircle size={14} />
                      تفعيل
                    </button>
                  )}
                  {canComplete(res) && (
                    <button
                      onClick={() => handleComplete(res.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <CheckCircle size={14} />
                      تصريح
                    </button>
                  )}
                  {canEdit(res) && (
                    <button
                      onClick={() => openEditModal(res)}
                      className="flex items-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
                    >
                      <Edit2 size={14} />
                      تعديل
                    </button>
                  )}
                  {canCancel(res) && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <XCircle size={14} />
                      إلغاء
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Reservation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">إنشاء حجز جديد</h2>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Reservation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحجز *
                </label>
                <select
                  required
                  value={createForm.reservationType}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      reservationType: e.target.value as ReservationType,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  {Object.entries(RESERVATION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room & Bed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الغرفة *
                  </label>
                  <select
                    required
                    value={createForm.roomId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        roomId: parseInt(e.target.value),
                        bedId: 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value={0}>اختر الغرفة</option>
                    {rooms
                      .filter((r) => r.status !== 'UNDER_MAINTENANCE')
                      .map((room) => (
                        <option key={room.id} value={room.id}>
                          غرفة {room.roomNumber} - {room.status === 'AVAILABLE' ? 'متاحة' : 'مشغولة'}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السرير (اختياري)
                  </label>
                  <select
                    value={createForm.bedId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, bedId: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    disabled={!createForm.roomId || availableBeds.length === 0}
                  >
                    <option value={0}>
                      {!createForm.roomId
                        ? 'اختر الغرفة أولاً'
                        : availableBeds.length === 0
                        ? 'لا توجد أسرة متاحة'
                        : 'اختر السرير'}
                    </option>
                    {availableBeds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        سرير {bed.bedNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient (مطلوب لـ PATIENT_STAY و SURGERY) */}
              {createForm.reservationType !== ReservationType.CONSULTATION && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المريض *
                  </label>
                  <select
                    required
                    value={createForm.patientId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, patientId: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    <option value={0}>اختر المريض</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الطبيب المسؤول (اختياري)
                </label>
                <select
                  value={createForm.doctorId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, doctorId: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value={0}>اختر الطبيب</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user?.fullName}
                      {d.speciality ? ` - ${d.speciality}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ البدء *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ الانتهاء
                    {createForm.reservationType !== ReservationType.PATIENT_STAY
                      ? ' *'
                      : ' (مفتوح)'}
                  </label>
                  <input
                    type="datetime-local"
                    required={createForm.reservationType !== ReservationType.PATIENT_STAY}
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
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
                  {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الحجز'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm(defaultCreateForm);
                  }}
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

      {/* Edit Reservation Modal */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                تعديل الحجز #{editingReservation.id}
              </h2>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الانتهاء
                </label>
                <input
                  type="datetime-local"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أي ملاحظات..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReservation(null);
                  }}
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
