import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Bot, ClipboardCheck, Gift, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

interface OverviewResponse {
  roleScope: string;
  isDemoData: boolean;
  cards: Record<string, number>;
  villageChart?: Array<{ village: string; verified: number; pending: number }>;
}

export function OverviewPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: () => apiRequest<OverviewResponse>('/analytics/overview'),
  });

  if (isLoading || !data) {
    return <div className="p-8 text-sm text-slate-500">Loading Betul District overview...</div>;
  }

  const isCitizen = user?.role === 'citizen';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {isCitizen ? 'Citizen Services Home' : 'Betul District Command Overview'}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {isCitizen
            ? 'Check eligible government schemes, track applications, or speak with the AI Assistant.'
            : 'Five-village pilot tracking, department verification status, and quick administrative actions.'}
        </p>
      </div>

      {/* Simple 4-card KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isCitizen ? (
          <>
            <StatCard label="Active Schemes" value={data.cards.activeSchemes} />
            <StatCard label="My Applications" value={data.cards.myApplications} />
            <StatCard label="Pilot Villages" value={data.cards.pilotVillages} />
            <StatCard label="District Departments" value={data.cards.departmentsAvailable} />
          </>
        ) : (
          <>
            <StatCard label="Pilot Villages" value={data.cards.pilotVillages} />
            <StatCard label="Departments" value={data.cards.departments} />
            <StatCard label="Verified Records" value={data.cards.verifiedRecords} accent="emerald" />
            <StatCard label="Pending Verification" value={data.cards.pendingVerification} accent="amber" />
          </>
        )}
      </div>

      {/* Quick Action Cards (Simple & Easy to Use) */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink
          to="/schemes"
          icon={Gift}
          title="Check Scheme Eligibility"
          desc="Match profile against official active rules"
        />
        <QuickLink
          to="/assistant"
          icon={Bot}
          title="Ask AI / Voice Assistant"
          desc="Ask in Hindi, English, or Hinglish"
        />
        <QuickLink
          to={isCitizen ? '/pilot' : '/records'}
          icon={isCitizen ? MapPin : ClipboardCheck}
          title={isCitizen ? 'Explore 5 Pilot Villages' : 'Submit or Verify Data'}
          desc={isCitizen ? 'View Betul pilot village directory & map' : 'Dynamic field forms & approval queue'}
        />
      </div>

      {/* Pilot Village Progress Chart (Officers & Admin) */}
      {!isCitizen && data.villageChart && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                5-Village Pilot Verification Progress
              </h3>
              <p className="text-xs text-slate-500">
                Demonstration Data • Verified vs. pending department records per village
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.villageChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="village" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="verified" name="Verified" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'navy',
}: {
  label: string;
  value: number;
  accent?: 'navy' | 'emerald' | 'amber';
}) {
  const color =
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'amber'
        ? 'text-amber-700'
        : 'text-[#0f2942]';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value ?? 0}</div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0f2942] transition flex items-center justify-between gap-3 group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#0f2942]/10 text-[#0f2942]">
          <Icon size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
      </div>
      <ArrowRight size={16} className="text-slate-400 group-hover:text-[#0f2942] shrink-0" />
    </Link>
  );
}
