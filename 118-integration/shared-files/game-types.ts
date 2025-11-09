/**
 * Core game type definitions
 * 
 * Shared types for game entities, player state, and real-time events.
 * Used across client and server for type safety.
 */

export interface Position {
  x: number;
  y: number;
}

export interface GamePlayer {
  id: string; // accountId (UUID) - unified identifier  
  walletAddress: string; // Always present (embedded or external wallet)
  walletType: 'embedded' | 'external' | 'smart'; // Type of wallet
  displayName: string;
  position: Position;
  color: string;
  connected: boolean;
}

export interface RingBlast {
  id: string;
  position: Position;
  startTime: number;
  duration: number; // in milliseconds
  maxRadius: number;
  color: string;
  walletAddress?: string; // Player who triggered the ring
  isCollaborative?: boolean; // Whether this is a mega-ring from collaboration
  collaboratorCount?: number; // Number of players involved in collaboration
}

export interface CollaborativeRing {
  id: string;
  centerPosition: Position;
  startTime: number;
  duration: number;
  maxRadius: number;
  collaborators: string[]; // Wallet addresses of collaborating players
  sourceRings: RingBlast[]; // Original ring blasts that formed this collaboration
}

export interface TipAnimation {
  id: string;
  position: Position;
  amount: string;
  startTime: number;
  duration: number;
  fromPlayer: string;
  toPlayer: string;
}

export interface GoldenAscendancy {
  id: string;
  position: Position;
  startTime: number;
  duration: number;
  walletAddress: string;
  amount: string; // Total tips received to trigger golden ascendancy
}

export interface GameMessage {
  type: 'player_joined' | 'player_left' | 'player_moved' | 'ring_blast' | 'tip' | 'chat' | 'state_sync';
  data: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  walletAddress: string;
  displayName: string;
  message: string;
  timestamp: number;
  type: 'normal' | 'system' | 'proximity'; // Proximity chat vs global chat
}

export interface PlayerState {
  player: GamePlayer;
  health?: number;
  level?: number;
  xp?: number;
  inventory?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  type: string;
  name: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface Building {
  id: string;
  type: string;
  position: Position;
  owner: string; // Wallet address
  level: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}
