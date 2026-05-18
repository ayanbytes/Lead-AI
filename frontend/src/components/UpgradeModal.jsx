import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Zap, Crown, X, ArrowRight } from 'lucide-react';
import { navigate } from '../utils/router';

const UpgradeModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-white via-white to-blue-50/50 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 z-10 overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 filter blur-2xl rounded-full" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30 border border-white/20">
            <Crown className="w-8 h-8 text-white animate-bounce" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Upgrade Your Experience
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-medium bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 text-blue-900 inline-block w-full">
              {message || "You've reached the token limit on the Free Starter plan. Upgrade to Agency Pro to unlock unlimited token quotas and premium capabilities."}
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3 mb-8 bg-white/80 p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Unlock Pro & Team Superpowers:
            </div>
            {[
              "Unlimited Company Analyses & Lead Discovery",
              "15,000+ Monthly API Token Quota Refill",
              "Bulk CSV Uploads (Process 50+ leads at once)",
              "Direct SMTP Integration & 1-Click Cold Emails",
              "Custom White-Label Branding on PDF Reports"
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className="w-full btn-primary py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Explore Premium Plans</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
