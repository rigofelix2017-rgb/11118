import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUISounds } from '@/hooks/use-ui-sounds';

interface VoidStage1Props {
  onNext: () => void;
  progress: number;
  setProgress: (progress: number) => void;
}

export function VoidStage1Awakening({ onNext, progress, setProgress }: VoidStage1Props) {
  const [clicked, setClicked] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { playVoidAmbience, playRealityTear, playVoidWhisper } = useUISounds();

  // Start void ambience when component mounts
  useEffect(() => {
    // Start subtle void ambience for atmosphere
    playVoidAmbience?.(0.3, 15); // Low intensity, 15 second duration
  }, [playVoidAmbience]);

  const handleClick = (e: React.MouseEvent) => {
    if (clicked) return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    setClicked(true);
    setProgress(100);

    // Play reality tear effect when reaching into the void
    playRealityTear?.();
    
    // Also play void whisper after a delay for atmospheric effect
    setTimeout(() => {
      playVoidWhisper?.();
    }, 500);
    
    setTimeout(() => {
      onNext();
    }, 2000);
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex items-center justify-center cursor-pointer relative overflow-hidden"
      onClick={handleClick}
      data-testid="void-stage-awakening"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-black" />

      {/* Main text with gentle breathing */}
      <div className="text-center z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ 
            duration: 1.5, 
            delay: 0.5,
            ease: "easeOut"
          }}
          className="text-retro-green text-lg md:text-xl font-mono"
        >
          You sense... something
        </motion.div>
        
        {/* Instruction text with simple fade-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ 
            duration: 1.5, 
            delay: 2,
            ease: "easeOut"
          }}
          className="text-retro-green text-sm font-mono mt-4"
        >
          [Click to reach into the void]
        </motion.div>
      </div>

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute border border-retro-green rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
          }}
        />
      ))}

      {/* Void glimpses after click */}
      {clicked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute inset-0 bg-gradient-radial from-retro-green/10 via-transparent to-transparent"
        />
      )}
    </motion.div>
  );
}