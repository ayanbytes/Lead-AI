import React from 'react';
import PageShell from '../components/PageShell';
import { Zap, Target, Users, Shield, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

const features = [
  { 
    icon: Sparkles, 
    title: 'Autonomous Deep Web Intelligence', 
    desc: 'Our AI agent scours search engines, company websites, and public directories to instantly extract tech stack signals, pain points, and target audience data.',
    practicalUse: 'Instantly uncover why a prospect’s current setup is failing before you even send the first email.'
  },
  { 
    icon: FileText, 
    title: 'White-Label Technical Audit Reports', 
    desc: 'Generate stunning, professional PDF audit reports customized with your agency’s name, logo, and brand aesthetic in a single click.',
    practicalUse: 'Attach a customized, high-value technical audit PDF to your cold email to instantly establish unquestionable authority.'
  },
  { 
    icon: Target, 
    title: 'Hyper-Personalized Cold Outreach', 
    desc: 'Leverage Groq Llama-3 LLM models to draft highly converting, value-first emails tailored precisely to each prospect’s specific tech stack and industry challenges.',
    practicalUse: 'Achieve 3x higher reply rates by pitching exact solutions to verified client problems rather than generic templates.'
  },
  { 
    icon: Users, 
    title: 'Automated Bulk CSV List Scraper', 
    desc: 'Upload standard CSV lists of target companies and let the backend autonomously process dozens of audits and email drafts in the background.',
    practicalUse: 'Scale your outbound lead generation campaigns without spending hours on manual research.'
  },
  { 
    icon: Zap, 
    title: 'Direct SMTP One-Click Sending', 
    desc: 'Securely connect your own Google or custom SMTP credentials to dispatch personalized outreach emails directly from within the dashboard.',
    practicalUse: 'Streamline your sales workflow—no need to copy-paste email copy between tabs or external email clients.'
  },
  { 
    icon: Shield, 
    title: 'Enterprise-Grade Security & Verification', 
    desc: 'All user credentials and SMTP tokens are encrypted. Payments are securely processed and instantly verified through Razorpay’s banking gateway.',
    practicalUse: 'Operate with complete peace of mind knowing client data and payment transactions are fully protected.'
  },
];

export default function Features() {
  return (
    <PageShell
      title="High-Converting Features for Practical Outbound"
      subtitle="Designed from the ground up for agencies, SDRs, and consultants who need actionable intelligence and seamless workflow automation."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <div key={f.title} className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:bg-white/90">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-6">{f.desc}</p>
            </div>
            
            <div className="mt-auto p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Practical Application</span>
              </div>
              <p className="text-xs text-gray-700 font-medium leading-normal">{f.practicalUse}</p>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
