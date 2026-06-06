import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Coins, 
  ShieldAlert, 
  PlusCircle, 
  ArrowUpRight, 
  TrendingUp, 
  CloudLightning,
  Clock,
  Terminal,
  Activity,
  UserCheck,
  Search,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { HMSAnalytics, Doctor, Patient, Invoice } from '../types';

interface AdminDashboardProps {
  token: string;
  formatPrice: (amount: number) => string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminDashboard({ token, formatPrice, currency, activeTab, setActiveTab }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<HMSAnalytics | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Forms state
  const [invPatientId, setInvPatientId] = useState('');
  const [invDescription, setInvDescription] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrency, setInvCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>(currency || 'INR');
  const [invMessage, setInvMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currency) {
      setInvCurrency(currency);
    }
  }, [currency]);

  // New Doctor account form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('General Physician');
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [docScheduleHours, setDocScheduleHours] = useState('09:00 - 15:00');
  const [docScheduleDays, setDocScheduleDays] = useState<string[]>(['Monday', 'Wednesday']);
  const [docPassword, setDocPassword] = useState('');
  const [docMessage, setDocMessage] = useState<string | null>(null);

  // New Offline Patient form
  const [patName, setPatName] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patDob, setPatDob] = useState('');
  const [patGender, setPatGender] = useState('Male');
  const [patAge, setPatAge] = useState('');
  const [patOccupation, setPatOccupation] = useState('');
  const [patAddress, setPatAddress] = useState('');
  const [patMedicalHistory, setPatMedicalHistory] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patMessage, setPatMessage] = useState<string | null>(null);
  const [showPatModal, setShowPatModal] = useState(false);
  const [patSearchQuery, setPatSearchQuery] = useState('');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [aptSearchQuery, setAptSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch concurrently
      const [resAnal, resDoc, resPat, resLogs, resInv, resApts] = await Promise.all([
        fetch('/api/analytics', { headers }),
        fetch('/api/doctors', { headers }),
        fetch('/api/patients', { headers }),
        fetch('/api/logs', { headers }),
        fetch('/api/invoices', { headers }),
        fetch('/api/appointments', { headers })
      ]);

      if (resAnal.ok) setAnalytics(await resAnal.json());
      if (resDoc.ok) setDoctors(await resDoc.json());
      if (resPat.ok) setPatients(await resPat.json());
      if (resLogs.ok) setLogs(await resLogs.json());
      if (resInv.ok) setInvoices(await resInv.json());
      if (resApts.ok) setAppointments(await resApts.json());
    } catch (e) {
      console.error('Error polling clinical data streams', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [token]);

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMessage(null);
    if (!invPatientId || !invDescription || !invAmount) return;

    // Convert from the chosen invoice input currency to base USD for storage
    let baseAmount = parseFloat(invAmount);
    if (invCurrency === 'INR') {
      baseAmount = baseAmount / 80;
    } else if (invCurrency === 'EUR') {
      baseAmount = baseAmount / 0.92;
    } else if (invCurrency === 'GBP') {
      baseAmount = baseAmount / 0.78;
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: invPatientId,
          description: invDescription,
          amount: baseAmount
        })
      });
      if (response.ok) {
        setInvMessage('success:Invoice registered successfully.');
        setInvDescription('');
        setInvAmount('');
        fetchAdminData();
      } else {
        const err = await response.json();
        setInvMessage(`error:${err.error || 'Server error creating billing record'}`);
      }
    } catch (e: any) {
      setInvMessage(`error:${e.message}`);
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocMessage(null);
    if (!docName || !docEmail || !docSpecialization || !docScheduleHours) return;

    const specializationValue = docSpecialization === 'Other' ? customSpecialization : docSpecialization;
    if (docSpecialization === 'Other' && !customSpecialization.trim()) {
      setDocMessage('error:Please specify the custom specialization.');
      return;
    }

    const departmentNameValue = 
      specializationValue === 'Cardiology' ? 'Cardiovascular Wellness' :
      specializationValue === 'Neurology' ? 'Neuroscience Division' :
      specializationValue === 'General Physician' ? 'General Medicine Division' :
      specializationValue === 'Pediatrics' ? 'Pediatrics Clinic' :
      specializationValue === 'Orthopedics' ? 'Orthopedic Surgery Unit' :
      specializationValue === 'Dermatology' ? 'Dermatology & Skin Care' :
      specializationValue ? `${specializationValue} Department` : 'Clinical Services';

    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: docName,
          email: docEmail,
          specialization: specializationValue,
          departmentName: departmentNameValue,
          scheduleDays: docScheduleDays,
          scheduleHours: docScheduleHours,
          password: docPassword
        })
      });
      if (response.ok) {
        setDocMessage('success:Physician registered successfully.');
        setDocName('');
        setDocEmail('');
        setDocPassword('');
        setCustomSpecialization('');
        fetchAdminData();
      } else {
        const err = await response.json();
        setDocMessage(`error:${err.error || 'Server error registering specialist'}`);
      }
    } catch (e: any) {
      setDocMessage(`error:${e.message}`);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this doctor account?')) return;
    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchAdminData();
      } else {
        const err = await response.json();
        alert(err.error || 'Server error deleting physician');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOfflinePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatMessage(null);
    if (!patName || !patEmail || !patDob || !patGender) return;

    try {
      const response = await fetch('/api/patients/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: patEmail,
          fullName: patName,
          dob: patDob,
          gender: patGender,
          age: patAge,
          occupation: patOccupation,
          address: patAddress,
          medicalHistorySummary: patMedicalHistory,
          password: patPassword
        })
      });
      if (response.ok) {
        setPatMessage('success:Offline patient registered successfully.');
        setPatName('');
        setPatEmail('');
        setPatDob('');
        setPatAge('');
        setPatOccupation('');
        setPatAddress('');
        setPatMedicalHistory('');
        setPatPassword('');
        fetchAdminData();
        setTimeout(() => {
          setShowPatModal(false);
          setPatMessage(null);
        }, 1500);
      } else {
        const err = await response.json();
        setPatMessage(`error:${err.error || 'Server error registering offline patient'}`);
      }
    } catch (e: any) {
      setPatMessage(`error:${e.message}`);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this patient account?')) return;
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchAdminData();
      } else {
        const err = await response.json();
        alert(err.error || 'Server error deleting patient');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const changeAptStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error('Error setting appointment status state', e);
    }
  };

  const COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#F43F5E'];

  const showAll = activeTab === 'dashboard';
  const showAppointments = showAll || activeTab === 'appointments';
  const showBilling = showAll || activeTab === 'billing';

  const filteredPatList = patients.filter(p =>
    p.fullName.toLowerCase().includes(patSearchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(patSearchQuery.toLowerCase())
  );

  const filteredDocList = doctors.filter(d =>
    d.fullName.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    d.specialization.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    d.departmentName.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredAptList = appointments.filter(a =>
    a.patientName.toLowerCase().includes(aptSearchQuery.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(aptSearchQuery.toLowerCase()) ||
    a.reason.toLowerCase().includes(aptSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans text-[#1E293B] dark:text-slate-100">
      
      {/* Upper Status Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-[10px] bg-[#0F172A] dark:bg-[#0D9488] text-white px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase">
            Facility HQ Node
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white mt-1.5 capitalize">
            {activeTab === 'dashboard' ? 'Operational Overview Dashboard' : `${activeTab} Management Portal`}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'dashboard' && 'Real-time compliance monitoring, medical billing & facility synchronization.'}
            {activeTab === 'patients' && 'Access comprehensive clinical records and register new walk-in patients.'}
            {activeTab === 'doctors' && 'Manage staff assignments, physician directories, and register medical specialists.'}
            {activeTab === 'appointments' && 'Monitor clinical queues, schedule intakes, and coordinate appointments.'}
            {activeTab === 'billing' && 'Oversee operational cashflow surcharge channels and publish invoices.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-[#10B981] rounded-full animate-pulse" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
            SYNC STATUS: ACTIVE GATEWAY
          </p>
        </div>
      </div>

      {/* Grid of HMS Operational Widgets */}
      {(showAll || activeTab === 'appointments' || activeTab === 'billing') && (
        <div className={showAll ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "max-w-md mx-auto w-full"}>
          
          {/* Stat card 1 - Total Patients */}
          {showAll && (
            <button
              onClick={() => setActiveTab('patients')}
              className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm hover:shadow-md hover:border-[#0D9488] active:scale-[0.98] transition-all text-left w-full cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="bg-[#0F172A]/5 dark:bg-slate-800 p-3 rounded-xl text-[#0F172A] dark:text-slate-200">
                  <Users className="h-6 w-6 stroke-[2]" />
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  +12% <TrendingUp className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                  {analytics?.totalPatients || patients.length || '0'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 font-semibold uppercase tracking-wider">Registered Patients</p>
              </div>
            </button>
          )}

          {/* Stat card 2 - Specialists Active */}
          {showAll && (
            <button
              onClick={() => setActiveTab('doctors')}
              className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm hover:shadow-md hover:border-[#0D9488] active:scale-[0.98] transition-all text-left w-full cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="bg-[#0D9488]/5 dark:bg-[#0D9488]/10 p-3 rounded-xl text-[#0D9488]">
                  <Stethoscope className="h-6 w-6 stroke-[2]" />
                </div>
                <span className="text-[10px] text-[#0D9488] font-bold bg-[#0D9488]/5 px-2 py-0.5 rounded-full">
                  Full Staff
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                  {analytics?.totalDoctors || doctors.length || '0'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 font-semibold uppercase tracking-wider">Active Physicians</p>
              </div>
            </button>
          )}

          {/* Stat card 3 - Today's Visits */}
          {activeTab === 'appointments' && (
            <button
              onClick={() => setActiveTab('appointments')}
              className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm hover:shadow-md hover:border-[#0D9488] active:scale-[0.98] transition-all text-left w-full cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl text-amber-500">
                  <Calendar className="h-6 w-6 stroke-[2]" />
                </div>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Live Queue
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                  {analytics?.appointmentsToday || '0'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 font-semibold uppercase tracking-wider">Intake Sessions Today</p>
              </div>
            </button>
          )}

          {/* Stat card 4 - Total Operational Revenue */}
          {activeTab === 'billing' && (
            <button
              onClick={() => setActiveTab('billing')}
              className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm hover:shadow-md hover:border-[#0D9488] active:scale-[0.98] transition-all text-left w-full cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-xl text-emerald-600">
                  <Coins className="h-6 w-6 stroke-[2]" />
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +4.8k wk
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white font-mono">
                  {analytics?.revenue ? formatPrice(analytics.revenue) : formatPrice(0)}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 font-semibold uppercase tracking-wider">Accumulated Revenue</p>
              </div>
            </button>
          )}

        </div>
      )}

      {/* ================= PATIENTS VIEW ================= */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Users className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search registered patients..."
                value={patSearchQuery}
                onChange={(e) => setPatSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none focus:border-[#0D9488]"
              />
            </div>
            <button
              onClick={() => setShowPatModal(true)}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0b7e73] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Register Walk-in Patient
            </button>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">E-mail Address</th>
                    <th className="p-4">Date of Birth</th>
                    <th className="p-4">Biological Gender</th>
                    <th className="p-4">Age</th>
                    <th className="p-4">Occupation</th>
                    <th className="p-4">Home Address</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredPatList.length > 0 ? (
                    filteredPatList.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-200 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{p.fullName}</td>
                        <td className="p-4 font-mono">{p.email}</td>
                        <td className="p-4">{p.dob}</td>
                        <td className="p-4">{p.gender}</td>
                        <td className="p-4">{p.age || 'N/A'}</td>
                        <td className="p-4">{p.occupation || 'N/A'}</td>
                        <td className="p-4 max-w-xs truncate" title={p.address}>{p.address || 'N/A'}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeletePatient(p.id)}
                            className="p-1.5 text-rose-505 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-all focus:outline-none cursor-pointer"
                            title="Delete Patient Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No patients match the search query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Offline Registration */}
          {showPatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 relative">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0D9488]" />
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-base text-[#0F172A] dark:text-white">Register Walk-in Patient (Offline record)</h3>
                  <button 
                    onClick={() => { setShowPatModal(false); setPatMessage(null); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleOfflinePatientSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans text-xs">
                  {patMessage && (
                    <div className={`p-2 text-xs font-semibold rounded-md ${
                      patMessage.startsWith('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#F43F5E]'
                    }`}>
                      {patMessage.split(':')[1]}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={patName}
                        onChange={(e) => setPatName(e.target.value)}
                        className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">E-mail Address</label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={patEmail}
                        onChange={(e) => setPatEmail(e.target.value)}
                        className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Account Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={patPassword}
                      onChange={(e) => setPatPassword(e.target.value)}
                      className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={patDob}
                        onChange={(e) => setPatDob(e.target.value)}
                        className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Gender</label>
                      <div className="relative">
                        <select
                          value={patGender}
                          onChange={(e) => setPatGender(e.target.value)}
                          className="w-full text-xs h-10 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                        >
                          <option className="dark:bg-[#111827]">Male</option>
                          <option className="dark:bg-[#111827]">Female</option>
                          <option className="dark:bg-[#111827]">Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Age</label>
                      <input
                        type="number"
                        placeholder="35"
                        value={patAge}
                        onChange={(e) => setPatAge(e.target.value)}
                        className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Occupation</label>
                      <input
                        type="text"
                        placeholder="Engineer"
                        value={patOccupation}
                        onChange={(e) => setPatOccupation(e.target.value)}
                        className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Home Address</label>
                    <input
                      type="text"
                      placeholder="123 Main St, City"
                      value={patAddress}
                      onChange={(e) => setPatAddress(e.target.value)}
                      className="w-full text-xs h-10 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase mb-1">Medical History Summary</label>
                    <textarea
                      placeholder="e.g. Minor asthma, no regular meds."
                      value={patMedicalHistory}
                      onChange={(e) => setPatMedicalHistory(e.target.value)}
                      rows={2}
                      className="w-full text-xs py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowPatModal(false); setPatMessage(null); }}
                      className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#0D9488] hover:bg-[#0b7e73] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Register Patient
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= DOCTORS VIEW ================= */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] flex gap-2 items-center shadow-sm">
              <Users className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search physicians by name or department..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-800 dark:text-white border-none outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4">Physician</th>
                      <th className="p-4">Specialization</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Assigned Hours</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredDocList.length > 0 ? (
                      filteredDocList.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-200 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-white">{d.fullName}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{d.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488]/10 text-[#0D9488]">{d.specialization}</span>
                          </td>
                          <td className="p-4">{d.departmentName}</td>
                          <td className="p-4">
                            <div className="font-semibold">{d.schedule?.hours || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{(d.schedule?.days || []).join(', ')}</div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteDoctor(d.id)}
                              className="p-1.5 text-rose-505 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-all focus:outline-none cursor-pointer"
                              title="Delete Doctor Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No specialist physicians found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0D9488]" />
              
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="text-[#0D9488] h-5 w-5" />
                <h3 className="font-bold text-[#0F172A] dark:text-white text-base">Register Specialist Physician</h3>
              </div>

              {docMessage && (
                <div className={`mb-4 p-2 text-xs font-semibold rounded-md ${
                  docMessage.startsWith('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#F43F5E]'
                }`}>
                  {docMessage.split(':')[1]}
                </div>
              )}

              <form onSubmit={handleDoctorSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Doctor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Watson"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Hospital E-mail Address</label>
                  <input
                    type="email"
                    required
                    placeholder="watson@hospital.com"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    className="w-full py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={docPassword}
                    onChange={(e) => setDocPassword(e.target.value)}
                    className="w-full py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Specialization</label>
                    <div className={`relative ${docSpecialization === 'Other' ? 'mb-2' : ''}`}>
                      <select
                        value={docSpecialization}
                        onChange={(e) => setDocSpecialization(e.target.value)}
                        className="w-full py-2.5 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                      >
                        <option className="dark:bg-[#111827]">General Physician</option>
                        <option className="dark:bg-[#111827]">Neurology</option>
                        <option className="dark:bg-[#111827]">Cardiology</option>
                        <option className="dark:bg-[#111827]">Pediatrics</option>
                        <option className="dark:bg-[#111827]">Orthopedics</option>
                        <option className="dark:bg-[#111827]">Dermatology</option>
                        <option className="dark:bg-[#111827]">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                    {docSpecialization === 'Other' && (
                      <input
                        type="text"
                        required
                        placeholder="Specify Specialization"
                        value={customSpecialization}
                        onChange={(e) => setCustomSpecialization(e.target.value)}
                        className="w-full py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Consulting Hours</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09:00 - 15:00"
                      value={docScheduleHours}
                      onChange={(e) => setDocScheduleHours(e.target.value)}
                      className="w-full py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Duty Days Selection</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                      const isSelected = docScheduleDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setDocScheduleDays(docScheduleDays.filter(day => day !== d));
                            } else {
                              setDocScheduleDays([...docScheduleDays, d]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full font-semibold border text-[10px] transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#0D9488]/15 border-[#0D9488] text-[#0D9488]' 
                              : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {d.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F172A] dark:bg-[#0D9488] hover:bg-slate-800 dark:hover:bg-[#0b7e73] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Register Specialist Physician</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= APPOINTMENTS VIEW ================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search appointments..."
                value={aptSearchQuery}
                onChange={(e) => setAptSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none focus:border-[#0D9488]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-[#0F172A] dark:text-white uppercase tracking-wider">
                  Complete Clinical Intake Queue
                </div>
                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto font-sans">
                  {filteredAptList.length > 0 ? (
                    filteredAptList.map(apt => (
                      <div 
                        key={apt.id}
                        className="p-4 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-900/35 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#0D9488]"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{apt.patientName}</h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">→ with {apt.doctorName}</span>
                          </div>
                          <p className="text-[10px] text-zinc-450 dark:text-slate-550 font-bold font-mono">
                            📆 {new Date(apt.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{apt.reason}"</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            apt.status === 'completed' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' :
                            apt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}>
                            {apt.status}
                          </span>

                          {apt.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => changeAptStatus(apt.id, 'cancelled')}
                                className="text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-bold px-2.5 py-1 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => changeAptStatus(apt.id, 'confirmed')}
                                className="text-[10px] bg-[#0D9488] text-white font-bold px-2.5 py-1 rounded-md hover:opacity-90 transition-all cursor-pointer"
                              >
                                Accept
                              </button>
                            </div>
                          )}

                          {apt.status === 'confirmed' && (
                            <button
                              onClick={() => changeAptStatus(apt.id, 'completed')}
                              className="text-[10px] bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 italic text-xs">No active appointments matching this criteria.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm">
                <h3 className="font-bold text-sm text-[#0F172A] dark:text-white mb-4 uppercase tracking-wider">Appointment Intake Status</h3>
                <div className="h-64 flex flex-col justify-between">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.appointmentsByStatus || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {(analytics?.appointmentsByStatus || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {(analytics?.appointmentsByStatus || []).map((entry, idx) => (
                      <div key={entry.name} className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BILLING VIEW ================= */}
      {activeTab === 'billing' && (
        <div className="space-y-6 font-sans">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0D9488]" />
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Coins className="text-[#0D9488] h-5 w-5" />
                    <h3 className="font-bold text-[#0F172A] dark:text-white text-base">Direct Clinical Manual Invoicing</h3>
                  </div>
                  
                  {invMessage && (
                    <div id="inv-alert" className={`mb-4 p-2 text-xs font-semibold rounded-md ${
                      invMessage.startsWith('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#F43F5E]'
                    }`}>
                      {invMessage.split(':')[1]}
                    </div>
                  )}

                  <form onSubmit={handleInvoiceSubmit} className="space-y-4 text-xs">
                    <div>
                      <label htmlFor="inv-patient" className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Select Hospitalized Patient</label>
                      <div className="relative">
                        <select
                          id="inv-patient"
                          value={invPatientId}
                          onChange={(e) => setInvPatientId(e.target.value)}
                          className="w-full text-xs py-2.5 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer transition-colors"
                          required
                        >
                          <option value="" className="dark:bg-[#111827]">-- Choose Patient Account --</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id} className="dark:bg-[#111827]">{p.fullName}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="inv-desc" className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Billing Item / Treatment Description</label>
                      <input
                        id="inv-desc"
                        type="text"
                        placeholder="e.g. Annual Cardiovascular ECG Charge"
                        value={invDescription}
                        onChange={(e) => setInvDescription(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label htmlFor="inv-currency" className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Currency</label>
                        <div className="relative">
                          <select
                            id="inv-currency"
                            value={invCurrency}
                            onChange={(e) => setInvCurrency(e.target.value as any)}
                            className="w-full text-xs py-2.5 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label htmlFor="inv-amount" className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Fee Amount</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-550 font-bold font-mono">
                            {invCurrency === 'INR' ? '₹' : invCurrency === 'EUR' ? '€' : invCurrency === 'GBP' ? '£' : '$'}
                          </span>
                          <input
                            id="inv-amount"
                            type="number"
                            step="0.01"
                            placeholder="150.00"
                            value={invAmount}
                            onChange={(e) => setInvAmount(e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 text-xs border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      id="btn-invoice-generate"
                      type="submit"
                      className="w-full py-2.5 bg-[#0F172A] dark:bg-[#0D9488] hover:bg-slate-800 dark:hover:bg-[#0b7e73] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4 text-[#0D9488] dark:text-white" />
                      <span>Publish Inpatient Invoice Record</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-[#0F172A] dark:text-white uppercase tracking-wider">
                  Transaction Ledger History
                </div>
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3">Patient</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {invoices.length > 0 ? (
                        invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-200 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white">{inv.patientName}</span>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.patientId}</div>
                            </td>
                            <td className="p-3">{inv.description}</td>
                            <td className="p-3 text-right font-mono font-bold">{formatPrice(inv.amount)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'paid' 
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400 italic">No hospital invoices published yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. MAIN DASHBOARD OVERVIEW ================= */}
      {showAll && (
        <>
          {/* Facility Hospital Capacity (Real-time Bed Occupancy Tracker) */}
          <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#0F172A] dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#0D9488]" />
                  Hospital Ward Capacity & Bed Allocation
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">ICU, Emergency, and Post-Op occupancy distribution.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#0F172A] dark:bg-[#0D9488] text-white px-3 py-1 rounded-md">
                BEDS OCCUPIED: 64% (216 / 340)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
              <div className="bg-[#0D9488] h-full" style={{ width: '45%' }} title="Emergency Floor (45%)" />
              <div className="bg-amber-500 h-full" style={{ width: '15%' }} title="ICU Ward (15%)" />
              <div className="bg-rose-500 h-full" style={{ width: '4%' }} title="Critical Care (4%)" />
              <div className="bg-slate-200 dark:bg-slate-700 h-full" style={{ width: '36%' }} title="Available Allocation (36%)" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" /> Primary ER Wards (45%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Intensive Care Unit (15%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical Isolation (4%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" /> Pure Free Space (36%)
              </span>
            </div>
          </div>

          {/* Visual Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm lg:col-span-2">
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white mb-4 uppercase tracking-wider">Hospital Cashflow Surcharge Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.revenueMonthly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEEF0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                    <Tooltip contentStyle={{ background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="amount" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm">
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white mb-4 uppercase tracking-wider">Appointment Intake Status</h3>
              <div className="h-64 flex flex-col justify-between">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.appointmentsByStatus || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(analytics?.appointmentsByStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {(analytics?.appointmentsByStatus || []).map((entry, idx) => (
                    <div key={entry.name} className="flex justify-between items-center px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Invoicing & Activity Logging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0D9488]" />
              
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="text-[#0D9488] h-5 w-5" />
                  <h3 className="font-bold text-[#0F172A] dark:text-white text-base">Direct Clinical Manual Invoicing</h3>
                </div>
                
                {invMessage && (
                  <div id="inv-alert" className={`mb-4 p-2 text-xs font-semibold rounded-md ${
                    invMessage.startsWith('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#F43F5E]'
                  }`}>
                    {invMessage.split(':')[1]}
                  </div>
                )}

                <form onSubmit={handleInvoiceSubmit} className="space-y-4 text-xs font-sans">
                  <div>
                    <label htmlFor="inv-patient" className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Select Hospitalized Patient</label>
                    <div className="relative">
                      <select
                        id="inv-patient"
                        value={invPatientId}
                        onChange={(e) => setInvPatientId(e.target.value)}
                        className="w-full text-xs py-2.5 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer transition-colors"
                        required
                      >
                        <option value="" className="dark:bg-[#111827]">-- Choose Patient Account --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id} className="dark:bg-[#111827]">{p.fullName}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inv-desc" className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Billing Item / Treatment Description</label>
                    <input
                      id="inv-desc"
                      type="text"
                      placeholder="e.g. Annual Cardiovascular ECG Diagnostic Charge"
                      value={invDescription}
                      onChange={(e) => setInvDescription(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label htmlFor="inv-currency" className="block font-bold text-slate-500 dark:text-slate-450 mb-1">Currency</label>
                      <div className="relative">
                        <select
                          id="inv-currency"
                          value={invCurrency}
                          onChange={(e) => setInvCurrency(e.target.value as any)}
                          className="w-full text-xs py-2.5 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer transition-colors"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label htmlFor="inv-amount" className="block font-bold text-slate-505 dark:text-slate-450 mb-1">Fee Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450 dark:text-slate-550 font-bold font-mono">
                          {invCurrency === 'INR' ? '₹' : invCurrency === 'EUR' ? '€' : invCurrency === 'GBP' ? '£' : '$'}
                        </span>
                        <input
                          id="inv-amount"
                          type="number"
                          step="0.01"
                          placeholder="150.00"
                          value={invAmount}
                          onChange={(e) => setInvAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 text-xs border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white focus:outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-invoice-generate"
                    type="submit"
                    className="w-full py-2.5 bg-[#0F172A] dark:bg-[#0D9488] hover:bg-slate-800 dark:hover:bg-[#0b7e73] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4 text-[#0D9488] dark:text-white" />
                    <span>Publish Inpatient Invoice Record</span>
                  </button>
                </form>
              </div>
            </div>

            <div id="hipaa-compliance-console" className="bg-[#0D111A] text-[#A7F3D0] p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="text-[#0D9488] h-5 w-5 animate-pulse" />
                    <h3 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">System Activity Logs</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-[#0D9488]/20 text-[#0e9f90] border border-[#0d9488]/30 px-2 py-0.5 rounded-md">
                    SYSTEM LOGS
                  </span>
                </div>

                <div className="space-y-3 font-mono text-[11px] max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} id={`audit-log-${index}`} className="border-b border-slate-800/60 pb-2 hover:bg-slate-900/50 p-1 rounded transition-colors">
                        <div className="flex justify-between text-slate-400">
                          <span>[{new Date(log.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}]</span>
                          <span className="font-bold text-amber-400">{log.action}</span>
                        </div>
                        <p className="mt-1 text-slate-300">
                          <strong className="text-white">{log.user}:</strong> {log.details}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div id="no-logs" className="text-slate-500 italic py-6 text-center">
                      Awaiting system interaction trigger events...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                <span>System Status: Online</span>
                <span className="font-bold text-emerald-400 font-mono">Logged Operations</span>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
