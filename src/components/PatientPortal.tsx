import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  CreditCard, 
  Activity, 
  Clock, 
  User, 
  MapPin, 
  FolderHeart, 
  CheckCircle,
  HelpCircle,
  XCircle,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { Appointment, MedicalRecord, Invoice, Doctor } from '../types';

interface PatientPortalProps {
  token: string;
  user: any;
  formatPrice: (amount: number) => string;
  activeTab: string;
  onUserUpdate: (updatedUserFields: Partial<any>) => void;
}

export default function PatientPortal({ token, user, formatPrice, activeTab, onUserUpdate }: PatientPortalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Profile edit states
  const [profileName, setProfileName] = useState(user.fullName);
  const [profileDob, setProfileDob] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileOccupation, setProfileOccupation] = useState('');
  const [profileGender, setProfileGender] = useState('Male');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileInsuranceNo, setProfileInsuranceNo] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);

  // Appointment Creator states
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // Billing checkout modal states
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [billingNumber, setBillingNumber] = useState('4242 4242 4242 4242');
  const [billingExp, setBillingExp] = useState('12/28');
  const [billingCvc, setBillingCvc] = useState('321');
  const [checkoutIsPaying, setCheckoutIsPaying] = useState(false);

  const fetchPatientData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resApts, resDocs, resRecords, resInvoices, resProfile] = await Promise.all([
        fetch('/api/appointments', { headers }),
        fetch('/api/doctors', { headers }),
        fetch(`/api/patients/${user.id}/records`, { headers }),
        fetch('/api/invoices', { headers }),
        fetch(`/api/patients/${user.id}`, { headers })
      ]);

      if (resApts.ok) setAppointments(await resApts.json());
      if (resDocs.ok) setDoctors(await resDocs.json());
      if (resRecords.ok) setMedicalRecords(await resRecords.json());
      if (resInvoices.ok) setInvoices(await resInvoices.json());
      if (resProfile.ok) {
        const data = await resProfile.json();
        setPatientProfile(data);
        setProfileName(data.fullName || '');
        setProfileDob(data.dob || '');
        setProfileAge(data.age !== undefined && data.age !== null ? data.age.toString() : '');
        setProfileOccupation(data.occupation || '');
        setProfileGender(data.gender || 'Male');
        setProfileAddress(data.address || '');
        setProfileInsuranceNo(data.insuranceNo || '');
      }
    } catch (e) {
      console.error('Error fetching patient data feeds', e);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      const response = await fetch(`/api/patients/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileName,
          dob: profileDob,
          gender: profileGender,
          age: profileAge ? parseInt(profileAge, 10) : undefined,
          occupation: profileOccupation,
          address: profileAddress,
          insuranceNo: profileInsuranceNo
        })
      });

      if (response.ok) {
        setProfileMessage('success:Personal details updated successfully.');
        fetchPatientData();
        onUserUpdate({ fullName: profileName });
      } else {
        const data = await response.json();
        setProfileMessage(`error:${data.error || 'Server error saving profile.'}`);
      }
    } catch (err: any) {
      setProfileMessage(`error:${err.message}`);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [token]);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingMessage(null);

    if (!selectedDoctorId || !selectedDate || !selectedTimeSlot || !bookingReason) {
      setBookingMessage('error:Please fulfill all booking criteria.');
      return;
    }

    // Combine date and time slot
    const startTimeStamp = `${selectedDate}T${selectedTimeSlot}:00.000Z`;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          startTime: startTimeStamp,
          reason: bookingReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error booking slot.');
      }

      setBookingMessage('success:Appointment slot booked successfully! Awaiting clinical practitioner check-in.');
      setBookingReason('');
      fetchPatientData();
    } catch (err: any) {
      setBookingMessage(`error:${err.message}`);
    }
  };

  // Trigger simulated Stripe billing payment
  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    setCheckoutIsPaying(true);
    // Simulate API network payment latency
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/invoices/${activePaymentInvoice.id}/pay`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setActivePaymentInvoice(null);
          fetchPatientData();
        }
      } catch (e) {
        console.error('Simulated gateway fault', e);
      } finally {
        setCheckoutIsPaying(false);
      }
    }, 1500);
  };

  const cancelAppointmentPatient = async (aptId: string) => {
    try {
      const response = await fetch(`/api/appointments/${aptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (response.ok) {
        fetchPatientData();
      }
    } catch (e) {
      console.error('Error cancelling appointment slot', e);
    }
  };

  const getUnpaidSum = () => {
    return invoices
      .filter(i => i.status === 'unpaid')
      .reduce((sum, i) => sum + i.amount, 0);
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

  const showAll = activeTab === 'dashboard';
  const showAppointments = showAll || activeTab === 'appointments';
  const showRecords = showAll || activeTab === 'records';
  const showBilling = showAll || activeTab === 'billing';
  const showProfile = activeTab === 'profile';

  return (
    <div className="space-y-8 animate-fade-in font-sans text-[#1E293B] dark:text-slate-100">
      
      {/* Upper patient card metadata banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-[#0D9488]/10 dark:bg-[#0D9488]/20 text-[#0D9488] font-bold border border-[#0D9488]/20 dark:border-[#0D9488]/30 px-3 py-1 rounded-full font-mono uppercase">
            PATIENT SELF SERVICE NODE
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white mt-1.5 flex items-center gap-2">
            My Electronic Patient Hub
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Book medical specialist appointments, check your medical history, and pay hospital invoices.
          </p>
        </div>
        
        {getUnpaidSum() > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 block shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">Unsettled Co-payments</p>
              <p className="text-slate-500 dark:text-slate-400 font-mono mt-0.5">Pending bills: <strong className="text-amber-700 dark:text-amber-400">{formatPrice(getUnpaidSum())}</strong></p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left column contains profile + appointment book flow, Right columns are clinical logs, timeline & invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column (5 columns) */}
        {showAppointments && (
          <div className={showAll ? "lg:col-span-5 space-y-6" : "lg:col-span-12 max-w-3xl mx-auto w-full space-y-6"}>
          
          {/* Patient Personal Details Summary card (Main Dashboard Only) */}
          {showAll && (
            <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D9488]/5 dark:bg-[#0D9488]/10 rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
                <User className="text-[#0D9488] h-5 w-5" />
                <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">My Personal Profile</h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-semibold">Full Name</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{patientProfile?.fullName || user.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-semibold">Age / Birth Date</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {patientProfile?.age ? `${patientProfile.age} yrs` : 'N/A'} {patientProfile?.dob ? `(${patientProfile.dob})` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-semibold">Occupation</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{patientProfile?.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-semibold">Registered Gender</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{patientProfile?.gender || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-semibold">Home Address</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{patientProfile?.address || 'N/A'}</p>
                </div>

                {patientProfile?.insuranceNo && (
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-semibold">Insurance Policy Card</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{patientProfile.insuranceNo}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointment booking module card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Calendar className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">Request Specialist Consultation</h3>
            </div>

            {bookingMessage && (
              <div id="booking-alert" className={`p-3 text-xs font-semibold rounded-md ${
                bookingMessage.startsWith('success') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-[#F43F5E] dark:text-[#F43F5E]'
              }`}>
                {bookingMessage.split(':')[1]}
              </div>
            )}

            <form onSubmit={handleBookSlot} className="space-y-4 text-xs">
              <div>
                <label htmlFor="slot-doctor" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Pick a Certified Specialist</label>
                <div className="relative">
                  <select
                    id="slot-doctor"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full text-xs py-2 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488] appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="text-slate-800 dark:text-slate-200 dark:bg-[#111827]">-- Choose Specialist Physician --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id} className="text-slate-800 dark:text-slate-200 dark:bg-[#111827]">{d.fullName} ({d.specialization})</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="slot-date" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Clinic Date</label>
                  <input
                    id="slot-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slot-time" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Clinic Hours Slot</label>
                  <div className="relative">
                    <select
                      id="slot-time"
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full text-xs py-2 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488] appearance-none cursor-pointer"
                      required
                    >
                      {timeSlots.map(ts => (
                        <option key={ts} value={ts} className="text-slate-800 dark:text-slate-200 dark:bg-[#111827]">{ts}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="slot-reason" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Consultation Reason / Symptoms</label>
                <textarea
                  id="slot-reason"
                  rows={3}
                  placeholder="Explain your physical symptoms or follow-up cardiovascular check-up particulars."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488] resize-none"
                  required
                />
              </div>

              <button
                id="btn-book-slot-submit"
                type="submit"
                className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-[#0D9488] dark:hover:bg-[#0b7a70] text-white font-bold text-sm rounded-xl transition-all hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
              >
                Book Secured Slot
              </button>
            </form>
          </div>

          {/* Active appointments status monitor list */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm overflow-hidden transition-colors">
            <div className="bg-[#0F172A] dark:bg-slate-900 text-white p-4 font-bold text-xs flex justify-between items-center">
              <span>My Scheduled Consultation Queue</span>
              <span className="text-[10px] font-mono bg-[#0D9488] text-white px-2 py-0.5 rounded">
                {appointments.filter(a => a.status !== 'cancelled').length} Slots
              </span>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {appointments.length > 0 ? (
                appointments.map(apt => (
                  <div key={apt.id} id={`patient-apt-${apt.id}`} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-850 dark:text-slate-200">Doctor: {apt.doctorName}</h4>
                        <p className="text-[10px] text-zinc-400 dark:text-slate-550 font-bold font-mono mt-0.5">
                          ⏰ {new Date(apt.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5">"{apt.reason}"</p>
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        apt.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                        apt.status === 'completed' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' :
                        apt.status === 'cancelled' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-450' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-450'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    {/* Patients can cancel their pending appointments */}
                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                      <div className="mt-3 flex justify-end">
                        <button
                          id={`btn-cancel-apt-${apt.id}`}
                          onClick={() => cancelAppointmentPatient(apt.id)}
                          className="text-[10px] text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-350 font-bold border border-rose-200 dark:border-rose-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div id="no-pt-apts" className="text-center py-6 text-xs text-slate-400 dark:text-slate-550 italic">
                  You have no consultative appointments booked inside your file.
                </div>
              )}
            </div>
          </div>

          </div>
        )}

        {/* Right column (7 columns) - medical records timeline & billing summaries */}
        {(showRecords || showBilling) && (
          <div className={showAll ? "lg:col-span-7 space-y-6" : "lg:col-span-12 max-w-3xl mx-auto w-full space-y-6"}>
          
            {/* Comprehensive Medical Records */}
            {showRecords && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <FolderHeart className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">My Clinical File & Records Timeline</h3>
            </div>

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
              {medicalRecords.length > 0 ? (
                medicalRecords.map((rec, idx) => (
                  <div key={rec.id} id={`pt-file-history-${rec.id}`} className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#0D9488] font-bold">
                      <span>📆 Consult Date: {rec.date}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">Dr: {rec.doctorName}</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Diagnosis Code: {rec.diagnosis}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1 italic">"{rec.notes}"</p>
                    </div>

                    {rec.vitals && (
                      <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-2 grid grid-cols-4 gap-2 text-[10px] text-slate-500 dark:text-slate-450 font-mono">
                        <div>
                          <span>Vital BP:</span>
                          <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{rec.vitals.bloodPressure}</p>
                        </div>
                        <div>
                          <span>Heart Rate:</span>
                          <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{rec.vitals.heartRate}</p>
                        </div>
                        <div>
                          <span>Temp:</span>
                          <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{rec.vitals.temperature}</p>
                        </div>
                        {rec.vitals.weight && (
                          <div>
                            <span>Weight:</span>
                            <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{rec.vitals.weight}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {rec.prescriptions && rec.prescriptions.length > 0 && (
                      <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 p-2.5 rounded-lg mt-2">
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider block mb-1">Active Prescription Compounds</span>
                        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {rec.prescriptions.map((px, lineIdx) => (
                            <div key={lineIdx}>🔬 {px}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div id="no-records-yet" className="text-center py-12 text-xs italic text-slate-400 dark:text-slate-500">
                  You have no historic health encounter records documented in this file.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Surcharge invoices billing card */}
        {showBilling && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <CreditCard className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">Hospital Billing and Surcharge Ledger</h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {invoices.length > 0 ? (
                invoices.map(inv => (
                  <div key={inv.id} id={`invoice-${inv.id}`} className="p-3 border.5 border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{inv.description}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 font-mono mt-0.5">ID: {inv.id} • {new Date(inv.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short' })}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{formatPrice(inv.amount)}</span>
                      
                      {inv.status === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-400 px-2.5 py-1 rounded-full uppercase">
                          Settled
                        </span>
                      ) : (
                        <button
                          id={`btn-pay-now-${inv.id}`}
                          onClick={() => setActivePaymentInvoice(inv)}
                          className="text-[10px] font-bold text-white bg-[#0D9488] hover:opacity-95 px-3 py-1 rounded-full transition-opacity uppercase cursor-pointer"
                        >
                          Checkout
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div id="no-invoices" className="text-center py-6 text-xs text-slate-400 dark:text-slate-550 italic">
                  All billing transaction files cleared.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    )}

  </div>

      {/* Patient Profile Editor Page */}
      {showProfile && (
        <div className="max-w-2xl mx-auto w-full bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] shadow-sm transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-6">
            <User className="text-[#0D9488] h-5 w-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Personal Details</h3>
          </div>

          {profileMessage && (
            <div id="profile-alert" className={`mb-6 p-3 text-xs font-semibold rounded-md ${
              profileMessage.startsWith('success') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-450' : 'bg-red-50 dark:bg-red-500/10 text-[#F43F5E] dark:text-[#F43F5E]'
            }`}>
              {profileMessage.split(':')[1]}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-name" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-age" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Age</label>
                <input
                  id="profile-age"
                  type="number"
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-dob" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Date of Birth</label>
                <input
                  id="profile-dob"
                  type="date"
                  value={profileDob}
                  onChange={(e) => setProfileDob(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                />
              </div>

              <div>
                <label htmlFor="profile-gender" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Registered Gender</label>
                <div className="relative">
                  <select
                    id="profile-gender"
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="w-full text-xs py-2 pl-3 pr-8 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488] appearance-none cursor-pointer"
                    required
                  >
                    <option value="Male" className="dark:bg-[#111827]">Male</option>
                    <option value="Female" className="dark:bg-[#111827]">Female</option>
                    <option value="Non-binary" className="dark:bg-[#111827]">Non-binary</option>
                    <option value="Other" className="dark:bg-[#111827]">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-occupation" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Occupation</label>
                <input
                  id="profile-occupation"
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={profileOccupation}
                  onChange={(e) => setProfileOccupation(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                />
              </div>

              <div>
                <label htmlFor="profile-insurance" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Insurance policy card number (optional)</label>
                <input
                  id="profile-insurance"
                  type="text"
                  placeholder="e.g. INS-48291"
                  value={profileInsuranceNo}
                  onChange={(e) => setProfileInsuranceNo(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-address" className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Home Address</label>
              <input
                id="profile-address"
                type="text"
                placeholder="e.g. 123 Main St, Springfield"
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#0D9488] focus:dark:border-[#0D9488]"
              />
            </div>

            <button
              id="btn-save-profile"
              type="submit"
              className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0b7e73] text-white font-bold text-sm rounded-xl transition-all cursor-pointer mt-4"
            >
              Save Profile Details
            </button>
          </form>
        </div>
      )}

      {/* SECURE STRIPE CHECKOUT SIMULATED MODAL */}
      {activePaymentInvoice && (
        <div id="stripe-checkout-modal" className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/70 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-[#1F2937] p-6 max-w-sm w-full relative overflow-hidden shadow-2xl animate-scale-up transition-colors">
            
            {/* Design accents */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#0D9488]" />

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold">L-SURE CHECKOUT</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">Surcharge Transaction settlement</h3>
              </div>
              <button
                id="btn-close-checkout"
                onClick={() => setActivePaymentInvoice(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-450">Invoice Ref:</span>
                <span className="font-mono font-bold">{activePaymentInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-450">Treatment:</span>
                <span className="font-bold text-right truncate max-w-[180px]">{activePaymentInvoice.description}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-850 mt-2 pt-2 text-sm">
                <span className="font-bold">Total billing amount:</span>
                <span className="font-mono font-extrabold text-[#0D9488]">{formatPrice(activePaymentInvoice.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs font-semibold">
              <div>
                <label htmlFor="card-num" className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Simulated Credit Card Number</label>
                <input
                  id="card-num"
                  type="text"
                  value={billingNumber}
                  onChange={(e) => setBillingNumber(e.target.value)}
                  className="w-full font-mono py-2 px-3 border border-slate-200 dark:border-slate-850 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-exp" className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Expires End</label>
                  <input
                    id="card-exp"
                    type="text"
                    value={billingExp}
                    onChange={(e) => setBillingExp(e.target.value)}
                    className="w-full font-mono py-2 px-3 border border-slate-200 dark:border-slate-850 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="card-cvc" className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">CVC Verification Keys</label>
                  <input
                    id="card-cvc"
                    type="password"
                    value={billingCvc}
                    onChange={(e) => setBillingCvc(e.target.value)}
                    className="w-full font-mono py-2 px-3 border border-slate-200 dark:border-slate-850 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-process-simulated-payment"
                type="submit"
                disabled={checkoutIsPaying}
                className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0b7a70] dark:bg-[#0D9488] dark:hover:bg-[#0b7a70] text-white font-bold rounded-xl text-center text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                {checkoutIsPaying ? 'Synchronising ledger with stripe...' : `Settle Bill of ${formatPrice(activePaymentInvoice.amount)}`}
              </button>
            </form>

            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block text-center mt-3">
              🔓 Secure 256-Bit SSL Encrypted Healthcare Payment Bridge.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
