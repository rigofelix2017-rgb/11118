import { useGlobalAudioPlayer } from '@/components/global-audio-player';

/**
 * Custom hook for accessing UI feedback sounds
 * Provides easy access to all UI interaction sounds from any component
 */
export function useUISounds() {
  const { audioPlayer } = useGlobalAudioPlayer();

  return {
    // Button interaction sounds
    playButtonClick: () => audioPlayer?.playButtonClick(),
    playCancelClick: () => audioPlayer?.playCancelClick(),
    playDestructiveClick: () => audioPlayer?.playDestructiveClick(),
    
    // Wallet connection sounds
    playWalletConnectSuccess: () => audioPlayer?.playWalletConnectSuccess(),
    playWalletConnectFailure: () => audioPlayer?.playWalletConnectFailure(),
    
    // Modal interaction sounds
    playModalOpen: () => audioPlayer?.playModalOpen(),
    playModalClose: () => audioPlayer?.playModalClose(),
    playTabSwitch: () => audioPlayer?.playTabSwitch(),
    
    // Input interaction sounds
    playInputFocus: () => audioPlayer?.playInputFocus(),
    playHoverSound: () => audioPlayer?.playHoverSound(),
    
    // Void sound effects
    playVoidAmbience: (intensity?: number, duration?: number) => audioPlayer?.playVoidAmbience(intensity, duration),
    playConsciousnessFragment: () => audioPlayer?.playConsciousnessFragment(),
    playRealityTear: () => audioPlayer?.playRealityTear(),
    playVoidWhisper: () => audioPlayer?.playVoidWhisper(),
    
    // Check if audio player is available
    isAvailable: !!audioPlayer,
  };
}