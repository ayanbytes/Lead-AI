import React, { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { navigate } from '../utils/router';
import { fetchAudits, deleteAudit } from '../services/api';

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

  const loadAudits = (currentPage) => {
    setLoading(true);
    setError('');
    fetchAudits({ page: currentPage, pageSize })
      .then((res) => {
        setData(res || { items: [], total: 0, page: currentPage, page_size: pageSize });
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load audits');
        setData({ items: [], total: 0, page: currentPage, page_size: pageSize });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAudits(page);
  }, [page, pageSize]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent navigation
    if (!window.confirm('Are you sure you want to delete this audit?')) return;

    try {
      await deleteAudit(id);
      // If we are on the last item of a page (not the first page), go back one page
      if (data.items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadAudits(page);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete audit');
    }
  };

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

      {loading && !data.items.length ? (
        <div className="text-gray-600">Loading audits…</div>
      ) : data.items?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/audit/${a.id}`)}
              className="group relative text-left glass-card rounded-2xl p-5 border border-white/40 hover:bg-white/80 transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-gray-900 truncate">{a.company_name || 'Company'}</div>
                  <div className="text-sm text-gray-600 mt-1">{a.industry || 'General'}</div>
                  <div className="text-xs text-gray-500 mt-2">{a.created_at ? formatDateTime(a.created_at) : ''}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                      String(a.status || '').toLowerCase() === 'failed'
                        ? 'text-red-700 border-red-200 bg-red-50'
                        : 'text-green-700 border-green-200 bg-green-50'
                    }`}
                  >
                    {a.status || 'Success'}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, a.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete audit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {a.website ? <div className="text-sm text-gray-600 mt-2 break-all line-clamp-1">{a.website}</div> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-gray-600">No audits found yet.</div>
      )}

      {totalPages > 1 && (
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
      )}
    </PageShell>
  );
}

