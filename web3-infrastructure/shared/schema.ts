import { z } from "zod";

/**
 * Core data types - NO GAME ENGINE TYPES
 * Only Web3, chat, and player positioning
 */

export interface Player {
  id: string; // accountId (UUID) - unified identifier
  walletAddress: string; // Coinbase embedded wallet or external wallet
  displayName: string;
  position: { x: number; y: number };
  color: string;
  connected: boolean;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  playerId: string; // accountId (UUID)
  walletAddress: string;
  displayName: string;
  message: string;
  timestamp: number;
}

export interface JukeboxSong {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  payerAddress: string;
  transactionHash: string;
  price: string;
  queuePosition: number;
  playedAt: number | null;
  createdAt: number;
  status: 'pending' | 'playing' | 'completed' | 'skipped';
}

export interface PlayerSession {
  sessionId: string;
  walletAddress: string;
  signature: string;
  createdAt: number;
  lastActive: number;
  expiresAt: number;
}

/**
 * WebSocket message types
 */

// Client -> Server messages
export interface ClientMessage {
  type: 'connect_account' | 'move' | 'chat' | 'proximity_chat' | 'heartbeat' | 'ring_blast';
  data: {
    playerId?: string;
    walletAddress?: string;
    signature?: string;
    message?: string;
    position?: { x: number; y: number };
    nonce?: string;
  };
}

// Server -> Client message data types
export interface AccountInitializedData {
  player: Player;
  players: Player[];
  chatHistory: ChatMessage[];
}

export interface UserJoinedData {
  player: Player;
}

export interface UserLeftData {
  playerId: string;
}

export interface UserMovedData {
  playerId: string;
  position: { x: number; y: number };
}

export interface ChatMessageData {
  message: ChatMessage;
}

export interface ProximityChatMessageData {
  message: ChatMessage;
  nearbyPlayers: string[]; // Player IDs who can see this message
}

export interface ProximityUpdateData {
  nearbyPlayers: string[]; // Player IDs of nearby players
}

export interface HeartbeatData {
  timestamp: number;
}

export interface RingBlastMessageData {
  playerId: string;
  position: { x: number; y: number };
}

export interface JukeboxSongPurchasedData {
  song: JukeboxSong;
  queueLength: number;
  estimatedWaitTime: number;
}

export interface JukeboxSongStartedData {
  song: JukeboxSong;
  startTime: number;
  serverTime: number;
}

export interface JukeboxSongEndedData {
  songId: string;
  nextSong: JukeboxSong | null;
}

export interface JukeboxQueueUpdatedData {
  queue: JukeboxSong[];
  currentSong: JukeboxSong | null;
}

export interface JukeboxSkipVoteData {
  songId: string;
  votes: number;
  required: number;
  voters: string[];
}

export interface ErrorData {
  code: string;
  message: string;
}

// Server -> Client message union type
export type ServerMessage =
  | { type: 'account_initialized'; data: AccountInitializedData }
  | { type: 'user_joined'; data: UserJoinedData }
  | { type: 'user_left'; data: UserLeftData }
  | { type: 'user_moved'; data: UserMovedData }
  | { type: 'chat_message'; data: ChatMessageData }
  | { type: 'proximity_chat_message'; data: ProximityChatMessageData }
  | { type: 'proximity_update'; data: ProximityUpdateData }
  | { type: 'heartbeat'; data: HeartbeatData }
  | { type: 'ring_blast'; data: RingBlastMessageData }
  | { type: 'jukebox_song_purchased'; data: JukeboxSongPurchasedData }
  | { type: 'jukebox_song_started'; data: JukeboxSongStartedData }
  | { type: 'jukebox_song_ended'; data: JukeboxSongEndedData }
  | { type: 'jukebox_queue_updated'; data: JukeboxQueueUpdatedData }
  | { type: 'jukebox_skip_vote'; data: JukeboxSkipVoteData }
  | { type: 'error'; data: ErrorData };

/**
 * Validation schemas (Zod)
 */

export const connectAccountSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-zA-Z0-9]{40}$/),
  signature: z.string(),
  nonce: z.string(),
  displayName: z.string().optional(),
});

export const moveSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(500),
});

export const ringBlastSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type ConnectAccountData = z.infer<typeof connectAccountSchema>;
export type MoveData = z.infer<typeof moveSchema>;
export type ChatData = z.infer<typeof chatSchema>;
export type RingBlastData = z.infer<typeof ringBlastSchema>;
