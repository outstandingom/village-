import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileUp, XCircle } from 'lucide-react';
import type { UploadedDocument } from '@betul/shared-types';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

export function DocumentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiRequest<{ documents: UploadedDocument[] }>('/documents'),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please choose a file first.');
      const form = new FormData();
      form.append('file', selectedFile);
      return apiRequest<{ document: UploadedDocument }>('/documents/upload', {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: (res) => {
      setError(null);
      setInfo(`Uploaded "${res.document.originalFilename}" and queued extracted fields for human review.`);
      setSelectedFile(null);
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: Error) => {
      setInfo(null);
      setError(err.message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'verified' | 'rejected' }) =>
      apiRequest(`/documents/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, notes: `Marked ${decision} by officer` }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const canVerify =
    user &&
    ['district_admin', 'department_head', 'department_officer', 'data_verification_officer'].includes(
      user.role,
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Document Upload &amp; OCR Review Queue</h2>
        <p className="text-sm text-slate-600 mt-1">
          Upload PDF, CSV, XLSX, DOCX, TXT, JPG, or PNG files. Duplicate uploads are detected via SHA-256 hash and OCR output always requires human verification.
        </p>
      </div>

      {/* Upload Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          uploadMutation.mutate();
        }}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png,.txt,.wav,.mp3"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-800 file:font-medium hover:file:bg-slate-200"
          />
          <button
            type="submit"
            disabled={!selectedFile || uploadMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-medium disabled:opacity-50"
          >
            <FileUp size={16} />
            {uploadMutation.isPending ? 'Extracting...' : 'Upload & Extract'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
        )}
        {info && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            {info}
          </div>
        )}
      </form>

      {/* Review Queue */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Uploaded Documents</h3>
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading documents...</div>
        ) : (data?.documents ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No documents uploaded yet. Upload a CSV, TXT, PDF, or image above to test the extraction &amp; review queue.
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.documents ?? []).map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{doc.originalFilename}</div>
                    <div className="text-xs text-slate-500">
                      {doc.category} • {(doc.sizeBytes / 1024).toFixed(1)} KB • Confidence:{' '}
                      {Math.round(doc.extractionConfidence * 100)}% • SHA-256: {doc.sha256Hash.slice(0, 12)}...
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doc.verificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {doc.warnings.map((w) => (
                  <div
                    key={w}
                    className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2"
                  >
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}

                <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto max-h-36">
                  {doc.extractedText}
                </pre>

                {canVerify && doc.verificationStatus === 'pending_review' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => verifyMutation.mutate({ id: doc.id, decision: 'verified' })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={14} /> Verify Extraction
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyMutation.mutate({ id: doc.id, decision: 'rejected' })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-medium hover:bg-red-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
