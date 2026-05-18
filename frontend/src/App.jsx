import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Hero3D from './components/Hero3D';
import SingleAnalysis from './components/SingleAnalysis';
import BulkAnalysis from './components/BulkAnalysis';
import DomainSearch from './components/DomainSearch';
import SettingsPanel from './components/SettingsPanel';
import StatsCard from './components/StatsCard';
import { BarChart3, Zap, Users, TrendingUp, Sparkles } from 'lucide-react';
import { useHashRoute, navigate } from './utils/router';
import { getAuth, clearAuth } from './utils/storage';
import { useAuth } from './utils/useAuth';
import { fetchRecentAudits } from './services/api';

import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Docs from './pages/Docs';
import Demo from './pages/Demo';
import StartTrial from './pages/StartTrial';
import Login from './pages/Login';
import GetStarted from './pages/GetStarted';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import AuditDetail from './pages/AuditDetail';
import AuditHistory from './pages/AuditHistory';
import UpgradeModal from './components/UpgradeModal';

function App() {
  const route = useHashRoute();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState('single');
  const isLoggedIn = Boolean(auth?.accessToken);
  const [homeAudits, setHomeAudits] = useState([]);
  const [homeAuditsLoading, setHomeAuditsLoading] = useState(false);
  const [homeAuditsError, setHomeAuditsError] = useState('');
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgResponseRate: 0,
    companiesProcessed: 0,
    timesSaved: 0
  });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const handleUpgradeRequired = (msg) => {
    setUpgradeMessage(msg);
    setUpgradeModalOpen(true);
  };

  useEffect(() => {
    if (route.includes('?tab=discovery')) setActiveTab('discovery');
    else if (route.includes('?tab=bulk')) setActiveTab('bulk');
    else if (route.includes('?tab=settings')) setActiveTab('settings');
    else if (route.includes('?tab=single')) setActiveTab('single');
  }, [route]);

  const uniqueHomeCompanies = useMemo(
    () => new Set(homeAudits.map((a) => (a.company_name || '').trim()).filter(Boolean)).size,
    [homeAudits]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setHomeAudits([]);
      setHomeAuditsError('');
      return;
    }
    let cancelled = false;
    setHomeAuditsLoading(true);
    setHomeAuditsError('');
    fetchRecentAudits(5)
      .then((rows) => {
        if (cancelled) return;
        setHomeAudits(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setHomeAudits([]);
        setHomeAuditsError(err?.message || 'Unable to load audits');
      })
      .finally(() => {
        if (cancelled) return;
        setHomeAuditsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const tabs = [
    { id: 'single', label: 'Single Analysis', icon: Zap },
    { id: 'discovery', label: 'Lead Discovery', icon: Sparkles },
    { id: 'bulk', label: 'Bulk Processing', icon: Users },
    { id: 'settings', label: 'Settings', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          },
        }}
      />
      
      <Navbar />

      {(route === '/' || route.startsWith('/?tab=')) && (
        <>
          <Hero3D />

          {/* Stats Cards */}
          <div className="container mx-auto px-4 sm:px-6 mt-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <StatsCard 
                icon={Zap} 
                label="Analyses Run" 
                value={stats.totalAnalyses}
                color="blue"
              />
              <StatsCard 
                icon={TrendingUp} 
                label="Avg Response Rate" 
                value={`${stats.avgResponseRate}%`}
                color="green"
              />
              <StatsCard 
                icon={Users} 
                label="Companies Processed" 
                value={isLoggedIn ? uniqueHomeCompanies : stats.companiesProcessed}
                color="purple"
              />
              <StatsCard 
                icon={BarChart3} 
                label="Hours Saved" 
                value={stats.timesSaved}
                color="cyan"
              />
            </div>
          </div>

          {isLoggedIn ? (
            <div className="container mx-auto px-4 sm:px-6 pb-6">
              <div className="glass-card rounded-2xl p-6 border border-white/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-500">Your recent audits</div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {homeAuditsLoading ? 'Loading…' : homeAudits.length ? `${homeAudits.length} recent audits` : 'No audits yet'}
                  </div>
                  {homeAuditsError ? (
                    <div className="text-red-600 mt-1 font-medium">{homeAuditsError}</div>
                  ) : (
                    <div className="text-gray-600 mt-1">Only your audits are shown here.</div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button className="btn-secondary py-3 px-6 rounded-xl w-full sm:w-auto" onClick={() => navigate('/app')}>
                    Open dashboard
                  </button>
                </div>
              </div>

              {homeAudits.length ? (
                <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {homeAudits.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigate(`/audit/${a.id}`)}
                      className="text-left glass-card rounded-2xl p-5 border border-white/40 hover:bg-white/80 transition-colors"
                    >
                      <div className="font-extrabold text-gray-900">{a.company_name || 'Company'}</div>
                      <div className="text-sm text-gray-600 mt-1">{a.industry || 'General'}</div>
                      <div className="text-xs text-gray-500 mt-2">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Main Content */}
          <div className="container mx-auto px-4 sm:px-6 pb-20">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8 px-1">
              <div className="glass-card rounded-2xl p-2 flex flex-wrap justify-center gap-2 w-full sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base
                      ${activeTab === tab.id 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'single' && <SingleAnalysis updateStats={setStats} onUpgradeRequired={handleUpgradeRequired} />}
                {activeTab === 'discovery' && <DomainSearch updateStats={setStats} onUpgradeRequired={handleUpgradeRequired} />}
                {activeTab === 'bulk' && <BulkAnalysis updateStats={setStats} onUpgradeRequired={handleUpgradeRequired} />}
                {activeTab === 'settings' && <SettingsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          <UpgradeModal
            isOpen={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            message={upgradeMessage}
          />
        </>
      )}

      {route === '/features' && <Features />}
      {route === '/pricing' && <Pricing />}
      {route === '/payment' && <Payment />}
      {route?.startsWith('/payment/success') && <PaymentSuccess />}
      {route === '/payment/cancel' && <PaymentCancel />}
      {route === '/docs' && <Docs />}
      {route === '/demo' && <Demo />}
      {route === '/get-started' && <GetStarted />}
      {route === '/start-trial' && <StartTrial />}
      {route === '/login' && <Login />}
      {route?.startsWith('/audit/') && <AuditDetail route={route} />}
      {route === '/audits' && <AuditHistory />}

      {route === '/app' && (!getAuth()?.accessToken ? (
        <div className="container mx-auto px-4 sm:px-6 py-10">
          <div className="max-w-4xl mx-auto glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">Dashboard</div>
              <div className="text-gray-600 text-sm">Please log in to continue.</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-secondary" onClick={() => navigate('/')}>
                Home
              </button>
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Log in
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Dashboard />
      ))}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-cyan-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          {/* <p className="text-lg mb-2">Built with LangChain + Groq + React</p> */}
          <p className="text-blue-200">Transform cold outreach into value-driven conversations</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-cyan-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cyan-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
