// User Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  LAB_TECH = 'LAB_TECH',
  RADIOLOGY_TECH = 'RADIOLOGY_TECH',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER',
}

// User Interface
export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
  shiftStart?: string;
  shiftEnd?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

// Auth Response
export interface AuthResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
}

// Gender Enum
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

// Patient Interface
export interface Patient {
  id: number;
  fullName: string;
  gender: Gender;
  birthDate: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient DTOs
export interface CreatePatientDto {
  fullName: string;
  gender: Gender;
  birthDate: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  emergencyContact?: string;
}

export interface UpdatePatientDto {
  fullName?: string;
  gender?: Gender;
  birthDate?: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  emergencyContact?: string;
}

// API Error Response
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ========== Doctor Types ==========
export interface Doctor {
  id: number;
  userId: number;
  speciality?: string;
  user: User;
}

export interface CreateDoctorDto {
  userId: number;
  speciality?: string;
}

export interface UpdateDoctorDto {
  speciality?: string;
}

// ========== Visit Types ==========
export interface Visit {
  id: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  diagnosis?: string;
  chiefComplaint?: string;
  notes?: string;
  patient?: any; // سنضيف Patient type لاحقاً
  doctor?: Doctor;
}

export interface CreateVisitDto {
  patientId: number;
  doctorId: number;
  visitDate?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  notes?: string;
}

export interface UpdateVisitDto {
  visitDate?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  notes?: string;
}

export interface QueryVisitsDto {
  patientId?: number;
  doctorId?: number;
  from?: string;
  to?: string;
}

// ========== Appointment Types ==========
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  reason?: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  date: string;
  reason?: string;
  status?: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentDto {
  patientId?: number;
  doctorId?: number;
  date?: string;
  reason?: string;
  status?: AppointmentStatus;
  notes?: string;
}

// ========== Medicine Types ==========
export interface Medicine {
  id: number;
  name: string;
  category?: string;
  stock: number;
  price: string; // Decimal from backend
  expirationDate?: string;
}

export interface CreateMedicineDto {
  name: string;
  category?: string;
  stock?: number;
  price: string; // Decimal as string
  expirationDate?: string;
}

export interface UpdateMedicineDto {
  name?: string;
  category?: string;
  stock?: number;
  price?: string;
  expirationDate?: string;
}

// ========== Prescription Types ==========
export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  medicineId: number;
  dosage: string;
  frequency?: string;
  duration?: string;
  medicine?: Medicine;
}

export interface Prescription {
  id: number;
  visitId: number;
  patientId: number;
  doctorId: number;
  date: string;
  status: PrescriptionStatus;
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  visit?: Visit;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionItemDto {
  medicineId: number;
  dosage: string;
  frequency?: string;
  duration?: string;
}

export interface CreatePrescriptionDto {
  visitId: number;
  patientId: number;
  doctorId: number;
  notes?: string;
  items: CreatePrescriptionItemDto[];
}

export interface UpdatePrescriptionDto {
  status?: PrescriptionStatus;
  notes?: string;
}

export interface QueryPrescriptionsDto {
  patientId?: number;
  doctorId?: number;
  status?: PrescriptionStatus;
  from?: string;
  to?: string;
}

// ========== Lab Test Types ==========
export interface LabTest {
  id: number;
  name: string;
  category?: string;
  price: string; // Decimal from backend
}

export interface CreateLabTestDto {
  name: string;
  category?: string;
  price: string;
}

export interface UpdateLabTestDto {
  name?: string;
  category?: string;
  price?: string;
}

// ========== Lab Request Types ==========
export enum LabRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface LabRequestItem {
  id: number;
  requestId: number;
  testId: number;
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  resultAt?: string;
  notes?: string;
  test?: LabTest;
}

export interface LabRequest {
  id: number;
  visitId: number;
  patientId: number;
  doctorId: number;
  status: LabRequestStatus;
  createdAt: string;
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  visit?: Visit;
  items: LabRequestItem[];
}

export interface CreateLabRequestItemDto {
  testId: number;
  notes?: string;
}

export interface CreateLabRequestDto {
  visitId: number;
  patientId: number;
  doctorId: number;
  notes?: string;
  items: CreateLabRequestItemDto[];
}

export interface UpdateLabRequestDto {
  status?: LabRequestStatus;
  notes?: string;
}

export interface UpdateLabResultDto {
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  resultAt?: string;
  notes?: string;
}

export interface QueryLabRequestsDto {
  patientId?: number;
  doctorId?: number;
  visitId?: number;
  status?: LabRequestStatus;
  from?: string;
  to?: string;
}

// ========== Radiology Test Types ==========
export interface RadiologyTest {
  id: number;
  name: string;
  category?: string;
  price: number;
}

export interface CreateRadiologyTestDto {
  name: string;
  category?: string;
  price: number;
}

export interface UpdateRadiologyTestDto {
  name?: string;
  category?: string;
  price?: number;
}

// ========== Radiology Request Types ==========
export enum RadiologyRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface RadiologyRequestItem {
  id: number;
  requestId: number;
  testId: number;
  imageUrl?: string;
  report?: string;
  resultAt?: string;
  notes?: string;
  test?: RadiologyTest;
}

export interface RadiologyRequest {
  id: number;
  visitId: number;
  patientId: number;
  doctorId: number;
  status: RadiologyRequestStatus;
  createdAt: string;
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  visit?: Visit;
  items: RadiologyRequestItem[];
}

export interface CreateRadiologyRequestDto {
  visitId: number;
  patientId: number;
  doctorId: number;
  notes?: string;
}

export interface AddRadiologyItemDto {
  testIds: number[];
}

export interface SubmitRadiologyResultDto {
  results: {
    itemId: number;
    imageUrl?: string;
    report?: string;
    notes?: string;
  }[];
}

export interface QueryRadiologyRequestsDto {
  status?: RadiologyRequestStatus;
  patientId?: number;
  doctorId?: number;
}

export interface UpdateRadiologyRequestDto {
  status?: RadiologyRequestStatus;
  notes?: string;
}

// ========== Invoice Types ==========
export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceItemType {
  CONSULTATION = 'CONSULTATION',
  LAB = 'LAB',
  RADIOLOGY = 'RADIOLOGY',
  PHARMACY = 'PHARMACY',
  ROOM = 'ROOM',
  OTHER = 'OTHER',
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  itemType: InvoiceItemType;
  referenceId?: number;
  description: string;
  quantity: number;
  unitPrice: string; // Decimal
  subTotal: string; // Decimal
}

export interface Invoice {
  id: number;
  patientId: number;
  status: InvoiceStatus;
  totalAmount: string; // Decimal
  discount: string; // Decimal
  finalAmount: string; // Decimal
  createdAt: string;
  patient?: Patient;
  items: InvoiceItem[];
}

export interface CreateInvoiceDto {
  patientId: number;
  discount?: number;
}

export interface AddInvoiceItemDto {
  itemType: InvoiceItemType;
  referenceId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QueryInvoicesDto {
  status?: InvoiceStatus;
  patientId?: number;
}
