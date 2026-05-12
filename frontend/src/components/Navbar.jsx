import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Menu, Sparkles, Twitter, X } from 'lucide-react';
import { navigate } from '../utils/router';
import { getAuth, clearAuth } from '../utils/storage';

const Navbar = () => {
  const isLoggedIn = Boolean(getAuth()?.accessToken);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setMobileOpen(false);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
            className="flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">Lead AI</h1>
              <p className="hidden sm:block text-xs text-gray-500">Sales Automation Platform</p>
            </div>
          </button>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#/" className="text-gray-700 hover:text-blue-700 font-semibold transition-colors">
              Home
            </a>
            <a href="#/features" className="text-gray-700 hover:text-blue-700 font-semibold transition-colors">
              Features
            </a>
            <a href="#/pricing" className="text-gray-700 hover:text-blue-700 font-semibold transition-colors">
              Pricing
            </a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github className="w-5 h-5 text-gray-600 hover:text-blue-700 transition-colors cursor-pointer" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="w-5 h-5 text-gray-600 hover:text-blue-700 transition-colors cursor-pointer" />
              </a>
            </div>
            {isLoggedIn ? (
              <>
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

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/70 border border-white/60 shadow-sm"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden mt-4">
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-3 flex flex-col gap-2">
              <a
                href="#/"
                className="px-3 py-2 rounded-xl text-gray-800 font-semibold hover:bg-white/80 transition-colors"
              >
                Home
              </a>
              <a
                href="#/features"
                className="px-3 py-2 rounded-xl text-gray-800 font-semibold hover:bg-white/80 transition-colors"
              >
                Features
              </a>
              <a
                href="#/pricing"
                className="px-3 py-2 rounded-xl text-gray-800 font-semibold hover:bg-white/80 transition-colors"
              >
                Pricing
              </a>
              {isLoggedIn ? (
                <>
                  <a
                    href="#/admin"
                    className="px-3 py-2 rounded-xl text-gray-800 font-semibold hover:bg-white/80 transition-colors"
                  >
                    Admin
                  </a>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-left text-red-700 font-semibold hover:bg-white/80 transition-colors"
                    onClick={() => {
                      clearAuth();
                      navigate('/');
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : null}
              <div className="flex items-center gap-3 px-3 py-2">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="w-5 h-5 text-gray-600 hover:text-blue-700 transition-colors cursor-pointer" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="w-5 h-5 text-gray-600 hover:text-blue-700 transition-colors cursor-pointer" />
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </motion.nav>
  );
};

export default Navbar;
