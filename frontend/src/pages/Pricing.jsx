import React from 'react';
import PageShell from '../components/PageShell';
import { CheckCircle2, Star, Lock } from 'lucide-react';
import { navigate } from '../utils/router';
import { setSelectedPlan } from '../utils/storage';
import { useAuth } from '../utils/useAuth';

const tiers = [
  {
    name: 'Starter (Free Tier)',
    price: '$0',
    note: 'Perfect for exploring AI-powered audits',
    description: 'Experience the full capability of autonomous deep web research and automated outreach draft generation for individual prospects.',
    items: [
      '3 Complimentary Company Analyses',
      'AI-Powered Deep Web Research & Tech Stack Discovery',
      'Automated Cold Email Copywriting (Value-First)',
      'Basic Client-Ready Audit Report PDF Export',
      'Standard Execution Speed & Community Support'
    ],
    cta: 'Your Current Plan',
  },
  {
    name: 'Agency Pro',
    price: '$49/mo',
    note: 'For growth-driven consultants & solo agencies',
    description: 'Unlock unlimited scale with batch processing, agency white-labeling, and priority AI model routing for blazing fast audits.',
    items: [
      'Unlimited Company Analyses & Lead Generation',
      'Bulk CSV List Processing (Run 50+ companies at once)',
      'Custom Agency Branding on all PDF Audit Reports',
      'Direct SMTP Integration for 1-Click Cold Email Sending',
      'Priority Speed AI Engine Routing (Groq Llama-3.1 70B)',
      'Dedicated 24/7 Email Support & Template Saving'
    ],
    highlight: true,
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Enterprise Team',
    price: '$129/mo',
    note: 'For sales teams & outbound marketing agencies',
    description: 'Full team collaboration, centralized billing, and custom API webhook access to integrate into your existing CRM workflows.',
    items: [
      'Everything in Agency Pro + 5 Team Member Seats',
      'Shared Agency Outreach Profiles & Email Templates',
      'Advanced Team Quota & Conversion Analytics Dashboard',
      'Custom API & CRM Webhook Integration Support',
      '1-on-1 Onboarding Session & Dedicated Account Manager'
    ],
    cta: 'Upgrade to Team',
  },
];

export default function Pricing() {
  const auth = useAuth();
  const isLoggedIn = Boolean(auth?.accessToken);

  if (!isLoggedIn) {
    return (
      <PageShell title="Members-Only Pricing" subtitle="Exclusive plans and customized quotas for registered users.">
        <div className="max-w-lg mx-auto glass-card rounded-3xl p-8 sm:p-12 text-center border border-white/40 shadow-2xl bg-white/50 backdrop-blur-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Members-Only Access</h2>
          <p className="text-gray-600 mb-8 text-base leading-relaxed">
            To view our customized pricing tiers, agency white-label options, and enterprise quotas, please log into your account or start for free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary py-4 px-8 text-base rounded-xl font-bold shadow-lg shadow-blue-600/30" onClick={() => navigate('/login')}>
              Log in to view pricing
            </button>
            <button className="btn-secondary py-4 px-8 text-base rounded-xl font-bold" onClick={() => navigate('/get-started')}>
              Create free account
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Transparent Pricing & Deliverables" subtitle="Simple, predictable plans designed to scale your outbound lead generation pipeline.">
      <div className="grid lg:grid-cols-3 gap-8">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={[
              'glass-card rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1',
              t.highlight ? 'border-blue-500 shadow-2xl bg-gradient-to-b from-white/90 to-blue-50/50' : 'border-white/40 bg-white/60',
            ].join(' ')}
          >
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-2xl font-extrabold text-gray-900">{t.name}</h3>
                {t.highlight ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-blue-600 text-white shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    Most Popular
                  </span>
                ) : null}
              </div>

              <div className="my-6">
                <div className="text-5xl font-extrabold gradient-text tracking-tight">{t.price}</div>
                <div className="text-sm font-semibold text-blue-600/80 mt-1">{t.note}</div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-8 pb-6 border-b border-gray-200/60">
                {t.description}
              </p>

              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">What's Included</div>
              <ul className="space-y-3.5 text-gray-700 text-sm font-medium">
                {t.items.map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className={t.highlight ? 'btn-primary w-full mt-10 py-4 rounded-xl text-base font-bold shadow-xl shadow-blue-600/20' : 'btn-secondary w-full mt-10 py-4 rounded-xl text-base font-bold'}
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
