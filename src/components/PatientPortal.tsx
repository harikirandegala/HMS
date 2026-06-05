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
  AlertTriangle
} from 'lucide-react';
import { Appointment, MedicalRecord, Invoice, Doctor } from '../types';

interface PatientPortalProps {
  token: string;
  user: any;
}

export default function PatientPortal({ token, user }: PatientPortalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

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
      const [resApts, resDocs, resRecords, resInvoices] = await Promise.all([
        fetch('/api/appointments', { headers }),
        fetch('/api/doctors', { headers }),
        fetch(`/api/patients/${user.id}/records`, { headers }),
        fetch('/api/invoices', { headers })
      ]);

      if (resApts.ok) setAppointments(await resApts.ok ? await resApts.json() : []);
      if (resDocs.ok) setDoctors(await resDocs.ok ? await resDocs.json() : []);
      if (resRecords.ok) setMedicalRecords(await resRecords.ok ? await resRecords.json() : []);
      if (resInvoices.ok) setInvoices(await resInvoices.ok ? await resInvoices.json() : []);
    } catch (e) {
      console.error('Error fetching patient data feeds', e);
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

  return (
    <div className="space-y-8 animate-fade-in font-sans text-[#1E293B]">
      
      {/* Upper patient card metadata banner */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-[#0D9488]/10 text-[#0D9488] font-bold border border-[#0D9488]/20 px-3 py-1 rounded-full font-mono uppercase">
            PATIENT SELF SERVICE NODE
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5 flex items-center gap-2">
            My Electronic Patient Hub
          </h2>
          <p className="text-sm text-slate-500">
            Book medical specialist appointments, check your medical history, and pay hospital invoices.
          </p>
        </div>
        
        {getUnpaidSum() > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 block shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-800">Unsettled Co-payments</p>
              <p className="text-slate-500 font-mono mt-0.5">Pending bills: <strong className="text-amber-700">${getUnpaidSum().toFixed(2)}</strong></p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left column contains profile + appointment book flow, Right columns are clinical logs, timeline & invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Appointment booking module card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-sm tracking-wide text-slate-900">Request Specialist Consultation</h3>
            </div>

            {bookingMessage && (
              <div id="booking-alert" className={`p-3 text-xs font-semibold rounded-md ${
                bookingMessage.startsWith('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#F43F5E]'
              }`}>
                {bookingMessage.split(':')[1]}
              </div>
            )}

            <form onSubmit={handleBookSlot} className="space-y-4 text-xs">
              <div>
                <label htmlFor="slot-doctor" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pick a Certified Specialist</label>
                <select
                  id="slot-doctor"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] bg-white rounded-xl focus:outline-none"
                  required
                >
                  <option value="">-- Choose Specialist Physician --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="slot-date" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Clinic Date</label>
                  <input
                    id="slot-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-[#E2E8F0] bg-white rounded-xl focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slot-time" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Clinic Hours Slot</label>
                  <select
                    id="slot-time"
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-[#E2E8F0] bg-white rounded-xl focus:outline-none"
                    required
                  >
                    {timeSlots.map(ts => (
                      <option key={ts} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="slot-reason" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Consultation Reason / Symptoms</label>
                <textarea
                  id="slot-reason"
                  rows={3}
                  placeholder="Explain your physical symptoms or follow-up cardiovascular check-up particulars."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-[#E2E8F0] bg-white rounded-xl focus:outline-none resize-none"
                  required
                />
              </div>

              <button
                id="btn-book-slot-submit"
                type="submit"
                className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all hover:translate-y-[-1px] active:translate-y-0"
              >
                Book Secured Slot
              </button>
            </form>
          </div>

          {/* Active appointments status monitor list */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="bg-[#0F172A] text-white p-4 font-bold text-xs flex justify-between items-center">
              <span>My Scheduled Consultation Queue</span>
              <span className="text-[10px] font-mono bg-[#0D9488] text-white px-2 py-0.5 rounded">
                {appointments.filter(a => a.status !== 'cancelled').length} Slots
              </span>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {appointments.length > 0 ? (
                appointments.map(apt => (
                  <div key={apt.id} id={`patient-apt-${apt.id}`} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-850">Doctor: {apt.doctorName}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold font-mono mt-0.5">
                          ⏰ {new Date(apt.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <p className="text-xs text-slate-500 italic mt-1.5">"{apt.reason}"</p>
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                        apt.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                        apt.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
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
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-bold border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div id="no-pt-apts" className="text-center py-6 text-xs text-slate-400 italic">
                  You have no consultative appointments booked inside your file.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column (7 columns) - medical records timeline & billing summaries */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Comprehensive Medical Records */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FolderHeart className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-sm tracking-wide text-slate-900">My Clinical File & Records Timeline</h3>
            </div>

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
              {medicalRecords.length > 0 ? (
                medicalRecords.map((rec, idx) => (
                  <div key={rec.id} id={`pt-file-history-${rec.id}`} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#0D9488] font-bold">
                      <span>📆 Consult Date: {rec.date}</span>
                      <span className="text-slate-500">Dr: {rec.doctorName}</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase">Diagnosis Code: {rec.diagnosis}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 italic">"{rec.notes}"</p>
                    </div>

                    {rec.vitals && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 mt-2 grid grid-cols-4 gap-2 text-[10px] text-slate-500 font-mono">
                        <div>
                          <span>Vital BP:</span>
                          <p className="font-bold text-slate-700 mt-0.5">{rec.vitals.bloodPressure}</p>
                        </div>
                        <div>
                          <span>Heart Rate:</span>
                          <p className="font-bold text-slate-700 mt-0.5">{rec.vitals.heartRate}</p>
                        </div>
                        <div>
                          <span>Temp:</span>
                          <p className="font-bold text-slate-700 mt-0.5">{rec.vitals.temperature}</p>
                        </div>
                        {rec.vitals.weight && (
                          <div>
                            <span>Weight:</span>
                            <p className="font-bold text-slate-700 mt-0.5">{rec.vitals.weight}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {rec.prescriptions && rec.prescriptions.length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg mt-2">
                        <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block mb-1">Active Prescription Compounds</span>
                        <div className="space-y-1 text-xs text-slate-700 font-mono">
                          {rec.prescriptions.map((px, lineIdx) => (
                            <div key={lineIdx}>🔬 {px}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div id="no-records-yet" className="text-center py-12 text-xs italic text-slate-400">
                  You have no historic health encounter records documented in this file.
                </div>
              )}
            </div>
          </div>

          {/* Surcharge invoices billing card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="text-[#0D9488] h-5 w-5" />
              <h3 className="font-bold text-sm tracking-wide text-slate-900">Hospital Billing and Surcharge Ledger</h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {invoices.length > 0 ? (
                invoices.map(inv => (
                  <div key={inv.id} id={`invoice-${inv.id}`} className="p-3 border.5 border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{inv.description}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {inv.id} • {new Date(inv.createdAt).toLocaleString([], { dateStyle: 'short' })}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">${inv.amount.toFixed(2)}</span>
                      
                      {inv.status === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                          Settled
                        </span>
                      ) : (
                        <button
                          id={`btn-pay-now-${inv.id}`}
                          onClick={() => setActivePaymentInvoice(inv)}
                          className="text-[10px] font-bold text-white bg-[#0D9488] hover:opacity-95 px-3 py-1 rounded-full transition-opacity uppercase"
                        >
                          Checkout
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div id="no-invoices" className="text-center py-6 text-xs text-slate-400 italic">
                  All billing transaction files cleared.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SECURE STRIPE CHECKOUT SIMULATED MODAL */}
      {activePaymentInvoice && (
        <div id="stripe-checkout-modal" className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full relative overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Design accents */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#0D9488]" />

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">L-SURE CHECKOUT</span>
                <h3 className="font-bold text-base text-slate-900 mt-1">Surcharge Transaction settlement</h3>
              </div>
              <button
                id="btn-close-checkout"
                onClick={() => setActivePaymentInvoice(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-mono font-bold">{activePaymentInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Treatment:</span>
                <span className="font-bold text-right truncate max-w-[180px]">{activePaymentInvoice.description}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 mt-2 pt-2 text-sm">
                <span className="font-bold">Total billing amount:</span>
                <span className="font-mono font-extrabold text-[#0D9488]">${activePaymentInvoice.amount.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs font-semibold">
              <div>
                <label htmlFor="card-num" className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Simulated Credit Card Number</label>
                <input
                  id="card-num"
                  type="text"
                  value={billingNumber}
                  onChange={(e) => setBillingNumber(e.target.value)}
                  className="w-full font-mono py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-exp" className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Expires End</label>
                  <input
                    id="card-exp"
                    type="text"
                    value={billingExp}
                    onChange={(e) => setBillingExp(e.target.value)}
                    className="w-full font-mono py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="card-cvc" className="block text-[10px] text-slate-400 uppercase font-bold mb-1">CVC Verification Keys</label>
                  <input
                    id="card-cvc"
                    type="password"
                    value={billingCvc}
                    onChange={(e) => setBillingCvc(e.target.value)}
                    className="w-full font-mono py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-process-simulated-payment"
                type="submit"
                disabled={checkoutIsPaying}
                className="w-full py-2.5 bg-[#0D9488] hover:bg-slate-900 text-white font-bold rounded-xl text-center text-xs tracking-wider uppercase transition-colors"
              >
                {checkoutIsPaying ? 'Synchronising ledger with stripe...' : `Settle Bill of $${activePaymentInvoice.amount.toFixed(2)}`}
              </button>
            </form>

            <span className="text-[9px] text-slate-400 font-medium block text-center mt-3">
              🔓 Secure 256-Bit SSL Encrypted Healthcare Payment Bridge.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
