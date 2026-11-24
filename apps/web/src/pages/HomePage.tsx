import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Download,
  FileSearch,
  Gift,
  Globe,
  MapPin,
  Menu,
  Mic,
  Shield,
  Smartphone,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ROLE_PORTALS = [
  {
    id: 'citizen',
    to: '/login/citizen',
    titleEn: 'Citizen & Household Portal',
    titleHi: 'नागरिक एवं परिवार पोर्टल',
    badge: 'For Farmers, Women, Youth & Seniors',
    color: 'from-emerald-600 to-teal-700',
    ring: 'hover:border-emerald-500',
    icon: Users,
    features: [
      'Smart 3-step scheme eligibility wizard (no long forms)',
      'Speak in Hindi or Hinglish to find PMAY-G, PM-KISAN & more',
      'Track submitted benefit applications in one place',
    ],
  },
  {
    id: 'field',
    to: '/login/field',
    titleEn: 'Field Worker & Survey Portal',
    titleHi: 'फील्ड कर्मचारी पोर्टल',
    badge: 'For Village Data Collectors & Coordinators',
    color: 'from-amber-600 to-orange-600',
    ring: 'hover:border-amber-500',
    icon: UserCheck,
    features: [
      'Offline-safe village survey forms with local draft save',
      'Upload scanned documents, photos & CSV datasets',
      'Scoped strictly to your assigned Betul pilot villages',
    ],
  },
  {
    id: 'officer',
    to: '/login/officer',
    titleEn: 'Department Officer Portal',
    titleHi: 'विभागीय अधिकारी पोर्टल',
    badge: 'For 18 District Departments & Verifiers',
    color: 'from-blue-600 to-indigo-700',
    ring: 'hover:border-blue-500',
    icon: Building2,
    features: [
      'Review, approve or flag field records in verification queue',
      'Manage versioned department data collection forms',
      'Verify OCR-extracted documents before official publishing',
    ],
  },
  {
    id: 'admin',
    to: '/login/admin',
    titleEn: 'District Administration Command',
    titleHi: 'जिला प्रशासन कमांड',
    badge: 'For Collector & Authorized Deputy Collectors',
    color: 'from-[#0f2942] to-slate-800',
    ring: 'hover:border-[#0f2942]',
    icon: Shield,
    features: [
      'Live 5-Village Pilot map, LGD progress & analytics',
      'Create departments via voice or text with preview confirmation',
      'Verify official accounts & monitor full security audit logs',
    ],
  },
];

export function HomePage() {
  const { lang, setLang } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Official Top Government Strip */}
      <div className="bg-[#091b2c] text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            {lang === 'hi'
              ? 'मध्य प्रदेश शासन • बैतूल जिला इंटेलिजेंस पहल (5-ग्राम पायलट)'
              : 'Betul District Administration, Madhya Pradesh • Unified 5-Village Pilot Portal'}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-medium">Demo Data Preview Enabled</span>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              <Globe size={12} />
              {lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Clean Primary Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2942] text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-xs">
              B48
            </div>
            <div>
              <div className="text-base font-bold text-[#0f2942] leading-tight">
                {lang === 'hi' ? 'बैतूल जिला पोर्टल' : 'Betul District Portal'}
              </div>
              <div className="text-[11px] text-slate-500">
                {lang === 'hi' ? 'योजनाएं • ग्राम डेटा • AI वॉइस सहायक' : 'Schemes • Village Intelligence • Voice AI'}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <a href="#portals" className="hover:text-[#0f2942]">Role Portals</a>
            <a href="#features" className="hover:text-[#0f2942]">What It Does</a>
            <a href="#pilot" className="hover:text-[#0f2942]">5-Village Pilot</a>
            <a href="#mobile-app" className="hover:text-[#0f2942]">Android App</a>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <Link
              to="/login/citizen"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[#0f2942] border border-slate-300 hover:bg-slate-50 transition"
            >
              Citizen Login
            </Link>
            <Link
              to="/login/admin"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0f2942] hover:bg-[#163a5f] text-white transition"
            >
              Official Login
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileNav((v) => !v)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileNav && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <a href="#portals" onClick={() => setMobileNav(false)} className="py-1">Role Portals</a>
              <a href="#features" onClick={() => setMobileNav(false)} className="py-1">What It Does</a>
              <a href="#pilot" onClick={() => setMobileNav(false)} className="py-1">5-Village Pilot</a>
              <a href="#mobile-app" onClick={() => setMobileNav(false)} className="py-1">Android App</a>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Link to="/login/citizen" className="text-center py-2 rounded-lg border border-slate-300 text-sm font-semibold text-[#0f2942]">
                Citizen Login
              </Link>
              <Link to="/login/admin" className="text-center py-2 rounded-lg bg-[#0f2942] text-white text-sm font-semibold">
                Official Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section: Clearly Explains What the Platform Does */}
      <section className="bg-gradient-to-br from-[#0f2942] via-[#133554] to-[#0b1f33] text-white py-14 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Mic size={14} /> Voice-First • Hindi &amp; English • Built for Every Citizen &amp; Officer
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {lang === 'hi'
                ? 'बैतूल के हर नागरिक, किसान और अधिकारी के लिए एकीकृत डिजिटल मंच'
                : 'One Unified Platform for Betul Citizens, Field Staff & District Administration'}
            </h1>
            <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
              {lang === 'hi'
                ? 'सरकारी योजनाओं की तुरंत पात्रता जांचें, हिन्दी या हिंग्लिश में बोलकर मदद लें, और बैतूल के 5 पायलट ग्रामों की प्रगति पारदर्शी रूप से देखें।'
                : 'Discover eligible Central & Madhya Pradesh schemes in 30 seconds by voice or smart presets, collect verified village data across 18 departments, and monitor Betul’s 5-village pilot in real time.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/login/citizen"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0f2942] font-bold text-sm transition shadow-sm"
              >
                Check Eligible Schemes <ArrowRight size={16} />
              </Link>
              <a
                href="#portals"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
              >
                Choose Your Portal
              </a>
            </div>
          </div>

          {/* Right Highlight Card: Live Platform Capabilities */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Platform at a Glance
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3.5">
                <div className="text-2xl font-extrabold">5</div>
                <div className="text-xs text-slate-200 mt-0.5">Betul Pilot Villages (LGD Mapped)</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5">
                <div className="text-2xl font-extrabold">18</div>
                <div className="text-xs text-slate-200 mt-0.5">Configurable District Departments</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5">
                <div className="text-2xl font-extrabold">24×7</div>
                <div className="text-xs text-slate-200 mt-0.5">Hindi / Hinglish Voice AI Assistant</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5">
                <div className="text-2xl font-extrabold">100%</div>
                <div className="text-xs text-slate-200 mt-0.5">Role-Scoped &amp; Audit-Logged</div>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Try any role instantly with built-in demo accounts or create your own verified account via Supabase Auth.
            </p>
          </div>
        </div>
      </section>

      {/* Dedicated Role Portals Section */}
      <section id="portals" className="max-w-7xl mx-auto w-full px-4 py-14 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Select Your Dedicated Login Portal
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every stakeholder gets a clean, focused workspace tailored to their exact responsibilities — no overcrowded menus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLE_PORTALS.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.id}
                to={portal.to}
                className={`group bg-white rounded-2xl border border-slate-200 ${portal.ring} shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  <div className={`bg-gradient-to-r ${portal.color} p-4 text-white`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <Icon size={20} />
                    </div>
                    <div className="text-[11px] font-medium text-white/85">{portal.badge}</div>
                    <h3 className="text-base font-bold mt-0.5">
                      {lang === 'hi' ? portal.titleHi : portal.titleEn}
                    </h3>
                  </div>
                  <ul className="p-4 space-y-2 text-xs text-slate-600">
                    {portal.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-4 pb-4">
                  <div className="w-full py-2 rounded-lg bg-slate-100 group-hover:bg-[#0f2942] group-hover:text-white text-slate-800 text-xs font-semibold text-center transition flex items-center justify-center gap-1.5">
                    Open Portal <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* What This Platform Does (Feature Showcase) */}
      <section id="features" className="bg-white border-y border-slate-200 py-14 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Designed for Simplicity, Speed &amp; Rural Accessibility
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Inspired by India’s UX4G, MyScheme, UMANG &amp; Bhashini principles so citizens with any literacy level can get help effortlessly.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureBox
              icon={Gift}
              title="Smart Scheme Suggestions"
              desc="No tedious forms — tap a persona or speak 1 sentence about your land, crop, or family and see eligible schemes immediately."
            />
            <FeatureBox
              icon={Bot}
              title="Hindi & Hinglish Voice AI"
              desc="Understands informal phrases like 'Mujhe ghar wali yojana ka form bharna hai' and confirms PMAY-G before acting."
            />
            <FeatureBox
              icon={MapPin}
              title="5-Village LGD Pilot Map"
              desc="Interactive Betul map tracking Khedi Sawligarh, Badora, Sohagpur, Betul Bazar, and Jhallar across 18 departments."
            />
            <FeatureBox
              icon={FileSearch}
              title="Safe Document & OCR Queue"
              desc="Upload PDFs, CSVs, or scanned photos with SHA-256 duplicate protection and mandatory officer verification."
            />
          </div>
        </div>
      </section>

      {/* Pilot Villages Preview */}
      <section id="pilot" className="max-w-7xl mx-auto w-full px-4 py-12">
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Phase 1 Rollout • Betul, Madhya Pradesh
            </span>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">
              Five Pilot Villages Connected
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Khedi Sawligarh • Badora • Sohagpur • Betul Bazar • Jhallar
            </p>
          </div>
          <Link
            to="/login/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0f2942] text-sm font-bold shrink-0"
          >
            View Live Pilot Map <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Mobile App & Android APK Download Section */}
      <section id="mobile-app" className="max-w-7xl mx-auto w-full px-4 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <Smartphone size={14} /> Mobile-First • Works on Budget Android Phones
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              Install Betul District App on Android
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Citizens and field staff can install this portal directly as a lightweight Android app (PWA) right from Chrome — with offline form drafts and voice input — or package it into a signed <code>betul-district.apk</code> via Capacitor.
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-700">
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-medium">
                1. Open in Chrome on Android
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-medium">
                2. Tap Menu (⋮) → Install App / Add to Home Screen
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-medium">
                3. Launch like a native Android app
              </span>
            </div>
          </div>
          <div className="md:col-span-4 flex flex-col gap-3">
            <Link
              to="/login/citizen"
              className="w-full py-3 px-4 rounded-xl bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-semibold text-center inline-flex items-center justify-center gap-2 transition"
            >
              <Download size={16} /> Launch Mobile Citizen App
            </Link>
            <p className="text-[11px] text-center text-slate-500">
              Android APK packaging guide included in <code>docs/deployment/ANDROID_APK.md</code>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#091b2c] text-slate-400 text-xs py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>© 2026 Betul District Intelligence &amp; Citizen Benefit Platform</span>
          <span>Demonstration Data clearly labelled • Official records require verified department approval</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureBox({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
      <div className="w-10 h-10 rounded-xl bg-[#0f2942] text-amber-400 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
