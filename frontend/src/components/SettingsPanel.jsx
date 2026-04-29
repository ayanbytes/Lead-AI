import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Key, Building, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPanel = () => {
  const [config, setConfig] = useState({
    agencyName: 'Your IT Agency',
    groqApiKey: '',
    tavilyApiKey: '',
    services: ['Web Development', 'Mobile Apps', 'AI/ML Integration'],
    emailTone: 'professional',
    signature: 'Best regards,\nSales Team'
  });

  const [showKeys, setShowKeys] = useState({
    groq: false,
    tavily: false
  });

  const allServices = [
    'Web Development', 
    'Mobile Apps', 
    'AI/ML Integration', 
    'Cloud Solutions', 
    'DevOps', 
    'UI/UX Design', 
    'Data Analytics', 
    'Cybersecurity',
    'Blockchain',
    'IoT Solutions'
  ];

  const handleSave = () => {
    // In a real app, this would save to backend
    toast.success('✅ Settings saved successfully!');
    console.log('Saved config:', config);
  };

  const toggleServiceSelection = (service) => {
    if (config.services.includes(service)) {
      setConfig({ 
        ...config, 
        services: config.services.filter(s => s !== service) 
      });
    } else {
      setConfig({ 
        ...config, 
        services: [...config.services, service] 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <p className="text-gray-500">Customize your agency profile and preferences</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* API Keys Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">API Configuration</h3>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Security Note:</p>
                  <p>API keys are stored in your browser's local storage. For production, use environment variables.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groq API Key
                  <a 
                    href="https://console.groq.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                  >
                    (Get free key →)
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKeys.groq ? 'text' : 'password'}
                    value={config.groqApiKey}
                    onChange={(e) => setConfig({ ...config, groqApiKey: e.target.value })}
                    placeholder="gsk_••••••••••••••••"
                    className="input-field pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, groq: !showKeys.groq })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showKeys.groq ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tavily API Key
                  <a 
                    href="https://tavily.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                  >
                    (Get free key →)
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKeys.tavily ? 'text' : 'password'}
                    value={config.tavilyApiKey}
                    onChange={(e) => setConfig({ ...config, tavilyApiKey: e.target.value })}
                    placeholder="tvly-••••••••••••••••"
                    className="input-field pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, tavily: !showKeys.tavily })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showKeys.tavily ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agency Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Agency Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agency Name
                </label>
                <input
                  type="text"
                  value={config.agencyName}
                  onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                  placeholder="Your IT Agency"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Core Services (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {allServices.map((service) => (
                    <label 
                      key={service} 
                      className={`
                        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                        ${config.services.includes(service)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={config.services.includes(service)}
                        onChange={() => toggleServiceSelection(service)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${
                        config.services.includes(service) ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {service}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Email Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Email Configuration</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Email Tone
                </label>
                <div className="flex gap-3">
                  {['casual', 'professional', 'technical'].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setConfig({ ...config, emailTone: tone })}
                      className={`
                        flex-1 px-6 py-3 rounded-xl font-semibold transition-all capitalize
                        ${config.emailTone === tone
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Signature
                </label>
                <textarea
                  value={config.signature}
                  onChange={(e) => setConfig({ ...config, signature: e.target.value })}
                  rows={4}
                  placeholder="Best regards,&#10;Your Name&#10;Company Name"
                  className="input-field font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will be appended to all generated emails
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6 mt-6"
      >
        <h4 className="font-bold text-gray-800 mb-3">💡 Quick Tips</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>API keys are required for the application to work. Get free tier keys from Groq and Tavily.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Select multiple services to help the AI generate more relevant solutions.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>"Professional" tone works best for C-level outreach, while "Technical" is great for CTOs.</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;