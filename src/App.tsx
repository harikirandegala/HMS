import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientPortal from './components/PatientPortal';
import SettingsPanel from './components/SettingsPanel';
import { Menu, Activity, Sun, Moon } from 'lucide-react';
import { User } from './types';

export interface SystemSettings {
  theme: 'light' | 'dark';
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Persistent system-wide settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('hms_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { theme: 'light', currency: 'INR' };
  });

  useEffect(() => {
    localStorage.setItem('hms_settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const formatPrice = (amount: number) => {
    switch (settings.currency) {
      case 'INR':
        return `₹${(amount * 80).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'EUR':
        return `€${(amount * 0.92).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'GBP':
        return `£${(amount * 0.78).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default:
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

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

  const refreshUser = (updatedUserFields: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedUserFields };
    setUser(newUser);
    localStorage.setItem('hms_user', JSON.stringify(newUser));
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
          return <AdminDashboard token={token} formatPrice={formatPrice} currency={settings.currency} activeTab={activeTab} setActiveTab={setActiveTab} />;
        } else if (user.role === 'doctor') {
          return <DoctorDashboard token={token} formatPrice={formatPrice} activeTab={activeTab} />;
        } else {
          return <PatientPortal token={token} user={user} formatPrice={formatPrice} activeTab={activeTab} onUserUpdate={refreshUser} />;
        }
      case 'appointments':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} formatPrice={formatPrice} activeTab={activeTab} onUserUpdate={refreshUser} />;
        } else if (user.role === 'doctor') {
          return <DoctorDashboard token={token} formatPrice={formatPrice} activeTab={activeTab} />;
        } else {
          return <AdminDashboard token={token} formatPrice={formatPrice} currency={settings.currency} activeTab={activeTab} setActiveTab={setActiveTab} />;
        }
      case 'records':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} formatPrice={formatPrice} activeTab={activeTab} onUserUpdate={refreshUser} />;
        } else {
          return <DoctorDashboard token={token} formatPrice={formatPrice} activeTab={activeTab} />;
        }
      case 'billing':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} formatPrice={formatPrice} activeTab={activeTab} onUserUpdate={refreshUser} />;
        } else {
          return <AdminDashboard token={token} formatPrice={formatPrice} currency={settings.currency} activeTab={activeTab} setActiveTab={setActiveTab} />;
        }
      case 'patients':
        if (user.role === 'admin') {
          return <AdminDashboard token={token} formatPrice={formatPrice} currency={settings.currency} activeTab={activeTab} setActiveTab={setActiveTab} />;
        }
        return <DoctorDashboard token={token} formatPrice={formatPrice} activeTab={activeTab} />;
      case 'doctors':
        if (user.role === 'admin') {
          return <AdminDashboard token={token} formatPrice={formatPrice} currency={settings.currency} activeTab={activeTab} setActiveTab={setActiveTab} />;
        }
        return null;
      case 'profile':
        if (user.role === 'patient') {
          return <PatientPortal token={token} user={user} formatPrice={formatPrice} activeTab={activeTab} onUserUpdate={refreshUser} />;
        }
        return null;
      case 'settings':
        return <SettingsPanel settings={settings} setSettings={setSettings} user={user} />;
      default:
        return <div className="text-center p-12 text-slate-400 dark:text-slate-600">Section actively under engineering build works.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col font-sans text-slate-800 dark:text-slate-100">
      
      {!token || !user ? (
        // Auth gate
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Mobile Sticky Top Bar */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] text-white border-b border-[#1E293B] sticky top-0 z-35 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-[#94A3B8] hover:text-white cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0D9488]" />
                <span className="font-bold text-sm tracking-tight">MediFlow HMS</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-[#94A3B8] hover:text-white cursor-pointer"
                title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <img 
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'} 
                alt={user.fullName}
                className="w-7 h-7 rounded-full object-cover border border-[#0D9488]"
              />
            </div>
          </div>

          {/* Backdrop overlay for mobile drawer */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Collapsible / Drawer medical sidebar */}
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout} 
            theme={settings.theme}
            toggleTheme={toggleTheme}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Core Content area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
              {renderActiveScreen()}
            </div>
          </main>

        </div>
      )}

    </div>
  );
}
