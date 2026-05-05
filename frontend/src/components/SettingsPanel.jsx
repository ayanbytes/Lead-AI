import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Key, Building, Mail, Shield, Server, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchUserSettings, updateUserSettings } from '../services/api';

const SettingsPanel = () => {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    agency_name: ''
  });

  const [config, setConfig] = useState({
    services: JSON.parse(localStorage.getItem('services') || '["Web Development", "Mobile Apps", "AI/ML Integration"]'),
    emailTone: localStorage.getItem('emailTone') || 'professional',
    signature: localStorage.getItem('signature') || 'Best regards,\nSales Team'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchUserSettings();
        setProfile({
          full_name: settings.full_name || '',
          email: settings.email || '',
          agency_name: settings.agency_name || ''
        });
      } catch (err) {
        console.error('Failed to load profile settings:', err);
      }
    };
    loadSettings();
  }, []);

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

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save local preferences
      localStorage.setItem('services', JSON.stringify(config.services));
      localStorage.setItem('emailTone', config.emailTone);
      localStorage.setItem('signature', config.signature);
      localStorage.setItem('agencyName', profile.agency_name); // Keep in sync

      // Save profile to backend
      await updateUserSettings(profile);
      
      toast.success('✅ Profile updated successfully!');
    } catch (err) {
      toast.error('❌ Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
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
        className="glass-card rounded-2xl p-8 shadow-xl border border-white/50"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
            <p className="text-gray-500">Manage your profile and agency preferences</p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Profile Management Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Manage Profile</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="john@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={profile.agency_name}
                    onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
                    placeholder="Premium IT Agency"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Agency Services Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Services Offered</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allServices.map((service) => (
                    <button 
                      key={service} 
                      onClick={() => toggleServiceSelection(service)}
                      className={`
                        text-xs font-semibold px-3 py-2 rounded-lg border-2 transition-all text-left
                        ${config.services.includes(service)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                        }
                      `}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Email Branding Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Email Signature</h3>
            </div>
            <div className="space-y-4">
              <div>
                <textarea
                  value={config.signature}
                  onChange={(e) => setConfig({ ...config, signature: e.target.value })}
                  rows={4}
                  className="input-field font-mono text-sm"
                  placeholder="Best regards,&#10;Your Name&#10;Agency Title"
                />
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`
                w-full flex items-center justify-center gap-2 text-lg py-4 rounded-xl font-bold transition-all
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Updating Profile...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;