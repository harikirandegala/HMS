import React, { useState, useEffect } from 'react';
import { 
  Clipboard, 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Search, 
  PlusCircle, 
  Activity, 
  Heart, 
  ListPlus, 
  FileCheck
} from 'lucide-react';
import { Appointment, Patient, MedicalRecord } from '../types';

interface DoctorDashboardProps {
  token: string;
  formatPrice: (amount: number) => string;
  activeTab: string;
}

export default function DoctorDashboard({ token, formatPrice, activeTab }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Selection/Modal states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Diagnostics / Treatment Notes Creator Box
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  
  // Vitals State Inputs
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState('75');
  const [temperature, setTemperature] = useState('36.8');
  const [weight, setWeight] = useState('70');

  // Multi prescription lines
  const [currentPrescriptionLine, setCurrentPrescriptionLine] = useState('');
  const [prescriptionsArrayList, setPrescriptionsArrayList] = useState<string[]>([]);
  const [writeMessage, setWriteMessage] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resApts, resPatients] = await Promise.all([
        fetch('/api/appointments', { headers }),
        fetch('/api/patients', { headers })
      ]);

      if (resApts.ok) {
        // Sort appointments: pending & confirmed first
        const apts = await resApts.json();
        apts.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setAppointments(apts);
      }
      if (resPatients.ok) {
        setPatients(await resPatients.json());
      }
    } catch (e) {
      console.error('Error querying physician clinical data feeds', e);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(fetchDoctorData, 8000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (selectedPatientId) {
      const pt = patients.find(p => p.id === selectedPatientId);
      if (pt) {
        setSelectedPatient(pt);
      }
    }
  }, [patients, selectedPatientId]);

  // Handle appointment state change (Reject, Confirm, Complete)
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
        fetchDoctorData();
      }
    } catch (e) {
      console.error('Error setting appointment status state', e);
    }
  };

  // Fetch medical files timeline for expanded patient
  const fetchPatientMedicalFile = async (ptId: string) => {
    try {
      const resp = await fetch(`/api/patients/${ptId}/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        setPatientRecords(await resp.json());
      }
    } catch (e) {
      console.error('Error fetch medical files timeline', e);
    }
  };

  const handlePatientSelect = (pt: Patient) => {
    setSelectedPatientId(pt.id);
    setSelectedPatient(pt);
    fetchPatientMedicalFile(pt.id);
    
    // Clear old form states
    setDiagnosis('');
    setNotes('');
    setPrescriptionsArrayList([]);
    setCurrentPrescriptionLine('');
    setWriteMessage(null);
  };

  const addPrescriptionLine = () => {
    if (currentPrescriptionLine.trim()) {
      setPrescriptionsArrayList([...prescriptionsArrayList, currentPrescriptionLine.trim()]);
      setCurrentPrescriptionLine('');
    }
  };

  const removePrescriptionLineLocal = (idx: number) => {
    setPrescriptionsArrayList(prescriptionsArrayList.filter((_, i) => i !== idx));
  };

  const handleSubmitClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis || !notes) return;

    try {
      const response = await fetch(`/api/patients/${selectedPatientId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          diagnosis,
          notes,
          prescriptions: prescriptionsArrayList,
          vitals: {
            bloodPressure,
            heartRate,
            temperature,
            weight: weight ? `${weight} kg` : undefined
          }
        })
      });

      if (response.ok) {
        setWriteMessage('success:Medical Clinical Note published; Consulting Invoice automatically sent.');
        setDiagnosis('');
        setNotes('');
        setPrescriptionsArrayList([]);
        
        // Refresh patient's file timeline
        fetchPatientMedicalFile(selectedPatientId);
      } else {
        const err = await response.json();
        setWriteMessage(`error:${err.error || 'Server error recording clinical files'}`);
      }
    } catch (err: any) {
      setWriteMessage(`error:${err.message}`);
    }
  };

  // Filter patients by user search query
  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.insuranceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showAll = activeTab === 'dashboard';
  const showAppointments = showAll || activeTab === 'appointments';
  const showRecords = showAll || activeTab === 'records';
  const showPatientsOnly = activeTab === 'patients';

  return (
    <div className="space-y-8 animate-fade-in font-sans text-[#1E293B] dark:text-slate-100">
      
      {/* Welcome Practitioner Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-[#0D9488]/10 text-[#0D9488] font-bold border border-[#0D9488]/20 px-3 py-1 rounded-full font-mono uppercase">
            Specialist Clinic Center
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white mt-1.5 flex items-center gap-2">
            Physician Clinical Portal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consult patients, write computerized prescriptions, and trace patient clinical files.
          </p>
        </div>
        <div className="bg-white dark:bg-[#111827] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition-colors">
          <p className="font-semibold text-slate-600 dark:text-slate-400">Assigned Ward Hours</p>
          <p className="font-bold text-[#0D9488] mt-0.5">Mon - Thurs, 08:00 - 14:00 (EST)</p>
        </div>
      </div>

      {/* Main Grid: Left is Appointment List & Patient Search list, Right is Patient Details / Form Pad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side (5 Column) */}
        {(showAppointments || showRecords || showPatientsOnly) && (
          <div className={activeTab === 'appointments' ? "lg:col-span-12 max-w-3xl mx-auto w-full space-y-6" : "lg:col-span-5 space-y-6"}>
          
            {/* Appointment Queue card */}
            {showAppointments && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden transition-colors">
            <div className="bg-[#0F172A] dark:bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0D9488]" />
                <h3 className="font-bold text-sm tracking-wide">Allocated Patient Queue</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-[#0D9488] text-white px-2 py-0.5 rounded">
                {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length} Active
              </span>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {appointments.length > 0 ? (
                appointments.map(apt => (
                  <div 
                    key={apt.id} 
                    id={`apt-card-${apt.id}`}
                    className="p-3 border.5 border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-900/35 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-all flex flex-col justify-between gap-2.5 relative pl-4 border-l-4 border-l-[#0D9488]"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{apt.patientName}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          apt.status === 'completed' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' :
                          apt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold font-mono mt-0.5">
                        📆 {new Date(apt.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lines-clamp-2 italic">"{apt.reason}"</p>
                    </div>

                    {/* Operational controls for doctor */}
                    {apt.status === 'pending' && (
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          id={`btn-apt-cancel-${apt.id}`}
                          onClick={() => changeAptStatus(apt.id, 'cancelled')}
                          className="text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 font-bold px-2.5 py-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          id={`btn-apt-confirm-${apt.id}`}
                          onClick={() => changeAptStatus(apt.id, 'confirmed')}
                          className="text-[10px] bg-[#0D9488] text-white font-bold px-2.5 py-1 rounded-md hover:opacity-90 transition-all cursor-pointer"
                        >
                          Accept/Confirm
                        </button>
                      </div>
                    )}

                    {apt.status === 'confirmed' && (
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          id={`btn-apt-complete-${apt.id}`}
                          onClick={() => changeAptStatus(apt.id, 'completed')}
                          className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-md hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div id="no-apts" className="text-center py-6 text-xs italic text-slate-400 dark:text-slate-500">
                  No patient clinical consults booked in active slots.
                </div>
              )}
              </div>
            </div>
          )}

            {/* Registered Patient Directories List */}
            {(showAll || showRecords || showPatientsOnly) && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex gap-2 items-center">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-550" />
              <input
                id="patient-search-input"
                type="text"
                placeholder="Search registered patient files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-800 dark:text-white border-none outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Hospital Records ({filteredPatients.length} Active Records)</h4>
              {filteredPatients.length > 0 ? (
                filteredPatients.map(pt => (
                  <button
                    key={pt.id}
                    id={`pt-row-${pt.id}`}
                    onClick={() => handlePatientSelect(pt)}
                    className={`w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between group ${
                      selectedPatientId === pt.id ? 'bg-[#0D9488]/5 dark:bg-[#0D9488]/10 border-[#0D9488]' : 'bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-white'
                    }`}
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#0D9488] transition-colors">{pt.fullName}</h5>
                      <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-semibold font-mono mt-0.5">
                        {pt.age ? `${pt.age} yrs` : 'N/A'} • {pt.occupation || 'No Occupation'}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-md uppercase">View File</span>
                  </button>
                ))
              ) : (
                <div id="no-patients-match" className="text-center py-4 text-xs italic text-slate-400 dark:text-slate-500">
                  No matching inpatient records discoverable in directories.
                </div>
              )}
              </div>
            </div>
          )}

          </div>
        )}

        {/* Right Side - Patient Detail Timeline & Professional Consultation note writer (7 Column) */}
        {(showAll || showRecords || showPatientsOnly) && (
          <div className="lg:col-span-7">
          
          {selectedPatientId && selectedPatient ? (
            <div className="space-y-6">
                          {/* Demographics Summary card */}
              {(showAll || showRecords || showPatientsOnly) && (
                <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D9488]/5 dark:bg-[#0D9488]/10 rounded-bl-full pointer-events-none" />
                
                <span className="text-[10px] bg-[#0F172A] dark:bg-slate-800 text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                  Active Clinical File
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mt-2">{selectedPatient.fullName}</h3>
                
                <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Age / Birth Date</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedPatient.age ? `${selectedPatient.age} yrs` : 'N/A'} {selectedPatient.dob ? `(${selectedPatient.dob})` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Registered Gender</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Occupation</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPatient.occupation || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Home Address</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPatient.address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Hospital policy insurance</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPatient.insuranceNo || 'N/A'}</p>
                  </div>
                </div>

                {selectedPatient.medicalHistorySummary && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-[#0D9488] font-bold uppercase">Chronic Pre-existing History LOG</span>
                    <p className="text-slate-600 dark:text-slate-350 mt-0.5 leading-relaxed">{selectedPatient.medicalHistorySummary}</p>
                  </div>
                )}
                </div>
              )}

              {/* Professional Consultation Note Creator Pad */}
              {(showAll || showRecords) && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden p-6 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <Clipboard className="text-[#0D9488] h-5 w-5" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Computerized Practitioner Clinical Pad & consult</h3>
                </div>

                {writeMessage && (
                  <div id="clinical-post-alert" className={`mb-4 p-2.5 text-xs font-semibold rounded-md ${
                    writeMessage.startsWith('success') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-450 border-l-4 border-emerald-500' : 'bg-red-50 dark:bg-red-500/10 text-[#F43F5E] border-l-4 border-[#F43F5E]'
                  }`}>
                    {writeMessage.split(':')[1]}
                  </div>
                )}

                <form onSubmit={handleSubmitClinicalNote} className="space-y-4">
                  <div>
                    <label htmlFor="diag-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Encounter Assessment Diagnosis</label>
                    <input
                      id="diag-input"
                      type="text"
                      placeholder="e.g. Stage 1 Hypertension Symptomatic Control review"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="notes-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Clinical Assessment Logs (Practitioner notes)</label>
                    <textarea
                      id="notes-input"
                      rows={3}
                      placeholder="Enter comprehensive findings, lifestyle plans, dietary and subsequent clinic reviews."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488] resize-none"
                      required
                    />
                  </div>

                  {/* Vitals Form Grid */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-[#0D9488]" />
                      Recorded Critical Inpatient Vitals
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label htmlFor="vital-bp" className="block text-[10px] font-semibold text-zinc-500 dark:text-slate-400 mb-0.5">BP (mmHg)</label>
                        <input
                          id="vital-bp"
                          type="text"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-md"
                        />
                      </div>
                      <div>
                        <label htmlFor="vital-hr" className="block text-[10px] font-semibold text-zinc-500 dark:text-slate-400 mb-0.5">Heart Rate (BPM)</label>
                        <input
                          id="vital-hr"
                          type="text"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-md"
                        />
                      </div>
                      <div>
                        <label htmlFor="vital-temp" className="block text-[10px] font-semibold text-zinc-500 dark:text-slate-400 mb-0.5">Temp (°C)</label>
                        <input
                          id="vital-temp"
                          type="text"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-md"
                        />
                      </div>
                      <div>
                        <label htmlFor="vital-weight" className="block text-[10px] font-semibold text-zinc-500 dark:text-slate-400 mb-0.5">Weight (kg)</label>
                        <input
                          id="vital-weight"
                          type="text"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic electronic prescription line creator */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-[#0D9488]/10 dark:border-[#0D9488]/20">
                    <h4 className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest mb-3 flex items-center gap-1">
                      <ListPlus className="h-3.5 w-3.5" />
                      Digital electronic-Prescription Lines (Rx Pad)
                    </h4>
                    
                    <div className="flex gap-2 mb-3">
                      <input
                        id="rx-line-input"
                        type="text"
                        placeholder="e.g. Paracetamol 500mg - one tablet every 6 hours PRN"
                        value={currentPrescriptionLine}
                        onChange={(e) => setCurrentPrescriptionLine(e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 border border-[#E2E8F0] dark:border-slate-850 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-lg focus:outline-none"
                        onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); addPrescriptionLine(); } }}
                      />
                      <button
                        id="btn-add-rx-line"
                        type="button"
                        onClick={addPrescriptionLine}
                        className="bg-[#0f172a] dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        Insert Rx
                      </button>
                    </div>

                    {prescriptionsArrayList.length > 0 ? (
                      <div className="space-y-1.5 bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        {prescriptionsArrayList.map((rx, index) => (
                          <div key={index} className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded font-mono">
                            <span>💊 {rx}</span>
                            <button
                              type="button"
                              onClick={() => removePrescriptionLineLocal(index)}
                              className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">No medicinal chemical compounds prescribed.</p>
                    )}
                  </div>

                  <button
                    id="btn-prescribe-submit"
                    type="submit"
                    className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0b7a70] dark:hover:bg-[#115e56] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>Authorize, Publish & invoice consultation</span>
                  </button>
                </form>
                </div>
              )}

              {/* Chronological clinical encounters logs history timeline */}
              {(showAll || showRecords) && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm p-6 space-y-4 transition-colors">
                <h4 className="font-bold text-sm text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">CHRONOLOGICAL CLINICAL FILE JOURNAL TIMELINE</h4>
                
                <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-4 ml-2">
                  {patientRecords.length > 0 ? (
                    patientRecords.map((rec, idx) => (
                      <div key={rec.id} id={`medical-timeline-item-${idx}`} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 bg-[#0D9488] rounded-full border border-white dark:border-[#111827]" />
                        
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          <div className="flex justify-between items-start text-xs text-slate-400 dark:text-slate-550 mb-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">📆 Visited: {rec.date}</span>
                            <span className="italic">Dr: {rec.doctorName}</span>
                          </div>
                          
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1 uppercase">Diagnosis: {rec.diagnosis}</h5>
                          <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 whitespace-pre-wrap leading-relaxed">"{rec.notes}"</p>

                          {rec.vitals && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px] text-slate-500 dark:text-slate-450 font-mono">
                              <span>BP: {rec.vitals.bloodPressure}</span>
                              <span>HR: {rec.vitals.heartRate}</span>
                              <span>Temp: {rec.vitals.temperature}</span>
                              {rec.vitals.weight && <span>Wt: {rec.vitals.weight}</span>}
                            </div>
                          )}

                          {rec.prescriptions && rec.prescriptions.length > 0 && (
                            <div className="mt-2 text-[11px] bg-white dark:bg-slate-900/50 p-2 rounded border border-slate-200/60 dark:border-slate-800/40">
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Assigned Prescriptions Rx:</p>
                              <div className="space-y-1">
                                {rec.prescriptions.map((px, rxIdx) => (
                                  <div key={rxIdx} className="text-slate-700 dark:text-slate-300 font-mono">
                                    • {px}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div id="no-history-logs" className="py-2 text-xs italic text-slate-400 dark:text-slate-500 pl-2">
                      No matching consultation encounters documented for this patient file yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            </div>
          ) : (
            (showAll || showRecords || showPatientsOnly) && (
              <div id="pt-selector-placeholder" className="bg-white dark:bg-[#111827] p-12 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] text-center max-w-sm mx-auto shadow-sm transition-colors">
              <Clipboard className="h-12 w-12 text-slate-300 dark:text-slate-750 mx-auto stroke-[1.5] mb-3" />
              <h3 className="font-sans font-bold text-[#0F172A] dark:text-white text-sm">Select Inpatient Medical Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
                Choose a clinical patient card from the sidebar directories to start consulting and writing prescriptions.
              </p>
              </div>
            )
          )}

        </div>
        )}

      </div>

    </div>
  );
}
