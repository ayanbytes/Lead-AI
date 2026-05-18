import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Target } from 'lucide-react';
import { navigate } from '../utils/router';
import { getAuth } from '../utils/storage';

function AnimatedSphere() {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.4}>
        <MeshDistortMaterial
          color="#60a5fa"
          attach="material"
          distort={0.45}
          speed={3}
          roughness={0.1}
          metalness={0.4}
          emissive="#1e40af"
          emissiveIntensity={0.5}
        />
      </Sphere>
    </Float>
  );
}

const Hero3D = () => {
  const isLoggedIn = Boolean(getAuth()?.accessToken);
  return (
    <div className="relative h-[720px] sm:h-[650px] lg:h-[600px] overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100" />
      
      {/* Animated Blobs */}
      <div className="absolute top-20 left-4 sm:left-10 w-64 sm:w-72 h-64 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" />
      <div className="absolute top-40 right-4 sm:right-10 w-64 sm:w-72 h-64 sm:h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-1/3 w-64 sm:w-72 h-64 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 sm:px-6 h-full relative z-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-12 items-center h-full">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 text-blue-700 px-4 py-2 rounded-full mb-6 shadow-sm">
              <Target className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">Next-Gen AI Lead Generation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Transform Cold Outreach Into
              <span className="gradient-text block mt-2">
                Value-Driven Conversations
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Generate hyper-personalized technical audits and outreach emails in seconds. 
              Powered by advanced AI to help IT agencies close more deals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {isLoggedIn ? (
                <button className="btn-primary flex items-center justify-center gap-2 py-3 px-6 sm:py-4 sm:px-8 w-full sm:w-auto" onClick={() => navigate('/app')}>
                  <Zap className="w-5 h-5" />
                  Go to Dashboard
                </button>
              ) : (
                <button className="btn-primary flex items-center justify-center gap-2 py-3 px-6 sm:py-4 sm:px-8 w-full sm:w-auto" onClick={() => navigate('/start-trial')}>
                  <Zap className="w-5 h-5" />
                  Start Free Trial
                </button>
              )}
              <button className="btn-secondary flex items-center justify-center gap-2 py-3 px-6 sm:py-4 sm:px-8 w-full sm:w-auto" onClick={() => navigate('/demo')}>
                <Target className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '⚡', text: 'Analysis in <5s' },
                { icon: '🎯', text: '15%+ Response Rate' },
                { icon: '📊', text: 'Bulk Processing' },
                { icon: '🔒', text: 'Secure sessions' }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right 3D Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="h-[320px] sm:h-[420px] md:h-[500px] relative"
          >
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight position={[-10, -10, -5]} intensity={0.5} color="#06b6d4" />
              <AnimatedSphere />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
            
            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-6 sm:top-10 right-4 sm:right-10 glass-card p-4 rounded-xl shadow-2xl"
            >
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-gray-700">Live Analysis</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Processing leads...</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute bottom-6 sm:bottom-10 left-4 sm:left-10 glass-card p-4 rounded-xl shadow-2xl"
            >
              <div className="text-2xl font-bold gradient-text">94%</div>
              <p className="text-xs text-gray-500">Accuracy Rate</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero3D;
