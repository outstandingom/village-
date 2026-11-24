import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Save, Send, XCircle } from 'lucide-react';
import type { DataRecord, DataSchemaVersion, Department, Village } from '@betul/shared-types';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

const DRAFT_STORAGE_KEY = 'betul_offline_record_draft';

export function RecordsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedDeptId, setSelectedDeptId] = useState('dept-agr');
  const [selectedVillageId, setSelectedVillageId] = useState('vil-khedi');
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest<{ departments: Department[] }>('/departments'),
  });
  const { data: villagesData } = useQuery({
    queryKey: ['villages'],
    queryFn: () => apiRequest<{ villages: Village[] }>('/villages?pilot=true'),
  });
  const { data: schemasData } = useQuery({
    queryKey: ['schemas', selectedDeptId],
    queryFn: () => apiRequest<{ schemas: DataSchemaVersion[] }>(`/departments/${selectedDeptId}/schemas`),
    enabled: Boolean(selectedDeptId),
  });
  const { data: recordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ['records'],
    queryFn: () => apiRequest<{ records: DataRecord[] }>('/records'),
  });

  const activeSchema = schemasData?.schemas[0];

  // Restore offline draft if present
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        setFormValues(parsed);
      } catch {
        // ignore invalid draft
      }
    }
  }, []);

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest('/records', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: selectedDeptId,
          villageId: selectedVillageId,
          schemaId: activeSchema?.id,
          referenceDate,
          source: 'field_web',
          payload: formValues,
          submitNow: true,
        }),
      }),
    onSuccess: () => {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setFormValues({});
      setError(null);
      setMessage('Record submitted successfully for officer verification.');
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (err: Error) => {
      setMessage(null);
      setError(err.message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: string; notes: string }) =>
      apiRequest(`/records/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, notes }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  const canVerify =
    user &&
    ['district_admin', 'department_head', 'department_officer', 'data_verification_officer'].includes(
      user.role,
    );

  function saveOfflineDraft() {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formValues));
    setMessage('Draft saved locally on this device (offline-safe).');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Field Data Collection &amp; Verification</h2>
        <p className="text-sm text-slate-600 mt-1">
          Submit village data using versioned department schemas. Access is strictly scoped to your assigned villages and departments.
        </p>
      </div>

      {/* Dynamic Form Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Submit Village Record</h3>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setFormValues({});
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {(deptsData?.departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Pilot Village</label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {(villagesData?.villages ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nameEn} (LGD {v.lgdCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reference Date</label>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {activeSchema ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate();
            }}
            className="space-y-4 pt-2 border-t border-slate-100"
          >
            <div className="text-xs font-semibold text-[#0f2942]">
              Active Form: {activeSchema.schemaName} (v{activeSchema.version})
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {activeSchema.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {field.labelEn} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={String(formValues[field.key] ?? '')}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 mt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(formValues[field.key])}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.checked }))
                        }
                      />
                      Yes / Available
                    </label>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      required={field.required}
                      value={String(formValues[field.key] ?? '')}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      required={field.required}
                      min={field.min}
                      value={String(formValues[field.key] ?? '')}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {message}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-medium"
              >
                <Send size={15} />
                {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
              </button>
              <button
                type="button"
                onClick={saveOfflineDraft}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Save size={15} />
                Save Offline Draft
              </button>
            </div>
          </form>
        ) : (
          <div className="text-xs text-slate-500 py-4">
            No active form schema configured yet for this department. Select Agriculture, Education, or Rural Development.
          </div>
        )}
      </section>

      {/* Verification Queue Table */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Submitted Records &amp; Verification Queue</h3>
        </div>
        {loadingRecords ? (
          <div className="p-6 text-sm text-slate-500">Loading records...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Dept / Village</th>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Status</th>
                {canVerify && <th className="px-4 py-3">Verify</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recordsData?.records ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-xs font-mono">{r.referenceDate}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.departmentId}</div>
                    <div className="text-xs text-slate-500">{r.villageId}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{r.submittedByName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                    {JSON.stringify(r.payload)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  {canVerify && (
                    <td className="px-4 py-3">
                      {r.status !== 'verified' && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              verifyMutation.mutate({
                                id: r.id,
                                decision: 'verified',
                                notes: 'Verified via District Portal',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              verifyMutation.mutate({
                                id: r.id,
                                decision: 'requires_correction',
                                notes: 'Please re-verify field counts',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-400 text-amber-800 text-xs hover:bg-amber-50"
                          >
                            <XCircle size={13} /> Flag
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
