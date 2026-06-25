'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  ClipboardList,
  UserPlus,
  Pill,
  FileText,
  FlaskConical,
  ScanLine,
  Receipt,
  Clipboard,
  LogOut,
  BedDouble,
  CalendarCheck,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { toast } from 'react-toastify';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[]; // الأدوار المسموح لها برؤية هذا العنصر
}

const allMenuItems: MenuItem[] = [
  { name: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard }, // للجميع

  // Role-specific dashboards
  { name: 'لوحة الاستقبال', href: '/dashboard/reception', icon: Clipboard, roles: ['RECEPTIONIST'] },
  { name: 'لوحة الصيدلية', href: '/dashboard/pharmacy', icon: Pill, roles: ['PHARMACIST'] },
  { name: 'لوحة المختبر', href: '/dashboard/lab-tech', icon: FlaskConical, roles: ['LAB_TECH'] },
  { name: 'لوحة الأشعة', href: '/dashboard/radiology-tech', icon: ScanLine, roles: ['RADIOLOGY_TECH'] },
  { name: 'لوحة المحاسب', href: '/dashboard/cashier', icon: Receipt, roles: ['CASHIER'] },

  // Admin pages
  { name: 'الموظفين', href: '/dashboard/staff', icon: Users, roles: ['ADMIN'] },
  { name: 'الأطباء', href: '/dashboard/doctors', icon: Stethoscope, roles: ['ADMIN'] },
  { name: 'المرضى', href: '/dashboard/patients', icon: UserPlus, roles: ['ADMIN', 'NURSE', 'RECEPTIONIST'] },
  { name: 'الزيارات', href: '/dashboard/visits', icon: ClipboardList, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { name: 'المواعيد', href: '/dashboard/appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { name: 'الأدوية', href: '/dashboard/medicines', icon: Pill, roles: ['ADMIN', 'PHARMACIST'] },
  { name: 'الوصفات الطبية', href: '/dashboard/prescriptions', icon: FileText, roles: ['ADMIN', 'DOCTOR'] },

  // Doctor-specific pages
  { name: 'طلبات التحاليل', href: '/dashboard/doctor-lab-requests', icon: FlaskConical, roles: ['DOCTOR'] },
  { name: 'طلبات الأشعة', href: '/dashboard/doctor-radiology-requests', icon: ScanLine, roles: ['DOCTOR'] },

  // Admin lab/radiology
  { name: 'المختبر', href: '/dashboard/lab', icon: FlaskConical, roles: ['ADMIN', 'LAB_TECH', 'NURSE'] },
  { name: 'الأشعة', href: '/dashboard/radiology', icon: ScanLine, roles: ['ADMIN', 'RADIOLOGY_TECH', 'NURSE'] },
  { name: 'الفواتير', href: '/dashboard/invoices', icon: Receipt, roles: ['ADMIN', 'CASHIER'] },

  // Rooms & Reservations
  { name: 'الغرف', href: '/dashboard/rooms', icon: BedDouble, roles: ['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'] },
  { name: 'حجوزات الغرف', href: '/dashboard/room-reservations', icon: CalendarCheck, roles: ['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمة السر الجديدة وتأكيدها غير متطابقين');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('تم تغيير كلمة السر بنجاح');
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تغيير كلمة السر');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تصفية القوائم بناءً على دور المستخدم
  const menuItems = allMenuItems.filter(item => {
    // إذا لم يكن هناك قيود على الأدوار، اعرض العنصر للجميع
    if (!item.roles || item.roles.length === 0) return true;
    // إذا كان هناك قيود، تحقق من أن دور المستخدم موجود في القائمة
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="h-screen w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">نظام المستشفى</h1>
        {user && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <button
          onClick={() => setShowChangePassword(true)}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <KeyRound size={20} />
          <span className="font-medium">تغيير كلمة السر</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">تغيير كلمة السر</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة السر الحالية *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أدخل كلمة السر الحالية"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة السر الجديدة *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="6 أحرف على الأقل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة السر *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="أعد كتابة كلمة السر الجديدة"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowChangePassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
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
