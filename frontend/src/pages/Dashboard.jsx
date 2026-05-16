import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell';
import { getAuth, setAuth, clearAuth } from '../utils/storage';
import { navigate } from '../utils/router';
import { BarChart3, CheckCircle2, Clock, FileText, Rocket, ShieldCheck, UploadCloud, User2, Sparkles } from 'lucide-react';
import { fetchRecentAudits, fetchMe } from '../services/api';

function initialsFromName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || 'U';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase();
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

const Card = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="glass-card rounded-2xl p-6 border border-white/40">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <Icon className="w-11 h-8 text-white" />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{title}</div>
          <div className="text-gray-600 mt-1">{description}</div>
        </div>
      </div>
      {actionLabel ? (
        <button type="button" className="btn-secondary py-3 px-5 rounded-xl" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  </div>
);

export default function Dashboard() {
  const auth = getAuth();
  const user = auth?.user || null;
  const createdAt = auth?.createdAt || null;
  const [audits, setAudits] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [auditsError, setAuditsError] = useState('');

  const avatarText = useMemo(() => initialsFromName(user?.full_name || user?.email || ''), [user]);
  const uniqueCompanies = useMemo(() => new Set(audits.map((a) => (a.company_name || '').trim()).filter(Boolean)).size, [audits]);

  useEffect(() => {
    let cancelled = false;
    setAuditsLoading(true);
    setAuditsError('');

    fetchRecentAudits(10)
      .then((rows) => {
        if (cancelled) return;
        setAudits(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setAuditsError(err?.message || 'Failed to load audits');
        setAudits([]);
      })
      .finally(() => {
        if (cancelled) return;
        setAuditsLoading(false);
      });

    // Background sync user token quota
    if (auth?.accessToken) {
      fetchMe()
        .then((updatedUser) => {
          if (cancelled) return;
          const current = getAuth();
          if (current && updatedUser) {
            setAuth({ ...current, user: updatedUser });
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const openAudit = (auditId) => navigate(`/audit/${auditId}`);

  return (
    <PageShell title="Dashboard" subtitle="Everything you need to run audits and outreach in one place.">
      <div className="grid gap-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-card rounded-2xl p-6 border border-white/40"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-xl shadow-blue-200">
                <span className="text-white font-extrabold text-xl">{avatarText}</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-xl font-extrabold text-gray-900">
                    {user?.full_name ? `Welcome, ${user.full_name}` : 'Welcome back'}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    {user?.plan_type || 'Starter'}
                  </span>
                </div>
                <div className="text-gray-600 mt-0.5">
                  {user?.email ? user.email : 'Signed in'} {createdAt ? `• Signed in: ${formatDateTime(createdAt)}` : ''}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary py-3 px-6 rounded-xl" onClick={() => navigate('/')}>
                Go to Analyses
              </button>
              <button
                type="button"
                className="btn-secondary py-3 px-6 rounded-xl"
                onClick={() => {
                  clearAuth();
                  navigate('/login');
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-500">Quick actions</div>
            <div className="text-lg font-extrabold text-gray-900">Start work faster</div>
          </div>
          <button type="button" className="text-blue-700 font-semibold hover:underline" onClick={() => navigate('/')}>
            Open workspace
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            icon={Rocket}
            title="Run a new audit"
            description="Generate a technical audit and value-driven outreach email in minutes."
            actionLabel="Start"
            onAction={() => navigate('/')}
          />
          <Card
            icon={UploadCloud}
            title="Bulk processing"
            description="Upload a CSV and process multiple accounts with consistent, professional outputs."
            actionLabel="Upload"
            onAction={() => navigate('/')}
          />
          <Card
            icon={FileText}
            title="Reports & exports"
            description="Download PDFs and CSV exports for sharing with your team or clients."
            actionLabel="View"
            onAction={() => navigate('/')}
          />
          <Card
            icon={ShieldCheck}
            title="Workspace ready"
            description="Your account is set up and ready to use across audits, exports, and bulk processing."
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-white/40">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-700" />
              <div className="font-bold text-gray-900">Overview</div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Audits run</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">{auditsLoading ? '—' : String(audits.length)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Exports</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">—</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Companies processed</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">{auditsLoading ? '—' : String(uniqueCompanies)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">Active</div>
              </div>
            </div>
            <div className="mt-4 text-gray-500 text-sm">
              Activity will appear here once audit history is enabled.
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/40 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <User2 className="w-5 h-5 text-blue-700" />
                <div className="font-bold text-gray-900">Account</div>
              </div>
              <button type="button" className="text-blue-700 font-semibold hover:underline" onClick={() => navigate('/audits')}>
                Manage
              </button>
            </div>

            <div className="mt-5 grid md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Plan & Tokens</div>
                <div className="mt-1 font-extrabold text-gray-900">
                  {user?.plan_type || 'Starter'} ({user?.tokens_used ?? 0}/{user?.tokens_limit ?? 3})
                </div>
                {(user?.plan_type || 'Starter').toLowerCase() === 'starter' && (
                  <button className="text-xs text-blue-700 font-bold hover:underline mt-1 block" onClick={() => navigate('/pricing')}>
                    Upgrade to unlimited →
                  </button>
                )}
              </div>
              <div className="p-5 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">User ID</div>
                <div className="mt-1 font-extrabold text-gray-900 break-all">{user?.id ?? '—'}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Email</div>
                <div className="mt-1 font-extrabold text-gray-900 break-all">{user?.email ?? '—'}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/60 border border-white/40">
                <div className="text-sm text-gray-600">Session</div>
                <div className="mt-1 font-extrabold text-gray-900">{auth?.accessToken ? 'Active' : '—'}</div>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/60 border border-white/40">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Getting started
                </div>
                <div className="mt-3 grid gap-2 text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">•</span>
                    <span>Open the workspace and run your first audit.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">•</span>
                    <span>Download a PDF report to share with a client.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">•</span>
                    <span>Use bulk processing for lists of companies.</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/60 border border-white/40">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <Clock className="w-5 h-5 text-blue-700" />
                  Recent activity
                </div>
                {auditsLoading ? (
                  <div className="mt-3 text-gray-600">Loading your recent audits…</div>
                ) : auditsError ? (
                  <div className="mt-3 text-red-600 font-medium">{auditsError}</div>
                ) : audits.length === 0 ? (
                  <div className="mt-3 text-gray-600">No audits yet. Run your first audit to see activity here.</div>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {audits.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => openAudit(a.id)}
                        className="text-left p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-extrabold text-gray-900">{a.company_name || 'Company'}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {(a.industry || 'General')}
                              {a.created_at ? ` • ${new Date(a.created_at).toLocaleString()}` : ''}
                            </div>
                          </div>
                          <div
                            className={`text-xs font-extrabold px-3 py-1 rounded-full border ${String(a.status || '').toLowerCase() === 'failed'
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
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
