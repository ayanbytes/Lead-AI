import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import { navigate } from '../utils/router';
import { downloadPDF, fetchAuditById } from '../services/api';

function parseAuditId(route) {
  const match = String(route || '').match(/^\/audit\/(\d+)\s*$/);
  return match ? Number(match[1]) : null;
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

function Section({ title, children }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/40">
      <div className="text-sm font-semibold text-gray-500">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function AuditDetail({ route }) {
  const auditId = useMemo(() => parseAuditId(route), [route]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    if (!auditId) {
      setError('Invalid audit link.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    setAudit(null);
    fetchAuditById(auditId)
      .then((row) => {
        if (cancelled) return;
        setAudit(row);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load audit');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  const result = audit?.result || null;

  return (
    <PageShell title="Audit details" subtitle="Review your audit, copy content, and export a PDF.">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-2xl font-extrabold text-gray-900">{audit?.company_name || (loading ? 'Loading…' : '—')}</div>
          <div className="text-gray-600 mt-1">
            {(audit?.industry || 'General')}{audit?.created_at ? ` • ${formatDateTime(audit.created_at)}` : ''}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary py-3 px-6 rounded-xl" onClick={() => navigate('/app')}>
            Back to dashboard
          </button>
          <button className="btn-secondary py-3 px-6 rounded-xl" onClick={() => navigate('/')}>
            Home
          </button>
          <button
            className="btn-primary py-3 px-6 rounded-xl"
            disabled={!result || loading}
            onClick={() => downloadPDF(result, null)}
          >
            Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading audit…</div>
      ) : error ? (
        <div className="text-red-600 font-medium">{error}</div>
      ) : !audit ? (
        <div className="text-gray-600">Audit not found.</div>
      ) : (
        <div className="grid gap-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Section title="Company">
              <div className="text-lg font-extrabold text-gray-900">{audit.company_name}</div>
              {audit.website ? <div className="text-gray-600 mt-1 break-all">{audit.website}</div> : null}
            </Section>
            <Section title="Status">
              <div className="text-lg font-extrabold text-gray-900">{audit.status || 'Success'}</div>
              <div className="text-gray-600 mt-1">{audit.industry || 'General'}</div>
            </Section>
            <Section title="Actions">
              <div className="grid gap-3">
                <button
                  type="button"
                  className="btn-secondary py-3 px-6 rounded-xl w-full"
                  onClick={() => {
                    const text = result?.email || '';
                    navigator.clipboard?.writeText(text);
                    toast.success('Email copied');
                  }}
                  disabled={!result?.email}
                >
                  Copy email
                </button>
                <button
                  type="button"
                  className="btn-secondary py-3 px-6 rounded-xl w-full"
                  onClick={() => {
                    const text = result?.audit_summary || '';
                    navigator.clipboard?.writeText(text);
                    toast.success('Summary copied');
                  }}
                  disabled={!result?.audit_summary}
                >
                  Copy summary
                </button>
              </div>
            </Section>
          </div>

          <Section title="Summary">
            <div className="text-gray-900 whitespace-pre-wrap">{result?.audit_summary || '—'}</div>
          </Section>

          <Section title="Business value">
            <div className="text-gray-900 whitespace-pre-wrap">{result?.business_value || '—'}</div>
          </Section>

          <Section title="Outreach email">
            <div className="text-gray-900 whitespace-pre-wrap">{result?.email || '—'}</div>
          </Section>
        </div>
      )}
    </PageShell>
  );
}

