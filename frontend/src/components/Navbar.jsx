import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Github, Twitter, Target } from 'lucide-react';
import { navigate } from '../utils/router';
import { clearAuth } from '../utils/storage';
import { useAuth } from '../utils/useAuth';

const Navbar = () => {
  const auth = useAuth();
  const isLoggedIn = Boolean(auth?.accessToken);
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card sticky top-0 z-50 border-b border-white/20"
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20 group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">Lead AI</h1>
              <p className="hidden sm:block text-xs text-gray-500 font-medium">Sales Automation Platform</p>
            </div>
          </button>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Home
            </a>
            <a href="#/features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Features
            </a>
            {isLoggedIn && (
              <a href="#/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Pricing
              </a>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" />
            </a>
            {isLoggedIn ? (
              <>
                {auth?.user && (
                  <button 
                    onClick={() => navigate('/pricing')}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-xs font-bold text-blue-700 hover:bg-blue-500/20 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{auth.user.plan_type || 'Starter'} Plan ({auth.user.tokens_used ?? 0}/{auth.user.tokens_limit ?? 3} used)</span>
                  </button>
                )}
                <button className="btn-secondary py-3 px-5 sm:py-4 sm:px-8" onClick={() => navigate('/app')}>
                  Dashboard
                </button>
                <button
                  className="btn-primary py-3 px-5 sm:py-4 sm:px-8"
                  onClick={() => {
                    clearAuth();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button className="btn-primary py-3 px-5 sm:py-4 sm:px-8" onClick={() => navigate('/get-started')}>
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
