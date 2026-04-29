import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Github, Twitter } from 'lucide-react';
import { navigate } from '../utils/router';
import { getAuth, clearAuth } from '../utils/storage';

const Navbar = () => {
  const isLoggedIn = Boolean(getAuth()?.accessToken);
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card sticky top-0 z-50 border-b border-white/20"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Lead AI</h1>
              <p className="text-xs text-gray-500">Sales Automation Platform</p>
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
            <a href="#/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Pricing
            </a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" />
            </a>
            {isLoggedIn ? (
              <>
                <button className="btn-secondary" onClick={() => navigate('/app')}>
                  Dashboard
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    clearAuth();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => navigate('/get-started')}>
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
