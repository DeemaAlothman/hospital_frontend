'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Edit2, Trash2, Wrench, BedDouble } from 'lucide-react';
import {
  Room,
  RoomType,
  RoomStatus,
  BedStatus,
  UserRole,
} from '@/types';
import { roomsApi } from '@/lib/api/rooms';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-toastify';
import { useConfirm } from '@/hooks/useConfirm';

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  GENERAL: 'عامة',
  ICU: 'عناية مركزة',
  SURGERY: 'جراحة',
  CONSULTATION: 'استشارة',
  PRIVATE: 'خاصة',
};

const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'متاحة',
  OCCUPIED: 'مشغولة',
  UNDER_MAINTENANCE: 'صيانة',
};

type RoomFormData = {
  roomNumber: string;
  type: RoomType;
  floor: number;
  nightlyRate: number;
  description: string;
  status: RoomStatus;
};

const defaultForm: RoomFormData = {
  roomNumber: '',
  type: RoomType.GENERAL,
  floor: 1,
  nightlyRate: 100,
  description: '',
  status: RoomStatus.AVAILABLE,
};

export default function RoomsPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showBedModal, setShowBedModal] = useState(false);
  const [bedRoomId, setBedRoomId] = useState<number | null>(null);
  const [bedNumber, setBedNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState<RoomFormData>(defaultForm);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch {
      toast.error('فشل تحميل الغرف');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (filterType && room.type !== filterType) return false;
    if (filterStatus && room.status !== filterStatus) return false;
    return true;
  });

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await roomsApi.update(editingRoom.id, {
          type: formData.type,
          floor: formData.floor,
          nightlyRate: formData.nightlyRate,
          description: formData.description || undefined,
          status: formData.status,
        });
        toast.success('تم تحديث الغرفة بنجاح');
      } else {
        await roomsApi.create({
          roomNumber: formData.roomNumber,
          type: formData.type,
          floor: formData.floor,
          nightlyRate: formData.nightlyRate,
          description: formData.description || undefined,
        });
        toast.success('تم إضافة الغرفة بنجاح');
      }
      handleCloseModal();
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      type: room.type,
      floor: room.floor,
      nightlyRate: parseFloat(room.nightlyRate),
      description: room.description || '',
      status: room.status,
    });
    setShowRoomModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من حذف هذه الغرفة؟', confirmText: 'حذف', type: 'danger' });
    if (!confirmed) return;
    try {
      await roomsApi.delete(id);
      toast.success('تم حذف الغرفة بنجاح');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'لا يمكن حذف الغرفة، تأكد أنه لا يوجد حجز نشط');
    }
  };

  const handleToggleMaintenance = async (room: Room) => {
    const action = room.status === RoomStatus.UNDER_MAINTENANCE ? 'تفعيل الغرفة' : 'وضعها في الصيانة';
    const confirmed2 = await confirm({ title: 'تأكيد الإجراء', message: `هل تريد ${action}؟`, confirmText: 'تأكيد', type: 'warning' });
    if (!confirmed2) return;
    try {
      await roomsApi.toggleMaintenance(room.id);
      toast.success('تم تغيير حالة الغرفة بنجاح');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تغيير حالة الغرفة');
    }
  };

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedRoomId) return;
    setIsSubmitting(true);
    try {
      await roomsApi.addBed(bedRoomId, { bedNumber });
      toast.success('تم إضافة السرير بنجاح');
      setBedNumber('');
      setShowBedModal(false);
      setBedRoomId(null);
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إضافة السرير');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
    setFormData(defaultForm);
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case RoomStatus.OCCUPIED:
        return 'bg-red-100 text-red-800';
      case RoomStatus.UNDER_MAINTENANCE:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getTypeColor = (type: RoomType) => {
    switch (type) {
      case RoomType.GENERAL:
        return 'bg-blue-100 text-blue-800';
      case RoomType.ICU:
        return 'bg-red-100 text-red-800';
      case RoomType.SURGERY:
        return 'bg-purple-100 text-purple-800';
      case RoomType.CONSULTATION:
        return 'bg-yellow-100 text-yellow-800';
      case RoomType.PRIVATE:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الغرف</h1>
          <p className="text-gray-600 mt-2">عرض وإدارة غرف المستشفى</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowRoomModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            إضافة غرفة جديدة
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">كل الأنواع</option>
          {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">كل الحالات</option>
          {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center">
          {filteredRooms.length} غرفة
        </span>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا توجد غرف</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    غرفة {room.roomNumber}
                  </h3>
                  <p className="text-sm text-gray-500">الطابق {room.floor}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    room.status
                  )}`}
                >
                  {ROOM_STATUS_LABELS[room.status]}
                </span>
              </div>

              {/* Type Badge */}
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getTypeColor(
                  room.type
                )}`}
              >
                {ROOM_TYPE_LABELS[room.type]}
              </span>

              {/* Nightly Rate */}
              <div className="text-sm text-gray-600 mb-3">
                <span className="font-medium">السعر الليلي: </span>
                <span className="text-gray-900 font-semibold">
                  {parseFloat(room.nightlyRate).toLocaleString()} ₪
                </span>
              </div>

              {/* Description */}
              {room.description && (
                <p className="text-sm text-gray-500 mb-3">{room.description}</p>
              )}

              {/* Beds */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    الأسرة ({room.beds?.length || 0})
                  </span>
                </div>
                {room.beds && room.beds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {room.beds.map((bed) => (
                      <span
                        key={bed.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          bed.status === BedStatus.OCCUPIED
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        سرير {bed.bedNumber}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(room)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Edit2 size={14} />
                    تعديل
                  </button>
                  <button
                    onClick={() => {
                      setBedRoomId(room.id);
                      setShowBedModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <Plus size={14} />
                    سرير
                  </button>
                  {room.status !== RoomStatus.OCCUPIED && (
                    <button
                      onClick={() => handleToggleMaintenance(room)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                        room.status === RoomStatus.UNDER_MAINTENANCE
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      }`}
                    >
                      <Wrench size={14} />
                      {room.status === RoomStatus.UNDER_MAINTENANCE
                        ? 'تفعيل'
                        : 'صيانة'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                    حذف
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Room Create/Edit Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRoom ? 'تعديل الغرفة' : 'إضافة غرفة جديدة'}
              </h2>
            </div>
            <form onSubmit={handleSubmitRoom} className="p-6 space-y-4">
              {!editingRoom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الغرفة *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, roomNumber: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    placeholder="مثال: 101، 212..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النوع *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as RoomType })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطابق *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر الليلي (₪) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={formData.nightlyRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nightlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="مثال: 100"
                />
              </div>

              {editingRoom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as RoomStatus })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  >
                    {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="وصف الغرفة..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'جاري الحفظ...'
                    : editingRoom
                    ? 'حفظ التعديلات'
                    : 'إضافة الغرفة'}
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

      {/* Add Bed Modal */}
      {showBedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">إضافة سرير</h2>
            </div>
            <form onSubmit={handleAddBed} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم/رمز السرير *
                </label>
                <input
                  type="text"
                  required
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="مثال: A, B, 1, 2..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الإضافة...' : 'إضافة السرير'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBedModal(false);
                    setBedRoomId(null);
                    setBedNumber('');
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
