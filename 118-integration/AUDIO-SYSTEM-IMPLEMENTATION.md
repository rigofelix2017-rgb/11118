# Audio System Implementation Guide

## Overview

The audio system provides comprehensive sound effects and music playback for the entire application:
- **UI Feedback Sounds**: Button clicks, wallet connections, modals, inputs
- **Game Sound Effects**: Walking, ring blasts, tips, ascensions
- **Void Atmosphere**: Ambience, whispers, reality tears, consciousness fragments
- **Global Jukebox**: Synchronized YouTube music playback across all players
- **Synthesis Engine**: Procedural audio generation for dynamic effects

## 🗂️ File Locations

### Core Files (void2/client/src/)
- `lib/audio-player.ts` (456 lines) - Main audio engine
- `components/global-audio-player.tsx` (341 lines) - React context provider
- `lib/synth-audio-engine.ts` - Procedural synthesis engine
- `hooks/use-ui-sounds.ts` ✅ UPLOADED (Task 3) - React hook for UI sounds

### Integration Files
- `118-integration/shared-files/use-ui-sounds.ts` ✅ UPLOADED
- `118-integration/01-jukebox-system/` - Jukebox implementation
- `web3-infrastructure/` - May need audio integration

## 🎵 Audio System Architecture

```
GlobalAudioPlayerProvider (React Context)
├── AudioPlayer Instance (Main Engine)
│   ├── Walking Sound (grass_*.wav)
│   ├── Monk Ascension (synthesis)
│   ├── Alien Whispers (alien-whispers.mp3)
│   ├── Computer Startup (computer-startup.mp3)
│   ├── Ring Blast (synthesis + ring blast_*.mp3)
│   └── Jukebox Player (hidden YouTube iframe)
│
├── SynthAudioEngine (Procedural Audio)
│   ├── Ring Blast Synthesis (with collaboration scaling)
│   ├── Tip Sound Synthesis (amount-based pitch)
│   ├── Monk Ascension Synthesis (ethereal tones)
│   ├── UI Sound Synthesis (clicks, modals, tabs)
│   ├── Void Effects (ambience, whispers, tears)
│   └── Crystal Resonance (magical shimmer)
│
└── YouTube Player API (Global Jukebox)
    ├── Server-Synchronized Playback (Void Monk timing)
    ├── Automatic Song Progression
    ├── Drift Correction (15s intervals)
    └── Hidden iframe (audio-only)
```

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-query
```

### Step 2: Add GlobalAudioPlayerProvider to App Root

```tsx
import { GlobalAudioPlayerProvider } from '@/components/global-audio-player';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalAudioPlayerProvider>
        {/* Your app content */}
        <YourMainApp />
      </GlobalAudioPlayerProvider>
    </QueryClientProvider>
  );
}
```

### Step 3: Use Audio in Components

```tsx
import { useUISounds } from '@/hooks/use-ui-sounds';
// OR from 118-integration:
// import { useUISounds } from '@/118-integration/shared-files/use-ui-sounds';

function MyButton() {
  const { playButtonClick, isAvailable } = useUISounds();
  
  return (
    <button onClick={() => {
      playButtonClick(); // Play click sound
      handleAction();
    }}>
      Click Me
    </button>
  );
}
```

## 🎨 Audio Categories

### 1. UI Feedback Sounds

**Purpose**: Provide tactile audio feedback for user interactions

**Available Methods**:
```typescript
const sounds = useUISounds();

// Button interactions
sounds.playButtonClick();        // Primary button click
sounds.playCancelClick();        // Cancel/close button
sounds.playDestructiveClick();   // Warning for destructive actions

// Wallet interactions
sounds.playWalletConnectSuccess(); // Wallet connected
sounds.playWalletConnectFailure(); // Connection failed

// Modal interactions
sounds.playModalOpen();          // Modal opened
sounds.playModalClose();         // Modal closed
sounds.playTabSwitch();          // Tab changed

// Input interactions
sounds.playInputFocus();         // Input field focused
sounds.playHoverSound();         // Element hovered
```

**Usage Example**:
```tsx
function ConnectWalletButton() {
  const { playButtonClick, playWalletConnectSuccess, playWalletConnectFailure } = useUISounds();
  
  const handleConnect = async () => {
    playButtonClick();
    
    try {
      await connectWallet();
      playWalletConnectSuccess(); // Success sound
    } catch (error) {
      playWalletConnectFailure(); // Failure sound
    }
  };
  
  return <button onClick={handleConnect}>Connect Wallet</button>;
}
```

### 2. Game Sound Effects

**Purpose**: Immersive sound effects for game interactions

**Available Methods**:
```typescript
audioPlayer.startWalkingSound();              // Walking (grass sound)
audioPlayer.playRingBlast();                   // Ring blast effect
audioPlayer.playRingBlastWithCollaboration(3); // Collaborative ring (3 players)
audioPlayer.playTipSound(100);                 // Tip animation (amount-based)
audioPlayer.playMonkAscension();               // Golden ascendancy
audioPlayer.playJukeboxClick();                // Jukebox interaction
```

**Walking Sound (Auto-Managed)**:
```typescript
// In game movement handler:
function handlePlayerMove(newPosition: Position) {
  audioPlayer.onPlayerMove(); // Plays walking sound with 200ms cooldown
  updatePosition(newPosition);
}
```

**Ring Blast with Collaboration Scaling**:
```typescript
// Single player ring blast
audioPlayer.playRingBlast();

// Collaborative ring blast (scales with player count)
const collaboratorCount = 5;
audioPlayer.playRingBlastWithCollaboration(collaboratorCount);
// Frequency: 200Hz + (collaboratorCount * 50Hz)
// Volume: 0.3 + (collaboratorCount * 0.1)
// Duration: 800ms + (collaboratorCount * 200ms)
```

**Tip Sound (Amount-Based Pitch)**:
```typescript
// Small tip (low pitch)
audioPlayer.playTipSound(10);

// Medium tip (mid pitch)
audioPlayer.playTipSound(100);

// Large tip (high pitch)
audioPlayer.playTipSound(1000);
// Pitch scales with amount for audio feedback
```

### 3. Void Atmosphere

**Purpose**: Create immersive void atmosphere with synthesized effects

**Available Methods**:
```typescript
const sounds = useUISounds();

// Void ambience (layered atmospheric sounds)
sounds.playVoidAmbience(1.0, 30);  // intensity, duration (seconds)
// intensity: 0.0 - 2.0 (higher = more intense)
// duration: seconds to play

// Consciousness fragment (sparkle effect)
sounds.playConsciousnessFragment(); // For void stage 4 minigame

// Reality tear (distortion effect)
sounds.playRealityTear(); // Void breakthrough moments

// Void whisper (ethereal whisper)
sounds.playVoidWhisper(); // Atmospheric effect
```

**Void Stage Integration**:
```tsx
function VoidStage4Minigame() {
  const { playVoidAmbience, playConsciousnessFragment } = useUISounds();
  
  useEffect(() => {
    // Start void ambience when stage begins
    playVoidAmbience(1.5, 60); // Intense ambience for 60 seconds
  }, []);
  
  const handleFragmentCollect = () => {
    playConsciousnessFragment(); // Sparkle sound
    incrementScore();
  };
  
  return <MinigameCanvas onCollect={handleFragmentCollect} />;
}
```

### 4. Global Jukebox

**Purpose**: Synchronized YouTube music playback across all connected players

**Architecture**:
- **Server-Authoritative Timing**: "Void Monk" server controls playback timing
- **15-Second Sync Intervals**: Automatic drift correction
- **Hidden YouTube Player**: Audio-only via hidden iframe
- **WebSocket Events**: Real-time jukebox updates

**Integration**:
```tsx
import { useGlobalAudioPlayer } from '@/components/global-audio-player';

function JukeboxWidget() {
  const { 
    isPlayerReady, 
    currentSong, 
    playerState, 
    initializePlayer 
  } = useGlobalAudioPlayer();
  
  // Initialize on user interaction (required for autoplay)
  const handleEnterGame = () => {
    initializePlayer();
  };
  
  return (
    <div>
      <button onClick={handleEnterGame}>Enter Game</button>
      
      {isPlayerReady && currentSong && (
        <div className="jukebox-status">
          <p>Now Playing: {currentSong.title}</p>
          <p>Artist: {currentSong.artist}</p>
          <p>Status: {playerState}</p>
        </div>
      )}
    </div>
  );
}
```

**Server Synchronization (Void Monk)**:
```typescript
// The global audio player automatically syncs with server every 15 seconds
// Server endpoint: /api/jukebox/server-time
// Response format:
{
  serverTime: 1699564800000,
  syncInfo: {
    songId: "uuid",
    isPlaying: true,
    elapsedSeconds: 45.3,
    duration: 180
  }
}

// If drift > 2 seconds, player auto-corrects
// Fallback to local timing if server unavailable
```

**WebSocket Events**:
```typescript
// Listen for jukebox updates
window.addEventListener('jukebox-update', (event: CustomEvent) => {
  console.log('Jukebox event:', event.detail.type);
  // Types: 'song_started', 'song_ended', 'queue_updated'
});
```

## 🔊 Volume Control

### Master Volume Control

```typescript
import { useGlobalAudioPlayer } from '@/components/global-audio-player';

function VolumeSettings() {
  const { audioPlayer } = useGlobalAudioPlayer();
  
  const handleMasterVolume = (value: number) => {
    audioPlayer?.setMasterVolume(value); // 0.0 - 1.0
  };
  
  const handleSFXVolume = (value: number) => {
    audioPlayer?.setSFXVolume(value); // 0.0 - 1.0
  };
  
  return (
    <div>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01"
        onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
      />
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01"
        onChange={(e) => handleSFXVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

### Base Volume Levels

Default volumes in `AudioPlayer`:
```typescript
baseVolumes = {
  walking: 0.3,
  monkAscension: 0.5,
  alienWhispers: 0.6,
  computerStartup: 0.5,
  ringBlast: 0.14
}

// Effective volume = baseVolume * masterVolume * sfxVolume
```

## 🎹 Synthesis Engine

### Overview

The `SynthAudioEngine` generates procedural audio using Web Audio API:
- **No audio files required** for synthesized effects
- **Dynamic parameters** (pitch, duration, intensity)
- **Layered synthesis** for complex sounds
- **Performance optimized** (minimal CPU usage)

### Synthesized Effects

**Ring Blast Synthesis**:
```typescript
// Parameters scale with collaborator count
frequency: 200Hz + (collaborators * 50Hz)
volume: 0.3 + (collaborators * 0.1)
duration: 800ms + (collaborators * 200ms)

// Single player: 200Hz, 0.3 volume, 800ms
// 5 players: 450Hz, 0.8 volume, 1800ms
```

**Tip Sound Synthesis**:
```typescript
// Pitch scales with tip amount
baseFrequency: 800Hz
scaledFrequency: 800Hz + (Math.log10(amount) * 200Hz)

// $10 tip: ~1000Hz
// $100 tip: ~1200Hz
// $1000 tip: ~1400Hz
```

**Void Ambience Layers**:
```typescript
// 3-layer synthesis:
Layer 1: Low rumble (40Hz - 80Hz)
Layer 2: Mid drone (120Hz - 200Hz)
Layer 3: High shimmer (400Hz - 800Hz)

// Intensity parameter (0.0 - 2.0) controls volume
// Duration parameter controls fadeout
```

**UI Click Sounds**:
```typescript
// Button click: Short high-frequency beep (800Hz, 50ms)
// Cancel click: Lower frequency (600Hz, 70ms)
// Destructive click: Warning tone (400Hz + 800Hz, 100ms)
// Modal open: Rising tone (400Hz → 800Hz, 150ms)
// Modal close: Falling tone (800Hz → 400Hz, 150ms)
```

## 🔧 Configuration

### Audio File Paths

Update paths in `audio-player.ts`:
```typescript
// Walking sound
import walkingSoundPath from '@assets/grass_1757484663285.wav';

// Monk ascension (if using file instead of synthesis)
this.monkAscensionAudio = new Audio('/sounds/monk-ascension.mp3');

// Alien whispers
this.alienWhispersAudio = new Audio('/sounds/alien-whispers.mp3');

// Computer startup
this.computerStartupAudio = new Audio('/sounds/computer-startup.mp3');

// Ring blast
import ringBlastSoundPath from '@assets/ring blast_1757912532404.mp3';
```

### YouTube Player Configuration

```typescript
playerVars: {
  autoplay: 1,              // Auto-start (requires user interaction first)
  controls: 1,              // Show controls (can set to 0 for hidden)
  showinfo: 0,              // Hide video info
  rel: 0,                   // Don't show related videos
  modestbranding: 1,        // Minimal YouTube branding
  origin: window.location.origin // Security requirement
}
```

### Jukebox API Endpoints

Required server endpoints:
```typescript
GET  /api/jukebox/queue         // Get current queue and song
GET  /api/jukebox/server-time   // Get authoritative timing (Void Monk)
POST /api/jukebox/trigger-autoplay // Auto-start stuck songs
```

## 📱 Mobile Support

### Audio Autoplay Restrictions

Mobile browsers block autoplay until user interaction:

```tsx
function GameEntry() {
  const { initializePlayer } = useGlobalAudioPlayer();
  
  // Initialize on user tap/click
  const handleEnter = () => {
    initializePlayer(); // Required for mobile autoplay
    startGame();
  };
  
  return <button onClick={handleEnter}>Enter Game</button>;
}
```

### Performance Optimization

```typescript
// Synthesis is lightweight and mobile-friendly
// Pre-load audio files to avoid lag
this.walkingAudio.preload = 'auto';

// Use Web Audio API (better performance than <audio> tags)
// Synthesis engine handles this automatically
```

## 🐛 Troubleshooting

### Issue 1: No audio plays

**Problem**: Audio player not initialized

**Solution**: Ensure `GlobalAudioPlayerProvider` wraps your app
```tsx
<GlobalAudioPlayerProvider>
  <App />
</GlobalAudioPlayerProvider>
```

**Check**: `useUISounds().isAvailable` should return `true`

### Issue 2: Jukebox songs don't play

**Problem**: YouTube API not loaded or autoplay blocked

**Solution**: Call `initializePlayer()` on user interaction
```tsx
const { initializePlayer } = useGlobalAudioPlayer();
<button onClick={initializePlayer}>Start Music</button>
```

### Issue 3: Songs are out of sync

**Problem**: Client drift from server timing

**Solution**: Automatic sync every 15 seconds (already implemented)

**Manual Check**:
```typescript
// Server time endpoint should return syncInfo
fetch('/api/jukebox/server-time')
  .then(r => r.json())
  .then(({ syncInfo }) => console.log(syncInfo));
```

### Issue 4: Audio cuts out or lags

**Problem**: Too many audio instances or synthesis load

**Solution**: 
- Synthesis has built-in cooldowns
- Walking sound has 200ms cooldown
- Ring blast limits to one at a time

**Debug**:
```typescript
// Check if audio player exists
const { audioPlayer, isAvailable } = useGlobalAudioPlayer();
console.log('Audio available:', isAvailable);
console.log('Audio player:', audioPlayer);
```

### Issue 5: Mobile autoplay blocked

**Problem**: Browser security policy

**Solution**: 
```tsx
// Always require user interaction first
<button onClick={() => {
  initializePlayer();
  playVoidAmbience();
}}>
  Start Experience
</button>
```

## 🧪 Testing Checklist

### Local Testing

- [ ] UI sounds play on button clicks
- [ ] Walking sound plays during movement (with cooldown)
- [ ] Ring blast plays with correct intensity
- [ ] Tip sounds have pitch variation
- [ ] Void ambience plays for specified duration
- [ ] Volume controls affect all sounds
- [ ] Jukebox initializes on user interaction
- [ ] Songs load and play correctly

### Production Testing

- [ ] Mobile autoplay works after user interaction
- [ ] Songs stay synchronized across multiple tabs
- [ ] Drift correction works (15s intervals)
- [ ] Server timing endpoint responds correctly
- [ ] WebSocket jukebox events trigger updates
- [ ] Audio doesn't lag on slow devices
- [ ] No memory leaks from audio instances

### Browser Testing

- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Edge

## 🚀 Deployment

### Required Assets

Place audio files in `public/sounds/`:
```
public/
└── sounds/
    ├── monk-ascension.mp3 (optional - can use synthesis)
    ├── alien-whispers.mp3
    └── computer-startup.mp3
```

### Environment Variables

```bash
# Optional: Custom jukebox server
JUKEBOX_SERVER_URL=https://your-api.com/api/jukebox
```

### Production Checklist

- [ ] Audio files compressed (MP3 < 100KB each)
- [ ] Preload set to 'auto' for critical sounds
- [ ] Volume levels tested and balanced
- [ ] Synthesis engine optimized (already is)
- [ ] YouTube API key configured (if required)
- [ ] Server endpoints deployed (/api/jukebox/*)
- [ ] WebSocket events working
- [ ] HTTPS enabled (required for autoplay)

## 📚 API Reference

### useUISounds() Hook

```typescript
interface UISounds {
  // Button sounds
  playButtonClick: () => void;
  playCancelClick: () => void;
  playDestructiveClick: () => void;
  
  // Wallet sounds
  playWalletConnectSuccess: () => void;
  playWalletConnectFailure: () => void;
  
  // Modal sounds
  playModalOpen: () => void;
  playModalClose: () => void;
  playTabSwitch: () => void;
  
  // Input sounds
  playInputFocus: () => void;
  playHoverSound: () => void;
  
  // Void effects
  playVoidAmbience: (intensity?: number, duration?: number) => void;
  playConsciousnessFragment: () => void;
  playRealityTear: () => void;
  playVoidWhisper: () => void;
  
  // Availability
  isAvailable: boolean;
}
```

### useGlobalAudioPlayer() Hook

```typescript
interface GlobalAudioPlayerContextType {
  isPlayerReady: boolean;
  currentSong: JukeboxSong | null;
  playerState: 'unstarted' | 'playing' | 'paused' | 'ended';
  initializePlayer: () => void;
  audioPlayer: AudioPlayer | null;
}
```

### AudioPlayer Class

```typescript
class AudioPlayer {
  // Walking
  startWalkingSound(): void;
  stopWalkingSound(): void;
  onPlayerMove(): void; // Auto-managed with cooldown
  
  // Game effects
  playMonkAscension(): void;
  playAlienWhispers(): void;
  playComputerStartup(): void;
  playRingBlast(): void;
  playRingBlastWithCollaboration(count: number): void;
  playTipSound(amount?: number): void;
  playJukeboxClick(): void;
  
  // UI sounds (via synthesis)
  playButtonClick(): void;
  playCancelClick(): void;
  playDestructiveClick(): void;
  playWalletConnectSuccess(): void;
  playWalletConnectFailure(): void;
  playModalOpen(): void;
  playModalClose(): void;
  playTabSwitch(): void;
  playInputFocus(): void;
  playHoverSound(): void;
  
  // Void effects
  playVoidAmbience(intensity: number, duration: number): void;
  playConsciousnessFragment(): void;
  playRealityTear(): void;
  playVoidWhisper(): void;
  playCrystalResonance(): void;
  
  // Volume
  setMasterVolume(volume: number): void; // 0.0 - 1.0
  setSFXVolume(volume: number): void;     // 0.0 - 1.0
  
  // Jukebox (internal use)
  startJukeboxSong(songData: any): void;
  stopJukeboxSong(): void;
  getCurrentJukeboxSong(): any;
  
  // Cleanup
  destroy(): void;
}
```

## 💡 Best Practices

### 1. Initialize on User Interaction
```tsx
// ❌ Don't auto-initialize on page load (mobile blocks it)
useEffect(() => {
  initializePlayer(); // Will fail on mobile
}, []);

// ✅ Initialize on user interaction
<button onClick={initializePlayer}>Enter Game</button>
```

### 2. Check Availability Before Playing
```tsx
const { playButtonClick, isAvailable } = useUISounds();

const handleClick = () => {
  if (isAvailable) {
    playButtonClick();
  }
  handleAction();
};
```

### 3. Use Synthesis for Dynamic Effects
```tsx
// ✅ Synthesis scales automatically
audioPlayer.playRingBlastWithCollaboration(collaboratorCount);

// ❌ Don't use static audio files for dynamic effects
```

### 4. Respect Cooldowns
```tsx
// ✅ Use built-in cooldowns
audioPlayer.onPlayerMove(); // Has 200ms cooldown

// ❌ Don't spam audio
setInterval(() => audioPlayer.playButtonClick(), 100); // Too fast!
```

### 5. Clean Up on Unmount
```tsx
useEffect(() => {
  const audioPlayer = new AudioPlayer();
  
  return () => {
    audioPlayer.destroy(); // Important!
  };
}, []);
```

## 🎯 Next Steps

1. **Upload Audio Files** (Task 5 completion):
   - Copy audio-player.ts to 118-integration/
   - Copy global-audio-player.tsx to 118-integration/
   - Copy synth-audio-engine.ts to 118-integration/

2. **Test Integration** (Task 7):
   - Add to intro sequence for mechanical sounds
   - Test mobile autoplay
   - Verify volume controls

3. **Jukebox System** (Existing in 01-jukebox-system/):
   - Already implemented
   - Integrate with global audio player
   - Test server synchronization

4. **Performance Optimization**:
   - Profile synthesis CPU usage
   - Optimize audio file sizes
   - Test on low-end devices

## 🤝 Support

**Related Documentation**:
- `use-ui-sounds.ts` ✅ UPLOADED (118-integration/shared-files/)
- `01-jukebox-system/` - Jukebox implementation
- `INTRO-SYSTEM-IMPLEMENTATION.md` - Audio integration with intro

**Issues**:
- Check browser console for audio errors
- Verify `isAvailable` flag
- Test user interaction requirement

**Questions**:
- Reference this guide for API usage
- Check synth-audio-engine.ts for synthesis details

---

**Status**: ✅ Documentation complete (Week 2 - Task 5)
**Last Updated**: 2024 (Week 2 upload)
**Dependencies**: Web Audio API, YouTube IFrame API, @tanstack/react-query
**Total Code**: ~800+ lines (audio-player + global-audio-player + synthesis)
**Hook Uploaded**: ✅ use-ui-sounds.ts (Task 3)
