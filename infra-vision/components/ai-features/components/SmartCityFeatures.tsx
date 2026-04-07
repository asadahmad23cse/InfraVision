"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { 
  MapPin, 
  Route, 
  BarChart3, 
  TrendingUp, 
  Leaf,
  Play,
  ArrowRight,
  Menu,
  X,
  Network,
  Cpu,
  Target,
  Activity
} from 'lucide-react';
import { FeatureCard } from '@/components/ai-features/components/FeatureCard';
import { PremiumUrbanGrowthCard } from '@/components/ai-features/components/PremiumUrbanGrowthCard';
import { Button } from '@/components/ai-features/components/ui/button';
import { useState, useEffect } from 'react';

const features = [
  {
    number: "1.",
    title: "Identify Infrastructure Gaps in Cities",
    description: "Leverage AI algorithms to analyze urban infrastructure patterns, identifying critical gaps in transportation, utilities, and public services. Our advanced mapping technology provides actionable insights for strategic city development.",
    Icon: MapPin
  },
  {
    number: "2.",
    title: "Smart Road & Housing Planning",
    description: "Optimize urban layouts with intelligent road network design and housing distribution analysis. AI-driven planning ensures efficient traffic flow, reduced congestion, and sustainable residential development.",
    Icon: Route
  },
  {
    number: "3.",
    title: "Advanced Data Visualization",
    description: "Transform complex urban datasets into intuitive heat maps, charts, and interactive dashboards. Real-time visualization helps city planners make data-driven decisions with confidence and clarity.",
    Icon: BarChart3
  },
  {
    number: "4.",
    title: "Predict Urban Growth Patterns",
    description: "Harness predictive analytics to forecast population growth, economic development, and infrastructure demands. Stay ahead of urban expansion with AI-powered trend analysis and scenario modeling.",
    Icon: TrendingUp
  },
  {
    number: "5.",
    title: "Sustainability & Green Planning",
    description: "Integrate environmental considerations into every planning decision. AI evaluates carbon footprint, green space optimization, and sustainable resource management for eco-friendly city development.",
    Icon: Leaf
  }
];

interface SmartCityFeaturesProps {
  onInfrastructureAnalyze?: () => void;
  onRoadHousingPlanning?: () => void;
  onDataVisualization?: () => void;
  onUrbanGrowthPatterns?: () => void;
  onSustainabilityGreenPlanning?: () => void;
}

export function SmartCityFeatures({ onInfrastructureAnalyze, onRoadHousingPlanning, onDataVisualization, onUrbanGrowthPatterns, onSustainabilityGreenPlanning }: SmartCityFeaturesProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMetricTab, setActiveMetricTab] = useState<'Population' | 'Economy' | 'Infrastructure'>('Population');
  const [isClient, setIsClient] = useState(false);
  const [particleData, setParticleData] = useState<Array<{
    left: number;
    top: number;
    width: number;
    height: number;
    blur: number;
    xOffset: number;
    delay: number;
  }>>([]);
  const [metricColors, setMetricColors] = useState<string[]>([]);
  const { scrollYProgress } = useScroll();
  
  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  // Generate random values only on client to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    
    // Generate particle data
    const particles = Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 3 + 2,
      height: Math.random() * 3 + 2,
      blur: Math.random() * 4 + 2,
      xOffset: Math.random() * 30 - 15,
      delay: Math.random() * 10,
    }));
    setParticleData(particles);

    // Generate metric colors
    const colors = Array.from({ length: 64 }, () => {
      const intensity = Math.random() * 0.8 + 0.2;
      const randomValue = Math.random();
      
      if (activeMetricTab === 'Population') {
        return randomValue > 0.7 ? `rgba(239,68,68,${intensity})` : 
               randomValue > 0.4 ? `rgba(59,130,246,${intensity})` : 
               `rgba(34,197,94,${intensity})`;
      } else if (activeMetricTab === 'Economy') {
        return randomValue > 0.6 ? `rgba(245,158,11,${intensity})` : 
               randomValue > 0.3 ? `rgba(0,168,232,${intensity})` : 
               `rgba(52,211,153,${intensity})`;
      } else {
        return randomValue > 0.5 ? `rgba(100,116,139,${intensity})` : 
               randomValue > 0.3 ? `rgba(14,165,233,${intensity})` : 
               `rgba(6,182,212,${intensity})`;
      }
    });
    setMetricColors(colors);
  }, [activeMetricTab]);

  // Mouse tracking for hero visual
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const visualX = useSpring(useTransform(mouseX, [0, windowSize.width], [-2, 2]), { stiffness: 200, damping: 30 });
  const visualY = useSpring(useTransform(mouseY, [0, windowSize.height], [-2, 2]), { stiffness: 200, damping: 30 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Premium Dark Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#050505]/70 backdrop-blur-2xl border-b border-white/[0.05] shadow-2xl' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Minimalist Logo */}
            <motion.div 
              className="text-xl tracking-tight text-white font-medium flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-[#050505]" />
              </div>
              Infra<span className="text-white/40 font-light">Vision</span>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              {['Features', 'How It Works', 'Metrics', 'Testimonials'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 uppercase tracking-widest"
                  whileHover={{ y: -1 }}
                >
                  {item}
                </motion.a>
              ))}
            </nav>

            {/* CTA Button */}
            <motion.div className="hidden md:block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-full font-bold tracking-wide transition-all duration-300"
                suppressHydrationWarning
              >
                Access Platform
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0a0a0c]/98 backdrop-blur-3xl border-b border-white/[0.05]"
          >
            <div className="px-6 py-8 space-y-4">
              {['Features', 'How It Works', 'Metrics', 'Testimonials'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="block text-white/60 hover:text-white font-medium tracking-wide uppercase text-sm py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Button className="w-full bg-white text-black font-bold tracking-wide rounded-lg mt-6 py-6 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Access Platform
              </Button>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hyper-Premium Hero Section */}
      <section className="relative min-h-[95vh] flex items-center pt-24 overflow-hidden bg-[#050505]">
        {/* Subtle Vercel-style Radial Grid mask */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(0, 168, 232, 0.15) 0%, transparent 60%), 
                              linear-gradient(to bottom, transparent, #050505 80%),
                              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: `100% 100%, 100% 100%, 40px 40px, 40px 40px`,
            backgroundPosition: `center top`,
          }}
        />

        <div className="relative max-w-[1400px] w-full mx-auto px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-16 lg:gap-8 items-center z-10">
          
          {/* Typography Content */}
          <motion.div
            style={{ y: heroY }}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] mb-8 w-fit mx-auto sm:mx-0 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-[#00A8E8] shadow-[0_0_10px_#00A8E8] animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-mono text-white/70 font-semibold select-none">Live Telemetry Active</span>
            </motion.div>

            <motion.h1 
              className="text-5xl sm:text-6xl lg:text-[72px] xl:text-[84px] font-medium tracking-tighter text-white leading-[1.05] mb-8 text-center sm:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              Compute the <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">Future City</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg lg:text-xl text-white/40 mb-12 max-w-xl leading-relaxed font-light text-center sm:text-left mx-auto sm:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              The most advanced urban intelligence platform. Simulate infrastructure stress, predict carbon footprints, and optimize capital allocation in real-time.
            </motion.p>

            {/* Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] px-8 py-6 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] group flex justify-center items-center h-[52px]"
                suppressHydrationWarning
              >
                Access Intelligence
                <ArrowRight className="ml-2 w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-[#0f0f11] hover:bg-white/[0.05] hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-8 py-6 rounded-xl font-medium transition-all duration-300 backdrop-blur-lg flex justify-center items-center h-[52px]"
                suppressHydrationWarning
              >
                View System Architecture
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Premium Holographic Terminal Array */}
          <motion.div
            className="relative w-full aspect-[4/3] perspective-1000 hidden lg:block ml-4"
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ x: visualX, y: visualY }}
          >
            <div className="absolute inset-0 transform rotate-y-[-8deg] rotate-x-[8deg] scale-100 group mt-10">
              
              {/* Main Center Terminal Dashboard */}
              <div className="absolute inset-0 rounded-[24px] border border-white/10 bg-[#0a0a0c]/80 backdrop-blur-2xl shadow-2xl overflow-hidden group-hover:border-[#00A8E8]/30 transition-all duration-700 z-20 flex flex-col">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
                     <Activity className="w-4 h-4 text-[#00A8E8]" />
                     INFRA_CORE_v2.0.4 
                  </div>
                  <div className="flex space-x-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-red-500/80 transition-colors duration-500"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-yellow-500/80 transition-colors duration-500 delay-100"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-green-500/80 transition-colors duration-500 delay-200"></div>
                  </div>
                </div>
                {/* Terminal Body */}
                <div className="p-6 flex-1 flex flex-col gap-6 relative">
                  {/* Cyber Grid Background */}
                  <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:30px_30px]" />
                  
                  {/* Active Simulation Stats */}
                  <div className="flex gap-6 relative z-10 hidden md:flex">
                     <div className="flex-1 bg-[#111113]/80 border border-white/5 p-5 rounded-xl backdrop-blur-sm">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex justify-between">
                           <span>Global Stress</span>
                           <Activity className="w-3 h-3 text-white/20" />
                        </div>
                        <div className="text-4xl font-light text-white flex items-baseline gap-2">14.2<span className="text-lg text-white/40">%</span></div>
                        <div className="mt-2 flex items-center gap-1 text-[#34D399] text-xs">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" /> Optimal
                        </div>
                     </div>
                     <div className="flex-1 bg-[#111113]/80 border border-white/5 p-5 rounded-xl backdrop-blur-sm">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 flex justify-between">
                           <span>Carbon Drift</span>
                           <Leaf className="w-3 h-3 text-white/20" />
                        </div>
                        <div className="text-4xl font-light text-white flex items-baseline gap-2">890<span className="text-lg text-white/40">MT</span></div>
                        <div className="mt-2 flex items-center gap-1 text-red-400 text-xs">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> +0.4% Variance
                        </div>
                     </div>
                  </div>

                  {/* Graph Visual */}
                  <div className="flex-1 bg-[#111113]/80 border border-white/5 rounded-xl p-4 relative z-10 overflow-hidden flex flex-col justify-end group-hover:border-[#00A8E8]/20 transition-colors duration-700">
                     {/* Data Visualization Mock */}
                     <svg className="w-full h-[120px] isolate" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Glow Gradient */}
                        <defs>
                           <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                           </linearGradient>
                        </defs>
                        {/* Area */}
                        <path d="M0,80 Q20,30 40,60 T80,40 T100,50 L100,100 L0,100 Z" fill="url(#gradArea)" className="transition-all duration-1000 group-hover:opacity-100 opacity-50" />
                        {/* Line */}
                        <path d="M0,80 Q20,30 40,60 T80,40 T100,50" fill="none" stroke="#0EA5E9" strokeWidth="1.5" className="drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                        {/* Scatter points */}
                        <circle cx="20" cy="55" r="1.5" fill="#fff" />
                        <circle cx="40" cy="60" r="1.5" fill="#fff" />
                        <circle cx="60" cy="40" r="1.5" fill="#fff" />
                        <circle cx="80" cy="40" r="1.5" fill="#fff" />
                     </svg>

                     {/* Scanning Radar Element */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                        <div className="w-32 h-32 rounded-full border border-[#0EA5E9]/20 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                           <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent to-[#0EA5E9]/60 absolute top-1/2 left-1/2 origin-left" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Floating Spatial Map Card */}
              <motion.div 
                className="absolute -right-8 -top-6 w-64 h-auto bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-30"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: [0, -10, 0], opacity: 1 }}
                transition={{ y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 1, delay: 1 } }}
              >
                  <div className="text-[10px] text-[#00A8E8] uppercase tracking-widest font-mono mb-4 flex justify-between items-center">
                     <span>Sector 7G</span>
                     <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">ANOMALY</span>
                  </div>
                  {/* Decorative Map Grid */}
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                     {Array(20).fill(0).map((_, i) => (
                        <div key={i} className={`h-4 rounded-[2px] transition-colors duration-500 delay-${i*75} ${[7,8,12,13].includes(i) ? 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-white/[0.08]'}`} />
                     ))}
                  </div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest font-mono mt-3 border-t border-white/10 pt-2 text-right">
                    Spatial Analytics Engine
                  </div>
              </motion.div>

              {/* Floating Energy Node Card */}
              <motion.div 
                className="absolute -left-12 bottom-12 w-60 h-auto bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-30"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: [0, 8, 0], opacity: 1 }}
                transition={{ y: { duration: 5, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 1, delay: 1.2 } }}
              >
                 <div className="flex items-center gap-4 mb-5">
                    <div className="w-10 h-10 rounded-full border border-[#34D399]/40 bg-[#34D399]/10 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                       <Leaf className="w-5 h-5 text-[#34D399]" />
                    </div>
                    <div>
                        <div className="text-sm text-white/90 font-medium">Grid Balance</div>
                       <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Optimized State</div>
                    </div>
                 </div>
                 <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#00A8E8] to-[#34D399]" 
                      initial={{ width: 0 }}
                      whileInView={{ width: '78%' }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    />
                 </div>
                 <div className="flex justify-between items-center mt-3">
                    <div className="text-[10px] font-mono text-white/30">System Load</div>
                    <div className="text-[10px] font-mono text-[#34D399] font-bold">78% EFFICIENCY</div>
                 </div>
              </motion.div>
            </div>
            
            {/* Ambient Back Glow for The Terminal Arrays */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,168,232,0.12)_0%,transparent_50%)] pointer-events-none blur-[80px] -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-32 bg-[#0a0a0c] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,168,232,0.05)_0%,transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#00A8E8] mb-4">Core Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Powerful Features for
              <strong className="font-semibold text-white ml-2">Smart Cities</strong>
            </h2>
            <p className="text-lg text-white/40 max-w-3xl mx-auto leading-relaxed">
              Discover how our AI-powered platform transforms urban planning with cutting-edge technology and real-time inference.
            </p>
          </motion.div>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                number={feature.number}
                title={feature.title}
                description={feature.description}
                Icon={feature.Icon}
                index={index}
                onClick={
                  index === 0 ? onInfrastructureAnalyze :
                  index === 1 ? onRoadHousingPlanning :
                  index === 2 ? onDataVisualization :
                  index === 3 ? onUrbanGrowthPatterns :
                  index === 4 ? onSustainabilityGreenPlanning :
                  undefined
                }
                isClickable={index === 0 || index === 1 || index === 2 || index === 3 || index === 4}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Platform Architecture Section (How It Works) */}
      <section id="how-it-works" className="py-32 bg-[#050505] relative border-t border-white/[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,168,232,0.03)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#00A8E8] mb-4">Core Architecture</p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">Intelligence Pipeline</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto font-medium tracking-wide leading-relaxed">
              Three deterministic phases to process raw urban telemetry into capital-efficient sustainability policies.
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Minimalist vertical line */}
            <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent transform md:-translate-x-1/2"></div>
            
            <div className="space-y-20">
              {[
                {
                  number: "01",
                  title: "Telemetry & Sensor Fusion",
                  description: "Ingest structured and unstructured data from IoT endpoints, traffic grids, and emission sensors into a unified digital twin.",
                  icon: Network
                },
                {
                  number: "02", 
                  title: "Predictive ML Engine",
                  description: "Apply advanced forecasting models and anomaly detection to map out ecological risks and economic drift before they manifest.",
                  icon: Cpu
                },
                {
                  number: "03",
                  title: "Policy & Capital Optimization",
                  description: "Run real-time linear programming (LP) to calculate the most capital-efficient interventions for maximum sustainability impact.",
                  icon: Target
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className={`flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className={`md:w-1/2 ${index % 2 === 1 ? 'md:text-left' : 'md:text-right'} pl-16 md:pl-0`}>
                    <div className="inline-block px-3 py-1 mb-4 rounded border border-white/[0.05] bg-white/[0.02] text-[10px] font-mono tracking-widest text-[#00A8E8] uppercase">
                      Phase {step.number}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-medium text-white/90 mb-4 tracking-tight">{step.title}</h3>
                    <p className={`text-white/40 text-sm leading-relaxed max-w-sm ${index % 2 === 0 ? 'md:ml-auto' : ''}`}>{step.description}</p>
                  </div>

                  <div className="absolute left-0 md:static md:w-auto flex justify-center w-14">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-[#0f0f11] border border-white/10 flex items-center justify-center text-white relative z-10 shadow-[0_0_30px_rgba(0,168,232,0.15)]"
                      whileHover={{ scale: 1.1, borderColor: 'rgba(0,168,232,0.5)' }}
                    >
                      <step.icon className="w-5 h-5 text-[#00A8E8]" />
                    </motion.div>
                  </div>

                  <div className="hidden md:block md:w-1/2">
                    {/* Minimalist illustration abstract line */}
                    <div className={`h-[1px] w-1/3 bg-gradient-to-r from-transparent ${index % 2 === 0 ? 'via-white/10 to-transparent' : 'via-white/10 to-transparent'} ${index % 2 === 1 ? 'ml-auto' : ''}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Grade Metrics Simulation */}
      <section id="metrics" className="py-32 bg-[#0a0a0c] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-emerald-400 mb-4">Live Telemetry</p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">Real-Time Risk Diagnostics</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8 font-medium">
              Enterprise-grade dashboard preview. Monitor structural stress, emissions, and water safety margins live.
            </p>

            {/* Toggle Chips */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {['Energy Matrix', 'Hydrology', 'Emissions'].map((category) => (
                <motion.button
                  key={category}
                  className={`px-6 py-2 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-300 border ${
                    (activeMetricTab === 'Population' && category === 'Energy Matrix') ||
                    (activeMetricTab === 'Economy' && category === 'Emissions') ||
                    (activeMetricTab === 'Infrastructure' && category === 'Hydrology') 
                      ? 'bg-white/10 text-white border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                      : 'bg-[#0f0f11] text-white/40 border-white/5 hover:bg-white/5 hover:text-white/80'
                  }`}
                  onClick={() => setActiveMetricTab(category === 'Energy Matrix' ? 'Population' : category === 'Emissions' ? 'Economy' : 'Infrastructure')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  suppressHydrationWarning
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div 
            key={activeMetricTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Terminal Style Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#0f0f11] rounded-[24px] p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00A8E8]/50 to-transparent opacity-50" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-medium text-white/90">Stress Volatility</h3>
                  <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mt-1">15-Day Simulation</p>
                </div>
                <div className="flex gap-2">
                  <Activity className="w-5 h-5 text-[#00A8E8] animate-pulse" />
                </div>
              </div>

              <div className="h-64 relative w-full flex-grow">
                {/* Recharts / SVG substitute for aesthetic */}
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid-dark" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
                      <path d="M 0 20 L 40 20 L 40 0" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-dark)" />
                  
                  {/* Chart Path Line */}
                  <motion.path
                    d={
                      activeMetricTab === 'Population' ? "M 0,160 Q 40,150 80,180 T 160,110 T 240,140 T 320,60 T 400,90" :
                      activeMetricTab === 'Economy' ? "M 0,110 Q 60,100 120,60 T 240,150 T 320,80 T 400,40" :
                      "M 0,190 Q 60,170 120,180 T 240,100 T 320,120 T 400,50"
                    }
                    stroke={
                      activeMetricTab === 'Population' ? "#00A8E8" :
                      activeMetricTab === 'Economy' ? "#fb7185" :
                      "#34D399"
                    }
                    strokeWidth="3"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  
                  {/* Area Fill */}
                  <motion.path
                    d={
                      activeMetricTab === 'Population' ? "M 0,160 Q 40,150 80,180 T 160,110 T 240,140 T 320,60 T 400,90 L 400,200 L 0,200 Z" :
                      activeMetricTab === 'Economy' ? "M 0,110 Q 60,100 120,60 T 240,150 T 320,80 T 400,40 L 400,200 L 0,200 Z" :
                      "M 0,190 Q 60,170 120,180 T 240,100 T 320,120 T 400,50 L 400,200 L 0,200 Z"
                    }
                    fill={
                      activeMetricTab === 'Population' ? "url(#popArea)" :
                      activeMetricTab === 'Economy' ? "url(#ecoArea)" :
                      "url(#infArea)"
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                  />
                  
                  <defs>
                    <linearGradient id="popArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(0,168,232,0.3)" />
                      <stop offset="100%" stopColor="rgba(0,168,232,0)" />
                    </linearGradient>
                    <linearGradient id="ecoArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(251,113,133,0.3)" />
                      <stop offset="100%" stopColor="rgba(251,113,133,0)" />
                    </linearGradient>
                    <linearGradient id="infArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(52,211,153,0.3)" />
                      <stop offset="100%" stopColor="rgba(52,211,153,0)" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-x-0 bottom-0 border-t border-white/5 pt-2 flex justify-between text-[10px] text-white/30 font-mono">
                  <span>-15d</span><span>-10d</span><span>-5d</span><span>Now</span>
                </div>
              </div>
            </motion.div>

            {/* City Heatmap - Matrix Style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#0f0f11] rounded-[24px] p-8 border border-white/5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-medium text-white/90">Zonal Risk Grid</h3>
                   <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mt-1">Spatial Anomaly Map</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-white/40 uppercase">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-sm"></div> Critical</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Normal</div>
                </div>
              </div>
              
              <div className="grid grid-cols-8 gap-[2px] h-64 bg-[#050505] p-[2px] rounded-lg border border-white/5">
                {isClient && metricColors.length > 0 ? (
                  metricColors.map((backgroundColor, i) => {
                     // Override bright colors to fit dark mode better
                     const isEco = activeMetricTab === 'Economy';
                     const isPop = activeMetricTab === 'Population';
                     const randomLevel = Math.random();
                     let color = "rgba(255,255,255,0.02)";
                     
                     if (randomLevel > 0.85) color = isEco ? "rgba(251,113,133,0.8)" : isPop ? "rgba(0,168,232,0.8)" : "rgba(52,211,153,0.8)";
                     else if (randomLevel > 0.6) color = isEco ? "rgba(251,113,133,0.3)" : isPop ? "rgba(0,168,232,0.3)" : "rgba(52,211,153,0.3)";
                     else if (randomLevel > 0.3) color = "rgba(255,255,255,0.06)";

                     return (
                      <motion.div
                        key={`${activeMetricTab}-${i}`}
                        className="rounded-[2px] w-full h-full cursor-crosshair"
                        style={{ backgroundColor: color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: i * 0.005,
                        }}
                        whileHover={{ 
                          backgroundColor: "#fff",
                          boxShadow: '0 0 10px #fff',
                          transition: { duration: 0 }
                        }}
                      />
                     )
                  })
                ) : (
                  Array.from({ length: 64 }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="bg-white/5 rounded-[2px]" />
                  ))
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                 <span className="font-mono text-[10px] text-white/30">LAT: 28.6139</span>
                 <span className="font-mono text-[10px] text-white/30">LNG: 77.2090</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Trusted by Cities Worldwide</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how leading cities are transforming their urban planning processes
            </p>
          </motion.div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "City Planner, Singapore",
                content: "This platform revolutionized how we approach urban development. The AI insights are incredibly accurate.",
                rating: 5
              },
              {
                name: "Marcus Johnson", 
                role: "Urban Development, Toronto",
                content: "We've reduced planning time by 60% while improving decision quality. Absolutely game-changing.",
                rating: 5
              },
              {
                name: "Elena Rodriguez",
                role: "Smart City Director, Barcelona", 
                content: "The sustainability features helped us create more environmentally conscious development plans.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00A8E8] to-[#34D399] flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Band */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient Background with Rays */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #00A8E8 0%, #0EA5E9 50%, #34D399 100%)',
            backgroundSize: '300% 300%'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Subtle Rays */}
          <div className="absolute inset-0" 
               style={{
                 background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 1px, transparent 1px)',
                 backgroundSize: '100px 100px, 150px 150px'
               }}>
          </div>
        </motion.div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
          >
            Ready to Transform Your City?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/90 mb-12 leading-relaxed"
          >
            Join thousands of cities already using our AI platform to build smarter, more sustainable urban environments.
          </motion.p>

          <motion.div 
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            style={{ opacity: 1 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                size="lg"
                className="bg-white text-[#00A8E8] hover:bg-gray-100 px-12 py-4 rounded-full shadow-2xl font-semibold text-lg transition-all duration-300"
                suppressHydrationWarning
              >
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            
            <motion.a 
              href="#"
              className="text-white/90 hover:text-white font-medium underline-offset-4 hover:underline transition-all duration-200"
              whileHover={{ y: -2 }}
            >
              Schedule a consultation
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-white relative">
        {/* Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-[#00A8E8] to-[#34D399]"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <div className="text-2xl font-bold bg-gradient-to-r from-[#00A8E8] to-[#34D399] bg-clip-text text-transparent mb-4">
                InfraVision
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transforming urban planning with AI-powered insights for sustainable, efficient cities.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2">
                {['Features', 'Analytics', 'Integrations', 'API'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                {['Documentation', 'Case Studies', 'Blog', 'Support'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                {['About', 'Careers', 'Contact', 'Privacy'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="border-t border-gray-800 pt-12 mb-8">
            <div className="max-w-md mx-auto text-center">
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                  suppressHydrationWarning
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-[#00A8E8] to-[#34D399] rounded-full font-medium hover:shadow-lg transition-all duration-300"
                  suppressHydrationWarning
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 InfraVision. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}