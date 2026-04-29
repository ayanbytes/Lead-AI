import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card rounded-2xl p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-500">
        {label}
      </div>
    </motion.div>
  );
};

export default StatsCard;