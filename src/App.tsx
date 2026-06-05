import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  HelpCircle, 
  ShieldAlert, 
  ExternalLink,
  Terminal,
  Database,
  Cloud,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientPortal from './components/PatientPortal';
import { User, UserRole } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDeploymentPanel, setShowDeploymentPanel] = useState(false);

  // Read session from localStorage on startup if present
  useEffect(() => {
    const savedToken = localStorage.getItem('hms_token');
    const savedUser = localStorage.getItem('hms_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
      }
    }
  }, []);

  const handleLoginSuccess = (newToken: string, freshUser: User) => {
    setToken(newToken);
    setUser(freshUser);
    localStorage.setItem('hms_token', newToken);
    localStorage.setItem('hms_user', JSON.stringify(freshUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
  };

  const renderActiveScreen = () => {
    if (!token || !user) return null;

    switch (activeTab) {
      case 'dashboard':
        if (user.role === 'admin') {
          return <AdminDashboard token={token} />;
        } else if (user.role === 'doctor') {
          return <DoctorDashboard token={token} />;
        } else {
          return <PatientPortal token={token} user={user} />;
        }
      case 'appointments':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} />;
        } else if (user.role === 'doctor') {
          return <DoctorDashboard token={token} />;
        } else {
          return <AdminDashboard token={token} />;
        }
      case 'records':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} />;
        } else {
          return <DoctorDashboard token={token} />;
        }
      case 'billing':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} />;
        } else {
          return <AdminDashboard token={token} />;
        }
      case 'patients':
        return <DoctorDashboard token={token} />;
      case 'logs':
        return <AdminDashboard token={token} />;
      default:
        return <div className="text-center p-12 text-slate-400">Section actively under engineering build works.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      
      {/* Top Deployment Guidelines Accordion Drawer */}
      <div className="bg-[#0F172A] border-b border-[#1E293B] text-slate-300">
        <div 
          onClick={() => setShowDeploymentPanel(!showDeploymentPanel)}
          className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between cursor-pointer text-xs font-semibold hover:bg-slate-800/40 select-none"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9488] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D9488]"></span>
            </span>
            <p className="font-mono text-[11px] text-slate-300">
              DEPLOYMENT ENVIRONMENT GUIDE: Render / Vercel Architecture Blueprint
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[#0D9488]">
            <span>{showDeploymentPanel ? 'Hide Specification' : 'Expand Setup Config'}</span>
            {showDeploymentPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </div>

        {/* Deployment specification text block */}
        {showDeploymentPanel && (
          <div className="max-w-7xl mx-auto px-6 pb-6 text-xs leading-relaxed space-y-4 border-t border-[#1E293B] pt-4 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-extrabold text-[#0D9488] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> 
                  1. Server Deployment (Render Configuration)
                </h4>
                <p className="text-slate-400">
                  Deploy the compiled <code className="font-mono text-[#A7F3D0] bg-slate-900 px-1 py-0.5 rounded">server.ts</code> onto Render or secure Docker container hosts.
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1 text-[11px] font-mono select-all">
                  <p className="text-slate-500"># Set those environment credentials on Render:</p>
                  <p className="text-white">NODE_ENV="production"</p>
                  <p className="text-white">DATABASE_TYPE="postgres"</p>
                  <p className="text-white">SUPABASE_URL="https://your-proj.supabase.co"</p>
                  <p className="text-white">SUPABASE_KEY="your-supabase-service-role-key"</p>
                  <p className="text-white">JWT_SECRET="your-jwt-signing-secret"</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#0D9488] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Database className="h-4 w-4" /> 
                  2. Frontend / SPA Deployment (Vercel Configuration)
                </h4>
                <p className="text-slate-400">
                  Deploy the client bundle <code className="font-mono text-[#A7F3D0] bg-slate-900 px-1 py-0.5 rounded">dist/</code> on Vercel. 
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1 text-[11px] font-mono select-all">
                  <p className="text-slate-500"># Set variable on Vercel Dashboard config:</p>
                  <p className="text-emerald-400">VITE_API_URL="https://your-mediflow-backend.onrender.com"</p>
                </div>
              </div>
            </div>
            <div className="text-slate-400 pt-2 text-[11px] border-t border-[#1E293B]">
              <strong>Note:</strong> During Vercel compilation build, Vite will compile to standard React assets, communicating securely to your Render endpoints.
            </div>
          </div>
        )}
      </div>

      {!token || !user ? (
        // Auth gate
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        // Main multi-screen layout
        <div className="flex-1 flex overflow-hidden">
          
          {/* Persistent medical sidebar */}
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout} 
          />

          {/* Core Content area */}
          <main className="flex-1 overflow-y-auto px-8 py-8 md:px-12 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto">
              {renderActiveScreen()}
            </div>
          </main>

        </div>
      )}

    </div>
  );
}
