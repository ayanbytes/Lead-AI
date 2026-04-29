import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Globe, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingAnimation from './LoadingAnimation';
import ResultsDisplay from './ResultsDisplay';
import { analyzeCompany } from '../services/api';

const SingleAnalysis = ({ updateStats }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'General',
    website: '',
    includeLinkedIn: false,
    includeCompetitors: false,
    agencyName: 'Your IT Agency'
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const industries = [
    'General', 'SaaS', 'E-commerce', 'Healthcare', 'Finance', 
    'Logistics', 'Real Estate', 'Education', 'Manufacturing',
    'Fintech', 'EdTech', 'MarTech', 'Developer Tools'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const data = await analyzeCompany(formData);
      
      if (data.status === 'Failed') {
        toast.error(data.error || 'Analysis failed');
        return;
      }
      
      setResults(data);
      toast.success('✨ Analysis completed successfully!');
      
      // Update stats
      updateStats(prev => ({
        ...prev,
        totalAnalyses: prev.totalAnalyses + 1,
        companiesProcessed: prev.companiesProcessed + 1,
        timesSaved: prev.timesSaved + 2 // Assume 2 hours saved per analysis
      }));
    } catch (error) {
      toast.error(error.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Single Company Analysis</h2>
            <p className="text-gray-500">Get instant technical audits and personalized outreach emails</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name or Description *
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Acme Corp - a mid-sized logistics company in Texas"
                className="input-field pl-12"
                disabled={loading}
              />
            </div>
          </div>

          {/* Industry & Website */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="input-field"
                disabled={loading}
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Website (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="input-field pl-12"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Agency Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Agency Name
            </label>
            <input
              type="text"
              value={formData.agencyName}
              onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
              placeholder="Your IT Agency"
              className="input-field"
              disabled={loading}
            />
          </div>

          {/* Advanced Options */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">Advanced Features</p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.includeLinkedIn}
                  onChange={(e) => setFormData({ ...formData, includeLinkedIn: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    🔍 Find Decision Maker (LinkedIn)
                  </span>
                  <p className="text-xs text-gray-500">Automatically find CEO/CTO name for personalization</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.includeCompetitors}
                  onChange={(e) => setFormData({ ...formData, includeCompetitors: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    📊 Include Competitive Analysis
                  </span>
                  <p className="text-xs text-gray-500">Compare against top 3 competitors in the industry</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Audit & Email
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Loading Animation */}
      {loading && <LoadingAnimation />}

      {/* Results */}
      {results && !loading && (
        <ResultsDisplay 
          results={results} 
          companyName={formData.companyName}
          agencyName={formData.agencyName}
        />
      )}
    </div>
  );
};

export default SingleAnalysis;