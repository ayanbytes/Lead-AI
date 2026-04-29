import React, { useEffect } from 'react';
import PageShell from '../components/PageShell';
import { navigate } from '../utils/router';
import { getAuth } from '../utils/storage';

export default function GetStarted() {
  useEffect(() => {
    if (getAuth()?.accessToken) navigate('/app');
  }, []);

  return (
    <PageShell title="Get Started" subtitle="Choose an option to continue.">
      <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900">
        Want to try it first? You can run demo audits from the <button className="font-semibold hover:underline" onClick={() => navigate('/')}>Home</button> page without logging in.
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/60 border border-white/40">
          <h3 className="text-2xl font-bold text-gray-900">Start Free Trial</h3>
          <p className="text-gray-600 mt-2">Create an account and begin generating audits and emails.</p>
          <button className="btn-primary mt-6" onClick={() => navigate('/start-trial')}>
            Create Account
          </button>
        </div>
        <div className="p-6 rounded-2xl bg-white/60 border border-white/40">
          <h3 className="text-2xl font-bold text-gray-900">Login</h3>
          <p className="text-gray-600 mt-2">Already have an account? Log in to continue.</p>
          <button className="btn-secondary mt-6" onClick={() => navigate('/login')}>
            Log in
          </button>
        </div>
      </div>
    </PageShell>
  );
}
