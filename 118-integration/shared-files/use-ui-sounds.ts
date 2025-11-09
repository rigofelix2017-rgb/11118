import { useGlobalAudioPlayer } from '@/components/global-audio-player';

/**
 * Custom hook for accessing UI feedback sounds
 * 
 * Provides easy access to all UI interaction sounds from any component.
 * Integrates with the global audio player system.
 * 
 * USAGE:
 * ```tsx
 * const { playButtonClick, playVoidAmbience, isAvailable } = useUISounds();
 * 
 * <button onClick={() => {
 *   playButtonClick();
 *   handleAction();
 * }}>
 *   Click Me
 * </button>
 * ```
 * 
 * FEATURES:
 * - Button interaction sounds (click, cancel, destructive)
 * - Wallet connection sounds (success, failure)
 * - Modal interaction sounds (open, close, tab switch)
 * - Input interaction sounds (focus, hover)
 * - Void sound effects (ambience, whispers, reality tears)
 * - Availability check (returns false if audio player not loaded)
 * 
 * NOTE: Requires global-audio-player component to be mounted in the app
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
