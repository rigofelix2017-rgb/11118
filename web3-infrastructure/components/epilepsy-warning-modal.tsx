import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface EpilepsyWarningModalProps {
  onAcknowledge: () => void;
}

export function EpilepsyWarningModal({ onAcknowledge }: EpilepsyWarningModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
      data-testid="epilepsy-warning-modal"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-retro-black border-4 border-yellow-500 p-4 md:p-8 max-w-lg w-full text-center relative"
        style={{
          boxShadow: '0 0 20px rgba(255, 255, 0, 0.3), inset 0 0 20px rgba(255, 255, 0, 0.1)'
        }}
      >
        {/* Terminal-style header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-b-2 border-yellow-500 mb-4 md:mb-6 pb-2"
        >
          <div className="text-yellow-500 font-mono text-sm">
            &gt; HEALTH_WARNING.exe
          </div>
        </motion.div>

        {/* Warning icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mb-6"
        >
          <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 mx-auto" />
        </motion.div>

        {/* Epilepsy warning text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 md:space-y-4 mb-6 md:mb-8"
        >
          <h2 className="text-yellow-500 font-mono text-lg md:text-xl font-bold mb-4">
            [ EPILEPSY WARNING ]
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-yellow-400 font-mono text-sm md:text-lg leading-relaxed"
          >
            This experience contains flashing lights
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-red-400 font-mono text-sm md:text-lg leading-relaxed font-bold"
          >
            that may trigger seizures
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-yellow-500 font-mono text-sm leading-relaxed"
          >
            If you have photosensitive epilepsy, please do not continue.
          </motion.p>
        </motion.div>

        {/* Acknowledge button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onAcknowledge}
            className="retro-button bg-retro-black border-4 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-retro-black font-mono font-bold text-sm md:text-lg px-4 md:px-8 py-3 md:py-4 transition-all duration-200"
            data-testid="button-acknowledge-epilepsy"
          >
            <span className="hidden md:inline">[ I UNDERSTAND - CONTINUE ]</span>
            <span className="md:hidden">[ CONTINUE ]</span>
          </Button>
        </motion.div>

        {/* Retro terminal effects */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ delay: 1, duration: 2, repeat: Infinity }}
          className="absolute top-2 right-2 text-yellow-500 font-mono text-xs"
        >
          ⚠
        </motion.div>
      </motion.div>
    </motion.div>
  );
}