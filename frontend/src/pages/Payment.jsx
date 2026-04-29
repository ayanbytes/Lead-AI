import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import { getSelectedPlan, clearSelectedPlan } from '../utils/storage';
import { navigate } from '../utils/router';

function formatAmount(amount) {
  if (!amount) return '';
  return amount;
}

export default function Payment() {
  const plan = useMemo(() => getSelectedPlan(), []);
  const [processing, setProcessing] = useState(false);

  const onPay = async () => {
    setProcessing(true);
    try {
      // Placeholder for payment gateway integration (Stripe/Razorpay).
      await new Promise((r) => setTimeout(r, 900));
      toast.success('Payment flow placeholder: integrate Stripe/Razorpay next.');
    } finally {
      setProcessing(false);
    }
  };

  if (!plan) {
    return (
      <PageShell title="Payment" subtitle="Choose a plan to continue.">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-gray-700">No plan selected.</div>
          <button className="btn-primary py-3 px-6 rounded-xl" onClick={() => navigate('/pricing')}>
            Go to Pricing
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Payment" subtitle="Review your plan and proceed securely.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/40">
          <div className="text-lg font-extrabold text-gray-900">Card details</div>
          <div className="text-gray-600 mt-1">Connect a payment provider to enable real payments.</div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Card number</label>
              <input className="input-field mt-2" placeholder="1234 1234 1234 1234" disabled />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Expiry</label>
                <input className="input-field mt-2" placeholder="MM/YY" disabled />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">CVV</label>
                <input className="input-field mt-2" placeholder="123" disabled />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Name on card</label>
              <input className="input-field mt-2" placeholder="Full name" disabled />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="btn-primary py-3 px-6 rounded-xl" disabled={processing} onClick={onPay}>
                {processing ? 'Processing…' : 'Proceed to pay'}
              </button>
              <button
                className="btn-secondary py-3 px-6 rounded-xl"
                disabled={processing}
                onClick={() => {
                  clearSelectedPlan();
                  navigate('/pricing');
                }}
              >
                Change plan
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/40">
          <div className="text-sm font-semibold text-gray-500">Order summary</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{plan.name}</div>
          <div className="text-gray-600 mt-1">{plan.note}</div>

          <div className="mt-6 rounded-2xl bg-white/60 border border-white/40 p-5">
            <div className="flex items-center justify-between">
              <div className="text-gray-700 font-semibold">Price</div>
              <div className="text-gray-900 font-extrabold">{formatAmount(plan.price)}</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Taxes and discounts depend on your payment provider setup.</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

