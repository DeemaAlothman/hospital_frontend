# أسئلة مقابلة Frontend — مبنية على مشروع Hospital Management System

---

## 1. Next.js & React

---

**س: ما الفرق بين App Router و Pages Router في Next.js؟**

> مشروعنا يستخدم App Router (مجلد `app/`)

**الجواب:**
- **Pages Router** (القديم): كل ملف في `pages/` يصير route تلقائياً، والـ layouts تتعمل يدوياً في كل صفحة
- **App Router** (الجديد - Next.js 13+): يستخدم مجلد `app/`، يدعم nested layouts، Server Components افتراضياً، وأسرع في الـ rendering
- في مشروعنا استخدمنا App Router لأنه يدعم الـ nested layouts بشكل نظيف — عندنا `app/layout.tsx` root layout و `app/dashboard/layout.tsx` للـ dashboard

---

**س: متى تستخدم `'use client'` ومتى لا تستخدمها؟**

**الجواب:**
- بدون `'use client'` = **Server Component**: يُرندر على السيرفر، لا يدعم hooks أو events
- مع `'use client'` = **Client Component**: يُرندر في المتصفح، يدعم `useState`, `useEffect`, event handlers
- في مشروعنا كل صفحات الـ dashboard فيها `'use client'` لأنها تستخدم useState وتجيب data من API
- القاعدة: استخدمها فقط لما تحتاج تفاعل مع المستخدم أو browser APIs

---

**س: كيف حميت الـ routes في مشروعك؟**

**الجواب:**
- عملنا `AuthProvider` component يلف كل الـ dashboard layout
- عند كل تحميل يتحقق إذا في token في localStorage
- إذا ما في token أو انتهت صلاحيته يرجع المستخدم لصفحة `/login`
- الـ Axios interceptor كمان يعمل redirect تلقائي لو السيرفر رجع 401 Unauthorized

---

**س: كيف تعمل Nested Layouts في Next.js؟**

**الجواب:**
- كل مجلد ممكن يحتوي على `layout.tsx` خاص فيه
- الـ layouts بتتداخل: root layout → dashboard layout → page
- في مشروعنا:
  - `app/layout.tsx`: يحتوي الـ AuthProvider والـ ToastContainer
  - `app/dashboard/layout.tsx`: يحتوي الـ Sidebar والمحتوى الرئيسي
  - كل صفحة داخل dashboard بترث الـ layout تلقائياً بدون ما نكرر الكود

---

## 2. TypeScript

---

**س: ما الفرق بين `interface` و `type`؟**

**الجواب:**
- `interface`: لتعريف شكل الـ objects، قابلة للـ extend والـ merge
- `type`: أشمل، تستخدم للـ unions, intersections, primitives أيضاً
- في مشروعنا استخدمنا `interface` للـ entities مثل `Patient`, `Doctor`, `Appointment`
- مثال:
```typescript
interface Patient {
  id: number;
  name: string;
  bloodType: BloodType;
}
type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
```

---

**س: شو هي الـ Enums واذكر مثال من مشروعك؟**

**الجواب:**
- Enum هو مجموعة من القيم الثابتة المسماة بدل ما نستخدم strings عشوائية
- يمنع الأخطاء الإملائية ويعطي autocomplete
- في مشروعنا:
```typescript
enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  RADIOLOGY_TECHNICIAN = 'radiology_technician',
  CASHIER = 'cashier'
}

enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

---

**س: شو معنى strict mode في TypeScript؟**

**الجواب:**
- يفعّل مجموعة من القواعد الصارمة مثل:
  - `strictNullChecks`: لازم تتعامل مع `null` و `undefined` صراحةً
  - `noImplicitAny`: ممنوع يكون في متغير بدون type
  - `strictFunctionTypes`: التحقق الصارم من أنواع الـ functions
- في مشروعنا `tsconfig.json` فيه `"strict": true` — هاد يساعد يمسك الأخطاء قبل الـ runtime

---

## 3. State Management — Zustand

---

**س: ليش اخترت Zustand بدل Redux؟**

**الجواب:**
- **Redux**: كثير boilerplate كود (actions, reducers, selectors)، مناسب لمشاريع كبيرة جداً
- **Zustand**: بسيط، خفيف، بدون boilerplate
- في مشروعنا الـ state الوحيد الـ global هو الـ authentication — Zustand كافي تماماً
- مثال على بساطته:
```typescript
const useAuthStore = create((set) => ({
  user: null,
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false })
}));
```

---

**س: ما الفرق بين Zustand و Context API؟**

**الجواب:**
- **Context API**: مدمج في React، لكن كل تغيير في الـ context يسبب re-render لكل المكونات اللي تستخدمه
- **Zustand**: ذكي في الـ re-renders، المكون يتحدث فقط لو الـ state اللي يستخدمه تغير
- لو عندنا بيانات كثيرة تتغير باستمرار، Zustand أفضل performance

---

## 4. API & Axios

---

**س: شو هو الـ Interceptor وكيف استخدمته في مشروعك؟**

**الجواب:**
- Interceptor هو كود يشتغل تلقائياً قبل كل request أو بعد كل response
- في مشروعنا عندنا interceptorين في `lib/api/client.ts`:

**Request Interceptor:**
```typescript
// يضيف الـ token تلقائياً لكل request
config.headers.Authorization = `Bearer ${token}`;
```

**Response Interceptor:**
```typescript
// لو السيرفر رجع 401، يعمل logout ويرجع للـ login
if (error.response?.status === 401) {
  localStorage.clear();
  window.location.href = '/login';
}
```

---

**س: ليش خزنت الـ token في localStorage وكمان في cookie؟**

**الجواب:**
- **localStorage**: سهل الوصول إليه من JavaScript لإضافته للـ headers
- **httpOnly cookie**: أكثر أماناً لأن JavaScript ما تقدر توصله — حماية من XSS attacks
- استخدمنا الاثنين: localStorage للراحة في الـ client side، والـ cookie للأمان
- في production المثالي نعتمد على httpOnly cookie فقط

---

**س: كيف استخدمت `Promise.all` في مشروعك ولماذا؟**

**الجواب:**
- في بعض الصفحات نحتاج نجيب بيانات من endpoints متعددة (مثلاً appointments + patients + doctors)
- بدل ما ننتظر كل request بعد الثاني:
```typescript
// بدون Promise.all — بطيء
const appointments = await appointmentsApi.getAll();
const patients = await patientsApi.getAll();
const doctors = await doctorsApi.getAll();

// مع Promise.all — أسرع (parallel)
const [appointments, patients, doctors] = await Promise.all([
  appointmentsApi.getAll(),
  patientsApi.getAll(),
  doctorsApi.getAll()
]);
```
- يوفر وقت = مجموع الأوقات بدل مجموعها

---

## 5. Forms & Validation

---

**س: كيف تعمل validation مع React Hook Form + Zod؟**

**الجواب:**
- **React Hook Form**: يتحكم بالـ form state وperformance بشكل ممتاز (أقل re-renders)
- **Zod**: يعرّف schema للـ validation
- نربطهم مع `zodResolver`:
```typescript
const schema = z.object({
  name: z.string().min(2, 'الاسم قصير'),
  phone: z.string().regex(/^[0-9]{10}$/, 'رقم غير صحيح')
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

---

**س: ما الفرق بين controlled و uncontrolled components؟**

**الجواب:**
- **Controlled**: قيمة الـ input مرتبطة بـ state في React — أنت تتحكم بكل تغيير
```typescript
<input value={name} onChange={(e) => setName(e.target.value)} />
```
- **Uncontrolled**: الـ DOM يتحكم بالقيمة، نقرأها بـ `ref` عند الحاجة
- React Hook Form يستخدم uncontrolled بشكل ذكي لتحسين الـ performance

---

## 6. Performance

---

**س: React Query موجود في مشروعك بس غير مستخدم — ليش؟ وشو فائدته؟**

**الجواب:**
- React Query (TanStack Query) للـ server state management
- فوائده:
  - **Caching**: ما يعيد جلب البيانات إذا ما تغيرت
  - **Auto refetch**: يحدث البيانات تلقائياً
  - **Loading/Error states**: جاهزة تلقائياً
  - **Pagination & Infinite scroll**: سهل التطبيق
- في المشروع استخدمنا useState + useEffect يدوياً — React Query كان يبسط هاد الكود كثير، وهو فرصة تحسين مستقبلية

---

**س: شو معنى `useMemo` و `useCallback`؟**

**الجواب:**
- **`useMemo`**: يحفظ نتيجة حساب ثقيل، ما يعيد حسابها إلا لو تغيرت الـ dependencies
```typescript
const filteredPatients = useMemo(() =>
  patients.filter(p => p.name.includes(search)), [patients, search]
);
```
- **`useCallback`**: يحفظ الـ function نفسها، مفيد لما تمرر function لـ child component
```typescript
const handleDelete = useCallback((id) => {
  deletePatient(id);
}, []);
```
- نستخدمهم فقط لما في مشكلة performance فعلية — مش بشكل عشوائي

---

## 7. Authentication & Security

---

**س: كيف يشتغل JWT authentication في مشروعك؟**

**الجواب:**
1. المستخدم يرسل email + password لـ `/auth/login`
2. السيرفر يرجع JWT token
3. نخزن الـ token في localStorage
4. كل request بعدها يحمل الـ token في الـ header: `Authorization: Bearer <token>`
5. السيرفر يتحقق من الـ token في كل request
6. لو انتهت صلاحية الـ token، السيرفر يرجع 401 ونعمل logout تلقائي

---

**س: شو مشكلة تخزين الـ token في localStorage؟**

**الجواب:**
- **XSS (Cross-Site Scripting)**: لو المهاجم نجح يحقن JavaScript في الصفحة، يقدر يسرق الـ token من localStorage
- الحل الأأمن: httpOnly cookie — JavaScript ما تقدر تقرأها أبداً
- في مشروعنا خزناه في الاثنين كـ trade-off بين الأمان والسهولة

---

**س: كيف طبقت Role-Based Access Control في مشروعك؟**

**الجواب:**
- عند login نحفظ بيانات المستخدم مع الـ role
- في `Sidebar.tsx` الـ menu items مفلترة حسب الـ role:
```typescript
const menuItems = allMenuItems.filter(item =>
  item.allowedRoles.includes(user.role)
);
```
- الـ dashboard الرئيسي يعرض محتوى مختلف حسب الـ role
- عندنا 8 roles: Admin, Doctor, Receptionist, Pharmacist, Lab Tech, Radiology Tech, Cashier

---

## 8. Custom Hooks

---

**س: شو هو الـ Custom Hook ولماذا نستخدمه؟**

**الجواب:**
- Custom Hook هو function اسمها يبدأ بـ `use` تحتوي على React hooks
- نستخدمه لـ:
  - إعادة استخدام منطق معين في أكثر من component
  - تنظيف الكود وفصل الـ logic عن الـ UI
- مثال من مشروعنا: `useConfirm()` — بدل ما نكرر كود الـ confirmation dialog في كل صفحة

---

**س: اشرح `useConfirm` hook اللي عملته**

**الجواب:**
```typescript
// Hook يرجع دالة confirm
const { confirm, ConfirmComponent } = useConfirm();

// في الكود
const handleDelete = async (id) => {
  const confirmed = await confirm({
    title: 'حذف المريض',
    message: 'هل أنت متأكد؟'
  });

  if (confirmed) {
    await deletePatient(id);
  }
};
```
- الـ hook يرجع Promise<boolean> — ننتظر قرار المستخدم
- يفصل منطق الـ confirmation عن الـ UI بشكل نظيف

---

## 9. Tailwind CSS

---

**س: كيف طبقت RTL layout في مشروعك؟**

**الجواب:**
- في `app/layout.tsx` أضفنا `dir="rtl"` و `lang="ar"` على الـ `<html>`
- Tailwind يدعم RTL variants مثل `rtl:mr-4` بدل `ml-4`
- الـ flexbox و grid يتعكسون تلقائياً مع RTL

---

**س: ما الفرق بين `flex` و `grid` ومتى تستخدم كل واحد؟**

**الجواب:**
- **Flexbox**: للتوزيع في اتجاه واحد (row أو column) — مناسب للـ navbar، الـ cards في صف واحد
- **Grid**: للتوزيع في اتجاهين (rows + columns) — مناسب للـ layouts المعقدة، الـ dashboards
- في مشروعنا استخدمنا flex للـ Sidebar layout وداخل الـ cards، وgrid لتوزيع الـ dashboard widgets

---

## 10. سؤال عملي متوقع

---

**س: اكتب custom hook يجيب data من API**

**الجواب:**
```typescript
function useFetch<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { data, loading, error };
}

// الاستخدام
const { data: patients, loading } = useFetch(() => patientsApi.getAll());
```

---

## 11. سؤال الـ Wildcard

---

**س: حكيلي عن أصعب مشكلة واجهتها في المشروع وكيف حليتها**

**جواب مقترح:**
> "أصعب جزء كان تصميم الـ authentication flow بشكل صحيح. احتجنا نتأكد أن كل route محمية، والـ token يُرسل مع كل request تلقائياً، وعند انتهاء صلاحية الـ token يصير logout فوري بدون ما المستخدم يلاحظ طلبات فاشلة. حليتها من خلال Axios interceptors اللي تعمل تلقائياً بدون ما نكتب نفس الكود في كل صفحة."

---

*ملاحظة: كل الأجوبة مبنية على الكود الفعلي في هذا المشروع — راجع `lib/api/client.ts`, `stores/authStore.ts`, `components/layout/Sidebar.tsx`, `hooks/useConfirm.tsx`, `types/index.ts`*
