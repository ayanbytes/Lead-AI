import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Mail, Database, Copy, Download, 
  CheckCircle, AlertCircle, TrendingUp, Target,
  ExternalLink, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadPDF } from '../services/api';

const ResultsDisplay = ({ results, companyName, agencyName }) => {
  const [activeTab, setActiveTab] = useState('audit');
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const tabs = [
    { id: 'audit', label: 'Audit Report', icon: FileText },
    { id: 'email', label: 'Email Draft', icon: Mail },
    { id: 'raw', label: 'Raw Data', icon: Database }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-8"
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
            onClick={() => copyToClipboard(results.email || '')}
            className="btn-secondary flex items-center gap-2"
            disabled={copied}
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy Email</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-primary flex items-center gap-2"
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Decision Maker Info (if available) */}
      {results.decision_maker && results.decision_maker !== 'Decision Maker' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">Decision Maker Found:</span>
            <span className="text-purple-700 font-bold">{results.decision_maker}</span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'audit' && (
          <div className="space-y-8">
            {/* Audit Summary */}
            <div className="relative group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Technical Audit Report</h4>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <div className="space-y-4">
                  {results.audit_summary?.split('•').filter(t => t.trim()).map((text, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{text.trim()}</p>
                    </div>
                  )) || <p className="text-gray-500 italic">No audit data available</p>}
                </div>
              </div>
            </div>

            {/* Proposed Solution */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="relative group">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Strategic Solution</h4>
                </div>
                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 border border-green-100 rounded-2xl p-6 h-full">
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {results.proposed_solution || 'Strategic implementation plan pending...'}
                  </p>
                </div>
              </div>

              {/* Business Value */}
              <div className="relative group">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">ROI & Impact</h4>
                </div>
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100 rounded-2xl p-6 h-full">
                  <p className="text-gray-700 leading-relaxed">
                    {results.business_value || 'Projected business impact analysis pending...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Competitive Analysis (if available) */}
            {results.competitive_analysis && (
              <div className="relative group">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Competitive Benchmark</h4>
                </div>
                <div className="bg-gradient-to-br from-orange-50/30 to-yellow-50/30 border border-orange-100 rounded-2xl p-8">
                   <div className="grid gap-4">
                    {results.competitive_analysis.split('\n').filter(l => l.trim()).map((line, i) => (
                      <p key={i} className="text-gray-700 text-sm leading-relaxed border-l-2 border-orange-200 pl-4">
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-xl p-8 border-2 border-blue-200 shadow-inner">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-500">OUTREACH EMAIL</span>
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans">
                  {results.email || 'No email generated'}
                </pre>
              </div>
            </div>
            
            <div className="mt-6 grid md:grid-cols-3 gap-3">
              <button
                onClick={() => copyToClipboard(results.email || '')}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Email
              </button>
              <button 
                onClick={() => {
                  const subject = results.email?.split('\n')[0]?.replace('Subject:', '').trim() || 'Opportunity';
                  const body = encodeURIComponent(results.email || '');
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                }}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Open in Mail
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Save as PDF
              </button>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-400 font-mono text-sm">JSON Response</span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-green-400 text-sm font-mono overflow-x-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ResultsDisplay;