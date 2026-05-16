import React from 'react';
import PageShell from '../components/PageShell';
import { navigate } from '../utils/router';

export default function PaymentCancel() {
  return (
    <PageShell title="Payment Cancelled" subtitle="Your payment was not completed.">
      <div className="glass-card rounded-2xl p-6 border border-white/40 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">You cancelled the checkout process. No charges were made.</p>
        <button className="btn-primary py-3 px-6 rounded-xl" onClick={() => navigate('/pricing')}>
          Back to Pricing
        </button>
      </div>
    </PageShell>
  );
}
