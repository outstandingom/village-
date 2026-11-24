import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Ban } from 'lucide-react';
import type { AuditLogEntry, UserProfile } from '@betul/shared-types';
import { apiRequest } from '../services/api';

export function AdminPage() {
  const qc = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<{ users: UserProfile[] }>('/admin/users'),
  });

  const { data: logsData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiRequest<{ logs: AuditLogEntry[] }>('/admin/audit-logs'),
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      verificationStatus: 'approved' | 'rejected' | 'revoked';
      role?: string;
    }) =>
      apiRequest(`/admin/users/${payload.userId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          verificationStatus: payload.verificationStatus,
          role: payload.role,
          assignedVillageIds: ['vil-khedi', 'vil-badora'],
          departmentIds: ['dept-agr'],
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Verification &amp; Security Audit</h2>
        <p className="text-sm text-slate-600 mt-1">
          Approve or revoke government/field officer accounts and inspect security audit events.
        </p>
      </div>

      {/* User Directory */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Registered Accounts</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name &amp; Email</th>
              <th className="px-4 py-3">Track / Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(usersData?.users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{u.fullName}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="font-medium uppercase">{u.role.replace(/_/g, ' ')}</div>
                  {u.requestedDesignation && (
                    <div className="text-slate-500">Requested: {u.requestedDesignation}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.verificationStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : u.verificationStatus === 'pending_verification'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {u.verificationStatus === 'pending_verification' && (
                      <button
                        type="button"
                        onClick={() =>
                          verifyMutation.mutate({
                            userId: u.id,
                            verificationStatus: 'approved',
                            role: u.track === 'field' ? 'field_employee' : 'department_officer',
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                      >
                        <Check size={13} /> Approve
                      </button>
                    )}
                    {u.role !== 'district_admin' && u.verificationStatus === 'approved' && (
                      <button
                        type="button"
                        onClick={() =>
                          verifyMutation.mutate({
                            userId: u.id,
                            verificationStatus: 'revoked',
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-red-300 text-red-700 text-xs hover:bg-red-50"
                      >
                        <Ban size={13} /> Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Audit Log */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Recent Security &amp; Activity Audit Log</h3>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Timestamp</th>
              <th className="px-4 py-2.5">Action</th>
              <th className="px-4 py-2.5">Actor Role</th>
              <th className="px-4 py-2.5">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(logsData?.logs ?? []).slice(0, 25).map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-2.5 font-mono text-slate-500">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{log.action}</td>
                <td className="px-4 py-2.5 text-slate-600">{log.actorRole}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      log.outcome === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
