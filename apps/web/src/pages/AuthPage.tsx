import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Shield, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type PortalKey = 'citizen' | 'field' | 'officer' | 'admin';

const PORTAL_CONFIG: Record<
  PortalKey,
  {
    title: string;
    subtitle: string;
    gradient: string;
    track: 'citizen' | 'field' | 'government';
    defaultDesignation: string;
    demoEmail: string;
    demoPass: string;
    demoLabel: string;
    icon: React.ComponentType<{ size?: number }>;
    highlights: string[];
  }
> = {
  citizen: {
    title: 'Citizen & Household Portal',
    subtitle: 'Check eligible schemes by voice or smart presets, apply & track benefits.',
    gradient: 'from-emerald-600 to-teal-700',
    track: 'citizen',
    defaultDesignation: '',
    demoEmail: 'ramesh.farmer@demo.in',
    demoPass: 'BetulCitizen@2026',
    demoLabel: 'Demo Citizen (Farmer)',
    icon: Users,
    highlights: [
      'Smart guided eligibility wizard — no tedious manual typing',
      'Speak in Hindi, English, or Hinglish for scheme help',
      'Track PMAY-G, PM-KISAN, Ladli Behna & employment applications',
    ],
  },
  field: {
    title: 'Field Worker & Survey Portal',
    subtitle: 'Collect village data offline-safe & upload supporting field documents.',
    gradient: 'from-amber-600 to-orange-600',
    track: 'field',
    defaultDesignation: 'Village Data Collector',
    demoEmail: 'field.khedi@demo.gov.in',
    demoPass: 'BetulField@2026',
    demoLabel: 'Demo Field Employee',
    icon: UserCheck,
    highlights: [
      'Dynamic village survey forms with local offline draft save',
      'Document & photo upload with duplicate SHA-256 checks',
      'Scoped strictly to your assigned Betul pilot villages',
    ],
  },
  officer: {
    title: 'Department Officer Portal',
    subtitle: 'Verify village submissions, manage schemas & review OCR documents.',
    gradient: 'from-blue-600 to-indigo-700',
    track: 'government',
    defaultDesignation: 'Department Officer',
    demoEmail: 'agri.officer@demo.gov.in',
    demoPass: 'BetulOfficer@2026',
    demoLabel: 'Demo Agriculture Officer',
    icon: Building2,
    highlights: [
      'Approve, flag, or reject field submissions in your department',
      'Review OCR-extracted documents before official publishing',
      'Compare pilot village metrics across Betul blocks',
    ],
  },
  admin: {
    title: 'District Administration Command',
    subtitle: 'Manage Betul 5-village pilot, 18 departments, verifications & security audits.',
    gradient: 'from-[#0f2942] to-slate-800',
    track: 'government',
    defaultDesignation: 'District Administrator',
    demoEmail: 'collector.betul@demo.gov.in',
    demoPass: 'BetulAdmin@2026',
    demoLabel: 'Demo District Admin',
    icon: Shield,
    highlights: [
      'Live 5-village pilot map, LGD directory & completion charts',
      'Create departments via voice/text with preview confirmation',
      'Approve/revoke official accounts & monitor security audit logs',
    ],
  },
};

export function AuthPage({ defaultPortal = 'citizen' }: { defaultPortal?: PortalKey }) {
  const params = useParams<{ portal?: string }>();
  const navigate = useNavigate();
  const activePortal: PortalKey =
    params.portal && params.portal in PORTAL_CONFIG
      ? (params.portal as PortalKey)
      : defaultPortal;
  const config = PORTAL_CONFIG[activePortal];
  const Icon = config.icon;

  const { login, register, lang, setLang } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedDesignation, setRequestedDesignation] = useState(config.defaultDesignation);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRequestedDesignation(config.defaultDesignation);
    setError(null);
    setInfo(null);
  }, [activePortal, config.defaultDesignation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/');
      } else {
        const msg = await register({
          email,
          password,
          fullName,
          phone,
          track: config.track,
          requestedDesignation: config.track === 'citizen' ? undefined : requestedDesignation,
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

  async function handleQuickDemo() {
    setError(null);
    setBusy(true);
    try {
      await login(config.demoEmail, config.demoPass);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Clean Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2942] hover:underline">
            <ArrowLeft size={16} /> Back to Betul Portal Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg bg-slate-100 p-0.5 text-xs">
              {(Object.keys(PORTAL_CONFIG) as PortalKey[]).map((key) => (
                <Link
                  key={key}
                  to={`/login/${key}`}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                    activePortal === key
                      ? 'bg-[#0f2942] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {key}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
            >
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 grid md:grid-cols-12 gap-8 items-start">
        {/* Left: Attractive Dedicated Portal Banner */}
        <section className={`md:col-span-5 rounded-2xl bg-gradient-to-br ${config.gradient} text-white p-6 sm:p-7 space-y-5 shadow-md`}>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Icon size={24} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">
              Dedicated Role Access
            </div>
            <h1 className="text-2xl font-extrabold mt-1">{config.title}</h1>
            <p className="text-sm text-white/90 mt-2 leading-relaxed">{config.subtitle}</p>
          </div>

          <ul className="space-y-2.5 text-xs text-white/95 pt-2 border-t border-white/15">
            {config.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-amber-300" />
                <span>{h}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-white/15">
            <button
              type="button"
              disabled={busy}
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0f2942] hover:bg-amber-50 font-bold text-xs transition shadow-xs"
            >
              Instant Preview: {config.demoLabel}
            </button>
            <p className="text-[11px] text-white/75 text-center mt-2">
              One-click synthetic demonstration account
            </p>
          </div>
        </section>

        {/* Right: Sign In / Create Account Form */}
        <section className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
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
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'register' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'register' && config.track !== 'citizen' && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Official accounts require District Administration verification before privileged access is granted.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Ramesh Patel"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number (10 digits)
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9826012345"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                </div>

                {config.track !== 'citizen' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Requested Designation
                    </label>
                    <input
                      required
                      value={requestedDesignation}
                      onChange={(e) => setRequestedDesignation(e.target.value)}
                      placeholder="e.g., Block Officer / Village Coordinator"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.in"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-bold transition disabled:opacity-50"
            >
              {busy
                ? 'Please wait...'
                : mode === 'login'
                  ? `Sign In to ${config.title}`
                  : `Create ${activePortal.charAt(0).toUpperCase() + activePortal.slice(1)} Account`}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
