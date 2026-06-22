'use client';

import { useState, useEffect } from 'react';
import { Plus, ClipboardList, FileText, FlaskConical, ScanLine, Calendar, Edit2, X } from 'lucide-react';
import {
  Visit,
  CreateVisitDto,
  Prescription,
  CreatePrescriptionDto,
  LabRequest,
  CreateLabRequestDto,
  CreateLabRequestItemDto,
  RadiologyRequest,
  CreateRadiologyRequestDto,
  Appointment,
  Patient,
  Doctor as DoctorType,
  LabTest,
  RadiologyTest,
  Medicine,
  PrescriptionStatus,
} from '@/types';
import { visitsApi } from '@/lib/api/visits';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { labRequestsApi } from '@/lib/api/lab-requests';
import { labTestsApi } from '@/lib/api/lab-tests';
import { radiologyRequestsApi } from '@/lib/api/radiology-requests';
import { radiologyTestsApi } from '@/lib/api/radiology-tests';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientsApi } from '@/lib/api/patients';
import { doctorsApi } from '@/lib/api/doctors';
import { medicinesApi } from '@/lib/api/medicines';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

type ActiveSection = 'visits' | 'prescriptions' | 'lab' | 'radiology' | 'appointments' | 'medicines';

export default function DoctorPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<ActiveSection>('visits');
  const [currentDoctorId, setCurrentDoctorId] = useState<number>(0);

  // Common data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);

  // Visits
  const [visits, setVisits] = useState<Visit[]>([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [visitFormData, setVisitFormData] = useState<CreateVisitDto>({
    patientId: 0,
    doctorId: 0,
    visitDate: '',
    diagnosis: '',
    chiefComplaint: '',
    notes: '',
  });

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFormData, setPrescriptionFormData] = useState<CreatePrescriptionDto>({
    visitId: 0,
    patientId: 0,
    doctorId: 0,
    items: [],
    notes: '',
  });
  const [currentMedicineItem, setCurrentMedicineItem] = useState({
    medicineId: 0,
    dosage: '',
    frequency: '',
    duration: '',
  });

  // Lab Requests
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [labFormData, setLabFormData] = useState<CreateLabRequestDto>({
    visitId: 0,
    patientId: 0,
    doctorId: 0,
    notes: '',
    items: [],
  });
  const [currentLabItem, setCurrentLabItem] = useState<CreateLabRequestItemDto>({
    testId: 0,
    notes: '',
  });

  // Radiology Requests
  const [radiologyRequests, setRadiologyRequests] = useState<RadiologyRequest[]>([]);
  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [radiologyFormData, setRadiologyFormData] = useState<CreateRadiologyRequestDto>({
    visitId: 0,
    patientId: 0,
    doctorId: 0,
    notes: '',
  });
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState<number[]>([]);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        patientsData,
        doctorsData,
        prescriptionsData,
        labRequestsData,
        radiologyRequestsData,
        appointmentsData,
        medicinesData,
        labTestsData,
        radiologyTestsData,
      ] = await Promise.all([
        patientsApi.getAll().catch(() => []),
        doctorsApi.getAll().catch(() => []),
        prescriptionsApi.getAll().catch(() => []),
        labRequestsApi.getAll().catch(() => []),
        radiologyRequestsApi.getAll().catch(() => []),
        appointmentsApi.getAll().catch(() => []),
        medicinesApi.getAll().catch(() => []),
        labTestsApi.getAll().catch(() => []),
        radiologyTestsApi.getAll().catch(() => []),
      ]);

      setPatients(patientsData);
      setDoctors(doctorsData);
      setPrescriptions(prescriptionsData);
      setLabRequests(labRequestsData);
      setRadiologyRequests(radiologyRequestsData);
      setAppointments(appointmentsData);
      setMedicines(medicinesData);
      setLabTests(labTestsData);
      setRadiologyTests(radiologyTestsData);

      // Find current doctor's ID
      if (user) {
        const currentDoctor = doctorsData.find((d) => d.userId === user.id);
        if (currentDoctor) {
          setCurrentDoctorId(currentDoctor.id);

          // Fetch doctor's visits using /visits/my-visits endpoint
          try {
            const visitsData = await visitsApi.getMyVisits();
            setVisits(Array.isArray(visitsData) ? visitsData : []);
          } catch (error) {
            console.error('Error fetching visits:', error);
            setVisits([]);
          }
        }
      }
    } catch (error: any) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Visit handlers
  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (visitFormData.patientId === 0) {
      toast.error('يجب اختيار المريض');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingVisit) {
        await visitsApi.update(editingVisit.id, {
          visitDate: visitFormData.visitDate,
          diagnosis: visitFormData.diagnosis,
          chiefComplaint: visitFormData.chiefComplaint,
          notes: visitFormData.notes,
        });
        toast.success('تم تحديث الزيارة بنجاح');
      } else {
        // Use createMyVisit instead of create - doctorId is automatically set from token
        await visitsApi.createMyVisit({
          patientId: visitFormData.patientId,
          visitDate: visitFormData.visitDate,
          diagnosis: visitFormData.diagnosis,
          chiefComplaint: visitFormData.chiefComplaint,
          notes: visitFormData.notes,
        });
        toast.success('تم إضافة الزيارة بنجاح');
      }
      handleCloseVisitModal();
      fetchData();
    } catch (error: any) {
      toast.error(editingVisit ? 'فشل تحديث الزيارة' : 'فشل إضافة الزيارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseVisitModal = () => {
    setShowVisitModal(false);
    setEditingVisit(null);
    setVisitFormData({
      patientId: 0,
      doctorId: 0,
      visitDate: '',
      diagnosis: '',
      chiefComplaint: '',
      notes: '',
    });
  };

  // Prescription handlers
  const handleAddMedicineItem = () => {
    if (currentMedicineItem.medicineId === 0 || !currentMedicineItem.dosage) {
      toast.error('يجب اختيار الدواء وإدخال الجرعة');
      return;
    }
    setPrescriptionFormData({
      ...prescriptionFormData,
      items: [...prescriptionFormData.items, currentMedicineItem],
    });
    setCurrentMedicineItem({ medicineId: 0, dosage: '', frequency: '', duration: '' });
  };

  const handleRemoveMedicineItem = (index: number) => {
    setPrescriptionFormData({
      ...prescriptionFormData,
      items: prescriptionFormData.items.filter((_, i) => i !== index),
    });
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (prescriptionFormData.items.length === 0) {
      toast.error('يجب إضافة دواء واحد على الأقل');
      setIsSubmitting(false);
      return;
    }

    try {
      // إرسال الوصفة مع الأدوية مباشرة باستخدام createMyPrescription
      const requestData = {
        visitId: prescriptionFormData.visitId,
        patientId: prescriptionFormData.patientId,
        doctorId: prescriptionFormData.doctorId,
        notes: prescriptionFormData.notes,
        items: prescriptionFormData.items,
      };
      await prescriptionsApi.createMyPrescription(requestData);
      toast.success('تم إضافة الوصفة الطبية بنجاح');
      handleClosePrescriptionModal();
      fetchData();
    } catch (error: any) {
      toast.error('فشل إضافة الوصفة الطبية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setPrescriptionFormData({
      visitId: 0,
      patientId: 0,
      doctorId: 0,
      items: [],
      notes: '',
    });
    setCurrentMedicineItem({ medicineId: 0, dosage: '', frequency: '', duration: '' });
  };

  // Lab handlers
  const handleAddLabItem = () => {
    if (currentLabItem.testId === 0) {
      toast.error('يجب اختيار التحليل');
      return;
    }
    setLabFormData({
      ...labFormData,
      items: [...labFormData.items, currentLabItem],
    });
    setCurrentLabItem({ testId: 0, notes: '' });
  };

  const handleRemoveLabItem = (index: number) => {
    setLabFormData({
      ...labFormData,
      items: labFormData.items.filter((_, i) => i !== index),
    });
  };

  const handleLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (labFormData.items.length === 0) {
      toast.error('يجب إضافة تحليل واحد على الأقل');
      setIsSubmitting(false);
      return;
    }

    try {
      // إرسال الطلب مع التحاليل مباشرة باستخدام createMyRequest
      const requestData = {
        visitId: labFormData.visitId,
        notes: labFormData.notes,
        items: labFormData.items,
      };
      await labRequestsApi.createMyRequest(requestData);
      toast.success('تم إرسال طلب التحليل بنجاح');
      handleCloseLabModal();
      fetchData();
    } catch (error: any) {
      toast.error('فشل إرسال طلب التحليل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseLabModal = () => {
    setShowLabModal(false);
    setLabFormData({
      visitId: 0,
      patientId: 0,
      doctorId: 0,
      notes: '',
      items: [],
    });
    setCurrentLabItem({ testId: 0, notes: '' });
  };

  // Radiology handlers
  const handleToggleRadiologyTest = (testId: number) => {
    setSelectedRadiologyTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleRadiologySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (selectedRadiologyTests.length === 0) {
      toast.error('يجب اختيار فحص واحد على الأقل');
      setIsSubmitting(false);
      return;
    }

    try {
      // إرسال الطلب مع الفحوصات مباشرة
      const requestData = {
        visitId: radiologyFormData.visitId,
        notes: radiologyFormData.notes,
        items: selectedRadiologyTests.map(testId => ({ testId, notes: '' })),
      };
      await radiologyRequestsApi.createMyRequest(requestData);
      toast.success('تم إرسال طلب الأشعة بنجاح');
      handleCloseRadiologyModal();
      fetchData();
    } catch (error: any) {
      toast.error('فشل إرسال طلب الأشعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRadiologyModal = () => {
    setShowRadiologyModal(false);
    setRadiologyFormData({
      visitId: 0,
      patientId: 0,
      doctorId: 0,
      notes: '',
    });
    setSelectedRadiologyTests([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  // Check if user is doctor
  if (user?.role !== 'DOCTOR') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          هذه الصفحة مخصصة للأطباء فقط
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">لوحة العيادة</h1>
        <p className="text-gray-600">إدارة الزيارات والتشخيص والوصفات الطبية</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveSection('visits')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeSection === 'visits'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={20} />
            الزيارات
          </div>
        </button>
        <button
          onClick={() => setActiveSection('prescriptions')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeSection === 'prescriptions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={20} />
            الوصفات الطبية
          </div>
        </button>
        <button
          onClick={() => setActiveSection('lab')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeSection === 'lab'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FlaskConical size={20} />
            طلبات التحاليل
          </div>
        </button>
        <button
          onClick={() => setActiveSection('radiology')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeSection === 'radiology'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ScanLine size={20} />
            طلبات الأشعة
          </div>
        </button>
        <button
          onClick={() => setActiveSection('appointments')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeSection === 'appointments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            المواعيد
          </div>
        </button>
        <button
          onClick={() => setActiveSection('medicines')}
          className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeSection === 'medicines'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Plus size={20} />
            الأدوية
          </div>
        </button>
      </div>

      {/* Visits Section */}
      {activeSection === 'visits' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">الزيارات</h2>
            <button
              onClick={() => {
                setVisitFormData({
                  patientId: 0,
                  doctorId: currentDoctorId,
                  visitDate: new Date().toISOString().slice(0, 16),
                  diagnosis: '',
                  chiefComplaint: '',
                  notes: '',
                });
                setEditingVisit(null);
                setShowVisitModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              إضافة زيارة جديدة
            </button>
          </div>

          {visits.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ClipboardList size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد زيارات</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطبيب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التشخيص</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => {
                    const patient = patients.find((p) => p.id === visit.patientId);
                    const doctor = doctors.find((d) => d.id === visit.doctorId);
                    return (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient?.fullName || `مريض #${visit.patientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doctor?.user?.fullName || `طبيب #${visit.doctorId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(visit.visitDate).toLocaleString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{visit.diagnosis || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => {
                              setEditingVisit(visit);
                              setVisitFormData({
                                patientId: visit.patientId,
                                doctorId: visit.doctorId,
                                visitDate: visit.visitDate.split('T')[0] + 'T' + visit.visitDate.split('T')[1].substring(0, 5),
                                diagnosis: visit.diagnosis || '',
                                notes: visit.notes || '',
                              });
                              setShowVisitModal(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Section */}
      {activeSection === 'prescriptions' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">الوصفات الطبية</h2>
            <button
              onClick={() => {
                setPrescriptionFormData({
                  visitId: 0,
                  patientId: 0,
                  doctorId: currentDoctorId,
                  items: [],
                  notes: '',
                });
                setShowPrescriptionModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              إضافة وصفة طبية
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد وصفات طبية</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prescriptions.map((prescription) => {
                const patient = patients.find((p) => p.id === prescription.patientId);
                return (
                  <div key={prescription.id} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{patient?.fullName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(prescription.date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          prescription.status === PrescriptionStatus.ACTIVE
                            ? 'bg-green-100 text-green-800'
                            : prescription.status === PrescriptionStatus.COMPLETED
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {prescription.status === PrescriptionStatus.ACTIVE
                          ? 'نشطة'
                          : prescription.status === PrescriptionStatus.COMPLETED
                          ? 'مكتملة'
                          : 'ملغاة'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">الأدوية:</p>
                      <ul className="list-disc list-inside">
                        {prescription.items?.slice(0, 3).map((item) => {
                          const medicine = medicines.find((m) => m.id === item.medicineId);
                          return <li key={item.id}>{medicine?.name || `دواء #${item.medicineId}`}</li>;
                        })}
                        {prescription.items && prescription.items.length > 3 && (
                          <li className="text-gray-500">+{prescription.items.length - 3} أدوية أخرى</li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lab Requests Section */}
      {activeSection === 'lab' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">طلبات التحاليل</h2>
            <button
              onClick={() => {
                setLabFormData({
                  visitId: 0,
                  patientId: 0,
                  doctorId: currentDoctorId,
                  notes: '',
                  items: [],
                });
                setShowLabModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              طلب تحليل جديد
            </button>
          </div>

          {labRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FlaskConical size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد طلبات تحاليل</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد التحاليل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {labRequests.map((request) => {
                    const patient = patients.find((p) => p.id === request.patientId);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient?.fullName || `مريض #${request.patientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.items?.length || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Radiology Requests Section */}
      {activeSection === 'radiology' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">طلبات الأشعة</h2>
            <button
              onClick={() => {
                setRadiologyFormData({
                  visitId: 0,
                  patientId: 0,
                  doctorId: currentDoctorId,
                  notes: '',
                });
                setSelectedRadiologyTests([]);
                setShowRadiologyModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              طلب أشعة جديد
            </button>
          </div>

          {radiologyRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ScanLine size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد طلبات أشعة</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الفحوصات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {radiologyRequests.map((request) => {
                    const patient = patients.find((p) => p.id === request.patientId);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient?.fullName || `مريض #${request.patientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.items?.length || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Appointments Section */}
      {activeSection === 'appointments' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">المواعيد</h2>

          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد مواعيد</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ والوقت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السبب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => {
                    const patient = patients.find((p) => p.id === appointment.patientId);
                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient?.fullName || `مريض #${appointment.patientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(appointment.date).toLocaleString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{appointment.reason || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medicines Section */}
      {activeSection === 'medicines' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">الأدوية المتاحة</h2>

          {medicines.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Plus size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد أدوية</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الدواء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية المتاحة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicines.map((medicine) => (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {medicine.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          medicine.stock > 50
                            ? 'bg-green-100 text-green-800'
                            : medicine.stock > 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {medicine.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(String(medicine.price)).toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {medicine.expirationDate ? new Date(medicine.expirationDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingVisit ? 'تعديل الزيارة' : 'إضافة زيارة جديدة'}</h2>
              <button onClick={handleCloseVisitModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleVisitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">المريض *</label>
                <select
                  required
                  value={visitFormData.patientId || ''}
                  onChange={(e) => setVisitFormData({ ...visitFormData, patientId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">اختر المريض</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">تاريخ ووقت الزيارة *</label>
                <input
                  type="datetime-local"
                  required
                  value={visitFormData.visitDate}
                  onChange={(e) => setVisitFormData({ ...visitFormData, visitDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">الشكوى الرئيسية</label>
                <textarea
                  rows={2}
                  value={visitFormData.chiefComplaint}
                  onChange={(e) => setVisitFormData({ ...visitFormData, chiefComplaint: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="الأعراض التي يشكو منها المريض..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">التشخيص</label>
                <textarea
                  rows={3}
                  value={visitFormData.diagnosis}
                  onChange={(e) => setVisitFormData({ ...visitFormData, diagnosis: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="التشخيص الطبي..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ملاحظات</label>
                <textarea
                  rows={2}
                  value={visitFormData.notes}
                  onChange={(e) => setVisitFormData({ ...visitFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingVisit ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseVisitModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">إضافة وصفة طبية</h2>
              <button onClick={handleClosePrescriptionModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePrescriptionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">المريض *</label>
                  <select
                    required
                    value={prescriptionFormData.patientId || ''}
                    onChange={(e) =>
                      setPrescriptionFormData({ ...prescriptionFormData, patientId: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">اختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">الزيارة *</label>
                  <select
                    required
                    value={prescriptionFormData.visitId || ''}
                    onChange={(e) =>
                      setPrescriptionFormData({ ...prescriptionFormData, visitId: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">اختر الزيارة</option>
                    {visits&&visits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        زيارة #{visit.id} - {new Date(visit.visitDate).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">إضافة دواء</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">الدواء *</label>
                    <select
                      value={currentMedicineItem.medicineId || ''}
                      onChange={(e) =>
                        setCurrentMedicineItem({ ...currentMedicineItem, medicineId: parseInt(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">اختر الدواء</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">الجرعة *</label>
                    <input
                      type="text"
                      value={currentMedicineItem.dosage}
                      onChange={(e) => setCurrentMedicineItem({ ...currentMedicineItem, dosage: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="مثال: 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">التكرار</label>
                    <input
                      type="text"
                      value={currentMedicineItem.frequency}
                      onChange={(e) => setCurrentMedicineItem({ ...currentMedicineItem, frequency: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="مثال: 3 مرات يومياً"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">المدة</label>
                    <input
                      type="text"
                      value={currentMedicineItem.duration}
                      onChange={(e) => setCurrentMedicineItem({ ...currentMedicineItem, duration: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="مثال: 7 أيام"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedicineItem}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                >
                  إضافة الدواء
                </button>

                {prescriptionFormData.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">الأدوية المضافة:</h4>
                    <div className="space-y-2">
                      {prescriptionFormData.items.map((item, index) => {
                        const medicine = medicines.find((m) => m.id === item.medicineId);
                        return (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <div className="text-sm">
                              <strong>{medicine?.name}</strong> - {item.dosage}
                              {item.frequency && ` - ${item.frequency}`}
                              {item.duration && ` - ${item.duration}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicineItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ملاحظات</label>
                <textarea
                  rows={2}
                  value={prescriptionFormData.notes}
                  onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الوصفة'}
                </button>
                <button
                  type="button"
                  onClick={handleClosePrescriptionModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Modal */}
      {showLabModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">طلب تحليل جديد</h2>
              <button onClick={handleCloseLabModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleLabSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">المريض *</label>
                  <select
                    required
                    value={labFormData.patientId || ''}
                    onChange={(e) => setLabFormData({ ...labFormData, patientId: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">اختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">الزيارة *</label>
                  <select
                    required
                    value={labFormData.visitId || ''}
                    onChange={(e) => setLabFormData({ ...labFormData, visitId: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">اختر الزيارة</option>
                    {visits&&visits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        زيارة #{visit.id} - {new Date(visit.visitDate).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">إضافة تحليل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">التحليل *</label>
                    <select
                      value={currentLabItem.testId || ''}
                      onChange={(e) => setCurrentLabItem({ ...currentLabItem, testId: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">اختر التحليل</option>
                      {labTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">ملاحظات</label>
                    <input
                      type="text"
                      value={currentLabItem.notes}
                      onChange={(e) => setCurrentLabItem({ ...currentLabItem, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="ملاحظات خاصة بالتحليل"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddLabItem}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                >
                  إضافة التحليل
                </button>

                {labFormData.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">التحاليل المضافة:</h4>
                    <div className="space-y-2">
                      {labFormData.items.map((item, index) => {
                        const test = labTests.find((t) => t.id === item.testId);
                        return (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <div className="text-sm">
                              <strong>{test?.name}</strong>
                              {item.notes && ` - ${item.notes}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ملاحظات عامة</label>
                <textarea
                  rows={2}
                  value={labFormData.notes}
                  onChange={(e) => setLabFormData({ ...labFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseLabModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Radiology Modal */}
      {showRadiologyModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">طلب أشعة جديد</h2>
              <button onClick={handleCloseRadiologyModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRadiologySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">المريض *</label>
                  <select
                    required
                    value={radiologyFormData.patientId || ''}
                    onChange={(e) =>
                      setRadiologyFormData({ ...radiologyFormData, patientId: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">اختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">الزيارة *</label>
                  <select
                    required
                    value={radiologyFormData.visitId || ''}
                    onChange={(e) => setRadiologyFormData({ ...radiologyFormData, visitId: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">اختر الزيارة</option>
                    {visits&&visits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        زيارة #{visit.id} - {new Date(visit.visitDate).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">اختر الفحوصات المطلوبة *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {radiologyTests.map((test) => (
                    <label key={test.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedRadiologyTests.includes(test.id)}
                        onChange={() => handleToggleRadiologyTest(test.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="flex-1 text-sm">{test.name}</span>
                      <span className="text-xs text-gray-600">
                        {parseFloat(String(test.price)).toFixed(2)} ريال
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">تم اختيار {selectedRadiologyTests.length} فحص</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ملاحظات</label>
                <textarea
                  rows={2}
                  value={radiologyFormData.notes}
                  onChange={(e) => setRadiologyFormData({ ...radiologyFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseRadiologyModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
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
