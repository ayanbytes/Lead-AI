import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Activity, Gauge, Layers, Lock, Sparkles, Target, Zap } from 'lucide-react';
import { navigate } from '../utils/router';
import { getAuth } from '../utils/storage';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const onChange = () => setPrefersReducedMotion(Boolean(media.matches));
    onChange();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);
  return prefersReducedMotion;
}

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 767px)');
    if (!media) return;
    const onChange = () => setIsSmall(Boolean(media.matches));
    onChange();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);
  return isSmall;
}

function AnimatedSphere() {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.2;
    meshRef.current.rotation.y = t * 0.3;
  });

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 96, 96]} scale={2.35}>
        <MeshDistortMaterial
          color="#60a5fa"
          attach="material"
          distort={0.42}
          speed={2.8}
          roughness={0.12}
          metalness={0.38}
          emissive="#1e40af"
          emissiveIntensity={0.55}
        />
      </Sphere>
    </Float>
  );
}

const Hero3D = () => {
  const isLoggedIn = Boolean(getAuth()?.accessToken);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isSmallScreen = useIsSmallScreen();

  const showCanvas = !prefersReducedMotion;
  const dpr = isSmallScreen ? 1 : 1.5;

  const featureItems = useMemo(
    () => [
      { Icon: Activity, title: 'Fast audits', detail: 'Generate insights in seconds' },
      { Icon: Gauge, title: 'Higher replies', detail: 'Value-first messaging that converts' },
      { Icon: Layers, title: 'Bulk workflows', detail: 'Process dozens of leads at once' },
      { Icon: Lock, title: 'Secure by default', detail: 'JWT sessions and private data' },
    ],
    []
  );

  return (
    <div className="relative h-[760px] sm:h-[680px] lg:h-[640px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(6,182,212,0.18),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(168,85,247,0.14),transparent_45%)]" />

      <div className="absolute top-20 left-4 sm:left-10 w-64 sm:w-72 h-64 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float" />
      <div
        className="absolute top-40 right-4 sm:right-10 w-64 sm:w-72 h-64 sm:h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute -bottom-10 left-1/3 w-64 sm:w-72 h-64 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float"
        style={{ animationDelay: '4s' }}
      />

      <div className="container mx-auto px-4 sm:px-6 h-full relative z-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center h-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full mb-6 border border-white/60 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">AI-powered lead research</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Turn Cold Outreach Into
              <span className="gradient-text block mt-2">Value-Driven Conversations</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Create credible technical audits and high-signal outreach emails in minutes. Designed for modern IT
              agencies that want predictable deal flow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {isLoggedIn ? (
                <button
                  className="btn-primary flex items-center justify-center gap-2 py-3 px-6 sm:py-4 sm:px-8 w-full sm:w-auto"
                  onClick={() => navigate('/app')}
                >
                  <Zap className="w-5 h-5" />
                  Go to Dashboard
                </button>
              ) : (
                <button
                  className="btn-primary flex items-center justify-center gap-2 py-3 px-6 sm:py-4 sm:px-8 w-full sm:w-auto"
                  onClick={() => navigate('/start-trial')}
                >
                  <Zap className="w-5 h-5" />
                  Start Free Trial
                </button>
              )}
              <button
                className="btn-secondary flex items-center justify-center gap-2 py-3 px-6 sm:py-4 sm:px-8 w-full sm:w-auto"
                onClick={() => navigate('/demo')}
              >
                <Target className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureItems.map(({ Icon, title, detail }, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 + 0.4 }}
                  className="flex items-start gap-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 px-4 py-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-900 leading-tight">{title}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="h-[320px] sm:h-[420px] md:h-[520px] relative"
          >
            <div className="absolute inset-0 rounded-[28px] bg-white/50 border border-white/60 shadow-[0_20px_60px_rgba(15,23,42,0.12)]" />

            {showCanvas ? (
              <Canvas
                dpr={dpr}
                frameloop={isSmallScreen ? 'demand' : 'always'}
                camera={{ position: [0, 0, 5], fov: 45 }}
              >
                <ambientLight intensity={0.55} />
                <directionalLight position={[10, 10, 5]} intensity={1.1} />
                <pointLight position={[-10, -10, -5]} intensity={0.55} color="#06b6d4" />
                <AnimatedSphere />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  enableRotate={!isSmallScreen}
                  autoRotate
                  autoRotateSpeed={0.6}
                />
              </Canvas>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-sm font-semibold text-gray-600">3D preview disabled (reduced motion)</div>
              </div>
            )}

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-6 sm:top-10 right-4 sm:right-10 glass-card p-4 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-gray-700">Live Analysis</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Processing leads…</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute bottom-6 sm:bottom-10 left-4 sm:left-10 glass-card p-4 rounded-2xl shadow-2xl"
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

