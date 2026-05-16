import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import { getSelectedPlan, clearSelectedPlan } from '../utils/storage';
import { navigate } from '../utils/router';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/api';

function formatAmount(amount) {
  if (!amount) return '';
  return amount;
}

export default function Payment() {
  const plan = useMemo(() => getSelectedPlan(), []);
  const [processing, setProcessing] = useState(false);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
      
      // Fallback timeout in case the script is blocked and doesn't fire onerror
      setTimeout(() => {
        if (!window.Razorpay) resolve(false);
      }, 10000);
    });
  };

  const onPay = async () => {
    setProcessing(true);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setProcessing(false);
        return;
      }

      const order = await createRazorpayOrder({
        planName: plan.name,
        price: plan.price
      });

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Lead-AI',
        description: `${plan.name} Plan`,
        order_id: order.order_id,
        handler: async function (response) {
          try {
            await verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_name: plan.name
            });
            navigate('/payment/success');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: '', 
          email: '',
        },
        theme: {
          color: '#2563EB' // blue-600
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp1.open();

    } catch (err) {
      toast.error('Payment failed: ' + err.message);
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
          <div className="text-lg font-extrabold text-gray-900">Payment details</div>
          <div className="text-gray-600 mt-1">Click the button below to pay securely via Razorpay.</div>

          <div className="mt-6 grid gap-4">
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="btn-primary py-3 px-6 rounded-xl" disabled={processing} onClick={onPay}>
                {processing ? 'Processing…' : 'Pay with Razorpay'}
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
