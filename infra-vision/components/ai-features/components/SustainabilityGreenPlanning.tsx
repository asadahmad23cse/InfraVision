'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { ArrowLeft, Leaf, Target, TreePine, Recycle, Activity, BarChart4, MapPin, Zap, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ai-features/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface SustainabilityGreenPlanningProps {
  onBack: () => void;
}

const featureCards = [
  {
    title: "Carbon Footprint Analysis",
    description: "AI-driven tracking of city emissions and reduction strategies. Monitor CO2 levels, identify pollution sources, and implement targeted interventions for cleaner air quality.",
    Icon: Target,
    gradient: "from-green-500 to-emerald-400"
  },
  {
    title: "Green Space Optimization", 
    description: "Mapping and planning for parks, tree cover, and urban greenery. Maximize biodiversity and air quality while creating beautiful, accessible recreational spaces for residents.",
    Icon: TreePine,
    gradient: "from-emerald-500 to-teal-400"
  },
  {
    title: "Sustainable Resource Management",
    description: "AI-powered optimization of water, energy, and waste systems. Reduce consumption, minimize waste, and create circular economy solutions for sustainable urban living.",
    Icon: Recycle,
    gradient: "from-teal-500 to-cyan-400"
  },
  {
    title: "Eco Impact Forecasting",
    description: "Predictive analytics for long-term environmental impact of city policies. Model climate scenarios and assess sustainability outcomes before implementation.",
    Icon: Activity,
    gradient: "from-cyan-500 to-blue-400"
  }
];

const chartPlaceholders = [
  {
    title: "CO2 Emission Trends",
    description: "Monthly carbon footprint tracking",
    Icon: BarChart4,
    color: "from-red-400 to-orange-400"
  },
  {
    title: "Green Space Coverage",
    description: "Parks and greenery per capita",
    Icon: MapPin,
    color: "from-green-400 to-emerald-400"
  },
  {
    title: "Energy Efficiency",
    description: "Renewable energy usage metrics",
    Icon: Zap,
    color: "from-yellow-400 to-orange-400"
  }
];

export function SustainabilityGreenPlanning({ onBack }: SustainabilityGreenPlanningProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [particleData, setParticleData] = useState<Array<{
    left: number;
    top: number;
    duration: number;
    delay: number;
  }>>([]);
  const { scrollYProgress } = useScroll();
  
  // Smooth mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  // Scroll-based animations
  const headerY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // Generate deterministic particle data on client only
  useEffect(() => {
    setIsClient(true);
    
    // Generate deterministic particle positions based on index
    const particles = Array.from({ length: 20 }, (_, i) => {
      // Use index to create deterministic values
      const seed = i * 7; // Prime number for better distribution
      return {
        left: (seed * 11) % 100, // Deterministic left position
        top: (seed * 13) % 100,  // Deterministic top position
        duration: 3 + ((seed % 10) / 5), // Duration between 3-5
        delay: (seed % 20) / 10  // Delay between 0-2
      };
    });
    setParticleData(particles);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePosition({ x: clientX, y: clientY });
      mouseX.set(clientX);
      mouseY.set(clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-900 relative overflow-hidden">
      {/* Dynamic Background Pattern */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(22,163,74,0.3) 1px, transparent 1px),
            linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px),
            radial-gradient(circle at 20% 20%, rgba(52,211,153,0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px, 40px 40px, 80px 80px'
        }}>
      </motion.div>

      {/* Floating Particles - Only render on client with deterministic values */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden">
          {particleData.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Header Section with Animated Gradient Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ y: headerY, opacity: headerOpacity }}
        className="relative"
      >
        {/* Animated Gradient Banner Background */}
        <motion.div 
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #16A34A 0%, #0EA5E9 50%, #34D399 100%)',
            backgroundSize: '300% 300%'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Wave Shimmer Effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-20deg)'
            }}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Soft glowing effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 py-8">
            {/* Sustainability Intelligence CTA */}
            <Link href="/sustainability-intelligence">
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-8 h-8 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Sustainability Intelligence System</p>
                    <p className="text-sm text-white/80">Full decision-support dashboard for Delhi planners — Water, Energy, Waste, Green Space, Carbon, Policy Simulator</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white/80" />
              </div>
            </Link>
            {/* Back Navigation */}
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-white hover:bg-white/20 transition-colors mb-6 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Features
            </Button>

            {/* Header Content */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                {/* Glowing Ring Animation around Icon */}
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.6), transparent)',
                    }}
                    animate={{
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                  <motion.div
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(255,255,255,0.3)',
                        '0 0 40px rgba(255,255,255,0.6)',
                        '0 0 20px rgba(255,255,255,0.3)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    >
                      <Leaf className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Scroll-based Fade-in Title and Subtitle */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-white mb-4"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                Sustainability & Green Planning
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-white/90 max-w-3xl mx-auto"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                AI-powered solutions for eco-friendly smart cities
              </motion.p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {featureCards.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ 
                y: -12,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              style={{
                transform: `translateX(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.01}px) translateY(${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * 0.01}px)`
              }}
              className="group relative overflow-hidden"
            >
              {/* Glassmorphism Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 relative overflow-hidden shadow-2xl hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500">
                {/* Neon Glow Border */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(22,163,74,0.6), rgba(14,165,233,0.6), rgba(52,211,153,0.6))',
                    backgroundSize: '300% 300%'
                  }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                
                {/* Hover glow effects */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#16A34A]/20 via-[#0EA5E9]/20 to-[#34D399]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                <motion.div 
                  className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-emerald-400/50 transition-all duration-500"
                  whileHover={{
                    boxShadow: '0 0 30px rgba(52,211,153,0.6)'
                  }}
                ></motion.div>
              
                <div className="relative z-10">
                  {/* Enhanced Icon with Micro-interactions */}
                  <motion.div
                    whileHover={{ 
                      scale: 1.15, 
                      rotate: [0, 5, -5, 0],
                      transition: { duration: 0.5 }
                    }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg relative overflow-hidden group-hover:shadow-2xl`}
                  >
                    {/* Icon Pulse Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(52,211,153,0.4)',
                          '0 0 0 10px rgba(52,211,153,0)',
                          '0 0 0 0 rgba(52,211,153,0.4)'
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                    <motion.div
                      whileHover={{
                        rotate: 360
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.Icon className="w-8 h-8 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-emerald-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Animated Explore Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="group-hover:opacity-100 opacity-0 transition-all duration-300"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group/btn"
                    >
                      {/* Ripple Effect */}
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ scale: 0, opacity: 1 }}
                        whileTap={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      <span className="relative z-10 flex items-center gap-2">
                        Explore
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </span>
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Visualization Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-white mb-4"
              style={{
                textShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              Environmental Analytics Dashboard
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-300 max-w-2xl mx-auto"
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              Interactive visualizations for tracking sustainability metrics and environmental KPIs
            </motion.p>
          </div>

          {/* Enhanced Chart Placeholders - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {chartPlaceholders.map((chart, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
                style={{
                  transform: `translateX(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.005}px) translateY(${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * 0.005}px)`
                }}
              >
                {/* Glassmorphism Chart Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500">
                  {/* Neon Border Animation */}
                  <motion.div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${chart.color.replace('from-', 'rgba(').replace(' to-', ', 0.6), rgba(').replace('-400', ')').replace('-500', ')')}, 0.6))`
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 0 1px rgba(52,211,153,0.3)',
                        '0 0 0 2px rgba(52,211,153,0.6)',
                        '0 0 0 1px rgba(52,211,153,0.3)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div 
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${chart.color} flex items-center justify-center shadow-lg`}
                        whileHover={{
                          rotate: 360,
                          scale: 1.1
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        <chart.Icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors duration-300">{chart.title}</h3>
                        <p className="text-sm text-gray-300">{chart.description}</p>
                      </div>
                    </div>
                    
                    {/* Animated Chart Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg flex items-center justify-center border border-gray-600/30 relative overflow-hidden">
                      {/* Animated Chart Bars */}
                      <div className="flex items-end justify-center gap-2 h-24">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={`w-3 bg-gradient-to-t ${chart.color} rounded-t`}
                            initial={{ height: 0 }}
                            animate={{ 
                              height: [0, 50, 45] // Deterministic height values
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: 'easeInOut'
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Glowing Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        animate={{
                          x: ['-100%', '200%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Premium Engagement Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-center"
        >
          {/* Premium Callout Box with Gradient Border Glow */}
          <div className="relative">
            {/* Gradient Border Glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl blur-xl"
              style={{
                background: 'linear-gradient(135deg, #16A34A, #0EA5E9, #34D399)',
                backgroundSize: '300% 300%'
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 relative overflow-hidden">
              {/* Enhanced Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 20%, rgba(22,163,74,0.4) 2px, transparent 2px),
                    radial-gradient(circle at 80% 80%, rgba(14,165,233,0.4) 2px, transparent 2px),
                    radial-gradient(circle at 40% 60%, rgba(52,211,153,0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px, 80px 80px, 40px 40px'
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl relative"
                    animate={{
                      boxShadow: [
                        '0 0 30px rgba(52,211,153,0.6)',
                        '0 0 50px rgba(52,211,153,0.8)',
                        '0 0 30px rgba(52,211,153,0.6)'
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    >
                      <Leaf className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                </div>
                
                <motion.h2 
                  className="text-3xl font-bold text-white mb-6"
                  style={{
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  Coming Soon: Advanced Eco-Planning Dashboard
                </motion.h2>
                <motion.p 
                  className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  with Live Environmental KPIs
                </motion.p>
                
                {/* Enhanced Glowing Gradient Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.button
                    className="relative bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-16 py-4 rounded-xl text-lg font-semibold shadow-2xl transition-all duration-300 overflow-hidden group/cta"
                    whileHover={{
                      boxShadow: [
                        '0 20px 40px rgba(52,211,153,0.4)',
                        '0 25px 50px rgba(52,211,153,0.6)',
                        '0 20px 40px rgba(52,211,153,0.4)'
                      ]
                    }}
                    animate={{
                      boxShadow: [
                        '0 10px 30px rgba(52,211,153,0.3)',
                        '0 15px 40px rgba(52,211,153,0.5)',
                        '0 10px 30px rgba(52,211,153,0.3)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    {/* Button Background Animation */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Ripple Effect */}
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ scale: 0, opacity: 1 }}
                      whileTap={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                    
                    <span className="relative z-10 flex items-center gap-3">
                      Join Eco Initiative
                      <motion.div
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}