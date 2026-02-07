# دليل إعداد نظام إدارة المستشفى - Frontend

## المكتبات المثبتة ✅

### المكتبات الأساسية
- **Next.js 16.0.10** - Framework
- **React 19.2.1** - المكتبة الأساسية
- **TypeScript 5** - للكتابة الآمنة

### إدارة الحالة والبيانات
- **Zustand 5.0.9** - State Management
- **@tanstack/react-query 5.90.12** - Server State Management
- **Axios 1.13.2** - HTTP Client

### النماذج والتحقق
- **react-hook-form 7.68.0** - إدارة النماذج
- **zod 4.2.1** - Schema Validation
- **@hookform/resolvers 5.2.2** - ربط zod مع react-hook-form

### واجهة المستخدم
- **Tailwind CSS 4** - CSS Framework
- **react-toastify 11.0.5** - إشعارات
- **lucide-react 0.561.0** - أيقونات

## البنية الأساسية للمشروع 📁

```
hospital-frontend/
├── app/
│   ├── login/
│   │   └── page.tsx          # صفحة تسجيل الدخول
│   ├── dashboard/
│   │   └── page.tsx          # الصفحة الرئيسية
│   ├── layout.tsx            # Layout الرئيسي
│   └── page.tsx              # الصفحة الافتراضية
├── components/
│   └── providers/
│       └── AuthProvider.tsx  # Provider للـ authentication
├── lib/
│   └── api/
│       ├── client.ts         # Axios client
│       └── auth.ts           # Auth API endpoints
├── stores/
│   └── authStore.ts          # Zustand store للـ authentication
├── types/
│   └── index.ts              # TypeScript types
├── middleware.ts             # Next.js middleware للحماية
└── .env.local                # متغيرات البيئة
```

## إعداد ملف .env.local 🔧

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: API Timeout
NEXT_PUBLIC_API_TIMEOUT=10000
```

## الـ Endpoints المتاحة 🔌

### Authentication
✅ **POST /auth/login** - تسجيل الدخول
```typescript
Request: { email: string, password: string }
Response: { user: User, accessToken: string }
```

✅ **GET /auth/me** - الحصول على بيانات المستخدم الحالي
```typescript
Headers: { Authorization: 'Bearer <token>' }
Response: User
```

## الأدوار المتاحة 👥

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  LAB_TECH = 'LAB_TECH',
  RADIOLOGY_TECH = 'RADIOLOGY_TECH',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER',
}
```

## تشغيل المشروع 🚀

```bash
# تشغيل الـ development server
npm run dev

# بناء المشروع للـ production
npm run build

# تشغيل الـ production server
npm start

# فحص الكود
npm run lint
```

## الصفحات المكتملة ✅

1. **صفحة تسجيل الدخول** - `/login`
   - Form تسجيل الدخول
   - التحقق من البيانات
   - عرض رسائل الخطأ
   - Loading state

2. **صفحة Dashboard** - `/dashboard`
   - عرض معلومات المستخدم
   - إحصائيات سريعة
   - زر تسجيل الخروج
   - UI متجاوب

3. **Authentication Flow**
   - Middleware للحماية
   - AuthProvider للتحقق التلقائي
   - تخزين Token في localStorage
   - إعادة توجيه تلقائية

## بيانات الدخول الافتراضية 🔑

```
البريد الإلكتروني: admin@hospital.local
كلمة المرور: Admin@123456
```

## الخطوات التالية 📋

سأحتاج لقائمة الـ endpoints المتبقية من الـ Backend لإكمال:
- إدارة المرضى (Patients)
- إدارة الأطباء (Doctors)
- إدارة المواعيد (Appointments)
- إدارة الأقسام (Departments)
- إدارة الفواتير والمدفوعات
- التقارير والإحصائيات

## ملاحظات مهمة 📌

- المشروع يستخدم RTL (Right-to-Left) للغة العربية
- جميع الـ API calls محمية بـ JWT Token
- التوكن يُخزن في localStorage
- في حالة انتهاء صلاحية التوكن، يتم إعادة التوجيه لصفحة Login تلقائياً
- جميع الصفحات محمية ماعدا `/login`
