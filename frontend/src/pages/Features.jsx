import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { Zap, Target, Users, Shield, FileText, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { navigate } from '../utils/router';

const features = [
  { 
    icon: Sparkles, 
    title: 'Autonomous Deep Web Intelligence', 
    desc: 'Our AI agent scours search engines, company websites, and public directories to instantly extract tech stack signals, pain points, and target audience data.',
    practicalUse: 'Instantly uncover why a prospect’s current setup is failing before you even send the first email.',
    btnLabel: 'Try Single Analysis',
    btnAction: () => navigate('/?tab=single')
  },
  { 
    icon: FileText, 
    title: 'White-Label Technical Audit Reports', 
    desc: 'Generate stunning, professional PDF audit reports customized with your agency’s name, logo, and brand aesthetic in a single click.',
    practicalUse: 'Attach a customized, high-value technical audit PDF to your cold email to instantly establish unquestionable authority.',
    btnLabel: 'Generate PDF Report',
    btnAction: () => navigate('/?tab=single')
  },
  { 
    icon: Target, 
    title: 'Hyper-Personalized Cold Outreach', 
    desc: 'Leverage Groq Llama-3 LLM models to draft highly converting, value-first emails tailored precisely to each prospect’s specific tech stack and industry challenges.',
    practicalUse: 'Achieve 3x higher reply rates by pitching exact solutions to verified client problems rather than generic templates.',
    btnLabel: 'Lead Discovery Tool',
    btnAction: () => navigate('/?tab=discovery')
  },
  { 
    icon: Users, 
    title: 'Automated Bulk CSV List Scraper', 
    desc: 'Upload standard CSV lists of target companies and let the backend autonomously process dozens of audits and email drafts in the background.',
    practicalUse: 'Scale your outbound lead generation campaigns without spending hours on manual research.',
    btnLabel: 'Launch Bulk Scraper',
    btnAction: () => navigate('/?tab=bulk')
  },
  { 
    icon: Zap, 
    title: 'Direct SMTP One-Click Sending', 
    desc: 'Securely connect your own Google or custom SMTP credentials to dispatch personalized outreach emails directly from within the dashboard.',
    practicalUse: 'Streamline your sales workflow—no need to copy-paste email copy between tabs or external email clients.',
    btnLabel: 'Configure SMTP Settings',
    btnAction: () => navigate('/?tab=settings')
  },
  { 
    icon: Shield, 
    title: 'Enterprise-Grade Security & Verification', 
    desc: 'All user credentials and SMTP tokens are encrypted. Payments are securely processed and instantly verified through Razorpay’s banking gateway.',
    practicalUse: 'Operate with complete peace of mind knowing client data and payment transactions are fully protected.',
    btnLabel: 'View Unlimited Plans',
    btnAction: () => navigate('/pricing')
  },
];

export default function Features() {
  const [quickCompany, setQuickCompany] = useState('');

  const handleQuickStart = () => {
    if (quickCompany.trim()) {
      localStorage.setItem('quick_company', quickCompany.trim());
    }
    navigate('/?tab=single');
  };

  return (
    <PageShell
      title="High-Converting Features for Practical Outbound"
      subtitle="Designed from the ground up for agencies, SDRs, and consultants who need actionable intelligence and seamless workflow automation."
    >
      {/* Live AI Simulation Banner */}
      <div className="max-w-5xl mx-auto mb-20 glass-card rounded-3xl p-8 sm:p-12 border border-blue-500/30 bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-black/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none transform translate-x-12 -translate-y-12">
          <Sparkles className="w-80 h-80 text-blue-400" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-widest mb-6 inline-block shadow-inner">
            ⚡ Interactive AI Simulation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Test the AI Research Engine Live
          </h2>
          <p className="text-blue-100/80 mb-8 text-base sm:text-lg leading-relaxed font-medium">
            Enter any target prospect or domain below. We'll instantly set up your workspace to run an autonomous deep web technical audit and generate a high-converting cold email draft.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="e.g., Acme Logistics (acmelogistics.com)" 
              value={quickCompany} 
              onChange={(e) => setQuickCompany(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickStart()}
              className="flex-1 bg-white/90 backdrop-blur px-6 py-4 rounded-xl border-2 border-blue-400/40 text-gray-900 placeholder-gray-500 font-bold shadow-inner focus:outline-none focus:border-blue-500 transition-all text-base"
            />
            <button 
              onClick={handleQuickStart}
              className="btn-primary py-4 px-8 text-base rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:scale-105 transition-all duration-300"
            >
              <span>Analyze Prospect Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <div key={f.title} className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:bg-white/90 group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-6">{f.desc}</p>
            </div>
            
            <div className="space-y-4 mt-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Practical Application</span>
                </div>
                <p className="text-xs text-gray-700 font-medium leading-normal">{f.practicalUse}</p>
              </div>

              <button 
                type="button" 
                onClick={f.btnAction}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gray-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn"
              >
                <span>{f.btnLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
