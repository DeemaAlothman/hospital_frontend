'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  User, Users, Stethoscope, ClipboardList, Calendar,
  Pill, FileText, FlaskConical, ScanLine, Receipt,
  Clipboard, BedDouble, CalendarCheck, ArrowLeft,
} from 'lucide-react';
import { invoicesApi } from '@/lib/api/invoices';
import { InvoiceStats, UserRole } from '@/types';
import Link from 'next/link';

// ========== Quick links per role ==========
const roleConfig: Partial<Record<UserRole, {
  title: string;
  description: string;
  links: { name: string; href: string; icon: any; color: string }[];
}>> = {
  [UserRole.DOCTOR]: {
    title: 'لوحة الطبيب',
    description: 'الوصول السريع لأدواتك الطبية',
    links: [
      { name: 'المواعيد', href: '/dashboard/appointments', icon: Calendar, color: 'blue' },
      { name: 'الزيارات', href: '/dashboard/visits', icon: ClipboardList, color: 'green' },
      { name: 'الوصفات الطبية', href: '/dashboard/prescriptions', icon: FileText, color: 'purple' },
      { name: 'طلبات التحاليل', href: '/dashboard/doctor-lab-requests', icon: FlaskConical, color: 'orange' },
      { name: 'طلبات الأشعة', href: '/dashboard/doctor-radiology-requests', icon: ScanLine, color: 'red' },
      { name: 'الغرف والحجوزات', href: '/dashboard/room-reservations', icon: BedDouble, color: 'teal' },
    ],
  },
  [UserRole.NURSE]: {
    title: 'لوحة التمريض',
    description: 'متابعة المرضى والزيارات',
    links: [
      { name: 'المرضى', href: '/dashboard/patients', icon: Users, color: 'blue' },
      { name: 'الزيارات', href: '/dashboard/visits', icon: ClipboardList, color: 'green' },
      { name: 'الغرف', href: '/dashboard/rooms', icon: BedDouble, color: 'purple' },
      { name: 'حجوزات الغرف', href: '/dashboard/room-reservations', icon: CalendarCheck, color: 'orange' },
    ],
  },
  [UserRole.RECEPTIONIST]: {
    title: 'لوحة الاستقبال',
    description: 'إدارة المرضى والمواعيد',
    links: [
      { name: 'لوحة الاستقبال', href: '/dashboard/reception', icon: Clipboard, color: 'blue' },
      { name: 'المرضى', href: '/dashboard/patients', icon: Users, color: 'green' },
      { name: 'المواعيد', href: '/dashboard/appointments', icon: Calendar, color: 'purple' },
      { name: 'الغرف', href: '/dashboard/rooms', icon: BedDouble, color: 'orange' },
      { name: 'حجوزات الغرف', href: '/dashboard/room-reservations', icon: CalendarCheck, color: 'teal' },
    ],
  },
  [UserRole.LAB_TECH]: {
    title: 'لوحة المختبر',
    description: 'معالجة طلبات التحاليل وإدخال النتائج',
    links: [
      { name: 'طلبات التحاليل', href: '/dashboard/lab-tech', icon: FlaskConical, color: 'blue' },
      { name: 'الفواتير', href: '/dashboard/lab-tech', icon: Receipt, color: 'green' },
    ],
  },
  [UserRole.RADIOLOGY_TECH]: {
    title: 'لوحة الأشعة',
    description: 'معالجة طلبات الأشعة وإدخال التقارير',
    links: [
      { name: 'طلبات الأشعة', href: '/dashboard/radiology-tech', icon: ScanLine, color: 'blue' },
      { name: 'الفواتير', href: '/dashboard/radiology-tech', icon: Receipt, color: 'green' },
    ],
  },
  [UserRole.PHARMACIST]: {
    title: 'لوحة الصيدلية',
    description: 'صرف الأدوية وإدارة المخزون',
    links: [
      { name: 'لوحة الصيدلية', href: '/dashboard/pharmacy', icon: Pill, color: 'blue' },
      { name: 'الأدوية', href: '/dashboard/medicines', icon: Pill, color: 'green' },
      { name: 'الفواتير', href: '/dashboard/pharmacy', icon: Receipt, color: 'purple' },
    ],
  },
  [UserRole.CASHIER]: {
    title: 'لوحة المحاسبة',
    description: 'إدارة الفواتير والمدفوعات',
    links: [
      { name: 'لوحة المحاسب', href: '/dashboard/cashier', icon: Receipt, color: 'blue' },
      { name: 'الفواتير', href: '/dashboard/invoices', icon: Receipt, color: 'green' },
    ],
  },
};

const colorClasses: Record<string, { bg: string; text: string; hover: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   hover: 'hover:bg-blue-100' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  hover: 'hover:bg-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    hover: 'hover:bg-red-100' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   hover: 'hover:bg-teal-100' },
};

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore();
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats[]>([]);

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      invoicesApi.getStats().then(setInvoiceStats).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ===== ADMIN dashboard — unchanged =====
  if (user.role === UserRole.ADMIN) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">مرحباً بك، {user.fullName}</h1>
          <p className="text-gray-600 mt-2">{getRoleLabel(user.role)} - نظام إدارة المستشفى</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات المستخدم</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الاسم الكامل</p>
                  <p className="text-base font-medium text-gray-900">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                  <p className="text-base font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الدور الوظيفي</p>
                  <p className="text-base font-medium text-gray-900">{getRoleLabel(user.role)}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="text-base font-medium text-gray-900">{user.phone}</p>
                  </div>
                )}
                {user.specialization && (
                  <div>
                    <p className="text-sm text-gray-600">التخصص</p>
                    <p className="text-base font-medium text-gray-900">{user.specialization}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="الموظفين"  count={0} icon={Users}         color="blue"   />
          <StatCard title="الأطباء"   count={0} icon={Stethoscope}   color="green"  />
          <StatCard title="الزيارات"  count={0} icon={ClipboardList} color="purple" />
          <StatCard title="المواعيد"  count={0} icon={Calendar}      color="orange" />
        </div>

        <div className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">مرحباً بك في نظام إدارة المستشفى</h2>
          <p className="text-blue-100">
            النظام جاهز للاستخدام. يمكنك البدء بإدارة الموظفين والأطباء والزيارات والمواعيد من القائمة الجانبية.
          </p>
        </div>

        {invoiceStats.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">إيرادات الأقسام</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoiceStats.map((stat) => (
                <div key={stat.department} className="bg-white rounded-lg shadow-md p-5">
                  <p className="text-sm text-gray-500 mb-1">{getDepartmentLabel(stat.department)}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {parseFloat(stat.totalRevenue).toLocaleString('ar-SA')} ر.س
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.totalItems} عنصر</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== Other roles — dynamic dashboard =====
  const config = roleConfig[user.role as UserRole];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">مرحباً، {user.fullName}</h1>
        <p className="text-gray-600 mt-1">{getRoleLabel(user.role)} — نظام إدارة المستشفى</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="text-blue-600" size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات الحساب</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="text-base font-medium text-gray-900">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                <p className="text-base font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الوظيفة</p>
                <p className="text-base font-medium text-gray-900">{getRoleLabel(user.role)}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-gray-600">الهاتف</p>
                  <p className="text-base font-medium text-gray-900">{user.phone}</p>
                </div>
              )}
              {user.specialization && (
                <div>
                  <p className="text-sm text-gray-600">التخصص</p>
                  <p className="text-base font-medium text-gray-900">{user.specialization}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Quick Links */}
      {config && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-gray-500 mt-1">{config.description}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.links.map((link) => {
              const Icon = link.icon;
              const colors = colorClasses[link.color] || colorClasses.blue;
              return (
                <Link
                  key={link.href + link.name}
                  href={link.href}
                  className={`flex items-center justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md ${colors.hover} group`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${colors.bg} p-3 rounded-lg`}>
                      <Icon className={colors.text} size={24} />
                    </div>
                    <span className="font-semibold text-gray-800">{link.name}</span>
                  </div>
                  <ArrowLeft className="text-gray-400 group-hover:text-gray-600 transition-colors" size={18} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, icon: Icon, color }: any) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue:   { bg: 'bg-blue-100',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-100',  text: 'text-green-600' },
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

function getDepartmentLabel(department: string): string {
  const labels: Record<string, string> = {
    CONSULTATION: 'الاستشارات',
    LAB:          'المختبر',
    RADIOLOGY:    'الأشعة',
    PHARMACY:     'الصيدلية',
    ROOM:         'الغرف',
    OTHER:        'أخرى',
  };
  return labels[department] || department;
}

function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    ADMIN:           'مدير النظام',
    DOCTOR:          'طبيب',
    NURSE:           'ممرض/ممرضة',
    RECEPTIONIST:    'موظف استقبال',
    LAB_TECH:        'فني مختبر',
    RADIOLOGY_TECH:  'فني أشعة',
    PHARMACIST:      'صيدلي',
    CASHIER:         'محاسب',
  };
  return roleLabels[role] || role;
}
