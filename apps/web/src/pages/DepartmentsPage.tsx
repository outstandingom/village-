import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import type { Department } from '@betul/shared-types';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

interface EnrichedDept extends Department {
  schemasCount: number;
  recordsCount: number;
}

export function DepartmentsPage() {
  const { user, lang } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [category, setCategory] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest<{ departments: EnrichedDept[] }>('/departments'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify({
          code: code.toUpperCase(),
          nameEn,
          nameHi: nameHi || nameEn,
          category: category || nameEn,
          descriptionEn,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      setShowCreate(false);
      setCode('');
      setNameEn('');
      setNameHi('');
      setCategory('');
      setDescriptionEn('');
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const departments = (data?.departments ?? []).filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${d.code} ${d.nameEn} ${d.nameHi} ${d.category}`.toLowerCase().includes(q);
  });

  const isAdmin = user?.role === 'district_admin' && user.verificationStatus === 'approved';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">District Departments</h2>
          <p className="text-sm text-slate-600 mt-1">
            Configurable administrative units across Betul District. You can also create departments via voice in the AI Assistant.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-medium"
          >
            <Plus size={16} />
            New Department
          </button>
        )}
      </div>

      {showCreate && isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
        >
          <h3 className="text-base font-semibold text-slate-900">Create Configurable Department</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Short Code</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., HORT"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Horticulture"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Name (English)</label>
              <input
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Horticulture & Food Processing"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Name (Hindi)</label>
              <input
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                placeholder="उद्यानिकी विभाग"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="Primary responsibilities and village data collection scope..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#0f2942] text-white text-sm font-medium"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Department'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 18+ departments..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading departments...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {dept.assignedVillageIds.length} pilot villages
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  {lang === 'hi' ? dept.nameHi : dept.nameEn}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{dept.descriptionEn}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{dept.schemasCount} form(s)</span>
                <span>{dept.recordsCount} record(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
