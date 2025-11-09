import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BetaNoticeModalProps {
  onAcknowledge: () => void;
}

export function BetaNoticeModal({ onAcknowledge }: BetaNoticeModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
      data-testid="beta-notice-modal"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-retro-black border-4 border-retro-green p-8 max-w-lg w-full text-center relative"
        style={{
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)'
        }}
      >
        {/* Terminal-style header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-b-2 border-retro-green mb-6 pb-2"
        >
          <div className="text-retro-green font-mono text-sm">
            &gt; SYSTEM_NOTICE.exe
          </div>
        </motion.div>

        {/* Beta warning text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-8"
        >
          <h2 className="text-retro-green font-mono text-xl font-bold mb-4">
            [ EARLY ACCESS WARNING ]
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-retro-cyan font-mono text-lg leading-relaxed"
          >
            This is an early open beta.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-yellow-400 font-mono text-lg leading-relaxed"
          >
            Things will break.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-retro-green font-mono text-lg leading-relaxed"
          >
            But it will get better.
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
            className="retro-button bg-retro-black border-4 border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black font-mono font-bold text-lg px-8 py-4 transition-all duration-200"
            data-testid="button-acknowledge-beta"
          >
            [ ENTER THE VOID ]
          </Button>
        </motion.div>

        {/* Retro terminal effects */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ delay: 1, duration: 2, repeat: Infinity }}
          className="absolute top-2 right-2 text-retro-green font-mono text-xs"
        >
          ●
        </motion.div>
      </motion.div>
    </motion.div>
  );
}