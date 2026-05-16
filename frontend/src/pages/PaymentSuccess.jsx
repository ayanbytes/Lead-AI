import React, { useEffect } from 'react';
import PageShell from '../components/PageShell';
import { navigate } from '../utils/router';

export default function PaymentSuccess() {
  useEffect(() => {
    // Optionally we could fetch session_id from URL and verify,
    // but for now we just show a success message.
    setTimeout(() => {
      navigate('/app');
    }, 4000);
  }, []);

  return (
    <PageShell title="Payment Successful" subtitle="Thank you for your purchase!">
      <div className="glass-card rounded-2xl p-6 border border-white/40 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
        <p className="text-gray-600 mb-6">Your payment was successful and your account has been upgraded.</p>
        <button className="btn-primary py-3 px-6 rounded-xl" onClick={() => navigate('/app')}>
          Go to Dashboard
        </button>
      </div>
    </PageShell>
  );
}
