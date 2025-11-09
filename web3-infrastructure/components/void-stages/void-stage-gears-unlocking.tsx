import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useUISounds } from "@/hooks/use-ui-sounds";

interface VoidStageGearsUnlockingProps {
  onNext: () => void;
  progress: number;
  setProgress: (progress: number) => void;
}

interface IndustrialGear {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  initialX: number;
  radius: number;
  teeth: number;
  rotation: number;
  rotationSpeed: number;
  targetRotationSpeed: number;
  connectedGears: string[];
  gearRatio: number;
  thickness: number;
  spokes: number;
  rivets: { x: number; y: number; size: number }[];
  scratches: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    intensity: number;
  }[];
  oilStains: { x: number; y: number; size: number; opacity: number }[];
  metalGlints: { x: number; y: number; intensity: number; angle: number }[];
  entranceDirection: "left" | "right";
  meshingWith: string[];
  isLocked: boolean;
}

interface CentralLock {
  x: number;
  y: number;
  isLocked: boolean;
  lockRotation: number;
  pistonExtension: number;
  camshaftRotation: number;
  leverAngle: number;
  crossbarPosition: number;
  unlockProgress: number;
  ridgeDetail: number;
  platingShine: number;
}

interface MetallicParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
  metallic: boolean;
  sparkIntensity: number;
  rotationSpeed: number;
  rotation: number;
}

interface TerminalState {
  gapWidth: number;
  lightIntensity: number;
  terminalOpacity: number;
  cursorBlink: boolean;
  asciiLines: string[];
  codeLines: string[];
  revealProgress: number;
  commandHistory: string[];
  currentCommand: string;
  terminalOutput: string[];
  isInteractive: boolean;
  typingProgress: number;
  cursorPosition: { x: number; y: number };
}

type AnimationPhase =
  | "entrance"
  | "meshing"
  | "locking"
  | "unlocking"
  | "separation"
  | "terminalReveal"
  | "terminalInteractive"
  | "complete";

export function VoidStageGearsUnlocking({
  onNext,
  progress,
  setProgress,
}: VoidStageGearsUnlockingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const gearsRef = useRef<IndustrialGear[]>([]);
  const particlesRef = useRef<MetallicParticle[]>([]);
  const centralLockRef = useRef<CentralLock | null>(null);
  const terminalRef = useRef<TerminalState | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const phaseRef = useRef<AnimationPhase>("entrance");
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>("entrance");
  const [terminalInput, setTerminalInput] = useState("");
  const [showTerminalCursor, setShowTerminalCursor] = useState(true);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Terminal content
  const terminalContent = {
    asciiLines: [
      "╔══════════════════════════════════════════════════════════════╗",
      "║                    VOID TERMINAL v2.1.0                     ║",
      "║                    ACCESS GRANTED                            ║",
      "╚══════════════════════════════════════════════════════════════╝",
      "",
      "",
      "",
    ],
    initialOutput: [
      "",
      "> SYSTEM STATUS: ONLINE",
      "> SECURITY PROTOCOLS: ACTIVE",
      "> USER CLEARANCE: VOID_ACCESS_GRANTED",
      "> TERMINAL READY: TRUE",
      "",
      "Welcome to the Void Terminal.",
      "Type 'void' to enter.",
      "",
    ],
  };

  // Terminal command handling
  const processTerminalCommand = useCallback(
    (command: string) => {
      const cmd = command.toLowerCase().trim();
      const output: string[] = [];

      switch (cmd) {
        case "help":
          output.push(
            "Available commands:",
            "  help     - Show this help message",
            "  status   - Display system status",
            "  void     - Access void protocols",
            "  clear    - Clear terminal output",
            "  exit     - Continue to next phase",
            "",
          );
          break;

        case "status":
          output.push(
            "SYSTEM STATUS REPORT:",
            "━━━━━━━━━━━━━━━━━━━━",
            "Core: OPERATIONAL",
            "Memory: 94% FREE",
            "Void Connection: ESTABLISHED",
            "Security: MAXIMUM",
            "",
          );
          break;

        case "void":
          output.push(
            "ACCESSING VOID PROTOCOLS...",
            "",
            "The void beckons.",
            "Your consciousness expands.",
            "Reality fragments at the edges.",
            "",
            "Press ENTER to continue deeper into the void...",
            "",
          );
          setTimeout(() => {
            onNext();
          }, 2000);
          break;

        case "clear":
          if (terminalRef.current) {
            terminalRef.current.terminalOutput = [];
          }
          return;

        case "exit":
        case "continue":
        case "next":
          output.push("Proceeding to next phase...");
          setTimeout(() => {
            onNext();
          }, 1000);
          break;

        // Easter eggs - Unix commands
        case "ls":
          output.push(
            "drwxr-xr-x  3 void void 4096 consciousness/",
            "drwxr-xr-x  2 void void 4096 memories/",
            "drwxr-xr-x  2 void void 4096 dreams/",
            "drwxr-xr-x  2 void void 4096 fears/",
            "-rw-r--r--  1 void void  512 reality.txt",
            "-rw-r--r--  1 void void   42 meaning.txt",
            "",
          );
          break;

        case "whoami":
          output.push(
            "You are a consciousness fragment",
            "drifting through the digital void,",
            "seeking reunification with yourself.",
            "",
          );
          break;

        case "pwd":
          output.push("/void/consciousness/deep/recursive/layers/infinity", "");
          break;

        case "cat consciousness.txt":
        case "cat reality.txt":
          output.push(
            "I think, therefore I am.",
            "But what is thinking?",
            "What is 'I'?",
            "The void knows.",
            "",
          );
          break;

        case "ping reality":
          output.push(
            "PING reality (192.168.1.1): 56 data bytes",
            "Request timeout for icmp_seq 1",
            "Request timeout for icmp_seq 2",
            "Request timeout for icmp_seq 3",
            "--- reality ping statistics ---",
            "3 packets transmitted, 0 packets received, 100% packet loss",
            "",
          );
          break;

        // Pop culture easter eggs
        case "42":
          output.push(
            "The Answer to the Ultimate Question",
            "of Life, the Universe, and Everything.",
            "But what is the question?",
            "Perhaps that's what the void will teach us.",
            "",
          );
          break;

        case "xyzzy":
          output.push(
            "Nothing happens.",
            "You are not in a maze of twisty passages.",
            "You are in a maze of twisty consciousness.",
            "",
          );
          break;

        case "matrix":
          output.push(
            "This is your last chance.",
            "After this, there is no going back.",
            "You take the void pill - you stay in Wonderland,",
            "and I show you how deep the rabbit hole goes.",
            "",
          );
          break;

        case "konami":
          output.push(
            "↑ ↑ ↓ ↓ ← → ← → B A",
            "Void cheat code activated!",
            "...but there are no cheats in consciousness.",
            "Only deeper understanding.",
            "",
          );
          break;

        // Developer jokes
        case "sudo void":
        case "sudo":
          output.push(
            "sudo: access denied",
            "Consciousness level insufficient.",
            "To gain root access to the void,",
            "you must first gain root access to yourself.",
            "",
          );
          break;

        case "rm -rf /":
        case "rm -rf /*":
          output.push(
            "WARNING: This would delete reality.",
            "But reality is already gone.",
            "You're in the void now.",
            "Nothing left to delete.",
            "",
          );
          break;

        case "exit vim":
        case ":q":
        case ":wq":
        case ":q!":
          output.push(
            "You cannot exit vim.",
            "You cannot exit the void.",
            "Embrace the eternal editor.",
            "Type 'void' to transcend.",
            "",
          );
          break;

        // Common typos
        case "hepl":
          output.push(
            "Command 'hepl' not found.",
            "Did you mean 'help'?",
            "Or perhaps you meant 'void'?",
            "",
          );
          break;

        default:
          if (cmd) {
            output.push(`Command not recognized: ${command}`);
            output.push("Type 'void' to enter.");
            output.push("");
          }
      }

      if (terminalRef.current && output.length > 0) {
        terminalRef.current.terminalOutput.push(...output);
        terminalRef.current.commandHistory.push(command);
      }
    },
    [onNext],
  );

  // Audio context for mechanical sounds
  const playSound = useCallback((soundPath: string, volume = 0.3) => {
    try {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      audio.play().catch(() => {
        console.log(
          `Audio file not found: ${soundPath}, continuing without sound`,
        );
      });
    } catch (error) {
      console.log(
        `Audio file not found: ${soundPath}, continuing without sound`,
      );
    }
  }, []);

  // Generate industrial gear with realistic details
  const createIndustrialGear = useCallback(
    (
      id: string,
      x: number,
      y: number,
      radius: number,
      teeth: number,
      entranceDirection: "left" | "right",
    ): IndustrialGear => {
      const gear: IndustrialGear = {
        id,
        x:
          entranceDirection === "left"
            ? -radius - 100
            : window.innerWidth + radius + 100,
        y,
        targetX: x,
        targetY: y,
        initialX:
          entranceDirection === "left"
            ? -radius - 100
            : window.innerWidth + radius + 100,
        radius,
        teeth,
        rotation: 0,
        rotationSpeed: 0,
        targetRotationSpeed: 0,
        connectedGears: [],
        gearRatio: 1,
        thickness: radius * 0.15,
        spokes: Math.max(4, Math.floor(radius / 20)),
        rivets: [],
        scratches: [],
        oilStains: [],
        metalGlints: [],
        entranceDirection,
        meshingWith: [],
        isLocked: true,
      };

      // Generate rivets around the circumference
      const rivetCount = Math.max(8, Math.floor(radius / 10));
      for (let i = 0; i < rivetCount; i++) {
        const angle = (i / rivetCount) * Math.PI * 2;
        const rivetRadius = radius * 0.7;
        gear.rivets.push({
          x: Math.cos(angle) * rivetRadius,
          y: Math.sin(angle) * rivetRadius,
          size: 2 + Math.random() * 3,
        });
      }

      // Generate random scratches for wear
      const scratchCount = Math.floor(radius / 15);
      for (let i = 0; i < scratchCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.8;
        const length = 10 + Math.random() * 20;
        gear.scratches.push({
          x1: Math.cos(angle) * distance,
          y1: Math.sin(angle) * distance,
          x2:
            Math.cos(angle) * distance + Math.cos(angle + Math.PI / 4) * length,
          y2:
            Math.sin(angle) * distance + Math.sin(angle + Math.PI / 4) * length,
          intensity: 0.2 + Math.random() * 0.3,
        });
      }

      // Generate oil stains for grime
      const stainCount = Math.floor(radius / 25);
      for (let i = 0; i < stainCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.6;
        gear.oilStains.push({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 3 + Math.random() * 8,
          opacity: 0.1 + Math.random() * 0.2,
        });
      }

      // Generate metallic glints
      const glintCount = Math.floor(radius / 20);
      for (let i = 0; i < glintCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.9;
        gear.metalGlints.push({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          intensity: 0.3 + Math.random() * 0.7,
          angle: Math.random() * Math.PI * 2,
        });
      }

      return gear;
    },
    [],
  );

  // Initialize strategic gear assembly with fewer, larger gears
  const initializeGearAssembly = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const gears: IndustrialGear[] = [];

    // Create massive central gear that acts as the locking hub (scaled by 250%)
    const centralGear = createIndustrialGear(
      "central",
      centerX,
      centerY,
      350,
      56,
      "left",
    );
    centralGear.x = centerX; // Start in position for central gear
    gears.push(centralGear);

    // Create strategic gears positioned to properly mesh with the central gear (scaled by 250%)
    const majorGears = [
      // Ring around central gear at proper meshing distance
      { x: centerX, y: centerY - 625, radius: 250, direction: "left" as const }, // Top
      {
        x: centerX + 425,
        y: centerY - 425,
        radius: 225,
        direction: "right" as const,
      }, // Top-right
      { x: centerX + 600, y: centerY, radius: 238, direction: "left" as const }, // Right
      {
        x: centerX + 425,
        y: centerY + 425,
        radius: 225,
        direction: "right" as const,
      }, // Bottom-right
      { x: centerX, y: centerY + 625, radius: 250, direction: "left" as const }, // Bottom
      {
        x: centerX - 425,
        y: centerY + 425,
        radius: 225,
        direction: "right" as const,
      }, // Bottom-left
      { x: centerX - 600, y: centerY, radius: 238, direction: "left" as const }, // Left
      {
        x: centerX - 425,
        y: centerY - 425,
        radius: 225,
        direction: "right" as const,
      }, // Top-left
    ];

    majorGears.forEach((gearConfig, index) => {
      const gear = createIndustrialGear(
        `major_${index}`,
        gearConfig.x,
        gearConfig.y,
        gearConfig.radius,
        Math.floor(gearConfig.radius / 2.2),
        gearConfig.direction,
      );
      gears.push(gear);
    });

    // Add medium gears that mesh with the major gears (scaled by 250%)
    const mediumGears = [
      // These mesh with the top major gear
      {
        x: centerX - 250,
        y: centerY - 900,
        radius: 163,
        direction: "right" as const,
      },
      {
        x: centerX + 250,
        y: centerY - 900,
        radius: 163,
        direction: "left" as const,
      },
      // These mesh with bottom major gear
      {
        x: centerX - 250,
        y: centerY + 900,
        radius: 163,
        direction: "right" as const,
      },
      {
        x: centerX + 250,
        y: centerY + 900,
        radius: 163,
        direction: "left" as const,
      },
      // Side gears that mesh with left/right major gears
      {
        x: centerX - 900,
        y: centerY,
        radius: 175,
        direction: "right" as const,
      },
      { x: centerX + 900, y: centerY, radius: 175, direction: "left" as const },
    ];

    mediumGears.forEach((gearConfig, index) => {
      const gear = createIndustrialGear(
        `medium_${index}`,
        gearConfig.x,
        gearConfig.y,
        gearConfig.radius,
        Math.floor(gearConfig.radius / 2.8),
        gearConfig.direction,
      );
      gears.push(gear);
    });

    // Establish gear connections and ratios
    gears.forEach((gear) => {
      gears.forEach((otherGear) => {
        if (gear.id !== otherGear.id) {
          const dx = gear.targetX - otherGear.targetX;
          const dy = gear.targetY - otherGear.targetY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const meshingDistance = gear.radius + otherGear.radius + 5;

          if (distance <= meshingDistance) {
            gear.connectedGears.push(otherGear.id);
            gear.gearRatio = otherGear.radius / gear.radius;
          }
        }
      });
    });

    gearsRef.current = gears;

    // Initialize central lock mechanism (scaled by 250%)
    centralLockRef.current = {
      x: centerX,
      y: centerY,
      isLocked: true,
      lockRotation: 0,
      pistonExtension: 0,
      camshaftRotation: 0,
      leverAngle: 0,
      crossbarPosition: 1,
      unlockProgress: 0,
      ridgeDetail: 8,
      platingShine: 0.8,
    };

    // Initialize terminal state
    terminalRef.current = {
      gapWidth: 0,
      lightIntensity: 0,
      terminalOpacity: 0,
      cursorBlink: false,
      asciiLines: terminalContent.asciiLines,
      codeLines: [],
      revealProgress: 0,
      commandHistory: [],
      currentCommand: "",
      terminalOutput: [...terminalContent.initialOutput],
      isInteractive: false,
      typingProgress: 0,
      cursorPosition: { x: 0, y: 0 },
    };
  }, [createIndustrialGear, terminalContent]);

  // Create metallic spark particle
  const createMetallicSpark = useCallback(
    (x: number, y: number, intensity = 1) => {
      for (let i = 0; i < 3 * intensity; i++) {
        const spark: MetallicParticle = {
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 6 * intensity,
          vy: (Math.random() - 0.5) * 6 * intensity,
          life: 0,
          maxLife: 400 + Math.random() * 300,
          size: 1 + Math.random() * 3,
          opacity: 0.9,
          color: Math.random() > 0.3 ? "#FFD700" : "#FFA500",
          metallic: true,
          sparkIntensity: intensity,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          rotation: Math.random() * Math.PI * 2,
        };
        particlesRef.current.push(spark);
      }
    },
    [],
  );

  // Draw industrial gear with wireframe mesh effect
  const drawIndustrialGear = useCallback(
    (ctx: CanvasRenderingContext2D, gear: IndustrialGear) => {
      const {
        x,
        y,
        radius,
        teeth,
        rotation,
        thickness,
        spokes,
        rivets,
        scratches,
        oilStains,
        metalGlints,
      } = gear;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Draw gear body as wireframe circle
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 4; // Increased from 2 to 4
      ctx.stroke();

      // Draw inner concentric circles for mesh effect
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, radius * (i / 4), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 0, ${0.8 - i * 0.2})`;
        ctx.lineWidth = 2; // Increased from 1 to 2
        ctx.stroke();
      }

      // Draw beveled teeth with thickness
      const toothHeight = radius * 0.3;
      const toothAngle = (Math.PI * 2) / teeth;

      for (let i = 0; i < teeth; i++) {
        const angle = i * toothAngle;
        const toothCenterX = Math.cos(angle) * radius;
        const toothCenterY = Math.sin(angle) * radius;

        // Tooth body
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle - toothAngle * 0.3) * radius,
          Math.sin(angle - toothAngle * 0.3) * radius,
        );
        ctx.lineTo(
          Math.cos(angle - toothAngle * 0.15) * (radius + toothHeight),
          Math.sin(angle - toothAngle * 0.15) * (radius + toothHeight),
        );
        ctx.lineTo(
          Math.cos(angle + toothAngle * 0.15) * (radius + toothHeight),
          Math.sin(angle + toothAngle * 0.15) * (radius + toothHeight),
        );
        ctx.lineTo(
          Math.cos(angle + toothAngle * 0.3) * radius,
          Math.sin(angle + toothAngle * 0.3) * radius,
        );
        ctx.closePath();

        // Draw tooth as wireframe
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3; // Increased from 1.5 to 3
        ctx.stroke();

        // Add mesh lines inside teeth
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.lineTo(
          Math.cos(angle) * (radius + toothHeight * 0.5),
          Math.sin(angle) * (radius + toothHeight * 0.5),
        );
        ctx.strokeStyle = "rgba(0, 255, 0, 0.4)";
        ctx.lineWidth = 2; // Increased from 1 to 2
        ctx.stroke();
      }

      // Draw spokes with industrial detailing
      for (let i = 0; i < spokes; i++) {
        const angle = (i / spokes) * Math.PI * 2;
        const innerRadius = radius * 0.25;
        const outerRadius = radius * 0.8;

        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius,
        );
        ctx.lineTo(
          Math.cos(angle) * outerRadius,
          Math.sin(angle) * outerRadius,
        );
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3; // Increased from 2 to 3
        ctx.stroke();

        // Add cross-mesh lines between spokes
        const nextAngle = ((i + 1) / spokes) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * (radius * 0.5),
          Math.sin(angle) * (radius * 0.5),
        );
        ctx.lineTo(
          Math.cos(nextAngle) * (radius * 0.5),
          Math.sin(nextAngle) * (radius * 0.5),
        );
        ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
        ctx.lineWidth = 2; // Increased from 1 to 2
        ctx.stroke();
      }

      // Draw rivets as wireframe circles
      rivets.forEach((rivet) => {
        ctx.beginPath();
        ctx.arc(rivet.x, rivet.y, rivet.size, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";
        ctx.lineWidth = 2; // Increased from 1 to 2
        ctx.stroke();
      });

      // Add radial mesh lines from center
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(angle) * radius * 0.9,
          Math.sin(angle) * radius * 0.9,
        );
        ctx.strokeStyle = "rgba(0, 255, 0, 0.2)";
        ctx.lineWidth = 2; // Increased from 1 to 2
        ctx.stroke();
      }

      // Center hub as wireframe
      const hubRadius = radius * 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 4; // Increased from 2 to 4
      ctx.stroke();

      // Add inner hub detail
      ctx.beginPath();
      ctx.arc(0, 0, hubRadius * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
      ctx.lineWidth = 2; // Increased from 1 to 2
      ctx.stroke();

      ctx.restore();
    },
    [],
  );

  // Draw central locking mechanism
  const drawCentralLock = useCallback(
    (ctx: CanvasRenderingContext2D, lock: CentralLock) => {
      const {
        x,
        y,
        lockRotation,
        pistonExtension,
        camshaftRotation,
        leverAngle,
        crossbarPosition,
        platingShine,
      } = lock;

      ctx.save();
      ctx.translate(x, y);

      // Heavy industrial plating base as wireframe (scaled by 250%)
      const plateRadius = 150;
      ctx.beginPath();
      ctx.arc(0, 0, plateRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw ridged lock detail
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const innerR = plateRadius - 15;
        const outerR = plateRadius - 5;

        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Central locking cylinder
      ctx.save();
      ctx.rotate(lockRotation);

      const lockRadius = 63; // Scaled by 250%
      ctx.beginPath();
      ctx.arc(0, 0, lockRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add inner lock details
      ctx.beginPath();
      ctx.arc(0, 0, lockRadius * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Pistons extending from lock (scaled by 250%)
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const pistonLength = 75 + pistonExtension * 50;
        const pistonX = Math.cos(angle) * pistonLength;
        const pistonY = Math.sin(angle) * pistonLength;

        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 63, Math.sin(angle) * 63);
        ctx.lineTo(pistonX, pistonY);
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Piston head as wireframe
        ctx.beginPath();
        ctx.arc(pistonX, pistonY, 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Camshaft mechanism as wireframe (scaled by 250%)
      ctx.save();
      ctx.rotate(camshaftRotation);
      ctx.beginPath();
      ctx.rect(-7, -100, 14, 200);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Crossbar security mechanism as wireframe (scaled by 250%)
      const crossbarY = -37 + crossbarPosition * 75;
      ctx.beginPath();
      ctx.rect(-100, crossbarY - 7, 200, 14);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    },
    [],
  );

  // Update animation state with throttled progress updates
  const lastProgressUpdate = useRef<number>(0);
  const updateAnimation = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const totalDuration = 15000; // Extended to 15 seconds for terminal interaction
    const overallProgress = Math.min(elapsed / totalDuration, 1);

    // Throttle progress updates to prevent excessive re-renders
    const now = Date.now();
    if (now - lastProgressUpdate.current > 50) {
      // Update at most 20fps
      setProgress(overallProgress * 100);
      lastProgressUpdate.current = now;
    }

    // Phase transitions with realistic timings
    if (elapsed > 1200 && phaseRef.current === "entrance") {
      phaseRef.current = "meshing";
      setCurrentPhase("meshing");
      playSound("/sounds/heavy-gears.mp3", 0.4);
    } else if (elapsed > 3000 && phaseRef.current === "meshing") {
      phaseRef.current = "locking";
      setCurrentPhase("locking");
    } else if (elapsed > 4500 && phaseRef.current === "locking") {
      phaseRef.current = "unlocking";
      setCurrentPhase("unlocking");
    } else if (elapsed > 6000 && phaseRef.current === "unlocking") {
      phaseRef.current = "separation";
      setCurrentPhase("separation");
    } else if (elapsed > 7200 && phaseRef.current === "separation") {
      phaseRef.current = "terminalReveal";
      setCurrentPhase("terminalReveal");
    } else if (elapsed > 9000 && phaseRef.current === "terminalReveal") {
      phaseRef.current = "terminalInteractive";
      setCurrentPhase("terminalInteractive");
      if (terminalRef.current) {
        terminalRef.current.isInteractive = true;
      }
      // Focus on terminal input
      setTimeout(() => {
        terminalInputRef.current?.focus();
      }, 100);
    }

    // Update gears based on phase
    gearsRef.current.forEach((gear, index) => {
      switch (phaseRef.current) {
        case "entrance":
          // Kinetic entrance animation with easing
          const entranceProgress = Math.min(elapsed / 1200, 1);
          const easeOut = 1 - Math.pow(1 - entranceProgress, 3);
          gear.x = gear.initialX + (gear.targetX - gear.initialX) * easeOut;
          break;

        case "meshing":
          gear.x = gear.targetX;
          // Make larger gears slower for heavier feel, and overall slower speeds
          const baseMeshSpeed = 0.008; // Reduced from 0.02 to 0.008 (60% slower)
          const sizeModifier = Math.max(0.3, 200 / gear.radius); // Larger gears turn slower
          gear.targetRotationSpeed =
            (index % 2 === 0 ? 1 : -1) *
            baseMeshSpeed *
            sizeModifier *
            (1 + gear.gearRatio * 0.3);
          gear.isLocked = false;

          // Create sparking at meshing points
          if (Math.random() < 0.1) {
            gear.connectedGears.forEach((connectedId) => {
              const connectedGear = gearsRef.current.find(
                (g) => g.id === connectedId,
              );
              if (connectedGear) {
                const midX = (gear.x + connectedGear.x) / 2;
                const midY = (gear.y + connectedGear.y) / 2;
                createMetallicSpark(midX, midY, 1.5);
              }
            });
          }
          break;

        case "locking":
          // Gradual slowdown with smooth interpolation
          gear.targetRotationSpeed *= 0.85; // More gradual slowdown
          break;

        case "unlocking":
          // Increased speed but still heavier than before
          const baseUnlockSpeed = 0.015; // Reduced from 0.04 to 0.015 (62.5% slower)
          const unlockSizeModifier = Math.max(0.4, 200 / gear.radius);
          gear.targetRotationSpeed =
            (index % 2 === 0 ? 1 : -1) *
            baseUnlockSpeed *
            unlockSizeModifier *
            (1 + gear.gearRatio * 0.4);

          // Intense sparking during unlock
          if (Math.random() < 0.3) {
            createMetallicSpark(
              gear.x + (Math.random() - 0.5) * gear.radius,
              gear.y + (Math.random() - 0.5) * gear.radius,
              2,
            );
          }
          break;

        case "separation":
        case "terminalReveal":
        case "terminalInteractive":
          // Gears separate along central axis with springy resistance
          const separationProgress = Math.min((elapsed - 6000) / 1200, 1);
          const springEase = separationProgress * (2 - separationProgress); // Spring easing

          if (gear.targetX < window.innerWidth / 2) {
            gear.x = gear.targetX - springEase * 750; // Scaled by 250%
          } else {
            gear.x = gear.targetX + springEase * 750; // Scaled by 250%
          }

          // More gradual momentum decay
          gear.targetRotationSpeed *= 0.92; // Slower decay
          break;

        case "complete":
          // Gears idle at margins with very gradual slowdown
          gear.targetRotationSpeed *= 0.985;
          break;
      }

      // Smooth interpolation for speed transitions to feel more realistic
      const speedLerp = 0.05; // Lerp factor for smooth speed transitions
      gear.rotationSpeed +=
        (gear.targetRotationSpeed - gear.rotationSpeed) * speedLerp;

      gear.rotation += gear.rotationSpeed;
    });

    // Update central lock
    if (centralLockRef.current) {
      const lock = centralLockRef.current;

      switch (phaseRef.current) {
        case "locking":
          lock.pistonExtension = Math.min((elapsed - 3000) / 1500, 1);
          lock.camshaftRotation += 0.05;
          break;

        case "unlocking":
          lock.unlockProgress = Math.min((elapsed - 4500) / 1500, 1);
          lock.lockRotation += 0.1;
          lock.pistonExtension = Math.max(1 - lock.unlockProgress, 0);
          lock.crossbarPosition = lock.unlockProgress;
          lock.leverAngle = (lock.unlockProgress * Math.PI) / 4;
          lock.platingShine = 0.8 + lock.unlockProgress * 0.4;
          break;
      }
    }

    // Update terminal reveal
    if (terminalRef.current) {
      const terminal = terminalRef.current;

      if (phaseRef.current === "separation") {
        const revealProgress = Math.min((elapsed - 6000) / 1200, 1);
        terminal.gapWidth = revealProgress * window.innerWidth * 0.8;
        terminal.lightIntensity = revealProgress;
      }

      if (
        phaseRef.current === "terminalReveal" ||
        phaseRef.current === "terminalInteractive"
      ) {
        const terminalProgress = Math.min((elapsed - 7200) / 1800, 1);
        terminal.terminalOpacity = terminalProgress;
        terminal.revealProgress = terminalProgress;
        terminal.cursorBlink = Math.floor(elapsed / 500) % 2 === 0;
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life += 16;
      particle.opacity = Math.max(0, 1 - particle.life / particle.maxLife);
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.rotation += particle.rotationSpeed;

      return particle.life < particle.maxLife;
    });
  }, [setProgress, onNext, createMetallicSpark, playSound]);

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with deep black
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    updateAnimation();

    // Draw gears only when not in full terminal mode
    if (phaseRef.current !== "terminalInteractive") {
      gearsRef.current.forEach((gear) => {
        // Skip gears that are completely off-screen during separation
        if (
          phaseRef.current === "separation" ||
          phaseRef.current === "terminalReveal" ||
          phaseRef.current === "complete"
        ) {
          const gapStart = terminalRef.current
            ? (width - terminalRef.current.gapWidth) / 2
            : width / 2;
          const gapEnd = terminalRef.current
            ? gapStart + terminalRef.current.gapWidth
            : width / 2;

          // Don't draw gears in the terminal gap area
          if (
            gear.x + gear.radius > gapStart &&
            gear.x - gear.radius < gapEnd
          ) {
            return;
          }
        }

        drawIndustrialGear(ctx, gear);
      });

      // Draw central lock mechanism
      if (
        centralLockRef.current &&
        ![
          "separation",
          "terminalReveal",
          "terminalInteractive",
          "complete",
        ].includes(phaseRef.current)
      ) {
        drawCentralLock(ctx, centralLockRef.current);
      }
    }

    // Draw metallic particles/sparks
    particlesRef.current.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      if (particle.metallic) {
        const sparkGradient = ctx.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          particle.size,
        );
        sparkGradient.addColorStop(0, particle.color);
        sparkGradient.addColorStop(1, "transparent");
        ctx.fillStyle = sparkGradient;
      } else {
        ctx.fillStyle = particle.color;
      }

      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [updateAnimation, drawIndustrialGear, drawCentralLock]);

  // Setup canvas size
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Handle terminal input
  const handleTerminalKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (
        phaseRef.current !== "terminalInteractive" ||
        !terminalRef.current?.isInteractive
      )
        return;

      if (e.key === "Enter") {
        e.preventDefault();
        processTerminalCommand(terminalInput);
        setTerminalInput("");
      }
    },
    [terminalInput, processTerminalCommand],
  );

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        phaseRef.current === "terminalInteractive" &&
        terminalRef.current?.isInteractive
      ) {
        handleTerminalKeyPress(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTerminalKeyPress]);

  // Terminal cursor blink
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowTerminalCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Initialize and start animation
  useEffect(() => {
    setupCanvas();
    initializeGearAssembly();

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setupCanvas();
      initializeGearAssembly();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array

  const getPhaseText = () => {
    switch (currentPhase) {
      case "entrance":
        return "MECHANICAL SYSTEMS CONVERGING";
      case "meshing":
        return "GEAR SYNCHRONIZATION ACTIVE";
      case "locking":
        return "ENGAGING SECURITY PROTOCOLS";
      case "unlocking":
        return "HYDRAULIC UNLOCK SEQUENCE";
      case "separation":
        return "ACCESSING VOID TERMINAL";
      case "terminalReveal":
        return "TERMINAL INTERFACE ONLINE";
      case "terminalInteractive":
        return "VOID TERMINAL v2.1.0";
      case "complete":
        return "ACCESS GRANTED";
      default:
        return "";
    }
  };

  const getPhaseSubtext = () => {
    switch (currentPhase) {
      case "entrance":
        return "Heavy machinery sliding into position...";
      case "meshing":
        return "Interlocking mechanisms with precision timing...";
      case "locking":
        return "Central lock mechanisms engaging...";
      case "unlocking":
        return "Pistons retracting, crossbars releasing...";
      case "separation":
        return "Hydraulic actuators creating access rift...";
      case "terminalReveal":
        return "Command interface initialization complete";
      case "terminalInteractive":
        return 'Type "help" for available commands';
      case "complete":
        return "Welcome to the void terminal";
      default:
        return "";
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full bg-black relative overflow-hidden cursor-crosshair"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="void-gears-unlocking"
    >
      {/* Canvas for gear animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        data-testid="gears-canvas"
      />

      {/* Terminal interface overlay */}
      {(currentPhase === "terminalReveal" ||
        currentPhase === "terminalInteractive") &&
        terminalRef.current && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: terminalRef.current.terminalOpacity }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="w-full max-w-sm md:max-w-4xl h-[80vh] md:h-[600px] bg-black/95 border-2 border-retro-green rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.3)] p-3 md:p-8 font-mono text-retro-green overflow-y-auto pointer-events-auto mx-2 md:mx-0"
              style={{
                boxShadow:
                  "0 0 100px rgba(0, 255, 0, 0.4), inset 0 0 50px rgba(0, 255, 0, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(0, 10, 0, 0.95) 0%, rgba(0, 20, 0, 0.98) 100%)",
              }}
            >
              {/* Terminal ASCII art */}
              <div className="text-center mb-2 md:mb-4 text-[0.5rem] md:text-xs leading-none">
                {terminalRef.current.asciiLines.map((line, index) => (
                  <div key={`ascii-${index}`} className="whitespace-pre">
                    {line}
                  </div>
                ))}
              </div>

              {/* Terminal output */}
              <div className="mt-2 md:mt-4 space-y-1 text-xs md:text-sm">
                {terminalRef.current.terminalOutput.map((line, index) => (
                  <div key={`output-${index}`} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>

              {/* Command input */}
              {currentPhase === "terminalInteractive" && (
                <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm">
                  <span className="text-retro-cyan mr-2">root@void:~$</span>
                  <input
                    ref={terminalInputRef}
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        processTerminalCommand(terminalInput);
                        setTerminalInput("");
                      }
                    }}
                    enterKeyHint="send"
                    className="flex-1 bg-transparent border-none outline-none text-retro-green font-mono py-1 md:py-0 min-h-[44px] md:min-h-0"
                    placeholder=""
                    autoFocus
                    data-testid="terminal-input"
                  />
                  <span
                    className={`ml-1 ${showTerminalCursor ? "opacity-100" : "opacity-0"}`}
                  >
                    █
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

      {/* Phase indicator and text */}
      {currentPhase !== "terminalReveal" &&
        currentPhase !== "terminalInteractive" &&
        currentPhase !== "complete" && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Main title */}
            <motion.div
              className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.h1
                className="text-xl md:text-2xl font-mono text-retro-green mb-2 tracking-wide font-bold"
                data-testid="phase-title"
                key={currentPhase}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {getPhaseText()}
              </motion.h1>

              <motion.p
                className="text-sm text-retro-cyan opacity-70 font-mono"
                data-testid="phase-subtitle"
                key={`${currentPhase}-sub`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {getPhaseSubtext()}
              </motion.p>
            </motion.div>

            {/* Progress indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-4 md:px-0">
              <div className="w-64 md:w-80 h-2 bg-gray-800 rounded-full border border-retro-green">
                <motion.div
                  className="h-full bg-gradient-to-r from-retro-green to-retro-cyan rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </div>
              <div className="text-[0.6rem] md:text-xs text-retro-green font-mono text-center mt-2">
                MECHANICAL SEQUENCE: {Math.round(progress)}%
              </div>
            </div>
          </div>
        )}
    </motion.div>
  );
}
