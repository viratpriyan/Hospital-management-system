import { Injectable, signal, computed } from '@angular/core';
import {
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Bill,
  HospitalStats
} from '../models/hospital.models';

const STORAGE_KEY = 'praveen_clinic_hms_data_v2';

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT-1001',
    name: 'Aarav Sharma',
    age: 34,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'aarav.sharma@gmail.com',
    address: 'Flat 302, Green Acres Apt, Anna Nagar West, Chennai, Tamil Nadu - 600040',
    bloodGroup: 'A+',
    emergencyContact: 'Pooja Sharma (+91 98765 11223)',
    allergies: 'Penicillin, Peanuts',
    medicalConditions: 'Mild Asthma',
    registeredDate: '2026-01-15'
  },
  {
    id: 'PAT-1002',
    name: 'Rajesh Patel',
    age: 52,
    gender: 'Male',
    phone: '+91 97890 12345',
    email: 'rajesh.patel@tcs.com',
    address: 'No. 12, 4th Main Road, Indiranagar, Bengaluru, Karnataka - 560038',
    bloodGroup: 'O+',
    emergencyContact: 'Geetha Patel (+91 97890 99887)',
    allergies: 'None',
    medicalConditions: 'Hypertension, Stage 1',
    registeredDate: '2026-02-04'
  },
  {
    id: 'PAT-1003',
    name: 'Meera Krishnan',
    age: 28,
    gender: 'Female',
    phone: '+91 98410 98765',
    email: 'meera.k@techcorp.in',
    address: 'Plot 88, Jubilee Hills, Road No. 36, Hyderabad, Telangana - 500033',
    bloodGroup: 'B+',
    emergencyContact: 'Venkatesh Krishnan (+91 98410 00998)',
    allergies: 'Sulfa drugs',
    medicalConditions: 'Migraine episodes',
    registeredDate: '2026-02-18'
  },
  {
    id: 'PAT-1004',
    name: 'Anand Verma',
    age: 67,
    gender: 'Male',
    phone: '+91 99400 54321',
    email: 'anand.verma@heritage.in',
    address: 'B-24, Mayur Vihar Phase 1, New Delhi - 110091',
    bloodGroup: 'AB+',
    emergencyContact: 'Sunita Verma (+91 99400 88776)',
    allergies: 'Aspirin',
    medicalConditions: 'Type 2 Diabetes, Osteoarthritis',
    registeredDate: '2026-03-01'
  },
  {
    id: 'PAT-1005',
    name: 'Divya Nair',
    age: 22,
    gender: 'Female',
    phone: '+91 98840 11223',
    email: 'divya.nair@mumbaiuniv.ac.in',
    address: '15, Shivaji Park, Dadar West, Mumbai, Maharashtra - 400028',
    bloodGroup: 'O-',
    emergencyContact: 'Madhavan Nair (+91 98840 44556)',
    allergies: 'Latex',
    medicalConditions: 'None',
    registeredDate: '2026-03-10'
  }
];

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'DOC-101',
    name: 'Dr. Praveen Kumar',
    specialization: 'Chief Consultant Physician & Diabetologist',
    department: 'General Medicine',
    qualification: 'MD (Gen Med), FICP, AIIMS New Delhi',
    phone: '+91 98401 11222',
    email: 'dr.praveen@praveenclinic.in',
    experienceYears: 18,
    consultationFee: 600,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableHours: '08:30 AM - 02:00 PM',
    status: 'Available',
    roomNo: 'Suite 101 - Director Clinic'
  },
  {
    id: 'DOC-102',
    name: 'Dr. Ananya Sharma',
    specialization: 'Senior Interventional Cardiologist',
    department: 'Cardiology',
    qualification: 'MD, DM (Cardiology), CMC Vellore',
    phone: '+91 98401 23456',
    email: 'a.sharma@praveenclinic.in',
    experienceYears: 15,
    consultationFee: 800,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu'],
    availableHours: '09:00 AM - 02:00 PM',
    status: 'Available',
    roomNo: 'Suite 301 - Heart Wing'
  },
  {
    id: 'DOC-103',
    name: 'Dr. Rajesh Iyer',
    specialization: 'Consultant Neurologist',
    department: 'Neurology',
    qualification: 'MD, DM (Neurology), NIMHANS Bengaluru',
    phone: '+91 98402 34567',
    email: 'r.iyer@praveenclinic.in',
    experienceYears: 14,
    consultationFee: 900,
    availableDays: ['Mon', 'Wed', 'Fri'],
    availableHours: '10:00 AM - 04:00 PM',
    status: 'Available',
    roomNo: 'Suite 204 - Neuro Wing'
  },
  {
    id: 'DOC-104',
    name: 'Dr. Priya Sundaram',
    specialization: 'Senior Pediatrician & Neonatologist',
    department: 'Pediatrics',
    qualification: 'MD (Pediatrics), DCH, Madras Medical College',
    phone: '+91 98403 45678',
    email: 'p.sundaram@praveenclinic.in',
    experienceYears: 12,
    consultationFee: 500,
    availableDays: ['Tue', 'Wed', 'Thu', 'Sat'],
    availableHours: '08:30 AM - 01:30 PM',
    status: 'In Consultation',
    roomNo: 'Suite 108 - Child Care'
  },
  {
    id: 'DOC-105',
    name: 'Dr. Suresh Venkatesh',
    specialization: 'Orthopedic & Joint Replacement Surgeon',
    department: 'Orthopedics',
    qualification: 'MS (Ortho), DNB (Ortho), PGIMER Chandigarh',
    phone: '+91 98404 56789',
    email: 's.venkatesh@praveenclinic.in',
    experienceYears: 17,
    consultationFee: 750,
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    availableHours: '11:00 AM - 05:00 PM',
    status: 'In Surgery',
    roomNo: 'OR-2 & Suite 402'
  },
  {
    id: 'DOC-106',
    name: 'Dr. Kavitha Raman',
    specialization: 'Consultant Dermatologist & Cosmetologist',
    department: 'Dermatology',
    qualification: 'MD (Dermatology), Stanley Medical College Chennai',
    phone: '+91 98405 67890',
    email: 'k.raman@praveenclinic.in',
    experienceYears: 10,
    consultationFee: 650,
    availableDays: ['Wed', 'Thu', 'Fri', 'Sat'],
    availableHours: '09:30 AM - 03:30 PM',
    status: 'Available',
    roomNo: 'Suite 215 - Skin Clinic'
  }
];

const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getTomorrowDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-2001',
    patientId: 'PAT-1002',
    patientName: 'Rajesh Patel',
    doctorId: 'DOC-102',
    doctorName: 'Dr. Ananya Sharma',
    department: 'Cardiology',
    date: getTodayDateStr(),
    timeSlot: '10:00 AM',
    reason: 'Routine quarterly cardiac evaluation & ECG checkup',
    type: 'Follow-up',
    status: 'Scheduled',
    notes: 'Patient reports mild chest tightness after climbing stairs.',
    createdAt: '2026-03-12'
  },
  {
    id: 'APT-2002',
    patientId: 'PAT-1003',
    patientName: 'Meera Krishnan',
    doctorId: 'DOC-103',
    doctorName: 'Dr. Rajesh Iyer',
    department: 'Neurology',
    date: getTodayDateStr(),
    timeSlot: '11:30 AM',
    reason: 'Frequent throbbing migraines on right temple',
    type: 'Specialist Consultation',
    status: 'Scheduled',
    notes: 'Review previous MRI brain scan results.',
    createdAt: '2026-03-13'
  },
  {
    id: 'APT-2003',
    patientId: 'PAT-1001',
    patientName: 'Aarav Sharma',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Praveen Kumar',
    department: 'General Medicine',
    date: getTodayDateStr(),
    timeSlot: '09:00 AM',
    reason: 'Persistent seasonal cough and wheezing',
    type: 'General Checkup',
    status: 'Completed',
    notes: 'Prescribed bronchodilator inhaler and allergy panel.',
    createdAt: '2026-03-14'
  },
  {
    id: 'APT-2004',
    patientId: 'PAT-1004',
    patientName: 'Anand Verma',
    doctorId: 'DOC-105',
    doctorName: 'Dr. Suresh Venkatesh',
    department: 'Orthopedics',
    date: getTomorrowDateStr(),
    timeSlot: '02:00 PM',
    reason: 'Right knee joint stiffness and chronic swelling',
    type: 'Specialist Consultation',
    status: 'Scheduled',
    notes: 'Bring previous knee X-rays from January.',
    createdAt: '2026-03-14'
  },
  {
    id: 'APT-2005',
    patientId: 'PAT-1005',
    patientName: 'Divya Nair',
    doctorId: 'DOC-106',
    doctorName: 'Dr. Kavitha Raman',
    department: 'Dermatology',
    date: getTomorrowDateStr(),
    timeSlot: '10:15 AM',
    reason: 'Contact dermatitis flare-up on hands',
    type: 'General Checkup',
    status: 'Scheduled',
    notes: 'Patch test recommended.',
    createdAt: '2026-03-14'
  }
];

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: 'REC-3001',
    patientId: 'PAT-1001',
    patientName: 'Aarav Sharma',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Praveen Kumar',
    date: getTodayDateStr(),
    vitals: {
      bloodPressure: '118/76 mmHg',
      heartRate: 74,
      temperature: 98.4,
      weight: 62,
      spo2: 98
    },
    symptoms: 'Mild wheezing on exertion, non-productive dry cough for 6 days.',
    diagnosis: 'Acute Bronchial Hyperresponsiveness / Mild Asthma Exacerbation',
    prescriptions: [
      { medicine: 'Asthalin Inhaler (100mcg)', dosage: '2 puffs', frequency: 'PRN as needed', duration: '14 days' },
      { medicine: 'Montair-LC (Montelukast + Levocetirizine)', dosage: '1 tablet', frequency: 'Once daily at bedtime', duration: '30 days' },
      { medicine: 'Doxovent 400mg', dosage: '1 tablet', frequency: 'Once daily (Night)', duration: '10 days' }
    ],
    labTests: ['Complete Blood Count (CBC)', 'Peak Flow Expiratory Rate', 'Total Serum IgE'],
    treatmentNotes: 'Advised avoiding cold drinks, dust and pollen exposure. Follow up in 2 weeks at Praveen Clinic.',
    followUpDate: '2026-03-28'
  },
  {
    id: 'REC-3002',
    patientId: 'PAT-1002',
    patientName: 'Rajesh Patel',
    doctorId: 'DOC-102',
    doctorName: 'Dr. Ananya Sharma',
    date: '2026-02-20',
    vitals: {
      bloodPressure: '142/90 mmHg',
      heartRate: 82,
      temperature: 98.6,
      weight: 84,
      spo2: 99
    },
    symptoms: 'Mild morning occipital headache, fatigue.',
    diagnosis: 'Essential Hypertension (Stage 1) - Sub-optimally controlled',
    prescriptions: [
      { medicine: 'Telma 40mg (Telmisartan)', dosage: '1 tablet', frequency: 'Once daily in the morning', duration: '90 days' },
      { medicine: 'Amlong 5mg (Amlodipine)', dosage: '1 tablet', frequency: 'Once daily (Night)', duration: '90 days' },
      { medicine: 'Rosuvas 10mg (Rosuvastatin)', dosage: '1 tablet', frequency: 'Once daily at bedtime', duration: '60 days' }
    ],
    labTests: ['Lipid Profile', 'Serum Creatinine', '12-Lead Resting ECG'],
    treatmentNotes: 'DASH diet counseling provided. Reduce sodium/salt intake. Regular 30 min morning brisk walk.',
    followUpDate: '2026-05-20'
  },
  {
    id: 'REC-3003',
    patientId: 'PAT-1004',
    patientName: 'Anand Verma',
    doctorId: 'DOC-105',
    doctorName: 'Dr. Suresh Venkatesh',
    date: '2026-02-14',
    vitals: {
      bloodPressure: '130/82 mmHg',
      heartRate: 68,
      temperature: 98.2,
      weight: 78,
      spo2: 97
    },
    symptoms: 'Crepitus in right knee, difficulty descending stairs, morning stiffness lasting 25 mins.',
    diagnosis: 'Primary Osteoarthritis of Right Knee (Kellgren-Lawrence Grade 2)',
    prescriptions: [
      { medicine: 'Cobix 100mg (Celecoxib)', dosage: '1 capsule', frequency: 'Twice daily after food', duration: '14 days' },
      { medicine: 'Jointace DN Tablet', dosage: '1 tablet', frequency: 'Twice daily', duration: '90 days' },
      { medicine: 'Pan 40mg (Pantoprazole)', dosage: '1 tablet', frequency: 'Once daily (Before breakfast)', duration: '14 days' }
    ],
    labTests: ['Bilateral Knee Weight-Bearing X-Rays (AP & Lateral)', 'Serum Uric Acid'],
    treatmentNotes: 'Physiotherapy referral for quadriceps strengthening. Avoid floor sitting and squatting.',
    followUpDate: '2026-04-14'
  }
];

const INITIAL_BILLS: Bill[] = [
  {
    id: 'INV-5001',
    patientId: 'PAT-1001',
    patientName: 'Aarav Sharma',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Praveen Kumar',
    issueDate: getTodayDateStr(),
    dueDate: getTodayDateStr(),
    consultationFee: 600,
    treatmentCharges: 250,
    labCharges: 450,
    pharmacyCharges: 380,
    roomCharges: 0,
    subtotal: 1680,
    taxPercent: 5,
    taxAmount: 84,
    discount: 100,
    totalAmount: 1664,
    paymentStatus: 'Paid',
    paymentMethod: 'UPI / Online',
    notes: 'Settled via Google Pay / UPI at Praveen Clinic Reception.'
  },
  {
    id: 'INV-5002',
    patientId: 'PAT-1002',
    patientName: 'Rajesh Patel',
    doctorId: 'DOC-102',
    doctorName: 'Dr. Ananya Sharma',
    issueDate: '2026-02-20',
    dueDate: '2026-03-06',
    consultationFee: 800,
    treatmentCharges: 400,
    labCharges: 750,
    pharmacyCharges: 620,
    roomCharges: 0,
    subtotal: 2570,
    taxPercent: 5,
    taxAmount: 128.5,
    discount: 0,
    totalAmount: 2698.5,
    paymentStatus: 'Paid',
    paymentMethod: 'Insurance',
    insuranceProvider: 'Star Health Insurance #SHI-992188',
    notes: 'Cashless TPA insurance claim authorized.'
  },
  {
    id: 'INV-5003',
    patientId: 'PAT-1004',
    patientName: 'Anand Verma',
    doctorId: 'DOC-105',
    doctorName: 'Dr. Suresh Venkatesh',
    issueDate: '2026-02-14',
    dueDate: '2026-02-28',
    consultationFee: 750,
    treatmentCharges: 1200,
    labCharges: 650,
    pharmacyCharges: 540,
    roomCharges: 800,
    subtotal: 3940,
    taxPercent: 5,
    taxAmount: 197,
    discount: 250,
    totalAmount: 3887,
    paymentStatus: 'Pending',
    notes: 'Partial payment arrangement approved by administration.'
  },
  {
    id: 'INV-5004',
    patientId: 'PAT-1003',
    patientName: 'Meera Krishnan',
    doctorId: 'DOC-103',
    doctorName: 'Dr. Rajesh Iyer',
    issueDate: getTodayDateStr(),
    dueDate: getTomorrowDateStr(),
    consultationFee: 900,
    treatmentCharges: 0,
    labCharges: 1200,
    pharmacyCharges: 250,
    roomCharges: 0,
    subtotal: 2350,
    taxPercent: 5,
    taxAmount: 117.5,
    discount: 0,
    totalAmount: 2467.5,
    paymentStatus: 'Pending',
    notes: 'Invoice generated pending MRI scan report verification.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class HospitalDataService {
  private readonly _patients = signal<Patient[]>([]);
  private readonly _doctors = signal<Doctor[]>([]);
  private readonly _appointments = signal<Appointment[]>([]);
  private readonly _records = signal<MedicalRecord[]>([]);
  private readonly _bills = signal<Bill[]>([]);

  // Public readonly signals
  public readonly patients = this._patients.asReadonly();
  public readonly doctors = this._doctors.asReadonly();
  public readonly appointments = this._appointments.asReadonly();
  public readonly records = this._records.asReadonly();
  public readonly bills = this._bills.asReadonly();

  // Calculated Stats
  public readonly stats = computed<HospitalStats>(() => {
    const today = getTodayDateStr();
    const appts = this._appointments();
    const bills = this._bills();

    const todayAppointments = appts.filter(a => a.date === today).length;
    const scheduledAppointments = appts.filter(a => a.status === 'Scheduled').length;
    
    const totalRevenue = bills
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingDues = bills
      .filter(b => b.paymentStatus !== 'Paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalPatients: this._patients().length,
      totalDoctors: this._doctors().length,
      todayAppointments,
      scheduledAppointments,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingDues: Math.round(pendingDues * 100) / 100,
      totalRecords: this._records().length
    };
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this._patients.set(data.patients || INITIAL_PATIENTS);
        this._doctors.set(data.doctors || INITIAL_DOCTORS);
        this._appointments.set(data.appointments || INITIAL_APPOINTMENTS);
        this._records.set(data.records || INITIAL_RECORDS);
        this._bills.set(data.bills || INITIAL_BILLS);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse stored clinic data, resetting to defaults', e);
    }

    // Default seed
    this.resetToDefaults();
  }

  private saveToStorage(): void {
    try {
      const data = {
        patients: this._patients(),
        doctors: this._doctors(),
        appointments: this._appointments(),
        records: this._records(),
        bills: this._bills()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save clinic data to localStorage', e);
    }
  }

  public resetToDefaults(): void {
    this._patients.set([...INITIAL_PATIENTS]);
    this._doctors.set([...INITIAL_DOCTORS]);
    this._appointments.set([...INITIAL_APPOINTMENTS]);
    this._records.set([...INITIAL_RECORDS]);
    this._bills.set([...INITIAL_BILLS]);
    this.saveToStorage();
  }

  // --- PATIENT METHODS ---
  public addPatient(patientData: Omit<Patient, 'id' | 'registeredDate'>): Patient {
    const nextNum = 1001 + this._patients().length;
    const newPatient: Patient = {
      ...patientData,
      id: `PAT-${nextNum}`,
      registeredDate: getTodayDateStr()
    };
    this._patients.update(list => [newPatient, ...list]);
    this.saveToStorage();
    return newPatient;
  }

  public updatePatient(patient: Patient): void {
    this._patients.update(list => list.map(p => p.id === patient.id ? { ...patient } : p));
    this.saveToStorage();
  }

  public deletePatient(id: string): void {
    this._patients.update(list => list.filter(p => p.id !== id));
    this.saveToStorage();
  }

  public getPatientById(id: string): Patient | undefined {
    return this._patients().find(p => p.id === id);
  }

  // --- DOCTOR METHODS ---
  public addDoctor(doctorData: Omit<Doctor, 'id'>): Doctor {
    const nextNum = 101 + this._doctors().length;
    const newDoctor: Doctor = {
      ...doctorData,
      id: `DOC-${nextNum}`
    };
    this._doctors.update(list => [...list, newDoctor]);
    this.saveToStorage();
    return newDoctor;
  }

  public updateDoctor(doctor: Doctor): void {
    this._doctors.update(list => list.map(d => d.id === doctor.id ? { ...doctor } : d));
    this.saveToStorage();
  }

  public deleteDoctor(id: string): void {
    this._doctors.update(list => list.filter(d => d.id !== id));
    this.saveToStorage();
  }

  public getDoctorById(id: string): Doctor | undefined {
    return this._doctors().find(d => d.id === id);
  }

  // --- APPOINTMENT METHODS ---
  public addAppointment(apptData: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const nextNum = 2001 + this._appointments().length;
    const newAppt: Appointment = {
      ...apptData,
      id: `APT-${nextNum}`,
      createdAt: getTodayDateStr()
    };
    this._appointments.update(list => [newAppt, ...list]);
    this.saveToStorage();
    return newAppt;
  }

  public updateAppointment(appointment: Appointment): void {
    this._appointments.update(list => list.map(a => a.id === appointment.id ? { ...appointment } : a));
    this.saveToStorage();
  }

  public updateAppointmentStatus(id: string, status: 'Scheduled' | 'Completed' | 'Cancelled'): void {
    this._appointments.update(list => list.map(a => a.id === id ? { ...a, status } : a));
    this.saveToStorage();
  }

  public deleteAppointment(id: string): void {
    this._appointments.update(list => list.filter(a => a.id !== id));
    this.saveToStorage();
  }

  // --- MEDICAL RECORD METHODS ---
  public addRecord(recordData: Omit<MedicalRecord, 'id'>): MedicalRecord {
    const nextNum = 3001 + this._records().length;
    const newRecord: MedicalRecord = {
      ...recordData,
      id: `REC-${nextNum}`
    };
    this._records.update(list => [newRecord, ...list]);
    this.saveToStorage();
    return newRecord;
  }

  public updateRecord(record: MedicalRecord): void {
    this._records.update(list => list.map(r => r.id === record.id ? { ...record } : r));
    this.saveToStorage();
  }

  public deleteRecord(id: string): void {
    this._records.update(list => list.filter(r => r.id !== id));
    this.saveToStorage();
  }

  public getRecordsByPatient(patientId: string): MedicalRecord[] {
    return this._records().filter(r => r.patientId === patientId);
  }

  // --- BILLING METHODS ---
  public addBill(billData: Omit<Bill, 'id' | 'subtotal' | 'taxAmount' | 'totalAmount'>): Bill {
    const nextNum = 5001 + this._bills().length;
    const subtotal = (billData.consultationFee || 0) +
                     (billData.treatmentCharges || 0) +
                     (billData.labCharges || 0) +
                     (billData.pharmacyCharges || 0) +
                     (billData.roomCharges || 0);

    const taxPercent = billData.taxPercent ?? 5;
    const taxAmount = Math.round((subtotal * (taxPercent / 100)) * 100) / 100;
    const discount = billData.discount || 0;
    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discount) * 100) / 100);

    const newBill: Bill = {
      ...billData,
      id: `INV-${nextNum}`,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      totalAmount
    };

    this._bills.update(list => [newBill, ...list]);
    this.saveToStorage();
    return newBill;
  }

  public updateBill(bill: Bill): void {
    const subtotal = (bill.consultationFee || 0) +
                     (bill.treatmentCharges || 0) +
                     (bill.labCharges || 0) +
                     (bill.pharmacyCharges || 0) +
                     (bill.roomCharges || 0);
    const taxPercent = bill.taxPercent ?? 5;
    const taxAmount = Math.round((subtotal * (taxPercent / 100)) * 100) / 100;
    const discount = bill.discount || 0;
    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discount) * 100) / 100);

    const updated: Bill = {
      ...bill,
      subtotal,
      taxAmount,
      totalAmount
    };

    this._bills.update(list => list.map(b => b.id === bill.id ? updated : b));
    this.saveToStorage();
  }

  public markBillPaid(id: string, paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI / Online' | 'Insurance' = 'UPI / Online'): void {
    this._bills.update(list => list.map(b => b.id === id ? { ...b, paymentStatus: 'Paid', paymentMethod } : b));
    this.saveToStorage();
  }

  public deleteBill(id: string): void {
    this._bills.update(list => list.filter(b => b.id !== id));
    this.saveToStorage();
  }
}
