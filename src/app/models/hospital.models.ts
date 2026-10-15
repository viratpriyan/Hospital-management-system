export interface Patient {
  id: string; // e.g., PAT-1001
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  emergencyContact: string;
  allergies?: string;
  medicalConditions?: string;
  registeredDate: string;
}

export interface Doctor {
  id: string; // e.g., DOC-101
  name: string;
  specialization: string;
  department: string;
  qualification: string;
  phone: string;
  email: string;
  experienceYears: number;
  consultationFee: number;
  availableDays: string[];
  availableHours: string;
  status: 'Available' | 'In Consultation' | 'On Leave' | 'In Surgery';
  roomNo: string;
}

export interface Appointment {
  id: string; // e.g., APT-2001
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:30 AM"
  reason: string;
  type: 'General Checkup' | 'Follow-up' | 'Emergency' | 'Specialist Consultation';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string; // e.g., "1-0-1 (After Food)"
  duration: string; // e.g., "5 days"
}

export interface MedicalRecord {
  id: string; // e.g., REC-3001
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  vitals: {
    bloodPressure: string; // e.g. "120/80 mmHg"
    heartRate: number; // e.g. 72 bpm
    temperature: number; // e.g. 98.6 F
    weight: number; // e.g. 70 kg
    respiratoryRate?: number;
    spo2?: number; // %
  };
  symptoms: string;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  labTests: string[];
  treatmentNotes: string;
  followUpDate?: string;
}

export interface BillItem {
  description: string;
  category: 'Consultation' | 'Treatment' | 'Laboratory' | 'Pharmacy' | 'Room' | 'Other';
  amount: number;
}

export interface Bill {
  id: string; // e.g., INV-5001
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  issueDate: string;
  dueDate: string;
  consultationFee: number;
  treatmentCharges: number;
  labCharges: number;
  pharmacyCharges: number;
  roomCharges: number;
  subtotal: number;
  taxPercent: number; // e.g. 5
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partially Paid';
  paymentMethod?: 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI / Online' | 'Insurance';
  insuranceProvider?: string;
  notes?: string;
}

export interface HospitalStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  scheduledAppointments: number;
  totalRevenue: number;
  pendingDues: number;
  totalRecords: number;
}
