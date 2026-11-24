import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, HelpCircle, Info, Sparkles } from 'lucide-react';
import type { CitizenProfile, SchemeApplication, SchemeMatchResult } from '@betul/shared-types';
import { apiRequest } from '../services/api';

export function SchemesPage() {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState('');
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
    setFullName(p.fullName ?? '');
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
    mutationFn: () =>
      apiRequest<{ profile: CitizenProfile; matches: SchemeMatchResult[] }>('/schemes/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName || 'Betul Resident',
          age: Number(age),
          gender,
          occupation,
          educationLevel,
          annualIncomeBand,
          landholdingAcres: Number(landholdingAcres),
          housingStatus,
          bplCardHolder,
          seekingEmployment,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Citizen Benefits &amp; Scheme Eligibility</h2>
        <p className="text-sm text-slate-600 mt-1">
          Enter simple household details to check eligibility against active Central and Madhya Pradesh schemes using deterministic official rules.
        </p>
      </div>

      {/* Simple Profile Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          checkMutation.mutate();
        }}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <h3 className="text-base font-semibold text-slate-900">1. Your Household Profile</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Ramesh Patel"
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
            <input
              type="number"
              step="0.5"
              min={0}
              value={landholdingAcres}
              onChange={(e) => setLandholdingAcres(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
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
            2. Explainable Scheme Matches (Active Schemes Only)
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
                      {m.matchedConditions.map((c) => (
                        <li key={c}>✓ {c}</li>
                      ))}
                    </ul>
                  )}
                  {m.failedConditions.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-red-700">
                      {m.failedConditions.map((c) => (
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
