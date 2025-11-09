import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WalletConnectionModal } from '../wallet-connection-modal';

interface VoidStage5Props {
  onWalletConnect: (walletData: { address: string; signature: string; message: string }) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

export function VoidStage5Portal({ onWalletConnect, progress, setProgress }: VoidStage5Props) {
  const [portalOpen, setPortalOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    // Start portal animation
    setProgress(25);
    setTimeout(() => {
      setPortalOpen(true);
      setProgress(50);
      
      // Show wallet modal after portal opens
      setTimeout(() => {
        setShowWalletModal(true);
        setProgress(75);
      }, 1500);
    }, 1000);
  }, [setProgress]);

  const handleWalletConnect = (walletData: { address: string; signature: string; message: string }) => {
    setProgress(100);
    // Keep portal open during transition to prevent black screen
    // Portal implosion effect will play while transitioning
    onWalletConnect(walletData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden"
      data-testid="void-stage-portal"
    >
      {/* Portal Background Effect */}
      <motion.div
        animate={{
          scale: portalOpen ? [1, 1.2, 1] : 0,
          rotate: [0, 360],
          opacity: portalOpen ? [0.3, 0.6, 0.3] : 0,
        }}
        transition={{
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute inset-0 bg-gradient-radial from-retro-cyan/20 via-retro-green/10 to-transparent"
      />

      {/* Spinning Portal Rings */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            rotate: portalOpen ? [0, 360] : 0,
            scale: portalOpen ? 1 : 0,
            opacity: portalOpen ? 0.8 - (i * 0.15) : 0,
          }}
          transition={{
            rotate: { duration: 8 - i, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, delay: i * 0.2 },
            opacity: { duration: 1, delay: i * 0.2 }
          }}
          className="absolute border-2 border-retro-green rounded-full"
          style={{
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
          }}
        />
      ))}

      {/* Portal Center Glow */}
      <motion.div
        animate={{
          scale: portalOpen ? [1, 1.5, 1] : 0,
          opacity: portalOpen ? [0.5, 1, 0.5] : 0,
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute w-32 h-32 bg-retro-green rounded-full blur-xl"
      />

      {/* Particle Streams */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: '50vw', y: '50vh' }}
            animate={portalOpen ? {
              scale: [0, 1, 0],
              x: [`50vw`, `${50 + Math.cos(i * 0.2) * 40}vw`],
              y: [`50vh`, `${50 + Math.sin(i * 0.2) * 40}vh`],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
            className="absolute w-1 h-1 bg-retro-cyan rounded-full"
          />
        ))}
      </div>

      {/* Portal Title */}
      <div>
        {portalOpen && !showWalletModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-1/4 text-center z-10"
          >
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 10px #00ff00',
                  '0 0 30px #00ff00, 0 0 40px #00ffff',
                  '0 0 10px #00ff00'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-3xl md:text-5xl font-mono font-bold text-retro-green mb-4"
            >
              VOID PORTAL ACTIVE
            </motion.h1>
            <p className="text-retro-cyan font-mono text-sm">
              Dimensional gateway established...
            </p>
          </motion.div>
        )}
      </div>

      {/* Wallet Connection Modal */}
      <div>
        {showWalletModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20"
          >
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" />
            <div className="relative z-10 h-full flex items-center justify-center">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 255, 0, 0.3)',
                    '0 0 40px rgba(0, 255, 0, 0.6)',
                    '0 0 20px rgba(0, 255, 0, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-black/90 p-8 border-2 border-retro-green rounded-lg max-w-md mx-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-mono text-retro-green mb-2">
                    ENTER THE VOID
                  </h2>
                  <p className="text-sm font-mono text-retro-cyan">
                    Connect your consciousness to proceed
                  </p>
                </div>
                <WalletConnectionModal
                  isOpen={true}
                  onConnect={handleWalletConnect}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Portal Implosion Effect */}
      {progress === 100 && (
        <motion.div
          animate={{
            scale: [1, 0],
            rotate: [0, -360],
          }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-radial from-retro-green via-transparent to-transparent"
        />
      )}
    </motion.div>
  );
}