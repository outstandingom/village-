import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, HelpCircle, Info, Mic, MicOff, Sparkles, Wand2 } from 'lucide-react';
import type { CitizenProfile, SchemeApplication, SchemeMatchResult } from '@betul/shared-types';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

const SMART_PERSONAS = [
  {
    id: 'small-farmer',
    label: 'Small Farmer (2 Acres • Kutcha House)',
    desc: 'Auto-fills farmer, 2 acres land, BPL, kutcha house',
    values: {
      fullName: 'Ramesh Patel',
      age: '42',
      gender: 'male' as const,
      occupation: 'farmer',
      educationLevel: '10th',
      annualIncomeBand: 'below_1L' as const,
      landholdingAcres: '2',
      housingStatus: 'kutcha' as const,
      bplCardHolder: true,
      seekingEmployment: false,
    },
  },
  {
    id: 'rural-woman',
    label: 'Rural Woman / Homemaker (BPL)',
    desc: 'Checks Ladli Behna, Ujjwala LPG & Ayushman Bharat',
    values: {
      fullName: 'Meera Bai',
      age: '31',
      gender: 'female' as const,
      occupation: 'homemaker',
      educationLevel: '10th',
      annualIncomeBand: 'below_1L' as const,
      landholdingAcres: '0',
      housingStatus: 'kutcha' as const,
      bplCardHolder: true,
      seekingEmployment: false,
    },
  },
  {
    id: 'graduate-youth',
    label: 'Graduate Youth Seeking Job',
    desc: 'Checks Seekho Kamao Yojana & skill stipends',
    values: {
      fullName: 'Amit Verma',
      age: '23',
      gender: 'male' as const,
      occupation: 'student',
      educationLevel: 'graduate',
      annualIncomeBand: '1L_to_2_5L' as const,
      landholdingAcres: '0',
      housingStatus: 'semi_pucca' as const,
      bplCardHolder: false,
      seekingEmployment: true,
    },
  },
];

export function SchemesPage() {
  const { lang } = useAuth();
  const qc = useQueryClient();

  const [smartText, setSmartText] = useState('');
  const [listening, setListening] = useState(false);
  const [smartHint, setSmartHint] = useState<string | null>(null);

  const [fullName, setFullName] = useState('Betul Citizen');
  const [age, setAge] = useState('35');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [occupation, setOccupation] = useState('farmer');
  const [educationLevel, setEducationLevel] = useState('10th');
  const [annualIncomeBand, setAnnualIncomeBand] = useState<CitizenProfile['annualIncomeBand']>('below_1L');
  const [landholdingAcres, setLandholdingAcres] = useState('2');
  const [housingStatus, setHousingStatus] = useState<CitizenProfile['housingStatus']>('kutcha');
  const [bplCardHolder, setBplCardHolder] = useState(true);
  const [seekingEmployment, setSeekingEmployment] = useState(false);
  const [matches, setMatches] = useState<SchemeMatchResult[]>([]);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [applyErr, setApplyErr] = useState<string | null>(null);

  const { data: profileData } = useQuery({
    queryKey: ['citizen-profile'],
    queryFn: () => apiRequest<{ profile: CitizenProfile | null }>('/schemes/profile'),
  });

  const { data: appsData } = useQuery({
    queryKey: ['scheme-applications'],
    queryFn: () => apiRequest<{ applications: SchemeApplication[] }>('/schemes/applications'),
  });

  useEffect(() => {
    const p = profileData?.profile;
    if (!p) return;
    if (p.fullName) setFullName(p.fullName);
    if (p.age !== undefined) setAge(String(p.age));
    if (p.gender) setGender(p.gender);
    if (p.occupation) setOccupation(p.occupation);
    if (p.educationLevel) setEducationLevel(p.educationLevel);
    if (p.annualIncomeBand) setAnnualIncomeBand(p.annualIncomeBand);
    if (p.landholdingAcres !== undefined) setLandholdingAcres(String(p.landholdingAcres));
    if (p.housingStatus) setHousingStatus(p.housingStatus);
    if (p.bplCardHolder !== undefined) setBplCardHolder(p.bplCardHolder);
    if (p.seekingEmployment !== undefined) setSeekingEmployment(p.seekingEmployment);
  }, [profileData]);

  const checkMutation = useMutation({
    mutationFn: (override?: Partial<CitizenProfile>) =>
      apiRequest<{ profile: CitizenProfile; matches: SchemeMatchResult[] }>('/schemes/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: override?.fullName ?? (fullName || 'Betul Citizen'),
          age: override?.age ?? Number(age),
          gender: override?.gender ?? gender,
          occupation: override?.occupation ?? occupation,
          educationLevel: override?.educationLevel ?? educationLevel,
          annualIncomeBand: override?.annualIncomeBand ?? annualIncomeBand,
          landholdingAcres: override?.landholdingAcres ?? Number(landholdingAcres),
          housingStatus: override?.housingStatus ?? housingStatus,
          bplCardHolder: override?.bplCardHolder ?? bplCardHolder,
          seekingEmployment: override?.seekingEmployment ?? seekingEmployment,
          consentGiven: true,
        }),
      }),
    onSuccess: (res) => {
      setMatches(res.matches);
      qc.invalidateQueries({ queryKey: ['citizen-profile'] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (schemeId: string) =>
      apiRequest('/schemes/applications', {
        method: 'POST',
        body: JSON.stringify({ schemeId }),
      }),
    onSuccess: () => {
      setApplyErr(null);
      setApplyMsg('Application submitted! Track its status in the Applications section below.');
      qc.invalidateQueries({ queryKey: ['scheme-applications'] });
    },
    onError: (err: Error) => {
      setApplyMsg(null);
      setApplyErr(err.message);
    },
  });

  function applySmartAutoFill(sentence: string) {
    const lower = sentence.toLowerCase();
    const detected: string[] = [];
    let nextOcc = occupation;
    let nextLand = Number(landholdingAcres);
    let nextHousing = housingStatus;
    let nextGender = gender;
    let nextEdu = educationLevel;
    let nextSeek = seekingEmployment;
    let nextBpl = bplCardHolder;
    let nextAge = Number(age);

    if (/(farmer|kisan|kheti|किसान)/i.test(lower)) {
      nextOcc = 'farmer';
      setOccupation('farmer');
      detected.push('Occupation: Farmer');
    }
    const acreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|एकड़)/i);
    if (acreMatch) {
      nextLand = Number(acreMatch[1]);
      setLandholdingAcres(acreMatch[1]);
      detected.push(`Land: ${acreMatch[1]} acres`);
    }
    if (/(kutcha|kaccha|ghar|makan|कच्चा)/i.test(lower)) {
      nextHousing = 'kutcha';
      setHousingStatus('kutcha');
      detected.push('Housing: Kutcha House');
    }
    if (/(woman|mahila|female|behna|महिला)/i.test(lower)) {
      nextGender = 'female';
      setGender('female');
      detected.push('Gender: Female');
    }
    if (/(graduate|graduation|degree|स्नातक)/i.test(lower)) {
      nextEdu = 'graduate';
      setEducationLevel('graduate');
      detected.push('Education: Graduate');
    }
    if (/(job|employment|rojgar|naukri|skill|रोजगार)/i.test(lower)) {
      nextSeek = true;
      setSeekingEmployment(true);
      detected.push('Seeking Employment');
    }
    if (/(bpl|ration|garib|बीपीएल)/i.test(lower)) {
      nextBpl = true;
      setBplCardHolder(true);
      detected.push('BPL Card Holder');
    }
    const ageMatch = lower.match(/(\d{2})\s*(?:year|years|sal|saal|वर्ष)/i);
    if (ageMatch) {
      nextAge = Number(ageMatch[1]);
      setAge(ageMatch[1]);
      detected.push(`Age: ${ageMatch[1]}`);
    }

    setSmartHint(
      detected.length > 0
        ? `Auto-detected: ${detected.join(' • ')}. Matching schemes updated!`
        : 'Updated your search. You can also tap any quick preset below.',
    );

    checkMutation.mutate({
      occupation: nextOcc,
      landholdingAcres: nextLand,
      housingStatus: nextHousing,
      gender: nextGender,
      educationLevel: nextEdu,
      seekingEmployment: nextSeek,
      bplCardHolder: nextBpl,
      age: nextAge,
    });
  }

  function startVoiceSmartFill() {
    const SpeechRec =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSmartHint('Voice input unavailable in this browser. Type a short sentence above and click Auto-Fill.');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRec as any)();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
      const spoken = event.results?.[0]?.[0]?.transcript ?? '';
      setListening(false);
      if (spoken) {
        setSmartText(spoken);
        applySmartAutoFill(spoken);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  function applyPersona(p: (typeof SMART_PERSONAS)[number]) {
    setFullName(p.values.fullName);
    setAge(p.values.age);
    setGender(p.values.gender);
    setOccupation(p.values.occupation);
    setEducationLevel(p.values.educationLevel);
    setAnnualIncomeBand(p.values.annualIncomeBand);
    setLandholdingAcres(p.values.landholdingAcres);
    setHousingStatus(p.values.housingStatus);
    setBplCardHolder(p.values.bplCardHolder);
    setSeekingEmployment(p.values.seekingEmployment);
    setSmartHint(`Applied "${p.label}" preset — showing matching schemes automatically!`);
    checkMutation.mutate({
      fullName: p.values.fullName,
      age: Number(p.values.age),
      gender: p.values.gender,
      occupation: p.values.occupation,
      educationLevel: p.values.educationLevel,
      annualIncomeBand: p.values.annualIncomeBand,
      landholdingAcres: Number(p.values.landholdingAcres),
      housingStatus: p.values.housingStatus,
      bplCardHolder: p.values.bplCardHolder,
      seekingEmployment: p.values.seekingEmployment,
    });
  }

  const eligibleCount = matches.filter((m) => m.outcome === 'potentially_eligible').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Smart Citizen Benefits &amp; Scheme Wizard</h2>
        <p className="text-sm text-slate-600 mt-1">
          No need to type everything manually — speak 1 sentence in Hindi/English or pick a quick profile preset to see eligible schemes instantly.
        </p>
      </div>

      {/* Step 1: Voice / 1-Sentence Smart Auto-Fill */}
      <section className="bg-gradient-to-r from-[#0f2942] to-[#173b5e] text-white rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Wand2 size={14} /> Smart Auto-Suggest by Voice or 1 Sentence
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startVoiceSmartFill}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              listening ? 'bg-red-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-[#0f2942]'
            }`}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
            {listening ? 'Listening...' : 'Speak Details'}
          </button>
          <input
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder='Try: "Main kisan hoon, 2 acre zameen aur kutcha ghar hai" or "Graduate woman seeking job"'
            className="flex-1 min-w-[220px] rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={() => applySmartAutoFill(smartText)}
            className="px-4 py-2 rounded-xl bg-white text-[#0f2942] hover:bg-amber-50 text-xs font-bold"
          >
            Auto-Fill &amp; Suggest
          </button>
        </div>

        {/* 1-Click Smart Persona Chips */}
        <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
          {SMART_PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPersona(p)}
              className="text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition"
            >
              <div className="text-xs font-bold text-white">{p.label}</div>
              <div className="text-[11px] text-slate-200 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>

        {smartHint && (
          <div className="text-xs bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 rounded-lg px-3 py-2">
            {smartHint}
          </div>
        )}
      </section>

      {/* Step 2: Fine-Tune Profile (Quick Presets + Editable Fields) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          checkMutation.mutate(undefined);
        }}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Fine-Tune Your Details</h3>
          {matches.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {eligibleCount} Potentially Eligible Scheme(s) Found
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Occupation</label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="farmer">Farmer / Cultivator</option>
              <option value="student">Student</option>
              <option value="labour">Daily Wage / Labour</option>
              <option value="homemaker">Homemaker</option>
              <option value="entrepreneur">Self-Employed / Entrepreneur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Education</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="below_10th">Below 10th</option>
              <option value="10th">10th Pass</option>
              <option value="12th">12th Pass</option>
              <option value="iti">ITI / Diploma</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Annual Income</label>
            <select
              value={annualIncomeBand}
              onChange={(e) => setAnnualIncomeBand(e.target.value as CitizenProfile['annualIncomeBand'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="below_1L">Below ₹1 Lakh</option>
              <option value="1L_to_2_5L">₹1 Lakh – ₹2.5 Lakh</option>
              <option value="2_5L_to_5L">₹2.5 Lakh – ₹5 Lakh</option>
              <option value="above_5L">Above ₹5 Lakh</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Housing Status</label>
            <select
              value={housingStatus}
              onChange={(e) => setHousingStatus(e.target.value as CitizenProfile['housingStatus'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="kutcha">Kutcha House</option>
              <option value="semi_pucca">Semi-Pucca</option>
              <option value="pucca">Pucca House</option>
              <option value="homeless">Homeless</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Landholding (Acres)</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.5"
                min={0}
                value={landholdingAcres}
                onChange={(e) => setLandholdingAcres(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {['0', '2', '5'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLandholdingAcres(v)}
                  className="px-2 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-100"
                >
                  {v}ac
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-1 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={bplCardHolder}
              onChange={(e) => setBplCardHolder(e.target.checked)}
            />
            BPL / Priority Ration Card Holder
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={seekingEmployment}
              onChange={(e) => setSeekingEmployment(e.target.checked)}
            />
            Seeking Skill Training / Employment
          </label>
        </div>

        <button
          type="submit"
          disabled={checkMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-semibold"
        >
          <Sparkles size={16} />
          {checkMutation.isPending ? 'Checking Official Rules...' : 'Check Eligible Schemes'}
        </button>
      </form>

      {applyMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {applyMsg}
        </div>
      )}
      {applyErr && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {applyErr}
        </div>
      )}

      {/* Eligibility Results */}
      {matches.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">
            Explainable Scheme Matches (Active Schemes Only)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <div
                key={m.scheme.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-500">
                        {m.scheme.level} • {m.scheme.departmentCategory}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{m.scheme.nameEn}</h4>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.outcome === 'potentially_eligible'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.outcome === 'additional_info_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.outcome === 'potentially_eligible' ? (
                        <CheckCircle size={12} />
                      ) : m.outcome === 'additional_info_required' ? (
                        <HelpCircle size={12} />
                      ) : (
                        <Info size={12} />
                      )}
                      {m.outcome.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{m.scheme.benefitDetailsEn}</p>

                  {m.matchedConditions.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-emerald-700">
                      {m.matchedConditions.map((c: string) => (
                        <li key={c}>✓ {c}</li>
                      ))}
                    </ul>
                  )}
                  {m.failedConditions.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-red-700">
                      {m.failedConditions.map((c: string) => (
                        <li key={c}>✗ {c}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">{m.disclaimer}</p>
                </div>

                {m.outcome !== 'likely_ineligible' && (
                  <button
                    type="button"
                    onClick={() => applyMutation.mutate(m.scheme.id)}
                    className="w-full py-2 rounded-lg border border-[#0f2942] text-[#0f2942] hover:bg-[#0f2942] hover:text-white text-xs font-semibold transition"
                  >
                    Submit Preliminary Application
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Applications Tracker */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Submitted Applications</h3>
        {(appsData?.applications ?? []).length === 0 ? (
          <p className="text-xs text-slate-500">No applications submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {(appsData?.applications ?? []).map((app) => (
              <div
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              >
                <div>
                  <div className="font-semibold text-slate-900">{app.schemeName}</div>
                  <div className="text-xs text-slate-500">
                    Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
