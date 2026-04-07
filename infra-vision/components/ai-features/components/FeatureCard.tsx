'use client';

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  index: number;
  onClick?: () => void;
  isClickable?: boolean;
}

export function FeatureCard({ number, title, description, Icon, index, onClick, isClickable }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.3 }
      }}
      onClick={isClickable ? onClick : undefined}
      className={`group relative overflow-hidden h-full rounded-[24px] ${isClickable ? 'cursor-pointer' : ''}`}
    >
      {/* Background card layer */}
      <div 
        className="bg-[#0f0f11] rounded-[24px] p-6 lg:p-10 border border-white/5 relative overflow-hidden transition-all duration-300 h-full min-h-[320px] flex flex-col group-hover:border-white/10 group-hover:bg-[#131316]"
      >
        {/* Subtle Ambient Hover Glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[24px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,168,232,0.06) 0%, transparent 60%)'
          }}
        />
        
        {/* Animated Top Border Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00A8E8]/0 to-transparent group-hover:via-[#00A8E8]/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Icon and Number Header */}
          <div className="flex items-start justify-between mb-8 lg:mb-12">
            <motion.div
              whileHover={{ 
                scale: 1.05, 
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-[14px] bg-white/[0.03] border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-[#00A8E8]/40 transition-colors duration-300"
            >
              <div className="absolute inset-0 bg-[#00A8E8]/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
              <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white/70 group-hover:text-[#00A8E8] relative z-10 transition-colors duration-300" />
            </motion.div>
            
            <div className="text-[10px] font-mono tracking-[0.25em] text-white/20 group-hover:text-white/40 transition-colors duration-300 border border-white/5 px-2 py-1 rounded">
              PHASE {number.replace('.', '')}
            </div>
          </div>
          
          {/* Text Content */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl lg:text-2xl font-light text-white/90 group-hover:text-white transition-colors duration-300 tracking-tight leading-tight mb-4">
              {title}
            </h3>
            
            <p className="text-white/40 group-hover:text-white/60 leading-relaxed text-sm lg:text-base transition-colors duration-300 flex-1">
              {description}
            </p>
            
            {/* Clickable Explore Arrow */}
            {isClickable && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ x: 4 }}
                className="group-hover:opacity-100 group-hover:x-0 opacity-0 transition-all duration-300 mt-8 flex items-center gap-2"
              >
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#00A8E8]">Engage</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00A8E8]">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
