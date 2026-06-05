import React from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Coins, 
  Bell, 
  ShieldCheck, 
  Activity, 
  Server, 
  Lock
} from 'lucide-react';
import { SystemSettings } from '../App';

interface SettingsPanelProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export default function SettingsPanel({ settings, setSettings }: SettingsPanelProps) {
  const toggleTheme = (theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const changeCurrency = (currency: 'INR' | 'USD' | 'EUR' | 'GBP') => {
    setSettings(prev => ({ ...prev, currency }));
  };

  const currencies: { id: 'INR' | 'USD' | 'EUR' | 'GBP'; label: string; symbol: string; desc: string }[] = [
    { id: 'INR', label: 'Indian Rupee', symbol: '₹', desc: 'Default INR (₹) - Converts 1:80' },
    { id: 'USD', label: 'US Dollar', symbol: '$', desc: 'Standard USD ($) - Native system ledger' },
    { id: 'EUR', label: 'Euro', symbol: '€', desc: 'European Euro (€) - Converts 1:0.92' },
    { id: 'GBP', label: 'British Pound', symbol: '£', desc: 'British Pound (£) - Converts 1:0.78' }
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans text-[#1E293B] dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-[10px] bg-[#0D9488]/10 dark:bg-[#0D9488]/20 text-[#0D9488] font-bold border border-[#0D9488]/20 px-3 py-1 rounded-full font-mono uppercase">
            System Preferences
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white mt-1.5 flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#0D9488]" />
            HMS Console Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize appearance, billing currencies, notifications, and security policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings Form Area (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Appearance */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              {settings.theme === 'dark' ? <Moon className="h-4 w-4 text-[#0D9488]" /> : <Sun className="h-4 w-4 text-[#0D9488]" />}
              Appearance Theme
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Choose how MediFlow HMS looks on your screen.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => toggleTheme('light')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium ${
                  settings.theme === 'light' 
                    ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488] font-semibold' 
                    : 'border-slate-200 dark:border-[#1F2937] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="h-4 w-4" />
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => toggleTheme('dark')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium ${
                  settings.theme === 'dark' 
                    ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488] font-semibold' 
                    : 'border-slate-200 dark:border-[#1F2937] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark Mode
              </button>
            </div>
          </div>

          {/* Card 2: Currency & Localization */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-4 w-4 text-[#0D9488]" />
              Hospital Billing Currency
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Configure default currency for medical invoices and payment gateways.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currencies.map(curr => (
                <button
                  key={curr.id}
                  type="button"
                  onClick={() => changeCurrency(curr.id)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    settings.currency === curr.id
                      ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]'
                      : 'border-slate-200 dark:border-[#1F2937] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">{curr.label}</span>
                    <span className="font-mono font-bold text-base px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{curr.symbol}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{curr.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Notifications (Mock Settings) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#0D9488]" />
              Patient & Doctor Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email Consult Transcripts</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Dispatch clinical summaries to patients post consultation.</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#0D9488] h-4 w-4 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">SMS Appointment Reminders</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Auto-send updates 24h prior to intake sessions.</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#0D9488] h-4 w-4 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Audit Logs Notifications</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Instantly notify compliance officers on high-risk credential logins.</p>
                </div>
                <input type="checkbox" className="accent-[#0D9488] h-4 w-4 cursor-pointer" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Info Column (1 column) */}
        <div className="space-y-6">
          
          {/* HIPAA & Security Specs */}
          <div className="bg-[#0F172A] text-[#A7F3D0] p-6 rounded-2xl border border-[#1E293B] shadow-lg space-y-4">
            <h3 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0D9488]" />
              HIPAA Crypt-Safe Console
            </h3>
            <p className="font-mono text-[10px] text-slate-300 leading-relaxed">
              This node is synchronized under NIST Health Standards. All changes to preferences (theme configurations, localization, notification triggers) are actively audited under HIPAA security log rules.
            </p>
            <div className="border-t border-[#1E293B] pt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-[#0D9488]" /> SSL: 256-Bit
              </span>
              <span>Audit State: ENFORCED</span>
            </div>
          </div>

          {/* System Specs */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-[#0D9488]" />
              Node Infrastructure
            </h3>
            <div className="space-y-2 text-[10px] font-mono text-slate-500">
              <div className="flex justify-between">
                <span>Console Version:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">v4.14.2-stable</span>
              </div>
              <div className="flex justify-between">
                <span>Database Sync:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500">Online (Supabase)</span>
              </div>
              <div className="flex justify-between">
                <span>React Version:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">v19.0.1</span>
              </div>
              <div className="flex justify-between">
                <span>Tailwind Engine:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">v4.0.0-vite</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
