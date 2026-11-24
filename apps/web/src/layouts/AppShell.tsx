import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bot,
  Building2,
  ClipboardCheck,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { t } from '../services/i18n';

export function AppShell() {
  const { user, lang, setLang, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isCitizen = user.role === 'citizen';
  const isAdmin = user.role === 'district_admin' && user.verificationStatus === 'approved';

  const navItems = [
    { to: '/', label: t(lang, 'navOverview'), icon: LayoutDashboard, show: true },
    { to: '/pilot', label: t(lang, 'navPilot'), icon: MapPin, show: true },
    { to: '/departments', label: t(lang, 'navDepartments'), icon: Building2, show: !isCitizen },
    { to: '/records', label: t(lang, 'navRecords'), icon: ClipboardCheck, show: !isCitizen },
    { to: '/schemes', label: t(lang, 'navSchemes'), icon: Gift, show: true },
    { to: '/documents', label: t(lang, 'navDocuments'), icon: FileText, show: true },
    { to: '/assistant', label: t(lang, 'navAssistant'), icon: Bot, show: true },
    { to: '/admin', label: t(lang, 'navAdmin'), icon: ShieldCheck, show: isAdmin },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0f2942] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-[#0f2942] font-bold flex items-center justify-center text-sm">
              B48
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">{t(lang, 'appTitle')}</h1>
              <p className="text-xs text-slate-300 hidden sm:block">{t(lang, 'appSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Simple Hindi / English toggle */}
            <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition ${
                  lang === 'en' ? 'bg-white text-[#0f2942]' : 'text-slate-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-md transition ${
                  lang === 'hi' ? 'bg-white text-[#0f2942]' : 'text-slate-200 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-sm font-medium leading-tight">{user.fullName}</span>
              <span className="text-[11px] uppercase tracking-wide text-amber-300">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{t(lang, 'signOut')}</span>
            </button>
          </div>
        </div>

        {/* Clear Demonstration Data Transparency Banner */}
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-1.5 text-center">
          <span className="font-semibold">Notice:</span> {t(lang, 'demoNotice')}
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileOpen ? 'fixed inset-y-0 left-0 z-40 w-64 pt-20' : 'hidden'
          } lg:block lg:static lg:w-60 bg-white border-r border-slate-200 p-3 shrink-0`}
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#0f2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {user.verificationStatus === 'pending_verification' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <p className="font-semibold">Verification Pending</p>
              <p className="mt-1">
                Your government/field designation is awaiting District Administrator approval.
              </p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
