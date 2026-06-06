import React, { useState } from 'react';
import { Activity, ShieldCheck, Mail, Lock, User as UserIcon, Calendar, FileCheck, Stethoscope, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Switch logins for ease-of-testing & complete demo auditing
  const demoAccounts = [
    { label: 'Administrator Access', email: 'admin@hospital.com', pass: 'Admin123', bg: 'bg-[#1E293B]', role: 'Admin' },
    { label: 'Specialist Physician', email: 'doctor@hospital.com', pass: 'Doctor123', bg: 'bg-[#0D9488]', role: 'Doctor' },
    { label: 'Patient Self-Service', email: 'patient@hospital.com', pass: 'Patient123', bg: 'bg-emerald-600', role: 'Patient' }
  ];

  const handleDemoClick = (dmEmail: string, dmPass: string) => {
    setEmail(dmEmail);
    setPassword(dmPass);
    setIsRegister(false);
    setError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const bodyObj = isRegister 
      ? { email, password, fullName, dob, gender }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authenication check failed. Please check inputs.');
      }

      if (isRegister) {
        setSuccess('Patient account created with success. Navigating to login...');
        setIsRegister(false);
        setPassword('');
        setError(null);
      } else {
        // Safe authenticated
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="hms-auth-container" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col justify-center py-12 px-6 lg:px-8 font-sans text-[#1E293B] dark:text-slate-100 transition-colors">
      
      {/* Decorative branding floating card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 bg-[#0F172A] p-2.5 rounded-xl text-white shadow-md">
          <Activity className="h-7 w-7 stroke-[2.5] text-[#0D9488]" />
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
          MediFlow Hospital Management
        </h2>
        <p className="mt-1.5 text-sm text-[#475569] dark:text-slate-400 max-w-xs mx-auto">
          Secure Multi-Branch Clinical Portal and Electronic Health Records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-[#111827] py-8 px-6 shadow-xl rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] relative overflow-hidden transition-colors">
          
          {/* Subtle decoration bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0D9488]" />

          {/* Error and Success feedback blocks */}
          {error && (
            <div id="auth-alert-error" className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border-l-4 border-[#F43F5E] text-[#F43F5E] text-xs font-semibold rounded-r rounded-l-none flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div id="auth-alert-success" className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded-r rounded-l-none">
              ✅ {success}
            </div>
          )}

          {/* Selector Tabs */}
          <div className="flex border-b border-[#E2E8F0] dark:border-slate-850 mb-6">
            <button
              id="auth-tab-login"
              type="button"
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors focus:outline-none ${
                !isRegister ? 'border-b-2 border-[#0D9488] text-[#0F172A] dark:text-white font-bold' : 'text-[#64748B] dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              onClick={() => { setIsRegister(false); setError(null); }}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register"
              type="button"
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors focus:outline-none ${
                isRegister ? 'border-b-2 border-[#0D9488] text-[#0F172A] dark:text-white font-bold' : 'text-[#64748B] dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              onClick={() => { setIsRegister(true); setError(null); }}
            >
              Patient Self-Register
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {isRegister && (
              <>
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1">
                    Patient Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="Johnathan Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 focus:outline-none focus:border-[#0D9488] text-sm text-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-dob" className="block text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <input
                        id="reg-dob"
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 focus:outline-none focus:border-[#0D9488] text-sm text-slate-900 dark:text-white transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-gender" className="block text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1">
                      Biological Gender
                    </label>
                    <select
                      id="reg-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-xl focus:outline-none focus:border-[#0D9488] text-sm text-slate-900 dark:text-white transition-colors"
                    >
                      <option className="dark:bg-[#111827]">Male</option>
                      <option className="dark:bg-[#111827]">Female</option>
                      <option className="dark:bg-[#111827]">Other</option>
                    </select>
                  </div>
                </div>


              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1">
                E-Mail Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 focus:outline-none focus:border-[#0D9488] text-sm text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 focus:outline-none focus:border-[#0D9488] text-sm text-slate-900 dark:text-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-btn-submit"
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all bg-[#0F172A] dark:bg-[#0D9488] hover:opacity-90 active:scale-[0.99] flex justify-center items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Validating Clinical Keys...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-[#0D9488] dark:text-white" />
                  <span>{isRegister ? 'Finalize Registration' : 'Secure Login'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Trigger */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-slate-850">
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-3 tracking-wider uppercase">
              Demonstration & Verification Roles
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  id={`demo-btn-${account.role.toLowerCase()}`}
                  onClick={() => handleDemoClick(account.email, account.pass)}
                  className="w-full transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35 hover:bg-slate-50 dark:hover:bg-slate-900 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      account.role === 'Admin' ? 'bg-[#10B981]' : account.role === 'Doctor' ? 'bg-[#3B82F6]' : 'bg-[#F59E0B]'
                    }`} />
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A] dark:text-slate-200">{account.label}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono italic">{account.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-1 px-2.5 text-slate-600 dark:text-slate-350 rounded-md font-bold">
                    Load Credentials
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
