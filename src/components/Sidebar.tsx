import React from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Users, 
  CreditCard, 
  ShieldAlert, 
  LogOut,
  Settings,
  Sun,
  Moon,
  User as UserIcon,
  Stethoscope
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, theme, toggleTheme }: SidebarProps) {
  const isAdmin = user.role === 'admin';
  const isDoctor = user.role === 'doctor';
  const isPatient = user.role === 'patient';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'patient']
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      roles: ['admin', 'doctor', 'patient']
    },
    {
      id: 'records',
      label: isPatient ? 'My Medical File' : 'Patient Clinical Notes',
      icon: FileText,
      roles: ['doctor', 'patient']
    },
    {
      id: 'billing',
      label: isPatient ? 'Bills & Payments' : 'Accounting & Invoices',
      icon: CreditCard,
      roles: ['admin', 'patient']
    },
    {
      id: 'patients',
      label: 'Registered Patients',
      icon: Users,
      roles: ['admin', 'doctor']
    },
    {
      id: 'doctors',
      label: 'Active Physicians',
      icon: Stethoscope,
      roles: ['admin']
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: UserIcon,
      roles: ['patient']
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      roles: ['admin', 'doctor', 'patient']
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div id="hms-sidebar" className="w-64 bg-[#0F172A] text-white flex flex-col justify-between h-full shadow-xl border-r border-[#1E293B]">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="bg-[#0D9488] p-2 rounded-lg text-white">
              <Activity className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg tracking-tight leading-none text-white">MediFlow HMS</h1>
              <span className="text-[10px] text-[#94A3B8] font-mono tracking-widest uppercase">Clinical Suite</span>
            </div>
          </div>
          
          {/* Quick Theme Toggle Shortcut */}
          <button
            onClick={toggleTheme}
            id="btn-sidebar-theme-toggle"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* User Badge Info */}
        <div className="px-6 py-5 flex items-center gap-3 bg-[#1E293B]/40 hover:bg-[#1E293B]/70 transition-colors">
          <img 
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'} 
            alt={user.fullName}
            className="w-10 h-10 rounded-full object-cover border border-[#0D9488]"
          />
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-100 truncate">{user.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                user.role === 'admin' ? 'bg-[#10B981]' : user.role === 'doctor' ? 'bg-[#3B82F6]' : 'bg-[#F59E0B]'
              }`} />
              <p className="text-[11px] font-semibold text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="p-4 space-y-1">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group duration-200 relative ${
                  isActive 
                    ? 'bg-[#0D9488]/10 text-[#0D9488]' 
                    : 'text-[#94A3B8] hover:bg-[#1E293B]/30 hover:text-white'
                }`}
              >
                {/* Active Indicator Left Accent Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#0D9488] rounded-r-md" />
                )}
                
                <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                  isActive ? 'text-[#0D9488]' : 'text-[#64748B] group-hover:text-white'
                }`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#1E293B]">
        <button
          id="btn-logout"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Exit Session</span>
        </button>
      </div>
    </div>
  );
}
