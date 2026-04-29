import React, { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { navigate } from '../utils/router';
import { fetchAudits } from '../services/api';

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

export default function AuditHistory() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 12 });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / pageSize)), [data.total, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAudits({ page, pageSize })
      .then((res) => {
        if (cancelled) return;
        setData(res || { items: [], total: 0, page, page_size: pageSize });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load audits');
        setData({ items: [], total: 0, page, page_size: pageSize });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  return (
    <PageShell title="Audit history" subtitle="Browse and open your previous audits.">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="text-gray-600">
          {loading ? 'Loading…' : `${data.total || 0} audits`}
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary py-3 px-6 rounded-xl" onClick={() => navigate('/app')}>
            Back to dashboard
          </button>
          <button className="btn-secondary py-3 px-6 rounded-xl" onClick={() => navigate('/')}>
            Home
          </button>
        </div>
      </div>

      {error ? <div className="text-red-600 font-medium mb-4">{error}</div> : null}

      {loading ? (
        <div className="text-gray-600">Loading audits…</div>
      ) : data.items?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/audit/${a.id}`)}
              className="text-left glass-card rounded-2xl p-5 border border-white/40 hover:bg-white/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold text-gray-900">{a.company_name || 'Company'}</div>
                  <div className="text-sm text-gray-600 mt-1">{a.industry || 'General'}</div>
                  <div className="text-xs text-gray-500 mt-2">{a.created_at ? formatDateTime(a.created_at) : ''}</div>
                </div>
                <div
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    String(a.status || '').toLowerCase() === 'failed'
                      ? 'text-red-700 border-red-200 bg-red-50'
                      : 'text-green-700 border-green-200 bg-green-50'
                  }`}
                >
                  {a.status || 'Success'}
                </div>
              </div>
              {a.website ? <div className="text-sm text-gray-600 mt-2 break-all">{a.website}</div> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-gray-600">No audits found yet.</div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-3">
          <button
            className="btn-secondary py-3 px-6 rounded-xl"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn-secondary py-3 px-6 rounded-xl"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </PageShell>
  );
}

