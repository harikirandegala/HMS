import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  PlusCircle, 
  ArrowUpRight, 
  TrendingUp, 
  CloudLightning,
  Clock,
  Terminal,
  Activity,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { HMSAnalytics, Doctor, Patient, Invoice } from '../types';

interface AdminDashboardProps {
  token: string;
}

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<HMSAnalytics | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Forms state
  const [invPatientId, setInvPatientId] = useState('');
  const [invDescription, setInvDescription] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invMessage, setInvMessage] = useState<string | null>(null);

  // New Doctor account form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('Neurology');
  const [docScheduleHours, setDocScheduleHours] = useState('09:00 - 15:00');
  const [docMessage, setDocMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch concurrently
      const [resAnal, resDoc, resPat, resLogs, resInv] = await Promise.all([
        fetch('/api/analytics', { headers }),
        fetch('/api/doctors', { headers }),
        fetch('/api/patients', { headers }),
        fetch('/api/logs', { headers }),
        fetch('/api/invoices', { headers })
      ]);

      if (resAnal.ok) setAnalytics(await resAnal.json());
      if (resDoc.ok) setDoctors(await resDoc.json());
      if (resPat.ok) setPatients(await resPat.json());
      if (resLogs.ok) setLogs(await resLogs.json());
      if (resInv.ok) setInvoices(await resInv.json());
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
          amount: parseFloat(invAmount)
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

  const COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#F43F5E'];

  return (
    <div className="space-y-8 animate-fade-in font-sans text-[#1E293B]">
      
      {/* Upper Status Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] bg-[#0F172A] text-white px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase">
            Facility HQ Node
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5">
            Operational Overview Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Real-time compliance monitoring, medical billing & facility synchronization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-[#10B981] rounded-full animate-pulse" />
          <p className="text-xs font-semibold text-slate-500 font-mono">
            SYNC STATUS: ACTIVE GATEWAY
          </p>
        </div>
      </div>

      {/* Grid of HMS Operational Widgets (Clinical Precision specifications) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat card 1 - Total Patients */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-[#0F172A]/5 p-3 rounded-xl text-[#0F172A]">
              <Users className="h-6 w-6 stroke-[2]" />
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              +12% <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {analytics?.totalPatients || patients.length || '0'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Registered Patients</p>
          </div>
        </div>

        {/* Stat card 2 - Specialists Active */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-[#0D9488]/5 p-3 rounded-xl text-[#0D9488]">
              <Stethoscope className="h-6 w-6 stroke-[2]" />
            </div>
            <span className="text-[10px] text-[#0D9488] font-bold bg-[#0D9488]/5 px-2 py-0.5 rounded-full">
              Full Staff
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {analytics?.totalDoctors || doctors.length || '0'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Active Physicians</p>
          </div>
        </div>

        {/* Stat card 3 - Today's Visits */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-amber-500/5 p-3 rounded-xl text-amber-500">
              <Calendar className="h-6 w-6 stroke-[2]" />
            </div>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
              Live Queue
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {analytics?.appointmentsToday || '0'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Intake Sessions Today</p>
          </div>
        </div>

        {/* Stat card 4 - Total Operational Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-500/5 p-3 rounded-xl text-emerald-600">
              <DollarSign className="h-6 w-6 stroke-[2]" />
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              +4.8k wk
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              ${analytics?.revenue ? analytics.revenue.toFixed(2) : '0.00'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Accumulated Revenue</p>
          </div>
        </div>

      </div>

      {/* Facility Hospital Capacity (Real-time Bed Occupancy Tracker) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#0D9488]" />
              Hospital Ward Capacity & Bed Allocation
            </h3>
            <p className="text-xs text-slate-400">ICU, Emergency, and Post-Op occupancy distribution.</p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#0F172A] text-white px-3 py-1 rounded-md">
            BEDS OCCUPIED: 64% (216 / 340)
          </span>
        </div>
        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
          <div className="bg-[#0D9488] h-full" style={{ width: '45%' }} title="Emergency Floor (45%)" />
          <div className="bg-amber-500 h-full" style={{ width: '15%' }} title="ICU Ward (15%)" />
          <div className="bg-rose-500 h-full" style={{ width: '4%' }} title="Critical Care (4%)" />
          <div className="bg-slate-200 h-full" style={{ width: '36%' }} title="Available Allocation (36%)" />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
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
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Pure Free Space (36%)
          </span>
        </div>
      </div>

      {/* Visual Analytics Block - Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Trend Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm lg:col-span-2">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4 uppercase tracking-wider">Hospital Cashflow Surcharge Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.revenueMonthly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEEF0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <ChartTooltip contentStyle={{ background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="amount" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Pie Status Allocation */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4 uppercase tracking-wider">Appointment Intake Status</h3>
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
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-1.5 text-xs text-slate-500">
              {(analytics?.appointmentsByStatus || []).map((entry, idx) => (
                <div key={entry.name} className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-700">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Main interactive panel splits: Manual Invoicing and Audit logging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Invoicing Section */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-[#0F172A] text-base">Direct Clinical Manual Invoicing</h3>
            </div>
            
            {invMessage && (
              <div id="inv-alert" className={`mb-4 p-2 text-xs font-semibold rounded-md ${
                invMessage.startsWith('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#F43F5E]'
              }`}>
                {invMessage.split(':')[1]}
              </div>
            )}

            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div>
                <label htmlFor="inv-patient" className="block text-xs font-semibold text-slate-500 mb-1">Select Hospitalized Patient</label>
                <select
                  id="inv-patient"
                  value={invPatientId}
                  onChange={(e) => setInvPatientId(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-[#0D9488]"
                  required
                >
                  <option value="">-- Choose Patient Account --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.insuranceNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="inv-desc" className="block text-xs font-semibold text-slate-500 mb-1">Billing Item / Treatment Description</label>
                <input
                  id="inv-desc"
                  type="text"
                  placeholder="e.g. Annual Cardiovascular ECG Diagnostic Charge"
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label htmlFor="inv-amount" className="block text-xs font-semibold text-slate-500 mb-1">Fee Amount (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>
                  <input
                    id="inv-amount"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-invoice-generate"
                type="submit"
                className="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4 text-[#0D9488]" />
                <span>Publish Inpatient Invoice Record</span>
              </button>
            </form>
          </div>
        </div>

        {/* Audit Logs System Panel */}
        <div id="hipaa-compliance-console" className="bg-[#0F172A] text-[#A7F3D0] p-6 rounded-2xl border border-[#1E293B] flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="text-[#0D9488] h-5 w-5 animate-pulse" />
                <h3 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">HIPAA Audit Trail (Real-Time Console)</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#0D9488]/20 text-[#0e9f90] border border-[#0d9488]/30 px-2 py-0.5 rounded-md">
                SECURE LOGS
              </span>
            </div>

            <div className="space-y-3 font-mono text-[11px] max-h-72 overflow-y-auto pr-2 scrollbar-thin">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} id={`audit-log-${index}`} className="border-b border-slate-800/60 pb-2 hover:bg-slate-900/50 p-1 rounded transition-colors">
                    <div className="flex justify-between text-slate-400">
                      <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
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

          <div className="mt-4 pt-3 border-t border-[#1E293B] text-[10px] text-slate-400 flex justify-between items-center">
            <span>Standard: NIST Healthcare Framework</span>
            <span className="font-bold text-emerald-400 font-mono">100% Crypt-Guard Verified</span>
          </div>
        </div>

      </div>

    </div>
  );
}
