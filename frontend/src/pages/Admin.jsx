import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { navigate } from '../utils/router';
import { clearAuth, getAuth } from '../utils/storage';
import { fetchAdminAudits, fetchAdminOverview, fetchAdminUsers } from '../services/api';

function Admin() {
  const isLoggedIn = Boolean(getAuth()?.accessToken);
  const [tab, setTab] = useState('users');
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  const [auditQuery, setAuditQuery] = useState('');
  const [auditsPage, setAuditsPage] = useState(1);
  const [audits, setAudits] = useState([]);
  const [auditsTotal, setAuditsTotal] = useState(0);
  const [auditsLoading, setAuditsLoading] = useState(false);

  const usersPages = useMemo(() => Math.max(1, Math.ceil((usersTotal || 0) / 25)), [usersTotal]);
  const auditsPages = useMemo(() => Math.max(1, Math.ceil((auditsTotal || 0) / 25)), [auditsTotal]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    setLoadingOverview(true);
    fetchAdminOverview()
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err?.message || 'Admin access denied');
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingOverview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || tab !== 'users') return;
    let cancelled = false;
    setUsersLoading(true);
    fetchAdminUsers({ page: usersPage, pageSize: 25, q: userQuery })
      .then((data) => {
        if (cancelled) return;
        setUsers(Array.isArray(data?.items) ? data.items : []);
        setUsersTotal(Number(data?.total || 0));
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err?.message || 'Failed to load users');
      })
      .finally(() => {
        if (cancelled) return;
        setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, tab, usersPage, userQuery]);

  useEffect(() => {
    if (!isLoggedIn || tab !== 'audits') return;
    let cancelled = false;
    setAuditsLoading(true);
    fetchAdminAudits({ page: auditsPage, pageSize: 25, q: auditQuery })
      .then((data) => {
        if (cancelled) return;
        setAudits(Array.isArray(data?.items) ? data.items : []);
        setAuditsTotal(Number(data?.total || 0));
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err?.message || 'Failed to load audits');
      })
      .finally(() => {
        if (cancelled) return;
        setAuditsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, tab, auditsPage, auditQuery]);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">Admin</div>
            <div className="text-gray-600 text-sm">Please log in to continue.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-secondary" onClick={() => navigate('/')}>Home</button>
            <button className="btn-primary" onClick={() => navigate('/login')}>Log in</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-6 border border-white/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">Admin Dashboard</div>
            <div className="text-gray-600 text-sm mt-1">
              {loadingOverview ? 'Loading overview…' : overview?.admin?.email ? `Signed in as ${overview.admin.email}` : ' '}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/70 border border-white/60">
                <div className="text-xs font-semibold text-gray-500">Users</div>
                <div className="text-lg font-extrabold text-gray-900">{overview?.totals?.users ?? '—'}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/70 border border-white/60">
                <div className="text-xs font-semibold text-gray-500">Audits</div>
                <div className="text-lg font-extrabold text-gray-900">{overview?.totals?.audits ?? '—'}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-secondary" onClick={() => navigate('/')}>Home</button>
            <button
              className="btn-secondary"
              onClick={() => {
                clearAuth();
                toast.success('Logged out');
                navigate('/');
              }}
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mt-6 glass-card rounded-2xl border border-white/40 overflow-hidden">
          <div className="p-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-xl font-semibold ${tab === 'users' ? 'bg-gray-900 text-white' : 'bg-white/70 text-gray-700 border border-white/60'}`}
                onClick={() => setTab('users')}
              >
                Users
              </button>
              <button
                className={`px-4 py-2 rounded-xl font-semibold ${tab === 'audits' ? 'bg-gray-900 text-white' : 'bg-white/70 text-gray-700 border border-white/60'}`}
                onClick={() => setTab('audits')}
              >
                Audits
              </button>
            </div>

            {tab === 'users' ? (
              <div className="flex gap-2 items-center">
                <input
                  value={userQuery}
                  onChange={(e) => {
                    setUsersPage(1);
                    setUserQuery(e.target.value);
                  }}
                  placeholder="Search name or email"
                  className="px-4 py-2 rounded-xl border border-white/60 bg-white/70 outline-none w-72 max-w-full"
                />
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  value={auditQuery}
                  onChange={(e) => {
                    setAuditsPage(1);
                    setAuditQuery(e.target.value);
                  }}
                  placeholder="Search company or email"
                  className="px-4 py-2 rounded-xl border border-white/60 bg-white/70 outline-none w-72 max-w-full"
                />
              </div>
            )}
          </div>

          {tab === 'users' ? (
            <div className="p-4">
              <div className="text-sm text-gray-600 mb-3">
                {usersLoading ? 'Loading users…' : `${usersTotal} total users`}
              </div>
              <div className="grid gap-3 md:hidden">
                {users.map((u) => (
                  <div key={u.id} className="rounded-2xl bg-white/70 border border-white/60 p-4">
                    <div className="font-extrabold text-gray-900">{u.full_name || '—'}</div>
                    <div className="text-sm text-gray-700 mt-1">{u.email}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Agency: <span className="font-semibold text-gray-800">{u.agency_name || '—'}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Audits: <span className="font-semibold text-gray-800">{u.audit_count ?? 0}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}
                    </div>
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
                {!usersLoading && users.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No users found.</div>
                ) : null}
              </div>

              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-semibold">Name</th>
                      <th className="py-2 pr-4 font-semibold">Email</th>
                      <th className="py-2 pr-4 font-semibold">Agency</th>
                      <th className="py-2 pr-4 font-semibold">Audits</th>
                      <th className="py-2 pr-4 font-semibold">Created</th>
                      <th className="py-2 pr-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-white/60">
                        <td className="py-3 pr-4 font-semibold text-gray-900">{u.full_name || '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{u.email}</td>
                        <td className="py-3 pr-4 text-gray-700">{u.agency_name || '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{u.audit_count ?? 0}</td>
                        <td className="py-3 pr-4 text-gray-700">{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                        <td className="py-3 pr-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!usersLoading && users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">No users found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button className="btn-secondary" disabled={usersPage <= 1} onClick={() => setUsersPage((p) => Math.max(1, p - 1))}>
                  Previous
                </button>
                <div className="text-sm text-gray-600">Page {usersPage} of {usersPages}</div>
                <button className="btn-secondary" disabled={usersPage >= usersPages} onClick={() => setUsersPage((p) => Math.min(usersPages, p + 1))}>
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-sm text-gray-600 mb-3">
                {auditsLoading ? 'Loading audits…' : `${auditsTotal} total audits`}
              </div>
              <div className="grid gap-3 md:hidden">
                {audits.map((a) => (
                  <div key={a.id} className="rounded-2xl bg-white/70 border border-white/60 p-4">
                    <div className="font-extrabold text-gray-900">{a.company_name || '—'}</div>
                    <div className="text-sm text-gray-700 mt-1">{a.industry || 'General'}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      User: <span className="font-semibold text-gray-800">{a.user?.email || '—'}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Status: <span className="font-semibold text-gray-800">{a.status || '—'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                    </div>
                  </div>
                ))}
                {!auditsLoading && audits.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No audits found.</div>
                ) : null}
              </div>

              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-semibold">Company</th>
                      <th className="py-2 pr-4 font-semibold">Industry</th>
                      <th className="py-2 pr-4 font-semibold">User</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((a) => (
                      <tr key={a.id} className="border-t border-white/60">
                        <td className="py-3 pr-4 font-semibold text-gray-900">{a.company_name || '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{a.industry || 'General'}</td>
                        <td className="py-3 pr-4 text-gray-700">{a.user?.email || '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{a.status || '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                    {!auditsLoading && audits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No audits found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button className="btn-secondary" disabled={auditsPage <= 1} onClick={() => setAuditsPage((p) => Math.max(1, p - 1))}>
                  Previous
                </button>
                <div className="text-sm text-gray-600">Page {auditsPage} of {auditsPages}</div>
                <button className="btn-secondary" disabled={auditsPage >= auditsPages} onClick={() => setAuditsPage((p) => Math.min(auditsPages, p + 1))}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
