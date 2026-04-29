import React from 'react';
import PageShell from '../components/PageShell';
import { CheckCircle2, Star } from 'lucide-react';
import { navigate } from '../utils/router';
import { setSelectedPlan } from '../utils/storage';

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    note: 'Perfect for trying it out',
    items: ['Single analysis', 'Email draft', 'Basic report export'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$49/mo',
    note: 'For solo agencies',
    items: ['Bulk processing', 'PDF exports', 'Saved templates', 'Priority speed'],
    highlight: true,
    cta: 'Choose Pro',
  },
  {
    name: 'Team',
    price: '$129/mo',
    note: 'For teams & pipelines',
    items: ['Team seats', 'Shared settings', 'Usage analytics', 'Support'],
    cta: 'Choose Team',
  },
];

export default function Pricing() {
  return (
    <PageShell title="Pricing" subtitle="Simple plans that scale with your outreach.">
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={[
              'glass-card rounded-2xl p-6 border',
              t.highlight ? 'border-blue-400 shadow-2xl' : 'border-white/40',
            ].join(' ')}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-extrabold text-gray-900">{t.name}</h3>
              {t.highlight ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  <Star className="w-3.5 h-3.5" />
                  Most Popular
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="text-4xl font-extrabold gradient-text">{t.price}</div>
              <div className="text-gray-600 mt-1">{t.note}</div>
            </div>

            <ul className="mt-6 space-y-3 text-gray-700">
              {t.items.map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={t.highlight ? 'btn-primary w-full mt-7 py-3 rounded-xl' : 'btn-secondary w-full mt-7 py-3 rounded-xl'}
              onClick={() => {
                setSelectedPlan({ name: t.name, price: t.price, note: t.note, items: t.items });
                navigate('/payment');
              }}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

