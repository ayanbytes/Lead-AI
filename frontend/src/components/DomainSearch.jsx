import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, Globe, Sparkles, ArrowRight, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchCompanies, analyzeCompany } from '../services/api';
import LoadingAnimation from './LoadingAnimation';
import ResultsDisplay from './ResultsDisplay';

const DomainSearch = ({ updateStats, onUpgradeRequired }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a domain or industry to search');
      return;
    }

    setSearching(true);
    setCompanies([]);
    setAnalysisResult(null);
    setSelectedCompany(null);

    try {
      const data = await searchCompanies(query);
      setCompanies(data.companies || []);
      if (data.companies?.length === 0) {
        toast.error('No companies found for this query.');
      } else {
        toast.success(`Found ${data.companies.length} potential leads!`);
      }
    } catch (error) {
      if (error.status === 403 || error.message?.toLowerCase().includes('premium') || error.message?.toLowerCase().includes('upgrade') || error.message?.toLowerCase().includes('limit')) {
        onUpgradeRequired?.(error.message);
      } else {
        toast.error(error.message || 'Search failed');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleAnalyze = async (company) => {
    setSelectedCompany(company);
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const data = await analyzeCompany({
        companyName: company.name,
        industry: company.industry || 'General',
        website: company.website,
        includeLinkedIn: true,
        includeCompetitors: false
      });

      if (data.status === 'Failed') {
        toast.error(data.error || 'Analysis failed');
        return;
      }

      setAnalysisResult(data);
      toast.success('✨ Deep Analysis completed!');
      
      // Update stats
      if (updateStats) {
        updateStats(prev => ({
          ...prev,
          totalAnalyses: prev.totalAnalyses + 1,
          companiesProcessed: prev.companiesProcessed + 1,
          timesSaved: prev.timesSaved + 2
        }));
      }
    } catch (error) {
      if (error.status === 403 || error.message?.toLowerCase().includes('premium') || error.message?.toLowerCase().includes('upgrade') || error.message?.toLowerCase().includes('limit')) {
        onUpgradeRequired?.(error.message);
      } else {
        toast.error(error.message || 'Analysis failed');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Domain & Lead Discovery</h2>
            <p className="text-gray-500">Search by niche, industry, or domain to find and analyze leads</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Real estate companies in Miami or 'stripe.com'"
            className="input-field pl-6 pr-32 py-4 text-lg"
            disabled={searching || analyzing}
          />
          <button
            type="submit"
            disabled={searching || analyzing}
            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:bg-gray-400"
          >
            {searching ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Discover
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Discovery Results */}
      <AnimatePresence mode="wait">
        {searching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-indigo-600 font-medium animate-pulse">Scanning the web for prospects...</p>
          </motion.div>
        ) : companies.length > 0 && !analysisResult ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {companies.map((company, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-6 rounded-2xl border border-white/50 hover:border-indigo-300 transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  {company.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                  {company.name}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">
                  {company.industry}
                </p>
                <p className="text-gray-500 text-sm mb-6 flex-grow">
                  {company.description}
                </p>

                <button
                  onClick={() => handleAnalyze(company)}
                  disabled={analyzing}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700"
                >
                  Analyze & Generate Lead
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Deep Analysis State */}
      {analyzing && (
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Info className="w-5 h-5 text-indigo-600" />
            <p className="text-sm text-indigo-800">
              Performing deep technical audit for <strong>{selectedCompany?.name}</strong>. Finding decision makers and personalizing outreach...
            </p>
          </div>
          <LoadingAnimation />
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && !analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setAnalysisResult(null)}
              className="text-indigo-600 font-semibold flex items-center gap-2 hover:underline"
            >
              ← Back to Discovery Results
            </button>
            <div className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Deep Audit Completed
            </div>
          </div>
          <ResultsDisplay 
            results={analysisResult} 
            companyName={selectedCompany?.name}
            agencyName={analysisResult.agency_name || 'Your IT Agency'}
          />
        </motion.div>
      )}
    </div>
  );
};

export default DomainSearch;
