import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Mail, CheckCircle } from 'lucide-react';

const LoadingAnimation = () => {
  const steps = [
    { icon: Search, label: 'Researching company...', delay: 0 },
    { icon: Sparkles, label: 'Analyzing tech stack...', delay: 0.5 },
    { icon: Mail, label: 'Generating email...', delay: 1 },
    { icon: CheckCircle, label: 'Finalizing report...', delay: 1.5 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-2xl p-12 text-center mb-8"
    >
      <div className="max-w-md mx-auto">
        {/* Animated Logo */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity }
          }}
          className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mx-auto mb-8 flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>

        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          AI is working its magic
        </h3>
        <p className="text-gray-500 mb-8">
          This usually takes 5-10 seconds...
        </p>

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center gap-3 bg-blue-50 rounded-xl p-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <step.icon className="w-5 h-5 text-blue-600" />
              </motion.div>
              <span className="text-gray-700 font-medium">{step.label}</span>
              <div className="ml-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: step.delay + 1.5 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 8, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingAnimation;