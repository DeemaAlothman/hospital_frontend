# دليل استخدام Confirm Dialog المخصص

## الملفات التي تم إنشاؤها

1. **`components/ConfirmDialog.tsx`** - مكون dialog التأكيد
2. **`hooks/useConfirm.tsx`** - Hook لتسهيل الاستخدام

## كيفية تطبيقه على أي صفحة

### الخطوة 1: إضافة الاستيراد

```typescript
import { useConfirm } from '@/hooks/useConfirm';
```

### الخطوة 2: استخدام الـ Hook

داخل component الصفحة:

```typescript
export default function YourPage() {
  const { confirm, ConfirmComponent } = useConfirm();
  // ... باقي الكود
}
```

### الخطوة 3: استبدال confirm القديم

**قبل:**
```typescript
const handleDelete = async (id: number) => {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;

  // كود الحذف
};
```

**بعد:**
```typescript
const handleDelete = async (id: number) => {
  const confirmed = await confirm({
    title: 'تأكيد الحذف',
    message: 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmText: 'حذف',
    cancelText: 'إلغاء',
    type: 'danger',
  });

  if (!confirmed) return;

  // كود الحذف
};
```

### الخطوة 4: إضافة Component في JSX

في نهاية return statement، قبل إغلاق `</div>` الأخير:

```typescript
return (
  <div>
    {/* كل محتوى الصفحة */}

    <ConfirmComponent />
  </div>
);
```

## أنواع الـ Dialog

- `type: 'danger'` - للحذف (أحمر)
- `type: 'warning'` - للتحذيرات (أصفر)
- `type: 'info'` - للمعلومات (أزرق)

## الصفحات المحدثة

✅ `/dashboard/visits` - تم
✅ `/dashboard/patients` - تم
✅ `/dashboard/doctors` - تم
✅ `/dashboard/medicines` - تم
⏳ `/dashboard/appointments` - pending
⏳ `/dashboard/prescriptions` - pending
⏳ `/dashboard/lab` - pending
⏳ `/dashboard/radiology` - pending
⏳ `/dashboard/pharmacy` - pending
⏳ `/dashboard/reception` - pending
⏳ `/dashboard/cashier` - pending
⏳ `/dashboard/invoices` - pending

## كيفية تطبيقه على باقي الصفحات

استخدم نفس الخطوات المذكورة أعلاه. يمكنك البحث عن `if (!confirm` في كل صفحة لتحديد مكان الحذف.

## ملاحظات

- الـ Dialog يدعم RTL تلقائياً
- يمكن تخصيص النصوص حسب السياق
- الـ Dialog يمنع النقر خارجه (modal backdrop)
- يمكن الإغلاق بزر X أو زر الإلغاء
