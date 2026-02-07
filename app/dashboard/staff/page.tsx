"use client";

import { useState, useEffect } from "react";
import { Plus, User as UserIcon, Trash2 } from "lucide-react";
import { RegisterDto, UserRole, User } from "@/types";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { toast } from "react-toastify";

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RegisterDto>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: UserRole.NURSE,
  });

  // جلب الموظفين عند تحميل الصفحة
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error: any) {
      toast.error("فشل تحميل الموظفين");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authApi.register(formData);
      toast.success("تم إضافة الموظف بنجاح");
      setShowModal(false);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        role: UserRole.NURSE,
      });
      // ✅ جلب الموظفين من جديد بعد الإضافة
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل إضافة الموظف");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الموظفين</h1>
          <p className="text-gray-600 mt-2">إضافة وإدارة الموظفين في النظام</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          إضافة موظف جديد
        </button>
      </div>
      {/* Staff List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <UserIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">لا يوجد موظفين في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserIcon className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.fullName}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">الدور: </span>
                  <span className="text-sm font-medium text-gray-900">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                {user.phone && (
                  <div>
                    <span className="text-sm text-gray-600">الهاتف: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {user.phone}
                    </span>
                  </div>
                )}
                {user.specialization && (
                  <div>
                    <span className="text-sm text-gray-600">التخصص: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {user.specialization}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                إضافة موظف جديد
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="example@hospital.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="05xxxxxxxx"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدور الوظيفي *
                </label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value={UserRole.ADMIN}>مدير النظام</option>
                  <option value={UserRole.DOCTOR}>طبيب</option>
                  <option value={UserRole.NURSE}>ممرض/ممرضة</option>
                  <option value={UserRole.RECEPTIONIST}>موظف استقبال</option>
                  <option value={UserRole.LAB_TECH}>فني مختبر</option>
                  <option value={UserRole.RADIOLOGY_TECH}>فني أشعة</option>
                  <option value={UserRole.PHARMACIST}>صيدلي</option>
                  <option value={UserRole.CASHIER}>محاسب</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "جاري الإضافة..." : "إضافة الموظف"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    ADMIN: "مدير النظام",
    DOCTOR: "طبيب",
    NURSE: "ممرض/ممرضة",
    RECEPTIONIST: "موظف استقبال",
    LAB_TECH: "فني مختبر",
    RADIOLOGY_TECH: "فني أشعة",
    PHARMACIST: "صيدلي",
    CASHIER: "محاسب",
  };

  return roleLabels[role] || role;
}
