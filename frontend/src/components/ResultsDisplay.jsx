import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Mail, Database, Copy, Download, 
  CheckCircle, AlertCircle, TrendingUp, Target,
  ExternalLink, Users, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadPDF } from '../services/api';
import EmailModal from './EmailModal';

const ResultsDisplay = ({ results, companyName, agencyName }) => {
  const [activeTab, setActiveTab] = useState('audit');
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('📋 Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      await downloadPDF(results, agencyName);
      toast.success('📄 PDF downloaded successfully!');
    } catch (error) {
      toast.error('PDF download failed: ' + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const parseEmail = (emailStr) => {
    if (!emailStr) return { subject: '', body: '' };
    const lines = emailStr.split('\n');
    let subject = '';
    let bodyStart = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().startsWith('subject:')) {
        subject = lines[i].substring(8).trim();
        bodyStart = i + 1;
        break;
      }
    }
    
    const body = lines.slice(bodyStart).join('\n').trim();
    return { subject, body };
  };

  const emailParts = parseEmail(results.email);

  const tabs = [
    { id: 'audit', label: 'Audit Report', icon: FileText },
    { id: 'email', label: 'Email Draft', icon: Mail },
    { id: 'raw', label: 'Raw Data', icon: Database }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-8 shadow-2xl border border-white/50"
    >
      {/* Success Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">✨ Analysis Complete!</h3>
            <p className="text-gray-500">Results for <span className="font-semibold">{companyName}</span></p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg"
          >
            <Send className="w-5 h-5" />
            <span>Direct Outreach</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-secondary flex items-center gap-2"
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>PDF Audit</span>
          </button>
        </div>
      </div>

      {/* Decision Maker Info (if available) */}
      <div className="flex flex-wrap gap-3 mb-6">
        {results.decision_maker && results.decision_maker !== 'Decision Maker' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-purple-50 rounded-xl px-4 py-2 border border-purple-100 flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700">Lead: {results.decision_maker}</span>
          </motion.div>
        )}
        {results.lead_email && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-100 flex items-center gap-2"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700">{results.lead_email}</span>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }
            `}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'audit' && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h4 className="text-xl font-bold text-gray-900">Technical Audit</h4>
              </div>
              <div className="space-y-4">
                {results.audit_summary?.split('•').filter(t => t.trim()).map((text, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-2 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{text.trim()}</p>
                  </div>
                )) || <p className="text-gray-500 italic">No audit data available</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-gray-900">Strategy</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {results.proposed_solution}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-900">ROI Impact</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {results.business_value}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-100 shadow-inner">
               <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">RE</div>
                  <span className="text-sm font-bold text-gray-800">{emailParts.subject || 'Subject'}</span>
                </div>
                <Mail className="w-5 h-5 text-gray-300" />
              </div>
              <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans text-sm italic">
                {emailParts.body || results.email || 'No email content generated'}
              </pre>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-4"
              >
                <Send className="w-5 h-5" />
                Send Direct Email
              </button>
              <button
                onClick={() => copyToClipboard(results.email || '')}
                className="btn-secondary flex items-center justify-center gap-2 py-4"
              >
                <Copy className="w-5 h-5" />
                Copy Draft
              </button>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="bg-gray-900 rounded-2xl p-6 shadow-inner">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
              <span className="text-blue-400 font-mono text-xs">JSON DATA</span>
              <button onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}>
                <Copy className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            </div>
            <pre className="text-blue-300 text-xs font-mono overflow-x-auto max-h-[400px]">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>

      {/* Email Modal */}
      <EmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialRecipient={results.lead_email || results.company_email || ''}
        initialSubject={emailParts.subject}
        initialBody={emailParts.body || results.email}
        companyName={companyName}
      />
    </motion.div>
  );
};

export default ResultsDisplay;