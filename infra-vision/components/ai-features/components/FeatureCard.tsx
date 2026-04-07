'use client';

import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { MouseEvent } from 'react';

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
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 40 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: index * 0.1, type: 'spring', stiffness: 100, damping: 20 }}
      onMouseMove={handleMouseMove}
      onClick={isClickable ? onClick : undefined}
      className={`group relative h-[380px] w-full rounded-[32px] border border-white/[0.04] bg-[#050505] p-[1px] overflow-hidden ${isClickable ? 'cursor-pointer' : ''}`}
    >
      {/* 
        Mouse Spotlight / Border Glow Reveal
        It tracks the mouse and shines a soft cyan light on the border.
      */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[31px] transition duration-300 group-hover:opacity-100 opacity-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 168, 232, 0.5),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Deep Card Inner Container */}
      <div className="absolute inset-x-[1px] inset-y-[1px] z-10 rounded-[30px] bg-[#0a0a0c] lg:p-10 p-8 flex flex-col justify-between overflow-hidden transition-colors duration-500 group-hover:bg-[#0c0c0f]">
         
         {/* Inner ambient directional glow tied to mouse */}
         <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-screen"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                500px circle at ${mouseX}px ${mouseY}px,
                rgba(0, 168, 232, 0.06),
                transparent 80%
              )
            `,
          }}
        />

        {/* Abstract Background Texture Blur */}
        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[80px] transform translate-x-1/2 -translate-y-1/2 rounded-full w-[300px] h-[300px] bg-gradient-to-br from-[#0EA5E9]/20 to-transparent pointer-events-none"></div>

        {/* Header Area (Icon + Number Watermark) */}
        <div className="flex justify-between items-start z-10 relative">
           {/* Premium Glass Icon Container */}
           <div className="relative">
              <div className="absolute -inset-1.5 rounded-[20px] bg-gradient-to-b from-[#0EA5E9]/30 to-[#34D399]/10 opacity-0 group-hover:opacity-100 blur-lg transition-all duration-700"></div>
              <div className="w-16 h-16 rounded-[18px] bg-[#111113] border border-white/5 flex items-center justify-center relative shadow-[inset_0_1px_rgba(255,255,255,0.1),_0_8px_20px_rgba(0,0,0,0.5)] group-hover:border-[#0EA5E9]/40 transition-all duration-500 group-hover:bg-[#16161a]">
                 <Icon className="w-7 h-7 text-white/40 group-hover:text-white relative z-10 transition-colors duration-500 drop-shadow-[0_0_10px_rgba(0,168,232,0)] group-hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]" />
              </div>
           </div>

           {/* Bleeding Edge Massive Typography Number */}
           <div className="font-mono text-[90px] font-black leading-none absolute -right-6 -top-10 text-white/[0.015] group-hover:text-white/[0.04] transition-colors duration-700 pointer-events-none select-none tracking-tighter">
              {number.replace('.', '')}
           </div>
        </div>

        {/* Text Content */}
        <div className="z-10 relative mt-auto">
          <h3 className="text-2xl lg:text-[28px] font-medium tracking-tight text-white/80 group-hover:text-white transition-colors duration-300 mb-4 leading-tight">
             {title}
          </h3>
          <p className="text-white/40 group-hover:text-white/60 leading-relaxed text-[15px] font-light transition-colors duration-500 mb-6">
             {description}
          </p>
          
          <div className="h-[24px] overflow-hidden">
             <div className="flex items-center space-x-2 text-[#0EA5E9] transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
               <span className="text-[11px] uppercase font-bold tracking-[0.25em]">Deploy Module</span>
               <motion.svg 
                 width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                 initial={{ x: 0 }}
                 animate={{ x: [0, 5, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
               >
                 <path d="M5 12h14"></path>
                 <path d="M12 5l7 7-7 7"></path>
               </motion.svg>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
