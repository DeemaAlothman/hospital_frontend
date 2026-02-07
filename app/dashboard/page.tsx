'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { User, Users, Stethoscope, ClipboardList, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          مرحباً بك، {user.fullName}
        </h1>
        <p className="text-gray-600 mt-2">
          {getRoleLabel(user.role)} - نظام إدارة المستشفى
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="text-blue-600" size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              معلومات المستخدم
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">الاسم الكامل</p>
                <p className="text-base font-medium text-gray-900">
                  {user.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                <p className="text-base font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الدور الوظيفي</p>
                <p className="text-base font-medium text-gray-900">
                  {getRoleLabel(user.role)}
                </p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-gray-600">رقم الهاتف</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.phone}
                  </p>
                </div>
              )}
              {user.specialization && (
                <div>
                  <p className="text-sm text-gray-600">التخصص</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.specialization}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="الموظفين"
          count={0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="الأطباء"
          count={0}
          icon={Stethoscope}
          color="green"
        />
        <StatCard
          title="الزيارات"
          count={0}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="المواعيد"
          count={0}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">مرحباً بك في نظام إدارة المستشفى</h2>
        <p className="text-blue-100">
          النظام جاهز للاستخدام. يمكنك البدء بإدارة الموظفين والأطباء والزيارات والمواعيد من القائمة الجانبية.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, count, icon: Icon, color }: any) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{count}</p>
        </div>
        <div className={`${colors.bg} p-3 rounded-full`}>
          <Icon className={colors.text} size={28} />
        </div>
      </div>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    ADMIN: 'مدير النظام',
    DOCTOR: 'طبيب',
    NURSE: 'ممرض/ممرضة',
    RECEPTIONIST: 'موظف استقبال',
    LAB_TECH: 'فني مختبر',
    RADIOLOGY_TECH: 'فني أشعة',
    PHARMACIST: 'صيدلي',
    CASHIER: 'محاسب',
  };

  return roleLabels[role] || role;
}
