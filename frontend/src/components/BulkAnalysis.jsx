import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileSpreadsheet, Play, Download, 
  CheckCircle, XCircle, AlertCircle, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeBulk, exportCSV } from '../services/api';

const BulkAnalysis = ({ updateStats }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);

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

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 1000);

    try {
      const data = await analyzeBulk(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResults(data);
      
      toast.success(`🎉 Successfully processed ${data.total} companies!`, {
        duration: 5000
      });
      
      // Update stats
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

  const downloadSampleCSV = () => {
    const sampleData = `company_name,industry,website
Shopify,E-commerce SaaS,https://shopify.com
Stripe,Fintech,https://stripe.com
Notion,Productivity SaaS,https://notion.so
Figma,Design Tools,https://figma.com
Vercel,Developer Tools,https://vercel.com`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_companies.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('📄 Sample CSV downloaded!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bulk Processing</h2>
            <p className="text-gray-500">Process hundreds of companies at once</p>
          </div>
        </div>

        {/* CSV Format Info */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Required CSV Format:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div className="bg-white rounded-lg p-3">
              <span className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">company_name</span>
              <p className="text-gray-600 mt-2 text-xs">Company name or description (required)</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded text-xs">industry</span>
              <p className="text-gray-600 mt-2 text-xs">Industry category (optional)</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">website</span>
              <p className="text-gray-600 mt-2 text-xs">Company website URL (optional)</p>
            </div>
          </div>
          <button 
            onClick={downloadSampleCSV}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Sample CSV Template
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : file 
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="space-y-3">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-semibold text-green-700 mb-1">✓ {file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB • Click to replace
                </p>
              </div>
            </div>
          ) : isDragActive ? (
            <div className="space-y-3">
              <Upload className="w-16 h-16 mx-auto text-blue-500 animate-bounce" />
              <p className="text-lg font-semibold text-blue-600">Drop your CSV file here...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-16 h-16 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drag & drop your CSV file here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse • Max file size: 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Process Button */}
        {file && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleProcess}
            disabled={processing}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-lg py-4"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing {progress}%...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Process All Companies
              </>
            )}
          </motion.button>
        )}

        {/* Progress Bar */}
        {processing && (
          <div className="mt-4 space-y-2">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Analyzing companies... This may take a few minutes.
            </p>
          </div>
        )}
      </motion.div>

      {/* Results Section */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Processing Complete!
              </h3>
              <p className="text-gray-500 mt-1">
                {results.successful} successful • {results.failed} failed • {results.total} total
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadCSV}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download CSV
              </button>
              <button className="btn-primary flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Download All PDFs
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-3xl font-bold text-green-600">{results.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-3xl font-bold text-red-600">{results.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{results.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.results && results.results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {result.company_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {result.industry || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {result.status === 'Success' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          // Store result in state for detailed view
                          toast('Feature coming soon!', { icon: '🚀' });
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BulkAnalysis;