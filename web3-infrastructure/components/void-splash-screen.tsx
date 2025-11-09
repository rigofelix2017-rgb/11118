import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { VoidStageGearsUnlocking } from './void-stages/void-stage-gears-unlocking.tsx';
import { VoidStage4Minigame } from './void-stages/void-stage4-minigame.tsx';
import { VoidStage5Portal } from './void-stages/void-stage5-portal.tsx';

export type VoidStage = 'gears' | 'minigame' | 'portal' | 'complete';

interface VoidSplashScreenProps {
  onComplete: () => void; // Called when intro completes and should show connection splash
}

export function VoidSplashScreen({ onComplete }: VoidSplashScreenProps) {
  const [currentStage, setCurrentStage] = useState<VoidStage>('gears');
  const [stageProgress, setStageProgress] = useState(0);
  const [isSkippable, setIsSkippable] = useState(false);
  const isAdvancing = useRef(false);

  // Enable skipping when minigame stage begins
  useEffect(() => {
    if (currentStage === 'minigame') {
      setIsSkippable(true);
    } else {
      setIsSkippable(false);
    }
  }, [currentStage]);

  // Show connection splash after portal stage completes
  useEffect(() => {
    if (currentStage === 'portal') {
      // Give a brief moment for portal animation then show connection splash
      const timer = setTimeout(() => {
        setCurrentStage('complete');
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, onComplete]);

  const nextStage = useCallback(() => {
    if (isAdvancing.current) return;
    isAdvancing.current = true;
    
    const stages: VoidStage[] = ['gears', 'minigame', 'portal'];
    const currentIndex = stages.indexOf(currentStage);
    
    if (currentIndex < stages.length - 1) {
      setCurrentStage(stages[currentIndex + 1]);
      setStageProgress(0);
      // Reset advancement flag after state update
      setTimeout(() => {
        isAdvancing.current = false;
      }, 100);
    } else {
      setCurrentStage('complete');
    }
  }, [currentStage]);

  const skipToConnectionSplash = useCallback(() => {
    if (isAdvancing.current) return;
    isAdvancing.current = true;
    
    // Skip directly to connection splash screen
    setCurrentStage('complete');
    onComplete();
    
    // Reset advancement flag after state update
    setTimeout(() => {
      isAdvancing.current = false;
    }, 100);
  }, [onComplete]);


  // Handle ESC key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSkippable) {
        skipToConnectionSplash();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSkippable, skipToConnectionSplash]);

  if (currentStage === 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Skip Button */}
      {isSkippable && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              '0 0 20px rgba(0, 255, 0, 0.3)',
              '0 0 30px rgba(0, 255, 0, 0.5)',
              '0 0 20px rgba(0, 255, 0, 0.3)'
            ]
          }}
          transition={{ 
            duration: 0.3,
            boxShadow: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 0 40px rgba(0, 255, 0, 0.7)',
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onClick={skipToConnectionSplash}
          className="absolute bottom-8 right-8 z-50 bg-black/90 border-2 border-retro-green text-retro-green font-mono font-bold px-6 py-3 rounded-lg hover:bg-retro-green/10 hover:text-retro-cyan transition-all duration-200 min-h-[44px] md:min-h-0 backdrop-blur-sm"
          style={{
            textShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 0, 0.9) 100%)'
          }}
          data-testid="button-skip-void-intro"
        >
          <span className="text-sm md:text-base">{'>>> SKIP <<<'}</span>
        </motion.button>
      )}

      {/* Stage Renderer */}
      <div className="w-full h-full">
        {currentStage === 'gears' && (
          <VoidStageGearsUnlocking
            key="gears"
            onNext={nextStage}
            progress={stageProgress}
            setProgress={setStageProgress}
          />
        )}
        
        {currentStage === 'minigame' && (
          <VoidStage4Minigame
            key="minigame"
            onNext={nextStage}
            progress={stageProgress}
            setProgress={setStageProgress}
          />
        )}
        
        {currentStage === 'portal' && (
          <div className="flex items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-retro-green font-mono text-2xl"
            >
              Entering the void...
            </motion.div>
          </div>
        )}
      </div>

    </div>
  );
}