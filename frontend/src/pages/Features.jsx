import React from 'react';
import PageShell from '../components/PageShell';
import { Zap, Target, Users, Shield, FileText, Sparkles } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'AI-Powered Research', desc: 'Instant company + tech stack signals to personalize outreach.' },
  { icon: FileText, title: 'Technical Audit PDFs', desc: 'Generate client-ready reports with clear action items.' },
  { icon: Target, title: 'High-Intent Emails', desc: 'Value-first emails tailored to each lead’s context.' },
  { icon: Users, title: 'Bulk Processing', desc: 'Run batches for lists and campaigns in one go.' },
  { icon: Shield, title: 'Data Safety', desc: 'Local JSON storage for auth data in the browser.' },
  { icon: Zap, title: 'Fast Workflows', desc: 'From lead → audit → email in minutes, not hours.' },
];

export default function Features() {
  return (
    <PageShell
      title="Features"
      subtitle="Everything you need to turn cold outreach into value-driven conversations."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f.title} className="p-6 rounded-2xl bg-white/60 border border-white/40">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4">
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{f.title}</h3>
            <p className="text-gray-600 mt-2">{f.desc}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

