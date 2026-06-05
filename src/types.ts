export type UserRole = 'admin' | 'doctor' | 'patient';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  departmentId?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  dob: string;
  gender: string;
  insuranceNo?: string;
  medicalHistorySummary?: string;
}

export interface Doctor {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  departmentName: string;
  schedule: {
    days: string[];
    hours: string;
  };
  rating?: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  startTime: string;
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

export interface Vitals {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  notes: string;
  prescriptions: string[];
  vitals?: Vitals;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  description: string;
  amount: number;
  status: 'paid' | 'unpaid';
  createdAt: string;
  paidAt?: string;
}

export interface HMSAnalytics {
  totalPatients: number;
  totalDoctors: number;
  appointmentsToday: number;
  revenue: number;
  bedOccupancy: number; // percentage
  appointmentsByStatus: { name: string; value: number }[];
  revenueMonthly: { month: string; amount: number }[];
}
