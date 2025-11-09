// Floating Systems Hub Button - Quick access to all 11 core systems
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, Sparkles } from 'lucide-react';

interface SystemsHubButtonProps {
  onClick: () => void;
  isMobile?: boolean;
}

export function SystemsHubButton({ onClick, isMobile = false }: SystemsHubButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        fixed z-40 group
        ${isMobile 
          ? 'bottom-24 right-4 w-16 h-16' 
          : 'bottom-6 right-6 w-14 h-14'
        }
        rounded-2xl
        bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500
        hover:from-purple-600 hover:via-pink-600 hover:to-orange-600
        shadow-2xl hover:shadow-purple-500/50
        border-2 border-white/20
        flex items-center justify-center
        transition-all duration-300
        overflow-hidden
      `}
      style={{
        boxShadow: isHovered 
          ? '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)'
          : '0 10px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-white/40"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center">
        <Grid3x3 className={`${isMobile ? 'w-8 h-8' : 'w-7 h-7'} text-white`} />
        
        {/* Sparkle effect */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </motion.div>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
        className="absolute right-full mr-3 px-4 py-2 rounded-lg bg-black/90 border border-purple-400/50 whitespace-nowrap pointer-events-none"
      >
        <div className="text-sm font-bold text-white">Systems Hub</div>
        <div className="text-xs text-gray-400 mt-0.5">
          Press <span className="font-mono bg-white/10 px-1 rounded">S</span> or click
        </div>
        <div className="text-xs text-purple-300 mt-1">11 core systems</div>
      </motion.div>

      {/* Badge indicator */}
      <motion.div
        className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-xs font-black text-white">11</span>
      </motion.div>
    </motion.button>
  );
}
