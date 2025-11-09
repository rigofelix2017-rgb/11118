/**
 * SynthAudioEngine - Web Audio API based synthesizer for game sound effects
 * Phase 1: Core synthesis engine with oscillators, filters, and envelope system
 */

export type OscillatorType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface EnvelopeSettings {
  attack: number;   // Attack time in seconds
  decay: number;    // Decay time in seconds  
  sustain: number;  // Sustain level (0-1)
  release: number;  // Release time in seconds
}

export interface SynthParams {
  frequency: number;
  oscillatorType: OscillatorType;
  envelope: EnvelopeSettings;
  filterFrequency?: number;
  filterQ?: number;
  volume: number;
  duration?: number;
}

export class SynthAudioEngine {
  private audioContext: AudioContext | null = null;
  private mainGainNode: GainNode | null = null;
  private activeSynths: Map<string, { 
    oscillator: OscillatorNode; 
    gainNode: GainNode; 
    filter?: BiquadFilterNode;
    startTime: number;
    duration?: number;
  }> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      // Create audio context - will be started on first user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create main gain node for master volume control
      this.mainGainNode = this.audioContext.createGain();
      this.mainGainNode.connect(this.audioContext.destination);
      this.mainGainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime); // Master volume
      
      console.log('🎵 SynthAudioEngine: Audio context initialized');
    } catch (error) {
      console.warn('Failed to initialize SynthAudioEngine:', error);
    }
  }

  // Ensure audio context is running (required after user interaction)
  private async ensureAudioContextRunning(): Promise<boolean> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }
    
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return false;
      }
    }
    
    return this.audioContext?.state === 'running';
  }

  // Create a basic synthesized tone
  async playTone(params: SynthParams): Promise<string | null> {
    if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
      return null;
    }

    const synthId = `synth_${Date.now()}_${Math.random()}`;
    const currentTime = this.audioContext.currentTime;
    const duration = params.duration || 1.0;

    try {
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = params.oscillatorType;
      oscillator.frequency.setValueAtTime(params.frequency, currentTime);

      // Create gain node for this synth
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0, currentTime);

      // Optional filter
      let filterNode: BiquadFilterNode | undefined;
      if (params.filterFrequency) {
        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(params.filterFrequency, currentTime);
        filterNode.Q.setValueAtTime(params.filterQ || 1, currentTime);
      }

      // Connect the audio graph
      if (filterNode) {
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
      } else {
        oscillator.connect(gainNode);
      }
      gainNode.connect(this.mainGainNode);

      // Apply ADSR envelope
      this.applyEnvelope(gainNode.gain, params.envelope, params.volume, currentTime, duration);

      // Start the oscillator
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration + params.envelope.release);

      // Store reference for potential early stopping
      this.activeSynths.set(synthId, {
        oscillator,
        gainNode,
        filter: filterNode,
        startTime: currentTime
      });

      // Clean up after the note finishes
      oscillator.onended = () => {
        this.activeSynths.delete(synthId);
      };

      return synthId;
    } catch (error) {
      console.warn('Failed to play synthesized tone:', error);
      return null;
    }
  }

  // Apply ADSR envelope to a gain parameter
  private applyEnvelope(
    gainParam: AudioParam,
    envelope: EnvelopeSettings,
    targetVolume: number,
    startTime: number,
    duration: number
  ) {
    const { attack, decay, sustain, release } = envelope;
    const sustainVolume = targetVolume * sustain;
    
    // Attack phase: 0 to peak volume
    gainParam.setValueAtTime(0, startTime);
    gainParam.linearRampToValueAtTime(targetVolume, startTime + attack);
    
    // Decay phase: peak volume to sustain level
    gainParam.linearRampToValueAtTime(sustainVolume, startTime + attack + decay);
    
    // Sustain phase: hold sustain level
    const sustainDuration = Math.max(0, duration - attack - decay);
    gainParam.setValueAtTime(sustainVolume, startTime + attack + decay + sustainDuration);
    
    // Release phase: sustain level to 0
    const releaseStart = startTime + duration;
    gainParam.setValueAtTime(sustainVolume, releaseStart);
    gainParam.linearRampToValueAtTime(0, releaseStart + release);
  }

  // Stop a specific synthesized sound early
  stopSynth(synthId: string) {
    const synth = this.activeSynths.get(synthId);
    if (synth && this.audioContext) {
      try {
        // Quick fade out to avoid clicks
        const currentTime = this.audioContext.currentTime;
        synth.gainNode.gain.cancelScheduledValues(currentTime);
        synth.gainNode.gain.setValueAtTime(synth.gainNode.gain.value, currentTime);
        synth.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);
        
        // Stop the oscillator after fade
        synth.oscillator.stop(currentTime + 0.05);
        this.activeSynths.delete(synthId);
      } catch (error) {
        console.warn('Failed to stop synth:', error);
      }
    }
  }

  // Stop all active synthesized sounds
  stopAllSynths() {
    Array.from(this.activeSynths.keys()).forEach(id => {
      this.stopSynth(id);
    });
  }

  // Set master volume
  setMasterVolume(volume: number) {
    if (this.mainGainNode && this.audioContext) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.mainGainNode.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);
    }
  }

  // Retro arcade ring blast - Classic "pew pew" laser sound
  async playEnhancedRingBlast(collaboratorCount: number = 1): Promise<string | null> {
    // Classic arcade parameters - short and punchy
    const startFreq = 800 + (collaboratorCount * 100); // Higher start frequency for more collaborators
    const endFreq = 150 + (collaboratorCount * 25);    // Slightly higher end frequency for more collaborators
    const duration = 0.3; // Short and punchy - classic arcade timing
    const volume = 0.6 + (collaboratorCount * 0.05); // Slightly louder for more collaborators

    try {
      if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
        return null;
      }

      const synthId = `retro_blast_${Date.now()}`;
      const currentTime = this.audioContext.currentTime;

      // Create the classic laser blast oscillator
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'square'; // Square wave for that classic arcade bite
      
      // Set up the frequency sweep - high to low for classic "pew" sound
      oscillator.frequency.setValueAtTime(startFreq, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, currentTime + duration);

      // Create gain envelope for sharp attack and quick decay
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01); // Very fast attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration); // Quick decay to silence

      // Add a subtle filter for that classic arcade tone
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, currentTime);
      filter.Q.setValueAtTime(1, currentTime);

      // Connect the audio chain
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.mainGainNode);

      // Start and stop the sound
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      // Track the synth
      this.activeSynths.set(synthId, {
        oscillator,
        gainNode,
        startTime: currentTime,
        duration
      });

      // Clean up when done
      oscillator.onended = () => {
        this.activeSynths.delete(synthId);
      };

      return synthId;
    } catch (error) {
      console.warn('Failed to play retro arcade blast:', error);
      return null;
    }
  }

  // Phase 2: Advanced game event synthesis

  // Monk Ascension - Majestic upward sweep with rich harmonics
  async playMonkAscension(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.5,
      decay: 1.0,
      sustain: 0.6,
      release: 2.0
    };

    const duration = 3.5;
    const baseFreq = 100;
    const targetFreq = 800;

    try {
      if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
        return null;
      }

      const synthId = `monk_ascension_${Date.now()}`;
      const currentTime = this.audioContext.currentTime;

      // Create main oscillator with frequency sweep
      const mainOsc = this.audioContext.createOscillator();
      mainOsc.type = 'sine';
      mainOsc.frequency.setValueAtTime(baseFreq, currentTime);
      mainOsc.frequency.exponentialRampToValueAtTime(targetFreq, currentTime + duration);

      // Create gain node for main oscillator
      const mainGain = this.audioContext.createGain();
      mainGain.gain.setValueAtTime(0, currentTime);

      // Create filter for warmth
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, currentTime);
      filter.frequency.linearRampToValueAtTime(2400, currentTime + duration);
      filter.Q.setValueAtTime(1.5, currentTime);

      // Connect main voice
      mainOsc.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(this.mainGainNode);

      // Apply envelope to main voice
      this.applyEnvelope(mainGain.gain, envelope, 0.4, currentTime, duration);

      // Add harmonic layers for richness
      const harmonics = [1.5, 2.0, 3.0]; // Perfect fifth, octave, perfect twelfth
      const harmonicOscs: OscillatorNode[] = [];

      harmonics.forEach((ratio, index) => {
        const harmOsc = this.audioContext!.createOscillator();
        harmOsc.type = index === 0 ? 'triangle' : 'sine';
        harmOsc.frequency.setValueAtTime(baseFreq * ratio, currentTime);
        harmOsc.frequency.exponentialRampToValueAtTime(targetFreq * ratio, currentTime + duration);

        const harmGain = this.audioContext!.createGain();
        harmGain.gain.setValueAtTime(0, currentTime);

        harmOsc.connect(harmGain);
        harmGain.connect(this.mainGainNode!);

        // Harmonic envelopes with delayed attack
        const harmEnvelope = { ...envelope, attack: envelope.attack + (index * 0.2) };
        const harmVolume = 0.2 / (index + 1); // Decreasing volume for higher harmonics
        this.applyEnvelope(harmGain.gain, harmEnvelope, harmVolume, currentTime, duration);

        harmonicOscs.push(harmOsc);
      });

      // Start all oscillators
      mainOsc.start(currentTime);
      harmonicOscs.forEach(osc => osc.start(currentTime));

      // Stop all oscillators
      const stopTime = currentTime + duration + envelope.release;
      mainOsc.stop(stopTime);
      harmonicOscs.forEach(osc => osc.stop(stopTime));

      return synthId;
    } catch (error) {
      console.warn('Failed to play monk ascension synthesis:', error);
      return null;
    }
  }

  // Tip Animation - Pleasant coin-like chime
  async playTipSound(amount?: number): Promise<string | null> {
    const tipValue = amount || 1;
    const numChimes = Math.min(Math.max(1, Math.floor(tipValue / 10)), 5); // 1-5 chimes based on tip amount
    
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.1,
      release: 0.8
    };

    try {
      // Play a sequence of chimes
      const chimeIds: string[] = [];
      const baseFreqs = [523, 659, 784, 880, 1047]; // C5, E5, G5, A5, C6

      for (let i = 0; i < numChimes; i++) {
        // Delay each chime slightly
        setTimeout(async () => {
          const freq = baseFreqs[i];
          const chimeId = await this.playTone({
            frequency: freq,
            oscillatorType: 'sine',
            envelope,
            filterFrequency: freq * 2,
            filterQ: 0.8,
            volume: 0.3,
            duration: 0.6
          });
          
          // Add subtle harmonic
          await this.playTone({
            frequency: freq * 2,
            oscillatorType: 'triangle',
            envelope: { ...envelope, sustain: 0.05 },
            volume: 0.1,
            duration: 0.4
          });
        }, i * 120); // 120ms delay between chimes
      }

      return `tip_sound_${Date.now()}`;
    } catch (error) {
      console.warn('Failed to play tip sound synthesis:', error);
      return null;
    }
  }

  // Walking Sound - Subtle organic footstep synthesis
  async playWalkingStep(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.0,
      release: 0.15
    };

    try {
      // Create a subtle, organic walking sound using filtered noise-like oscillators
      const stepId = await this.playTone({
        frequency: 80 + (Math.random() * 40), // Random low frequency for organic feel
        oscillatorType: 'triangle',
        envelope,
        filterFrequency: 200 + (Math.random() * 100),
        filterQ: 2.0,
        volume: 0.15,
        duration: 0.25
      });

      // Add high-frequency component for texture
      await this.playTone({
        frequency: 1000 + (Math.random() * 500),
        oscillatorType: 'sawtooth',
        envelope: { ...envelope, decay: 0.05, release: 0.08 },
        filterFrequency: 800,
        filterQ: 3.0,
        volume: 0.05,
        duration: 0.1
      });

      return stepId;
    } catch (error) {
      console.warn('Failed to play walking step synthesis:', error);
      return null;
    }
  }

  // Jukebox Interaction - Classic arcade button sound
  async playJukeboxClick(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.08,
      sustain: 0.2,
      release: 0.15
    };

    try {
      // Create a satisfying arcade-style click using multiple frequency components
      const clickId = await this.playTone({
        frequency: 800,
        oscillatorType: 'square',
        envelope,
        filterFrequency: 1200,
        filterQ: 1.5,
        volume: 0.25,
        duration: 0.2
      });

      // Add harmonic for richness
      await this.playTone({
        frequency: 1600,
        oscillatorType: 'triangle',
        envelope: { ...envelope, decay: 0.05, sustain: 0.1 },
        volume: 0.1,
        duration: 0.15
      });

      return clickId;
    } catch (error) {
      console.warn('Failed to play jukebox click synthesis:', error);
      return null;
    }
  }

  // === UI FEEDBACK SOUNDS - Phase 2 ===

  // Primary button click - Standard confirmation sound
  async playButtonClick(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.05,
      sustain: 0.3,
      release: 0.1
    };

    try {
      return await this.playTone({
        frequency: 600,
        oscillatorType: 'triangle',
        envelope,
        filterFrequency: 1200,
        filterQ: 1.2,
        volume: 0.2,
        duration: 0.15
      });
    } catch (error) {
      console.warn('Failed to play button click sound:', error);
      return null;
    }
  }

  // Wallet connection success sound
  async playWalletConnectSuccess(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.02,
      decay: 0.15,
      sustain: 0.4,
      release: 0.5
    };

    try {
      // Play ascending chord progression for success
      const frequencies = [440, 554, 659]; // A4, C#5, E5 - A major chord
      const chordIds: string[] = [];

      for (let i = 0; i < frequencies.length; i++) {
        setTimeout(async () => {
          const id = await this.playTone({
            frequency: frequencies[i],
            oscillatorType: 'sine',
            envelope,
            filterFrequency: frequencies[i] * 2,
            filterQ: 0.8,
            volume: 0.25,
            duration: 0.8
          });
          if (id) chordIds.push(id);
        }, i * 100);
      }

      return `wallet_connect_success_${Date.now()}`;
    } catch (error) {
      console.warn('Failed to play wallet connect success sound:', error);
      return null;
    }
  }

  // Wallet connection failure sound
  async playWalletConnectFailure(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.2,
      release: 0.3
    };

    try {
      // Play descending dissonant tones for failure
      const frequencies = [400, 350, 300]; // Descending minor intervals
      
      for (let i = 0; i < frequencies.length; i++) {
        setTimeout(async () => {
          await this.playTone({
            frequency: frequencies[i],
            oscillatorType: 'square',
            envelope,
            filterFrequency: frequencies[i] * 1.5,
            filterQ: 2.0,
            volume: 0.2,
            duration: 0.3
          });
        }, i * 150);
      }

      return `wallet_connect_failure_${Date.now()}`;
    } catch (error) {
      console.warn('Failed to play wallet connect failure sound:', error);
      return null;
    }
  }

  // Cancel/Close button sound - soft dismissal
  async playCancelClick(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.08,
      sustain: 0.1,
      release: 0.2
    };

    try {
      return await this.playTone({
        frequency: 450,
        oscillatorType: 'sine',
        envelope,
        filterFrequency: 800,
        filterQ: 1.0,
        volume: 0.15,
        duration: 0.2
      });
    } catch (error) {
      console.warn('Failed to play cancel click sound:', error);
      return null;
    }
  }

  // Destructive action warning sound (disconnect, delete, etc.)
  async playDestructiveClick(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.3
    };

    try {
      // Play warning tone with slight vibrato
      return await this.playTone({
        frequency: 300,
        oscillatorType: 'sawtooth',
        envelope,
        filterFrequency: 600,
        filterQ: 2.5,
        volume: 0.25,
        duration: 0.25
      });
    } catch (error) {
      console.warn('Failed to play destructive click sound:', error);
      return null;
    }
  }

  // Modal open sound - slide-in effect
  async playModalOpen(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.1,
      release: 0.3
    };

    try {
      // Rising tone for modal opening
      if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
        return null;
      }

      const synthId = `modal_open_${Date.now()}`;
      const currentTime = this.audioContext.currentTime;
      const duration = 0.4;

      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(200, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(500, currentTime + duration);

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0, currentTime);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, currentTime);
      filter.frequency.linearRampToValueAtTime(1500, currentTime + duration);
      filter.Q.setValueAtTime(1.2, currentTime);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.mainGainNode);

      this.applyEnvelope(gainNode.gain, envelope, 0.2, currentTime, duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration + envelope.release);

      return synthId;
    } catch (error) {
      console.warn('Failed to play modal open sound:', error);
      return null;
    }
  }

  // Modal close sound - slide-out effect
  async playModalClose(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.15,
      sustain: 0.1,
      release: 0.4
    };

    try {
      // Falling tone for modal closing
      if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
        return null;
      }

      const synthId = `modal_close_${Date.now()}`;
      const currentTime = this.audioContext.currentTime;
      const duration = 0.3;

      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, currentTime + duration);

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0, currentTime);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, currentTime);
      filter.frequency.linearRampToValueAtTime(300, currentTime + duration);
      filter.Q.setValueAtTime(1.0, currentTime);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.mainGainNode);

      this.applyEnvelope(gainNode.gain, envelope, 0.18, currentTime, duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration + envelope.release);

      return synthId;
    } catch (error) {
      console.warn('Failed to play modal close sound:', error);
      return null;
    }
  }

  // Tab switching sound - soft navigation feedback
  async playTabSwitch(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.01,
      decay: 0.06,
      sustain: 0.2,
      release: 0.12
    };

    try {
      // Quick dual-tone for tab switching
      const lowTone = await this.playTone({
        frequency: 320,
        oscillatorType: 'triangle',
        envelope,
        filterFrequency: 640,
        filterQ: 1.0,
        volume: 0.12,
        duration: 0.12
      });

      // Slight delay for second tone
      setTimeout(async () => {
        await this.playTone({
          frequency: 480,
          oscillatorType: 'sine',
          envelope: { ...envelope, attack: 0.005 },
          filterFrequency: 960,
          filterQ: 0.8,
          volume: 0.1,
          duration: 0.1
        });
      }, 30);

      return lowTone;
    } catch (error) {
      console.warn('Failed to play tab switch sound:', error);
      return null;
    }
  }

  // Input focus sound - subtle feedback when focusing on inputs
  async playInputFocus(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.005,
      decay: 0.04,
      sustain: 0.1,
      release: 0.08
    };

    try {
      return await this.playTone({
        frequency: 800,
        oscillatorType: 'sine',
        envelope,
        filterFrequency: 1600,
        filterQ: 0.5,
        volume: 0.08,
        duration: 0.1
      });
    } catch (error) {
      console.warn('Failed to play input focus sound:', error);
      return null;
    }
  }

  // Hover sound - very subtle feedback for hovering over interactive elements
  async playHoverSound(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.002,
      decay: 0.03,
      sustain: 0.05,
      release: 0.05
    };

    try {
      return await this.playTone({
        frequency: 1200,
        oscillatorType: 'sine',
        envelope,
        volume: 0.04,
        duration: 0.08
      });
    } catch (error) {
      console.warn('Failed to play hover sound:', error);
      return null;
    }
  }

  // Get audio context state for debugging
  getStatus() {
    return {
      contextState: this.audioContext?.state || 'not-initialized',
      activeSynths: this.activeSynths.size,
      sampleRate: this.audioContext?.sampleRate || 0
    };
  }

  // === VOID SOUND EFFECTS - Phase 1 ===

  // Void Ambience - Layered atmospheric synthesis for immersive void atmosphere
  async playVoidAmbience(intensity: number = 1.0, duration: number = 30): Promise<string | null> {
    if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
      return null;
    }

    const synthId = `void_ambience_${Date.now()}`;
    const currentTime = this.audioContext.currentTime;
    const baseVolume = 0.3 * intensity;

    try {
      // Layer 1: Low-frequency rumble (40-80Hz) - Foundation layer
      const rumbleOsc = this.audioContext.createOscillator();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(45, currentTime);
      
      // Create slow LFO for rumble frequency modulation
      const rumbleLFO = this.audioContext.createOscillator();
      rumbleLFO.type = 'triangle';
      rumbleLFO.frequency.setValueAtTime(0.1, currentTime); // Very slow modulation
      
      const rumbleLFOGain = this.audioContext.createGain();
      rumbleLFOGain.gain.setValueAtTime(15, currentTime); // Modulation depth
      
      rumbleLFO.connect(rumbleLFOGain);
      rumbleLFOGain.connect(rumbleOsc.frequency);
      
      const rumbleGain = this.audioContext.createGain();
      rumbleGain.gain.setValueAtTime(0, currentTime);
      rumbleGain.gain.linearRampToValueAtTime(baseVolume * 0.4, currentTime + 3);
      
      // Low-pass filter for rumble warmth
      const rumbleFilter = this.audioContext.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(120, currentTime);
      rumbleFilter.Q.setValueAtTime(0.5, currentTime);
      
      rumbleOsc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.mainGainNode);

      // Layer 2: Ethereal pad (200-800Hz) - Mid-range atmosphere
      const padOsc = this.audioContext.createOscillator();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(220, currentTime);
      
      // LFO for pad frequency drift
      const padLFO = this.audioContext.createOscillator();
      padLFO.type = 'sine';
      padLFO.frequency.setValueAtTime(0.05, currentTime); // Even slower drift
      
      const padLFOGain = this.audioContext.createGain();
      padLFOGain.gain.setValueAtTime(30, currentTime);
      
      padLFO.connect(padLFOGain);
      padLFOGain.connect(padOsc.frequency);
      
      const padGain = this.audioContext.createGain();
      padGain.gain.setValueAtTime(0, currentTime);
      padGain.gain.linearRampToValueAtTime(baseVolume * 0.25, currentTime + 5);
      
      // Band-pass filter for ethereal quality
      const padFilter = this.audioContext.createBiquadFilter();
      padFilter.type = 'bandpass';
      padFilter.frequency.setValueAtTime(400, currentTime);
      padFilter.frequency.linearRampToValueAtTime(600, currentTime + duration);
      padFilter.Q.setValueAtTime(2.0, currentTime);
      
      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(this.mainGainNode);

      // Layer 3: High-frequency shimmer (1000-3000Hz) - Ethereal sparkle
      const shimmerOsc = this.audioContext.createOscillator();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(1500, currentTime);
      
      // Fast tremolo for shimmer effect
      const shimmerLFO = this.audioContext.createOscillator();
      shimmerLFO.type = 'triangle';
      shimmerLFO.frequency.setValueAtTime(2.5, currentTime);
      
      const shimmerLFOGain = this.audioContext.createGain();
      shimmerLFOGain.gain.setValueAtTime(baseVolume * 0.15, currentTime);
      
      shimmerLFO.connect(shimmerLFOGain);
      shimmerLFOGain.connect(shimmerOsc.frequency);
      
      const shimmerGain = this.audioContext.createGain();
      shimmerGain.gain.setValueAtTime(0, currentTime);
      shimmerGain.gain.linearRampToValueAtTime(baseVolume * 0.1, currentTime + 8);
      
      // High-pass filter for sparkle
      const shimmerFilter = this.audioContext.createBiquadFilter();
      shimmerFilter.type = 'highpass';
      shimmerFilter.frequency.setValueAtTime(1200, currentTime);
      shimmerFilter.Q.setValueAtTime(1.5, currentTime);
      
      shimmerOsc.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(this.mainGainNode);

      // Start all oscillators
      rumbleLFO.start(currentTime);
      rumbleOsc.start(currentTime);
      padLFO.start(currentTime);
      padOsc.start(currentTime);
      shimmerLFO.start(currentTime);
      shimmerOsc.start(currentTime);

      // Stop all oscillators at the end
      const stopTime = currentTime + duration;
      
      // Fade out gradually
      rumbleGain.gain.linearRampToValueAtTime(0, stopTime - 2);
      padGain.gain.linearRampToValueAtTime(0, stopTime - 3);
      shimmerGain.gain.linearRampToValueAtTime(0, stopTime - 1);
      
      rumbleLFO.stop(stopTime);
      rumbleOsc.stop(stopTime);
      padLFO.stop(stopTime);
      padOsc.stop(stopTime);
      shimmerLFO.stop(stopTime);
      shimmerOsc.stop(stopTime);

      console.log('🌌 Void ambience started with intensity:', intensity);
      return synthId;
    } catch (error) {
      console.warn('Failed to play void ambience:', error);
      return null;
    }
  }

  // Consciousness Fragment - Ethereal sparkle for consciousness collection
  async playConsciousnessFragment(): Promise<string | null> {
    const envelope: EnvelopeSettings = {
      attack: 0.1,
      decay: 0.3,
      sustain: 0.4,
      release: 1.2
    };

    try {
      // Create crystalline bell-like tone with harmonic content
      const baseFreq = 800 + (Math.random() * 400); // Random ethereal frequency
      const duration = 1.5;

      // Fundamental tone
      const fundamentalId = await this.playTone({
        frequency: baseFreq,
        oscillatorType: 'sine',
        envelope,
        filterFrequency: baseFreq * 2,
        filterQ: 2.5,
        volume: 0.2,
        duration
      });

      // Perfect fifth harmonic
      await this.playTone({
        frequency: baseFreq * 1.5,
        oscillatorType: 'triangle',
        envelope: { ...envelope, attack: 0.15 },
        filterFrequency: baseFreq * 3,
        filterQ: 3.0,
        volume: 0.12,
        duration: duration * 0.8
      });

      // Octave harmonic
      await this.playTone({
        frequency: baseFreq * 2,
        oscillatorType: 'sine',
        envelope: { ...envelope, attack: 0.2, sustain: 0.2 },
        filterFrequency: baseFreq * 4,
        filterQ: 2.0,
        volume: 0.08,
        duration: duration * 0.6
      });

      return fundamentalId;
    } catch (error) {
      console.warn('Failed to play consciousness fragment:', error);
      return null;
    }
  }

  // Reality Tear - Subtle distortion effect for void breakthrough moments
  async playRealityTear(): Promise<string | null> {
    if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
      return null;
    }

    const synthId = `reality_tear_${Date.now()}`;
    const currentTime = this.audioContext.currentTime;
    const duration = 2.0;

    try {
      // Create distorted sweep from high to low frequency
      const tearOsc = this.audioContext.createOscillator();
      tearOsc.type = 'sawtooth';
      tearOsc.frequency.setValueAtTime(2000, currentTime);
      tearOsc.frequency.exponentialRampToValueAtTime(150, currentTime + duration);

      const tearGain = this.audioContext.createGain();
      tearGain.gain.setValueAtTime(0, currentTime);
      tearGain.gain.linearRampToValueAtTime(0.15, currentTime + 0.1);
      tearGain.gain.linearRampToValueAtTime(0.05, currentTime + 0.8);
      tearGain.gain.linearRampToValueAtTime(0, currentTime + duration);

      // Heavy filtering for distortion effect
      const tearFilter = this.audioContext.createBiquadFilter();
      tearFilter.type = 'lowpass';
      tearFilter.frequency.setValueAtTime(1500, currentTime);
      tearFilter.frequency.exponentialRampToValueAtTime(200, currentTime + duration);
      tearFilter.Q.setValueAtTime(8.0, currentTime); // High resonance for distortion

      // Add subtle reverb-like delay
      const delay = this.audioContext.createDelay(0.3);
      delay.delayTime.setValueAtTime(0.15, currentTime);
      
      const delayGain = this.audioContext.createGain();
      delayGain.gain.setValueAtTime(0.3, currentTime);

      // Connect the tear effect
      tearOsc.connect(tearFilter);
      tearFilter.connect(tearGain);
      tearGain.connect(this.mainGainNode);
      
      // Add delayed signal
      tearGain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.mainGainNode);

      tearOsc.start(currentTime);
      tearOsc.stop(currentTime + duration);

      console.log('🌊 Reality tear effect triggered');
      return synthId;
    } catch (error) {
      console.warn('Failed to play reality tear:', error);
      return null;
    }
  }

  // Void Whisper - Synthesized whisper-like sounds for atmospheric effect
  async playVoidWhisper(): Promise<string | null> {
    if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
      return null;
    }

    const synthId = `void_whisper_${Date.now()}`;
    const currentTime = this.audioContext.currentTime;
    const duration = 3.5;

    try {
      // Create noise-like whisper using multiple filtered oscillators
      const whisperOscs: OscillatorNode[] = [];
      const whisperGains: GainNode[] = [];
      
      // Create multiple whisper voices at different frequencies
      const whisperFreqs = [180, 220, 280, 350, 450];
      
      whisperFreqs.forEach((freq, index) => {
        const osc = this.audioContext!.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, currentTime);
        
        // Add slight frequency wobble for organic feel
        osc.frequency.linearRampToValueAtTime(freq * (0.95 + Math.random() * 0.1), currentTime + duration);
        
        const gain = this.audioContext!.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(0.03 / (index + 1), currentTime + 1 + (index * 0.2));
        gain.gain.linearRampToValueAtTime(0.02 / (index + 1), currentTime + duration - 1);
        gain.gain.linearRampToValueAtTime(0, currentTime + duration);
        
        // Heavy filtering to create whisper-like quality
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 1.5, currentTime);
        filter.Q.setValueAtTime(3.0 + (index * 0.5), currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.mainGainNode!);
        
        whisperOscs.push(osc);
        whisperGains.push(gain);
      });

      // Add subtle modulation for breathing effect
      const breathLFO = this.audioContext.createOscillator();
      breathLFO.type = 'sine';
      breathLFO.frequency.setValueAtTime(0.3, currentTime); // Slow breathing rate
      
      const breathLFOGain = this.audioContext.createGain();
      breathLFOGain.gain.setValueAtTime(0.01, currentTime);
      
      breathLFO.connect(breathLFOGain);
      whisperGains.forEach(gain => {
        breathLFOGain.connect(gain.gain);
      });

      // Start all oscillators
      breathLFO.start(currentTime);
      whisperOscs.forEach(osc => osc.start(currentTime));

      // Stop all oscillators
      const stopTime = currentTime + duration;
      breathLFO.stop(stopTime);
      whisperOscs.forEach(osc => osc.stop(stopTime));

      console.log('👻 Void whisper effect triggered');
      return synthId;
    } catch (error) {
      console.warn('Failed to play void whisper:', error);
      return null;
    }
  }

  // Crystal Resonance - Magical shimmering sound for crystal activation
  async playCrystalResonance(): Promise<string | null> {
    if (!(await this.ensureAudioContextRunning()) || !this.audioContext || !this.mainGainNode) {
      return null;
    }

    const synthId = `crystal_resonance_${Date.now()}`;
    const currentTime = this.audioContext.currentTime;
    const duration = 1.8;

    try {
      // Base crystal tone - high frequency bell-like sound
      const baseFreq = 880; // A5 - bright crystalline frequency
      
      const crystalOsc = this.audioContext.createOscillator();
      crystalOsc.type = 'sine';
      crystalOsc.frequency.setValueAtTime(baseFreq, currentTime);
      // Slight frequency shimmer
      crystalOsc.frequency.linearRampToValueAtTime(baseFreq * 1.02, currentTime + duration * 0.5);
      crystalOsc.frequency.linearRampToValueAtTime(baseFreq, currentTime + duration);

      const crystalGain = this.audioContext.createGain();
      crystalGain.gain.setValueAtTime(0, currentTime);
      crystalGain.gain.linearRampToValueAtTime(0.25, currentTime + 0.05);
      crystalGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      // Add shimmer effect with modulation
      const shimmerLFO = this.audioContext.createOscillator();
      shimmerLFO.type = 'sine';
      shimmerLFO.frequency.setValueAtTime(8, currentTime); // 8Hz shimmer
      
      const shimmerLFOGain = this.audioContext.createGain();
      shimmerLFOGain.gain.setValueAtTime(0.15, currentTime);
      
      shimmerLFO.connect(shimmerLFOGain);
      shimmerLFOGain.connect(crystalGain.gain);

      crystalOsc.connect(crystalGain);
      crystalGain.connect(this.mainGainNode);

      // Add harmonic layers for magical richness
      const harmonics = [1.5, 2.0, 3.0]; // Perfect fifth, octave, perfect twelfth
      const harmonicOscs: OscillatorNode[] = [];

      harmonics.forEach((ratio, index) => {
        const harmOsc = this.audioContext!.createOscillator();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(baseFreq * ratio, currentTime);
        harmOsc.frequency.linearRampToValueAtTime(baseFreq * ratio * 1.02, currentTime + duration * 0.5);
        harmOsc.frequency.linearRampToValueAtTime(baseFreq * ratio, currentTime + duration);

        const harmGain = this.audioContext!.createGain();
        harmGain.gain.setValueAtTime(0, currentTime);
        harmGain.gain.linearRampToValueAtTime(0.12 / (index + 1), currentTime + 0.08 + (index * 0.02));
        harmGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

        harmOsc.connect(harmGain);
        harmGain.connect(this.mainGainNode!);

        harmonicOscs.push(harmOsc);
      });

      // Add sparkle layer - very high frequency for magical effect
      const sparkleOsc = this.audioContext.createOscillator();
      sparkleOsc.type = 'triangle';
      sparkleOsc.frequency.setValueAtTime(baseFreq * 4, currentTime);

      const sparkleGain = this.audioContext.createGain();
      sparkleGain.gain.setValueAtTime(0, currentTime);
      sparkleGain.gain.linearRampToValueAtTime(0.08, currentTime + 0.03);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration * 0.6);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(this.mainGainNode);

      // Start all oscillators
      shimmerLFO.start(currentTime);
      crystalOsc.start(currentTime);
      harmonicOscs.forEach(osc => osc.start(currentTime));
      sparkleOsc.start(currentTime);

      // Stop all oscillators
      const stopTime = currentTime + duration;
      shimmerLFO.stop(stopTime);
      crystalOsc.stop(stopTime);
      harmonicOscs.forEach(osc => osc.stop(stopTime));
      sparkleOsc.stop(stopTime);

      console.log('✨ Crystal resonance effect triggered');
      return synthId;
    } catch (error) {
      console.warn('Failed to play crystal resonance:', error);
      return null;
    }
  }

  // Cleanup method
  destroy() {
    this.stopAllSynths();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.mainGainNode = null;
    this.activeSynths.clear();
  }
}