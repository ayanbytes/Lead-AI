import React, { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import { getAuth, setAuth } from '../utils/storage';
import { navigate } from '../utils/router';
import { loginAccount } from '../services/api';

export default function Login() {
  useEffect(() => {
    if (getAuth()?.accessToken) navigate('/app');
  }, []);

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');

    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError('Password is too long (max 72 bytes).');
      return;
    }

    loginAccount({ email, password })
      .then((data) => {
        setAuth({
          accessToken: data.access_token,
          user: data.user,
          createdAt: new Date().toISOString(),
        });
        navigate('/app');
      })
      .catch((err) => setError(err.message || 'Login failed'));
  };

  return (
    <PageShell title="Login" subtitle="Welcome back.">
      <form onSubmit={onSubmit} className="max-w-xl">
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <input
              value={form.email}
              onChange={onChange('email')}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@company.com"
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <input
              value={form.password}
              onChange={onChange('password')}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Your password"
              type="password"
            />
          </div>

          {error ? <div className="text-red-600 font-medium">{error}</div> : null}

          <button type="submit" className="btn-primary w-fit">
            Log in
          </button>

          <div className="text-gray-600">
            New here?{' '}
            <button type="button" className="text-blue-700 font-semibold hover:underline" onClick={() => navigate('/start-trial')}>
              Create an account
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
