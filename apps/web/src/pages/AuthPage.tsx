import React, { useState } from 'react';
import { Shield, UserCheck, Users, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const DEMO_ACCOUNTS = [
  {
    label: 'District Admin',
    sub: 'Full Betul pilot, departments, user verification & AI creation',
    email: 'collector.betul@demo.gov.in',
    pass: 'BetulAdmin@2026',
    icon: Shield,
  },
  {
    label: 'Agriculture Officer',
    sub: 'Department data verification & scoped village view',
    email: 'agri.officer@demo.gov.in',
    pass: 'BetulOfficer@2026',
    icon: Building2,
  },
  {
    label: 'Field Employee',
    sub: 'Collect village survey data (Khedi & Badora)',
    email: 'field.khedi@demo.gov.in',
    pass: 'BetulField@2026',
    icon: UserCheck,
  },
  {
    label: 'Citizen (Farmer)',
    sub: 'Check scheme eligibility, apply & ask AI in Hindi/English',
    email: 'ramesh.farmer@demo.in',
    pass: 'BetulCitizen@2026',
    icon: Users,
  },
];

export function AuthPage() {
  const { login, register, lang, setLang } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [track, setTrack] = useState<'citizen' | 'field' | 'government'>('citizen');
  const [requestedDesignation, setRequestedDesignation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        const msg = await register({
          email,
          password,
          fullName,
          phone,
          track,
          requestedDesignation: track === 'citizen' ? undefined : requestedDesignation,
          preferredLanguage: lang,
        });
        setInfo(msg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  async function quickLogin(demoEmail: string, demoPass: string) {
    setError(null);
    setBusy(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0f2942] text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-[#0f2942] font-bold flex items-center justify-center">
              B48
            </div>
            <div>
              <h1 className="text-lg font-bold">Betul District Intelligence Platform</h1>
              <p className="text-xs text-slate-300">
                Unified Governance &amp; Citizen Benefit Portal • Madhya Pradesh
              </p>
            </div>
          </div>
          <div className="flex rounded-lg bg-white/10 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded ${lang === 'en' ? 'bg-white text-[#0f2942] font-semibold' : ''}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 rounded ${lang === 'hi' ? 'bg-white text-[#0f2942] font-semibold' : ''}`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 grid md:grid-cols-2 gap-8 items-start mt-4">
        {/* Left: Sign In / Register Card */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'login' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'register' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registration Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['citizen', 'Citizen'],
                        ['field', 'Field Worker'],
                        ['government', 'Govt Officer'],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTrack(val)}
                        className={`py-2 px-2 rounded-lg border text-xs font-medium transition ${
                          track === val
                            ? 'border-[#0f2942] bg-[#0f2942]/5 text-[#0f2942]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {track !== 'citizen' && (
                    <p className="text-[11px] text-amber-700 mt-1.5">
                      Official accounts require District Administration verification before privileged access is granted.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Ramesh Patel"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mobile Number (10 digits)
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9826012345"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                {track !== 'citizen' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Requested Designation
                    </label>
                    <input
                      required
                      value={requestedDesignation}
                      onChange={(e) => setRequestedDesignation(e.target.value)}
                      placeholder="e.g., Block Officer / Village Coordinator"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.in"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </section>

        {/* Right: Quick Role Explorer (Demo Accounts) */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900">Quick Demo Role Sign-In</h2>
            <p className="text-xs text-slate-600 mt-1">
              Test each role-scoped experience in one click (clearly labelled synthetic demonstration accounts).
            </p>
            <div className="mt-4 space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={busy}
                    onClick={() => quickLogin(acc.email, acc.pass)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 transition flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-[#0f2942]/10 text-[#0f2942] shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{acc.label}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{acc.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
