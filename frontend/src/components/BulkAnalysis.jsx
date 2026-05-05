import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileSpreadsheet, Play, Download, 
  CheckCircle, XCircle, AlertCircle, FileText, Send, Mail, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeBulk, exportCSV } from '../services/api';
import EmailModal from './EmailModal';

const BulkAnalysis = ({ updateStats }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedEmailData, setSelectedEmailData] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setResults(null);
      toast.success(`✅ File "${uploadedFile.name}" uploaded successfully`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleProcess = async () => {
    if (!file) {
      toast.error('Please upload a CSV file first');
      return;
    }

    setProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 1500);

    try {
      const data = await analyzeBulk(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResults(data);
      
      toast.success(`🎉 Successfully processed ${data.total} companies!`, {
        duration: 5000
      });
      
      updateStats(prev => ({
        ...prev,
        companiesProcessed: prev.companiesProcessed + data.successful,
        totalAnalyses: prev.totalAnalyses + data.total,
        timesSaved: prev.timesSaved + (data.successful * 2)
      }));
    } catch (error) {
      clearInterval(progressInterval);
      toast.error(error.message || 'Bulk processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!results || !results.results) {
      toast.error('No results to download');
      return;
    }

    try {
      await exportCSV(results.results);
      toast.success('📥 CSV downloaded successfully!');
    } catch (error) {
      toast.error('CSV download failed: ' + error.message);
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

  const handleOpenEmailModal = (result) => {
    const { subject, body } = parseEmail(result.email);
    setSelectedEmailData({
      companyName: result.company_name,
      recipient: result.lead_email || result.company_email || '',
      subject: subject,
      body: body || result.email
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 shadow-xl border border-white/40"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bulk Analysis & Outreach</h2>
            <p className="text-gray-500">Discover leads and send automated emails to multiple companies</p>
          </div>
        </div>

        <div className="bg-indigo-50/50 rounded-2xl p-6 mb-8 border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-800">Ready for Outreach?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Ensure your <strong>SMTP Settings</strong> are configured in the Settings tab before processing to enable direct email sending.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">Lead Email Discovery</span>
             </div>
             <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">Customized Audits</span>
             </div>
             <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">Direct SMTP Outreach</span>
             </div>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-50 scale-102' 
              : file 
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  Ready to process {(file.size / 1024).toFixed(1)} KB file
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto shadow-inner group-hover:bg-indigo-100 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 group-hover:text-indigo-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-700">Drop your leads list here</p>
                <p className="text-sm text-gray-500">CSV format with company_name required</p>
              </div>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={handleProcess}
            disabled={processing}
            className={`
              w-full mt-8 flex items-center justify-center gap-3 text-lg py-5 rounded-2xl font-bold transition-all
              ${processing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl hover:scale-[1.01] active:scale-[0.99]'
              }
            `}
          >
            {processing ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Leads ({progress}%)
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Start Bulk Analysis & Discovery
              </>
            )}
          </button>
        )}
      </motion.div>

      {/* Results Section */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 shadow-2xl border border-white/40"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                Campaign Results
              </h3>
              <p className="text-gray-500 mt-1">
                Processed {results.total} companies • {results.successful} leads found
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadCSV}
                className="btn-secondary flex items-center gap-2 shadow-sm"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Lead Found</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {results.results && results.results.map((result, index) => (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-800">{result.company_name}</div>
                      <div className="text-xs text-gray-500">{result.industry || 'Industry N/A'}</div>
                    </td>
                    <td className="px-6 py-5">
                       {result.decision_maker ? (
                         <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                           <User className="w-4 h-4" />
                           {result.decision_maker}
                         </div>
                       ) : (
                         <span className="text-gray-400 italic text-sm">Not found</span>
                       )}
                    </td>
                    <td className="px-6 py-5">
                       {result.lead_email || result.company_email ? (
                         <div className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                           <Mail className="w-4 h-4" />
                           {result.lead_email || result.company_email}
                         </div>
                       ) : (
                         <span className="text-gray-400 italic text-sm">No email found</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {result.status === 'Success' && (
                          <button 
                            onClick={() => handleOpenEmailModal(result)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            title="Send Direct Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Email Modal */}
      <AnimatePresence>
        {selectedEmailData && (
          <EmailModal 
            isOpen={!!selectedEmailData}
            onClose={() => setSelectedEmailData(null)}
            initialRecipient={selectedEmailData.recipient}
            initialSubject={selectedEmailData.subject}
            initialBody={selectedEmailData.body}
            companyName={selectedEmailData.companyName}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkAnalysis;