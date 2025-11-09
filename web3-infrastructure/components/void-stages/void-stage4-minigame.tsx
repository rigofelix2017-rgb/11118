import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import bubbleSound from '@assets/bubble_iMw0wu6_1758195358381.mp3';
import { useUISounds } from '@/hooks/use-ui-sounds';

interface VoidStage4Props {
  onNext: () => void;
  progress: number;
  setProgress: (progress: number) => void;
}

interface ConsciousnessFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  age: number;
  color: string;
  pulsePhase: number;
}

interface NarrativeSequence {
  phase: 'fragmentation' | 'exploration' | 'gathering' | 'reformation' | 'complete';
  text: string;
  duration: number;
}

const narrativeSequences: NarrativeSequence[] = [
  { phase: 'fragmentation', text: 'Your consciousness fragments across dimensions...', duration: 6000 },
  { phase: 'exploration', text: 'Memories scatter like stars in the void...', duration: 0 }, // No auto-advance
  { phase: 'gathering', text: 'Click to gather consciousness fragments...', duration: 0 }, // No auto-advance
  { phase: 'reformation', text: 'The void recognizes you...', duration: 5000 },
  { phase: 'complete', text: 'Consciousness reformed. The void accepts you.', duration: 6000 }
];

export function VoidStage4Minigame({ onNext, progress, setProgress }: VoidStage4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPhase, setCurrentPhase] = useState<NarrativeSequence['phase']>('fragmentation');
  const [narrativeText, setNarrativeText] = useState('');
  const clickPointsRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const { playConsciousnessFragment, playVoidAmbience } = useUISounds();
  
  // Use refs for all mutable data to avoid dependency issues
  const fragmentsRef = useRef<ConsciousnessFragment[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const fragmentationStartTime = useRef<number>(0);
  const currentPhaseStartTime = useRef<number>(0);
  const gatheredFragments = useRef<ConsciousnessFragment[]>([]);
  const reformationProgress = useRef(0);
  const currentPhaseRef = useRef<NarrativeSequence['phase']>('fragmentation');
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const bubbleSoundPlayed = useRef(false);
  
  // Enhanced completion effects
  const completionStartTime = useRef(0);
  const lightningBolts = useRef<Array<{x1: number, y1: number, x2: number, y2: number, intensity: number, id: number}>>([]);
  const screenShake = useRef({ x: 0, y: 0, intensity: 0 });
  const completionFinished = useRef(false);
  
  // Initialize canvas dimensions
  useEffect(() => {
    canvasDimensions.current = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    if (canvasRef.current) {
      canvasRef.current.width = canvasDimensions.current.width;
      canvasRef.current.height = canvasDimensions.current.height;
    }
    
    // Initialize mouse position to center
    mousePos.current = {
      x: canvasDimensions.current.width / 2,
      y: canvasDimensions.current.height / 2
    };
  }, []);

  // Keep currentPhaseRef in sync with currentPhase state
  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(bubbleSound);
    audioRef.current.volume = 0.6;
    
    // Start void ambience for atmospheric effect
    playVoidAmbience?.(0.5, 20); // Medium intensity, 20 second duration
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [playVoidAmbience]);

  // Reset bubble sound flag when phase changes and reset reformation progress
  useEffect(() => {
    if (currentPhase === 'reformation') {
      // Reset reformation progress when entering reformation phase
      reformationProgress.current = 0;
    } else if (currentPhase === 'complete') {
      // Reset completion effects when entering complete phase
      completionStartTime.current = 0;
      lightningBolts.current = [];
      screenShake.current = { x: 0, y: 0, intensity: 0 };
      completionFinished.current = false;
    } else {
      bubbleSoundPlayed.current = false;
    }
  }, [currentPhase]);

  // Initialize consciousness fragments
  const initializeFragments = useCallback(() => {
    const fragments: ConsciousnessFragment[] = [];
    const centerX = canvasDimensions.current.width / 2;
    const centerY = canvasDimensions.current.height / 2;
    
    const colors = [
      'rgba(0, 255, 255, ',
      'rgba(0, 255, 0, ',
      'rgba(100, 200, 255, ',
      'rgba(255, 100, 255, ',
      'rgba(150, 255, 150, '
    ];
    
    for (let i = 0; i < 150; i++) {
      const angle = (i / 150) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const radius = Math.random() * 10;
      fragments.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: Math.cos(angle) * (Math.random() * 1.5 + 1.5),
        vy: Math.sin(angle) * (Math.random() * 1.5 + 1.5),
        opacity: 1,
        size: Math.random() * 6 + 2,
        age: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    fragmentsRef.current = fragments;
    gatheredFragments.current = [];
    reformationProgress.current = 0;
  }, []);

  // Handle mouse movement - no dependencies to avoid recreation
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Handle click interaction - minimal dependencies
  const handleClick = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add click point for visual effect
    clickPointsRef.current.push({ x, y, time: Date.now() });
    
    // In exploration phase, clicking advances to gathering phase
    if (currentPhaseRef.current === 'exploration') {
      setCurrentPhase('gathering');
      setProgress(20);
      return;
    }
    
    // In gathering phase, clicking gathers nearby fragments
    if (currentPhaseRef.current === 'gathering') {
      const nearbyFragments = fragmentsRef.current.filter(fragment => {
        const distance = Math.sqrt(
          Math.pow(fragment.x - x, 2) + 
          Math.pow(fragment.y - y, 2)
        );
        return distance < 150 && fragment.opacity > 0.1;
      });
      
      nearbyFragments.forEach(fragment => {
        gatheredFragments.current.push({
          ...fragment,
          vx: 0,
          vy: 0
        });
        fragment.opacity = 0;
        
        // Play consciousness fragment sound for each gathered fragment
        playConsciousnessFragment?.();
      });
      
      // Check if enough particles have been gathered (require 60 out of 150)
      const gatheringThreshold = 60;
      const gatheredCount = gatheredFragments.current.length;
      
      if (gatheredCount >= gatheringThreshold) {
        // Start coalescing phase - gather remaining fragments automatically
        setTimeout(() => {
          // Automatically gather remaining visible fragments
          fragmentsRef.current.forEach(fragment => {
            if (fragment.opacity > 0.1) {
              gatheredFragments.current.push({
                ...fragment,
                vx: 0,
                vy: 0
              });
              fragment.opacity = 0;
            }
          });
          
          // Move to reformation phase after coalescing
          setTimeout(() => {
            setCurrentPhase('reformation');
            setProgress(60);
          }, 3000);
        }, 1500);
      }
      
      // Update progress based on gathered fragments
      const gatheredRatio = gatheredCount / gatheringThreshold;
      setProgress(20 + gatheredRatio * 40);
    }
  }, [setProgress, setCurrentPhase]);

  // Main animation loop - stable function with no dependencies
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvasDimensions.current.width / 2;
    const centerY = canvasDimensions.current.height / 2;
    const timeElapsed = Date.now() - fragmentationStartTime.current;
    const phaseTime = Date.now() - currentPhaseStartTime.current;
    const currentPhase = currentPhaseRef.current;
    
    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(0, 0, 8, 0.1)';
    ctx.fillRect(0, 0, canvasDimensions.current.width, canvasDimensions.current.height);

    switch (currentPhase) {
      case 'fragmentation':
        if (phaseTime < 4000) {
          // Initial orb that's about to explode
          const pulseIntensity = Math.sin(phaseTime * 0.005) * 0.3 + 1;
          const orbRadius = Math.min(canvasDimensions.current.width, canvasDimensions.current.height) * 0.3 * pulseIntensity;

          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius);
          gradient.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.6)');
          gradient.addColorStop(1, 'rgba(0, 100, 200, 0.2)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Explosion of fragments with boundary checking
          fragmentsRef.current.forEach(fragment => {
            // Apply drag to slow down fragments over time
            fragment.vx *= 0.990;
            fragment.vy *= 0.990;
            
            // Update position
            fragment.x += fragment.vx;
            fragment.y += fragment.vy;
            fragment.age += 1;

            // Boundary checking - wrap around screen edges
            const margin = 50;
            if (fragment.x < -margin) fragment.x = canvasDimensions.current.width + margin;
            if (fragment.x > canvasDimensions.current.width + margin) fragment.x = -margin;
            if (fragment.y < -margin) fragment.y = canvasDimensions.current.height + margin;
            if (fragment.y > canvasDimensions.current.height + margin) fragment.y = -margin;

            // Keep minimum opacity and slow decay
            fragment.opacity = Math.max(0.2, fragment.opacity * 0.9995);

            // Render all fragments with minimum opacity
            const pulseIntensity = Math.sin(fragment.pulsePhase + fragment.age * 0.05) * 0.4 + 0.8;
            
            ctx.beginPath();
            ctx.fillStyle = fragment.color + (fragment.opacity * pulseIntensity) + ')';
            ctx.arc(fragment.x, fragment.y, fragment.size * pulseIntensity, 0, Math.PI * 2);
            ctx.fill();
            
            // Trailing glow
            ctx.beginPath();
            ctx.strokeStyle = fragment.color + (fragment.opacity * pulseIntensity * 0.3) + ')';
            ctx.lineWidth = 1;
            ctx.arc(fragment.x, fragment.y, fragment.size + 4, 0, Math.PI * 2);
            ctx.stroke();
          });
        }
        break;

      case 'exploration':
        fragmentsRef.current.forEach(fragment => {
          const dx = mousePos.current.x - fragment.x;
          const dy = mousePos.current.y - fragment.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200 && distance > 0) {
            const force = (200 - distance) / 200;
            fragment.vx += (dx / distance) * force * 0.3;
            fragment.vy += (dy / distance) * force * 0.3;
          }
          
          fragment.vx *= 0.99;
          fragment.vy *= 0.99;
          fragment.x += fragment.vx;
          fragment.y += fragment.vy;
          fragment.age += 1;

          // Boundary checking - wrap around screen edges
          const margin = 50;
          if (fragment.x < -margin) fragment.x = canvasDimensions.current.width + margin;
          if (fragment.x > canvasDimensions.current.width + margin) fragment.x = -margin;
          if (fragment.y < -margin) fragment.y = canvasDimensions.current.height + margin;
          if (fragment.y > canvasDimensions.current.height + margin) fragment.y = -margin;

          fragment.opacity = Math.max(0.3, fragment.opacity * 0.998);

          if (fragment.opacity > 0.05) {
            const pulseIntensity = Math.sin(fragment.pulsePhase + fragment.age * 0.02) * 0.3 + 0.7;
            
            const gradient = ctx.createRadialGradient(
              fragment.x, fragment.y, 0,
              fragment.x, fragment.y, fragment.size * 3
            );
            gradient.addColorStop(0, fragment.color + fragment.opacity + ')');
            gradient.addColorStop(1, fragment.color + '0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(fragment.x, fragment.y, fragment.size * 3 * pulseIntensity, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        break;

      case 'gathering':
        fragmentsRef.current.forEach(fragment => {
          fragment.x += Math.sin(fragment.age * 0.01 + fragment.pulsePhase) * 0.3;
          fragment.y += Math.cos(fragment.age * 0.01 + fragment.pulsePhase) * 0.3;
          fragment.age += 1;

          if (fragment.opacity > 0.05) {
            const pulseIntensity = Math.sin(fragment.pulsePhase + fragment.age * 0.02) * 0.3 + 0.7;
            
            ctx.beginPath();
            ctx.fillStyle = fragment.color + fragment.opacity + ')';
            ctx.arc(fragment.x, fragment.y, fragment.size * pulseIntensity, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight gatherable fragments near cursor
            const dx = mousePos.current.x - fragment.x;
            const dy = mousePos.current.y - fragment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 * (1 - distance / 150)) + ')';
              ctx.lineWidth = 2;
              ctx.arc(fragment.x, fragment.y, fragment.size + 5, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        });
        
        // Draw gathered fragments converging
        gatheredFragments.current.forEach((fragment, index) => {
          const targetX = centerX + Math.cos(index * 0.1) * 50;
          const targetY = centerY + Math.sin(index * 0.1) * 50;
          
          fragment.x += (targetX - fragment.x) * 0.02;
          fragment.y += (targetY - fragment.y) * 0.02;
          
          ctx.beginPath();
          ctx.fillStyle = fragment.color + '0.8)';
          ctx.arc(fragment.x, fragment.y, fragment.size, 0, Math.PI * 2);
          ctx.fill();
        });
        break;

      case 'reformation':
        reformationProgress.current += 0.004;
        
        // Play bubble sound when orb becomes solid (around 50% formation)
        if (reformationProgress.current >= 0.5 && !bubbleSoundPlayed.current && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
          bubbleSoundPlayed.current = true;
        }
        
        const reformRadius = Math.min(canvasDimensions.current.width, canvasDimensions.current.height) * 0.2 * Math.min(reformationProgress.current, 1);
        
        // Multiple layers for depth
        for (let i = 3; i > 0; i--) {
          const layerRadius = reformRadius * (1 + i * 0.1);
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, layerRadius);
          gradient.addColorStop(0, `rgba(200, 240, 255, ${0.3 / i})`);
          gradient.addColorStop(0.5, `rgba(100, 200, 255, ${0.2 / i})`);
          gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw converging fragments
        gatheredFragments.current.forEach((fragment, index) => {
          const angle = (index / gatheredFragments.current.length) * Math.PI * 2;
          const targetRadius = reformRadius * (1 - reformationProgress.current);
          const targetX = centerX + Math.cos(angle) * targetRadius;
          const targetY = centerY + Math.sin(angle) * targetRadius;
          
          fragment.x += (targetX - fragment.x) * 0.05;
          fragment.y += (targetY - fragment.y) * 0.05;
          fragment.opacity = 1 - reformationProgress.current;
          
          if (fragment.opacity > 0.01) {
            ctx.beginPath();
            ctx.fillStyle = fragment.color + fragment.opacity + ')';
            ctx.arc(fragment.x, fragment.y, fragment.size * (1 - reformationProgress.current), 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        break;

      case 'complete':
        // Initialize completion timing
        if (completionStartTime.current === 0) {
          completionStartTime.current = Date.now();
        }
        
        const now = Date.now();
        const completionElapsed = now - completionStartTime.current;
        const completionProgress = Math.min(completionElapsed / 6000, 1); // 6 second buildup for smoother timing
        
        // Trigger transition after full buildup
        if (completionProgress >= 1 && !completionFinished.current) {
          completionFinished.current = true;
          setTimeout(() => onNext(), 500); // Small delay to see final effect
        }
        
        const finalRadius = Math.min(canvasDimensions.current.width, canvasDimensions.current.height) * 0.15;
        const basePulse = Math.sin(now * 0.003) * 0.15 + 1; // More dynamic pulsing
        const energyIntensity = Math.pow(completionProgress, 0.7); // Smoother energy buildup curve
        
        // Dynamic screen shake effect that builds up smoothly
        const shakeIntensity = energyIntensity * energyIntensity * 12 * (Math.sin(now * 0.015) * 0.5 + 0.5);
        screenShake.current.x = (Math.random() - 0.5) * shakeIntensity;
        screenShake.current.y = (Math.random() - 0.5) * shakeIntensity;
        
        // Apply screen shake to canvas transform
        ctx.save();
        ctx.translate(screenShake.current.x, screenShake.current.y);
        
        // Color morphing - cycles through colors and ends on green
        let orbColor1, orbColor2, orbColor3, orbColor4;
        
        if (completionProgress < 0.75) {
          // Smoother, more dynamic color cycling
          const timeBase = now * 0.008;
          const cycle1 = Math.sin(timeBase) * 0.5 + 0.5;
          const cycle2 = Math.sin(timeBase * 1.3 + 1) * 0.5 + 0.5;
          const cycle3 = Math.sin(timeBase * 0.7 + 2) * 0.5 + 0.5;
          
          const colors = [
            ['255, 255, 255', '0, 255, 255', '0, 200, 255', '0, 100, 200'],
            ['255, 100, 255', '255, 0, 255', '200, 0, 255', '100, 0, 200'],
            ['255, 255, 0', '255, 200, 0', '255, 150, 0', '200, 100, 0'],
            ['255, 100, 100', '255, 0, 0', '200, 0, 0', '150, 0, 0']
          ];
          
          // Blend between multiple color sets for smoother transitions
          const colorIndex1 = Math.floor(cycle1 * colors.length);
          const colorIndex2 = Math.floor(cycle2 * colors.length);
          const blendFactor = cycle3;
          
          const color1 = colors[colorIndex1];
          const color2 = colors[colorIndex2];
          
          // Simple color blending
          orbColor1 = color1[0];
          orbColor2 = blendFactor > 0.5 ? color1[1] : color2[1];
          orbColor3 = blendFactor > 0.3 ? color1[2] : color2[2];
          orbColor4 = color2[3];
        } else {
          // Smoother transition to green
          const greenProgress = Math.pow((completionProgress - 0.75) / 0.25, 2); // Ease-in curve
          const whiteIntensity = Math.floor(255 * (1 - greenProgress));
          orbColor1 = `255, 255, 255`;
          orbColor2 = `${whiteIntensity}, 255, ${whiteIntensity}`;
          orbColor3 = `0, 255, 0`;
          orbColor4 = `0, ${150 + Math.floor(105 * greenProgress)}, 0`; // Brighter green
        }
        
        
        // Dynamic lightning bolts around the orb
        if (energyIntensity > 0.3) {
          // More frequent lightning generation with dynamic timing
          const lightningChance = 0.15 + energyIntensity * 0.25; // Increases with energy
          if (Math.random() < lightningChance) {
            const angle = Math.random() * Math.PI * 2;
            const distance = finalRadius * (1.3 + Math.random() * 1.2); // Longer bolts
            const intensity = 0.3 + Math.random() * 0.7 + energyIntensity * 0.5; // Brighter with energy
            lightningBolts.current.push({
              x1: centerX + Math.cos(angle) * (finalRadius * 0.9),
              y1: centerY + Math.sin(angle) * (finalRadius * 0.9),
              x2: centerX + Math.cos(angle) * distance,
              y2: centerY + Math.sin(angle) * distance,
              intensity: intensity,
              id: Date.now()
            });
          }
          
          // Update and draw lightning bolts with smoother fading
          lightningBolts.current = lightningBolts.current.filter(bolt => bolt.intensity > 0.05);
          lightningBolts.current.forEach(bolt => {
            bolt.intensity *= 0.92; // Slightly slower fade for smoother effect
            
            // Use green that matches the final orb color
            const greenComponent = completionProgress > 0.75 ? 255 : Math.floor(200 + 55 * energyIntensity);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, ${greenComponent}, 0, ${bolt.intensity})`;
            ctx.lineWidth = 1.5 + energyIntensity;
            ctx.moveTo(bolt.x1, bolt.y1);
            
            // Create more dynamic jagged lightning effect
            const steps = 6 + Math.floor(energyIntensity * 3);
            const jitterAmount = 15 + energyIntensity * 15;
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const x = bolt.x1 + (bolt.x2 - bolt.x1) * t + (Math.random() - 0.5) * jitterAmount;
              const y = bolt.y1 + (bolt.y2 - bolt.y1) * t + (Math.random() - 0.5) * jitterAmount;
              ctx.lineTo(x, y);
            }
            
            ctx.stroke();
          });
        }
        
        // Main consciousness orb with dynamic colors
        const finalGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, finalRadius * basePulse);
        finalGradient.addColorStop(0, `rgba(${orbColor1}, 0.9)`);
        finalGradient.addColorStop(0.3, `rgba(${orbColor2}, 0.7)`);
        finalGradient.addColorStop(0.6, `rgba(${orbColor3}, 0.5)`);
        finalGradient.addColorStop(1, `rgba(${orbColor4}, 0.2)`);
        
        ctx.fillStyle = finalGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, finalRadius * basePulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic glow effect that builds smoothly
        if (energyIntensity > 0.4) {
          const glowIntensity = Math.pow((energyIntensity - 0.4) / 0.6, 1.5);
          const glowSize = 30 + glowIntensity * 40;
          const glowOpacity = glowIntensity * 0.6;
          
          ctx.shadowBlur = glowSize;
          ctx.shadowColor = `rgba(0, 255, 0, ${glowOpacity})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, finalRadius * (0.7 + glowIntensity * 0.2), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 0, ${glowIntensity * 0.25})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        ctx.restore();
        break;
    }
    
    // Draw click effects using ref
    const now = Date.now();
    clickPointsRef.current = clickPointsRef.current.filter(point => now - point.time < 1000);
    clickPointsRef.current.forEach(point => {
      const age = (now - point.time) / 1000;
      const radius = age * 100;
      const opacity = 1 - age;
      
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Phase progression - separate effect to avoid dependency issues
  useEffect(() => {
    const sequence = narrativeSequences.find(s => s.phase === currentPhase);
    if (!sequence) return;
    
    setNarrativeText(sequence.text);
    currentPhaseStartTime.current = Date.now();
    
    // Only set timer if duration > 0 (auto-advance)
    if (sequence.duration > 0) {
      const timer = setTimeout(() => {
        const currentIndex = narrativeSequences.findIndex(s => s.phase === currentPhase);
        if (currentIndex < narrativeSequences.length - 1) {
          const nextPhase = narrativeSequences[currentIndex + 1].phase;
          setCurrentPhase(nextPhase);
          
          const progressPercentage = ((currentIndex + 1) / narrativeSequences.length) * 100;
          setProgress(progressPercentage);
          
          if (nextPhase === 'complete') {
            // Don't auto-advance from complete phase - let the buildup finish
          }
        }
      }, sequence.duration);
      
      return () => clearTimeout(timer);
    }
  }, [currentPhase, setProgress, onNext]);

  // Initialize and start animation - separate effects
  useEffect(() => {
    initializeFragments();
    fragmentationStartTime.current = Date.now();
    currentPhaseStartTime.current = Date.now();
  }, [initializeFragments]);

  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [handleMouseMove, handleClick]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
      data-testid="void-stage-minigame"
    >
      {/* Canvas for animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ 
          background: 'radial-gradient(circle at center, #000020 0%, #000008 100%)',
          cursor: currentPhase === 'gathering' ? 'pointer' : 'default'
        }}
      />
      
      {/* Narrative text overlay */}
      <motion.div
        key={narrativeText}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 1 }}
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none"
      >
        <h2 className="text-2xl md:text-3xl font-mono text-retro-green drop-shadow-lg"
            style={{ textShadow: '0 0 20px rgba(0, 255, 0, 0.5)' }}>
          {narrativeText}
        </h2>
      </motion.div>
      
      {/* Interactive hints */}
      {currentPhase === 'exploration' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
        >
          <p className="text-retro-cyan font-mono text-sm">
            Click anywhere to begin gathering
          </p>
        </motion.div>
      )}
      
      {currentPhase === 'gathering' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
        >
          <p className="text-retro-cyan font-mono text-sm">
            Click to gather consciousness fragments ({Math.floor((progress - 20) / 40 * 60)}/60)
          </p>
        </motion.div>
      )}
      
    </motion.div>
  );
}