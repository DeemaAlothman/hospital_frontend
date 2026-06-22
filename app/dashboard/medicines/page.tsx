'use client';

import { useState, useEffect } from 'react';
import { Plus, Pill, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Medicine, CreateMedicineDto } from '@/types';
import { medicinesApi } from '@/lib/api/medicines';
import { toast } from 'react-toastify';
import { useConfirm } from '@/hooks/useConfirm';

export default function MedicinesPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateMedicineDto>({
    name: '',
    category: '',
    stock: 0,
    price: '0',
    expirationDate: '',
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await medicinesApi.getAll();
      setMedicines(data);
    } catch (error: any) {
      toast.error('فشل تحميل الأدوية');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMedicine) {
        await medicinesApi.update(editingMedicine.id, formData);
        toast.success('تم تحديث الدواء بنجاح');
      } else {
        await medicinesApi.create(formData);
        toast.success('تم إضافة الدواء بنجاح');
      }
      handleCloseModal();
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      category: medicine.category || '',
      stock: medicine.stock,
      price: medicine.price,
      expirationDate: medicine.expirationDate ? medicine.expirationDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا الدواء؟ سيؤثر ذلك على الوصفات الطبية المرتبطة.',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await medicinesApi.delete(id);
      toast.success('تم حذف الدواء بنجاح');
      fetchMedicines();
    } catch (error: any) {
      toast.error('فشل حذف الدواء');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMedicine(null);
    setFormData({
      name: '',
      category: '',
      stock: 0,
      price: '0',
      expirationDate: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'stock' ? parseInt(value) || 0 : value,
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأدوية</h1>
          <p className="text-gray-600 mt-2">عرض وإدارة جميع الأدوية في المستودع</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          إضافة دواء جديد
        </button>
      </div>

      {/* Medicines List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Pill className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا يوجد أدوية في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((medicine) => (
            <div
              key={medicine.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative"
            >
              {/* Warning Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isExpired(medicine.expirationDate) && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} />
                    منتهي الصلاحية
                  </span>
                )}
                {!isExpired(medicine.expirationDate) && isExpiringSoon(medicine.expirationDate) && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} />
                    يقترب من الانتهاء
                  </span>
                )}
                {isLowStock(medicine.stock) && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} />
                    مخزون منخفض
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4 mb-4 mt-8">
                <div className="p-3 rounded-full bg-green-100">
                  <Pill className="text-green-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {medicine.name}
                  </h3>
                  {medicine.category && (
                    <p className="text-sm text-gray-600">{medicine.category}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">السعر:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parseFloat(medicine.price).toFixed(2)} ريال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">المخزون:</span>
                  <span className={`text-sm font-semibold ${
                    isLowStock(medicine.stock) ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {medicine.stock}
                  </span>
                </div>
                {medicine.expirationDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">تاريخ الانتهاء:</span>
                    <span className={`text-sm font-semibold ${
                      isExpired(medicine.expirationDate) ? 'text-red-600' :
                      isExpiringSoon(medicine.expirationDate) ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {new Date(medicine.expirationDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(medicine)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={16} />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(medicine.id)}
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
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الدواء *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أدخل اسم الدواء"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفئة
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="مثال: مسكنات، مضادات حيوية، فيتامينات..."
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر (ريال) *
                  </label>
                  <input
                    type="text"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية المتاحة *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ انتهاء الصلاحية
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
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
                    : editingMedicine
                    ? 'حفظ التعديلات'
                    : 'إضافة الدواء'}
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
