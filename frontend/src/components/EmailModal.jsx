import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, User, Info, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmail } from '../services/api';

const EmailModal = ({ isOpen, onClose, initialRecipient, initialSubject, initialBody, companyName }) => {
  const [emailData, setEmailData] = useState({
    recipient: initialRecipient || '',
    subject: initialSubject || '',
    body: initialBody || ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmailData({
        recipient: initialRecipient || '',
        subject: initialSubject || '',
        body: initialBody || ''
      });
      setSent(false);
    }
  }, [isOpen, initialRecipient, initialSubject, initialBody]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!emailData.recipient) {
      toast.error('Recipient email is required');
      return;
    }

    setLoading(true);
    try {
      await sendEmail({
        recipient: emailData.recipient,
        subject: emailData.subject,
        body: emailData.body
      });
      setSent(true);
      toast.success('🚀 Email sent successfully!');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Send Outreach Email</h3>
              <p className="text-blue-100 text-sm">Directly to {companyName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-8 space-y-6">
          {!sent ? (
            <>
              {/* Recipient */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Email</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={emailData.recipient}
                    onChange={(e) => setEmailData({ ...emailData, recipient: e.target.value })}
                    placeholder="ceo@company.com"
                    className="input-field pl-12"
                  />
                </div>
                {!initialRecipient && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <Info className="w-3 h-3" /> No lead email was found automatically. Please enter it manually.
                  </p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Collaboration Opportunity"
                  className="input-field"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Content</label>
                <textarea
                  required
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  rows={10}
                  className="input-field font-sans text-sm resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary py-4"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    flex-[2] flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all
                    ${loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Email Now
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-2">Email Sent!</h4>
              <p className="text-gray-500 max-w-sm">
                Your outreach has been delivered to <strong>{emailData.recipient}</strong>. You'll receive any replies directly at your registered email address.
              </p>
            </div>
          )}
        </form>

        {/* Security Badge */}
        <div className="bg-gray-50 p-4 flex items-center justify-center gap-2 border-t border-gray-100">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Sent via platform outreach system on your behalf</span>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailModal;
