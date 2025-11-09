import { ethers } from "ethers";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { youtubeAPI } from "./youtube";
import { JukeboxSong } from "@shared/schema";
import { JUKEBOX } from "@shared/constants";

// USDC contract address on Base
const USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Smart contract configuration
const JUKEBOX_CONTRACT_ADDRESS = "0x5026a8ff0CF9c29CDd17661a2E09Fd3417c05311";
const BASE_RPC_URL = "https://mainnet.base.org";

// ERC20 Transfer event ABI for USDC verification
const ERC20_TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Contract ABI (complete interface)
const JUKEBOX_ABI = [
  "event SongPurchased(address indexed buyer, string indexed youtubeId, string title, uint256 price, uint256 timestamp)",
  "event PriceUpdated(uint256 oldPrice, uint256 newPrice)",
  "event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury)",
  "event PurchaseAttemptFailed(address indexed buyer, string reason)",
  
  // View functions for frontend
  "function songPrice() view returns (uint256)",
  "function treasury() view returns (address)",
  "function getSongPriceInUSD() view returns (uint256)",
  "function getSongPriceFormatted() view returns (string)",
  
  // Write functions for purchasing
  "function purchaseSong(string memory youtubeId, string memory title) payable external"
];

export class JukeboxContractManager {
  public contract: ethers.Contract;
  public provider: ethers.JsonRpcProvider;
  private isListening = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private eventListeners: Array<{ event: string; listener: (...args: any[]) => void }> = [];
  private isRecreating = false;
  private activeSongTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastRecreateAttempt = 0;
  private rejectionHandler: ((reason: any) => void) | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    this.contract = new ethers.Contract(JUKEBOX_CONTRACT_ADDRESS, JUKEBOX_ABI, this.provider);
    
    // Handle provider errors and reconnection with exponential backoff
    this.provider.on('error', (error) => {
      // Suppress noisy "filter not found" errors - they're expected and handled proactively
      const isFilterError = error.code === 'UNKNOWN_ERROR' && 
        (error.message?.includes('filter not found') ||
         error.error?.message?.includes('filter not found'));
         
      if (isFilterError) {
        // Silently handle filter expiration - it's expected behavior
        // Our 8-minute proactive recreation cycle handles this automatically
        return;
      }
      
      // Log other provider errors that aren't filter-related
      console.error('🚨 Provider error:', error.code, error.message);
    });
    
    // More targeted approach: override ethers provider error logging
    const originalProviderEmit = this.provider.emit.bind(this.provider);
    this.provider.emit = (event: string, ...args: any[]) => {
      // Suppress filter not found errors since we handle them gracefully
      if (event === 'error' && args[0]?.message?.includes('filter not found')) {
        console.log('🔄 Filter expired detected, recreating...');
        this.recreateListenersWithBackoff();
        return Promise.resolve(false); // Don't propagate this error
      }
      return originalProviderEmit(event, ...args);
    };
    
    // Simple periodic recreation to prevent filter expiration
    console.log('🔄 Filter management: Using proactive 8-minute recreation cycle');
  }

  private async recreateListenersWithBackoff() {
    if (!this.isListening || this.eventListeners.length === 0) return;
    
    const now = Date.now();
    if (this.lastRecreateAttempt && now - this.lastRecreateAttempt < 30000) {
      console.log('🔄 Skipping filter recreation - too soon since last attempt');
      return;
    }
    this.lastRecreateAttempt = now;
    
    console.log('🔄 Recreating expired event listeners...');
    
    try {
      this.contract.removeAllListeners();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      for (const { event, listener } of this.eventListeners) {
        try {
          this.contract.on(event, listener);
          console.log(`✅ Recreated listener for ${event}`);
        } catch (error) {
          console.error(`❌ Failed to recreate listener for ${event}:`, error);
        }
      }
      
      console.log('✅ All event listeners recreated successfully');
    } catch (error) {
      console.error('❌ Error during listener recreation:', error);
    }
  }

  // Start listening for contract events
  async startListening(broadcastFunction: (message: any) => void) {
    if (this.isListening) {
      console.log("Already listening to contract events");
      return;
    }

    console.log("Starting to listen for jukebox contract events...");
    this.isListening = true;
    this.eventListeners = []; // Reset listeners array

    // Create SongPurchased event listener
    const songPurchasedListener = async (buyer: string, youtubeId: string, title: string, price: bigint, timestamp: bigint, event: any) => {
      try {
        console.log(`Song purchased: ${title} by ${buyer}`);
        
        const transactionHash = event.log.transactionHash;
        
        // Critical: Check idempotency to prevent double-enqueue
        const isAlreadyProcessed = await storage.isTransactionProcessed(transactionHash);
        if (isAlreadyProcessed) {
          console.log(`Transaction ${transactionHash} already processed, skipping`);
          return;
        }

        // Check queue limits to prevent DoS
        const currentQueue = await storage.getJukeboxQueue();
        if (currentQueue.length >= JUKEBOX.MAX_QUEUE_LENGTH) {
          console.warn(`Queue is full (${currentQueue.length}/${JUKEBOX.MAX_QUEUE_LENGTH}), skipping song from ${buyer}`);
          return;
        }

        // Validate the video still exists and get full details
        const videoDetails = await youtubeAPI.validateVideo(youtubeId);
        if (!videoDetails) {
          console.error(`Invalid video purchased: ${youtubeId}`);
          return;
        }

        // Mark transaction as processed for idempotency
        await storage.markTransactionProcessed(transactionHash);

        // Create song object
        const song: JukeboxSong = {
          id: randomUUID(),
          youtubeId: youtubeId,
          title: videoDetails.title,
          artist: videoDetails.channelTitle,
          duration: videoDetails.duration,
          thumbnailUrl: videoDetails.thumbnailUrl,
          payerAddress: buyer,
          transactionHash: transactionHash,
          price: price.toString(),
          queuePosition: currentQueue.length, // Correct position
          playedAt: null,
          createdAt: Date.now(),
          status: 'pending'
        };

        // Add to queue
        await this.addSongToQueue(song, broadcastFunction);

      } catch (error) {
        console.error("Error processing song purchase:", error);
      }
    };

    // Create PriceUpdated event listener
    const priceUpdatedListener = (oldPrice: bigint, newPrice: bigint) => {
      console.log(`Song price updated: ${oldPrice} → ${newPrice}`);
      
      broadcastFunction({
        type: 'jukebox_price_updated',
        data: {
          oldPrice: oldPrice.toString(),
          newPrice: newPrice.toString(),
          formattedPrice: `$${(Number(newPrice) / 1e6).toFixed(2)}`
        }
      });
    };

    // Create PurchaseAttemptFailed event listener
    const purchaseFailedListener = (buyer: string, reason: string) => {
      console.log(`Purchase failed for ${buyer}: ${reason}`);
    };

    // Store listeners for recreation
    this.eventListeners = [
      { event: "SongPurchased", listener: songPurchasedListener },
      { event: "PriceUpdated", listener: priceUpdatedListener },
      { event: "PurchaseAttemptFailed", listener: purchaseFailedListener }
    ];

    // Attach listeners to contract
    this.contract.on("SongPurchased", songPurchasedListener);
    this.contract.on("PriceUpdated", priceUpdatedListener);
    this.contract.on("PurchaseAttemptFailed", purchaseFailedListener);

    // Proactively recreate filters every 8 minutes to prevent expiration
    // Most providers expire filters after 10 minutes, so 8 minutes gives buffer
    this.reconnectInterval = setInterval(() => {
      console.log('🔄 Proactively recreating blockchain event filters...');
      this.recreateListenersWithBackoff();
    }, 8 * 60 * 1000); // 8 minutes

    console.log("✅ Jukebox contract event listening started");
  }

  // Stop listening
  stopListening() {
    if (!this.isListening) return;
    
    this.contract.removeAllListeners();
    this.isListening = false;
    console.log("Stopped listening to contract events");
  }

  // Add song to queue and broadcast update
  private async addSongToQueue(song: JukeboxSong, broadcastFunction: (message: any) => void) {
    try {
      // Get current queue
      const currentQueue = await storage.getJukeboxQueue();
      
      // Set queue position (0-based, consistent with HTTP route)
      song.queuePosition = currentQueue.length;

      // Add to storage
      await storage.addToJukeboxQueue(song);

      // Get updated queue for broadcast
      const updatedQueue = await storage.getJukeboxQueue();
      const currentSong = await storage.getCurrentSong();

      // Calculate estimated wait time (in seconds)
      const estimatedWaitTime = currentQueue.reduce((total, queuedSong) => {
        return total + queuedSong.duration;
      }, 0);

      // Broadcast to all users
      broadcastFunction({
        type: 'jukebox_song_purchased',
        data: {
          song,
          queueLength: updatedQueue.length,
          estimatedWaitTime
        }
      });

      broadcastFunction({
        type: 'jukebox_queue_updated',
        data: {
          queue: updatedQueue,
          currentSong
        }
      });

      // If this is the first song and nothing is playing, start it using atomic advancement
      if (updatedQueue.length === 1 && !currentSong) {
        const result = await storage.advanceCurrentSong('no-current-song');
        
        if (result.success && result.nextSong) {
          // Broadcast song start
          broadcastFunction({
            type: 'jukebox_song_started',
            data: {
              song: result.nextSong,
              startTime: result.nextSong.playedAt || Date.now(),
              serverTime: Date.now()
            }
          });
          
          // Schedule timer for this song
          this.scheduleCurrentSongTimer(result.nextSong, broadcastFunction);
        }
      }

    } catch (error) {
      console.error("Error adding song to queue:", error);
    }
  }

  // Start the next song in queue (used only for initial startup, not timer advancement)
  private async startNextSong(broadcastFunction: (message: any) => void) {
    try {
      // Use atomic advancement for consistency with rest of system
      const result = await storage.advanceCurrentSong('no-current-song');
      
      if (!result.success || !result.nextSong) {
        console.log('🎵 No song to start or advancement failed');
        return;
      }

      const startTime = result.nextSong.playedAt || Date.now();
      
      // Clear any existing timer for this song
      if (this.activeSongTimers.has(result.nextSong.id)) {
        clearTimeout(this.activeSongTimers.get(result.nextSong.id)!);
        this.activeSongTimers.delete(result.nextSong.id);
      }

      // Broadcast song start with server's authoritative timing
      broadcastFunction({
        type: 'jukebox_song_started',
        data: {
          song: result.nextSong,
          startTime,
          serverTime: Date.now()
        }
      });

      // Use centralized scheduling to manage the song timer
      this.scheduleCurrentSongTimer(result.nextSong, broadcastFunction);

    } catch (error) {
      console.error("Error starting next song:", error);
    }
  }

  // Centralized song timer scheduling - used by all code paths that start a song
  scheduleCurrentSongTimer(song: any, broadcastFunction: (message: any) => void) {
    // Clear any existing timer for this song
    if (this.activeSongTimers.has(song.id)) {
      clearTimeout(this.activeSongTimers.get(song.id)!);
      this.activeSongTimers.delete(song.id);
    }

    // Calculate remaining time from when the song started playing
    const elapsedTime = song.playedAt ? Math.max(0, (Date.now() - song.playedAt) / 1000) : 0;
    const remainingTime = Math.max(0, song.duration - elapsedTime);
    
    console.log(`🎵 Server: Scheduling auto-advancement for "${song.title}" in ${remainingTime.toFixed(1)} seconds`);
    
    // Schedule advancement using atomic advancement
    const timerId = setTimeout(async () => {
      console.log(`🎵 Server: Auto-advancing from song "${song.title}" (timer completed)`);
      
      // Remove from active timers
      this.activeSongTimers.delete(song.id);
      
      // Use atomic advancement to handle potential race conditions
      const result = await storage.advanceCurrentSong(song.id);
      
      if (result.success && (result.reason === 'advanced_to_next' || result.reason === 'queue_empty')) {
        console.log(`🎵 Server: Auto-advancement completed - ${result.reason}`);
        
        // Broadcast song ended event
        broadcastFunction({
          type: 'jukebox_song_ended',
          data: { songId: song.id, nextSong: result.nextSong }
        });
        
        // Broadcast updated queue
        const updatedQueue = await storage.getJukeboxQueue();
        const updatedCurrentSong = await storage.getCurrentSong();
        broadcastFunction({
          type: 'jukebox_queue_updated',
          data: { queue: updatedQueue, currentSong: updatedCurrentSong }
        });
        
        // Start next song if there is one - use direct scheduling to avoid double-advancement
        if (result.nextSong && result.reason === 'advanced_to_next') {
          // Broadcast song start for the already-playing next song
          broadcastFunction({
            type: 'jukebox_song_started',
            data: {
              song: result.nextSong,
              startTime: result.nextSong.playedAt || Date.now(),
              serverTime: Date.now()
            }
          });
          
          // Schedule timer for this next song
          this.scheduleCurrentSongTimer(result.nextSong, broadcastFunction);
        }
      } else {
        console.log(`🎵 Server: Auto-advancement skipped - ${result.reason}`);
      }
    }, remainingTime * 1000);
    
    // Store the timer ID
    this.activeSongTimers.set(song.id, timerId);
  }

  // Initialize server restart reconciliation - reschedule timers for in-progress songs
  async initializeServerRestart(broadcastFunction: (message: any) => void) {
    try {
      const currentSong = await storage.getCurrentSong();
      
      if (currentSong && currentSong.status === 'playing' && currentSong.playedAt) {
        const elapsedTime = Math.max(0, (Date.now() - currentSong.playedAt) / 1000);
        
        if (elapsedTime < currentSong.duration) {
          console.log(`🎵 Server: Resuming timer for in-progress song "${currentSong.title}" (${elapsedTime.toFixed(1)}s elapsed)`);
          this.scheduleCurrentSongTimer(currentSong, broadcastFunction);
        } else {
          console.log(`🎵 Server: Song "${currentSong.title}" should have finished (${elapsedTime.toFixed(1)}s elapsed) - advancing immediately`);
          
          // Song should have finished - advance immediately
          const result = await storage.advanceCurrentSong(currentSong.id);
          
          if (result.success && (result.reason === 'advanced_to_next' || result.reason === 'queue_empty')) {
            // Broadcast song ended event
            broadcastFunction({
              type: 'jukebox_song_ended',
              data: { songId: currentSong.id, nextSong: result.nextSong }
            });
            
            // Broadcast updated queue
            const updatedQueue = await storage.getJukeboxQueue();
            const updatedCurrentSong = await storage.getCurrentSong();
            broadcastFunction({
              type: 'jukebox_queue_updated',
              data: { queue: updatedQueue, currentSong: updatedCurrentSong }
            });
            
            // Start next song if there is one
            if (result.nextSong && result.reason === 'advanced_to_next') {
              await this.startNextSong(broadcastFunction);
            }
          }
        }
      } else {
        console.log('🎵 Server: No in-progress song to reconcile');
      }
    } catch (error) {
      console.error('🎵 Server: Error during restart reconciliation:', error);
    }
  }

  // Get contract info for frontend
  async getContractInfo() {
    try {
      const [songPrice, treasury, formattedPrice] = await Promise.all([
        this.contract.songPrice(),
        this.contract.treasury(),
        this.contract.getSongPriceFormatted()
      ]);

      return {
        address: JUKEBOX_CONTRACT_ADDRESS,
        songPrice: songPrice.toString(),
        songPriceUSD: Number(songPrice) / 1e6,
        formattedPrice,
        treasury
      };
    } catch (error) {
      console.error("Error getting contract info:", error);
      return null;
    }
  }

  // Manual skip song (admin function)
  async skipCurrentSong(broadcastFunction: (message: any) => void) {
    try {
      const currentSong = await storage.getCurrentSong();
      if (!currentSong) return false;

      // Clear the active timer for the current song
      if (this.activeSongTimers.has(currentSong.id)) {
        clearTimeout(this.activeSongTimers.get(currentSong.id)!);
        this.activeSongTimers.delete(currentSong.id);
        console.log(`🎵 Server: Cleared auto-advancement timer for skipped song "${currentSong.title}"`);
      }

      // Mark as skipped
      await storage.skipSong(currentSong.id);
      
      // Get next song
      const nextSong = await storage.getNextSongInQueue();
      
      // Broadcast song skip event
      broadcastFunction({
        type: 'jukebox_song_ended',
        data: { songId: currentSong.id, nextSong, skipped: true }
      });

      // Broadcast updated queue
      const updatedQueue = await storage.getJukeboxQueue();
      const updatedCurrentSong = await storage.getCurrentSong();
      broadcastFunction({
        type: 'jukebox_queue_updated',
        data: { queue: updatedQueue, currentSong: updatedCurrentSong }
      });

      // Start next song if exists
      if (nextSong) {
        await this.startNextSong(broadcastFunction);
      }
      
      return true;
    } catch (error) {
      console.error("Error skipping song:", error);
      return false;
    }
  }
}

// Singleton instance
export const jukeboxContract = new JukeboxContractManager();

// Helper functions for routes
export async function getJukeboxPrice(): Promise<bigint> {
  const manager = jukeboxContract;
  return await manager.contract.songPrice();
}

// Enhanced payment verification with event correlation
export interface VerifiedPayment {
  buyer: string;
  youtubeId: string;
  title: string;
  price: string;
  timestamp: bigint;
  transactionHash: string;
}

export async function verifyJukeboxPayment(
  transactionHash: string, 
  expected: {
    payerAddress: string;
    youtubeId: string;
    minPrice: string;
  }
): Promise<VerifiedPayment | null> {
  try {
    console.log(`🔍 Verifying payment for transaction: ${transactionHash}`);
    const provider = jukeboxContract.provider;
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt || receipt.status !== 1) {
      console.log(`❌ Transaction not found or failed: ${transactionHash}`);
      return null; // Transaction failed or doesn't exist
    }

    console.log(`📋 Transaction receipt.to: ${receipt.to}`);
    console.log(`📋 Jukebox contract: ${JUKEBOX_CONTRACT_ADDRESS}`);
    console.log(`📋 USDC contract: ${USDC_CONTRACT_ADDRESS}`);

    // Try legacy ETH payment verification first (for backward compatibility)
    if (receipt.to?.toLowerCase() === JUKEBOX_CONTRACT_ADDRESS.toLowerCase()) {
      console.log(`🔄 Trying legacy ETH payment verification...`);
      const ethResult = await verifyETHPayment(receipt, expected);
      if (ethResult) {
        console.log(`✅ ETH payment verified`);
        return ethResult;
      }
    }

    // Always try USDC ERC20 Transfer verification regardless of receipt.to
    // (The jukebox contract might call USDC.transferFrom, so receipt.to could be jukebox)
    console.log(`🔄 Trying USDC payment verification...`);
    const usdcResult = await verifyUSDCPayment(receipt, expected, transactionHash);
    if (usdcResult) {
      console.log(`✅ USDC payment verified`);
      return usdcResult;
    }

    console.log(`❌ No valid payment verification found for ${transactionHash}`);
    return null; // No valid payment found
  } catch (error) {
    console.error('Error verifying payment:', error);
    return null;
  }
}

// Legacy ETH payment verification
async function verifyETHPayment(
  receipt: ethers.TransactionReceipt,
  expected: { payerAddress: string; youtubeId: string; minPrice: string }
): Promise<VerifiedPayment | null> {
  const contract = jukeboxContract.contract;
  const logs = receipt.logs;
  
  for (const log of logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog?.name === 'SongPurchased') {
        const [buyer, youtubeId, title, price, timestamp] = parsedLog.args;
        
        // Critical security validation - correlate event with request
        if (buyer.toLowerCase() !== expected.payerAddress.toLowerCase()) {
          console.warn(`Payment verification failed: buyer mismatch. Expected ${expected.payerAddress}, got ${buyer}`);
          return null;
        }
        
        if (youtubeId !== expected.youtubeId) {
          console.warn(`Payment verification failed: YouTube ID mismatch. Expected ${expected.youtubeId}, got ${youtubeId}`);
          return null;
        }
        
        if (BigInt(price) < BigInt(expected.minPrice)) {
          console.warn(`Payment verification failed: insufficient price. Expected ${expected.minPrice}, got ${price}`);
          return null;
        }
        
        return {
          buyer,
          youtubeId,
          title,
          price: price.toString(),
          timestamp,
          transactionHash: receipt.hash
        };
      }
    } catch (error) {
      // Skip logs that can't be parsed by our contract
      continue;
    }
  }
  return null;
}

// USDC ERC20 Transfer verification
async function verifyUSDCPayment(
  receipt: ethers.TransactionReceipt,
  expected: { payerAddress: string; youtubeId: string; minPrice: string },
  transactionHash: string
): Promise<VerifiedPayment | null> {
  try {
    // Get treasury address from contract
    const treasuryAddress = await jukeboxContract.contract.treasury();
    console.log(`💰 Expected treasury address: ${treasuryAddress}`);
    
    // Create interface for ERC20 Transfer events
    const erc20Interface = new ethers.Interface(ERC20_TRANSFER_ABI);
    
    // Parse logs to find USDC Transfer to treasury
    for (const log of receipt.logs) {
      try {
        // Only check logs from USDC contract
        if (log.address.toLowerCase() !== USDC_CONTRACT_ADDRESS.toLowerCase()) {
          continue;
        }
        
        const parsedLog = erc20Interface.parseLog(log);
        if (parsedLog?.name === 'Transfer') {
          const [from, to, value] = parsedLog.args;
          
          console.log(`💸 Found Transfer: from=${from}, to=${to}, value=${value}`);
          
          // Validate sender matches expected payer
          if (from.toLowerCase() !== expected.payerAddress.toLowerCase()) {
            console.log(`⚠️ Transfer from wrong address: expected ${expected.payerAddress}, got ${from}`);
            continue;
          }
          
          // Validate recipient is treasury
          if (to.toLowerCase() !== treasuryAddress.toLowerCase()) {
            console.log(`⚠️ Transfer to wrong address: expected ${treasuryAddress}, got ${to}`);
            continue;
          }
          
          // Validate amount meets minimum (USDC has 6 decimals)
          if (BigInt(value) < BigInt(expected.minPrice)) {
            console.log(`⚠️ Insufficient amount: expected ${expected.minPrice}, got ${value}`);
            continue;
          }
          
          console.log(`✅ Valid USDC Transfer found!`);
          
          // Get block timestamp for consistency
          const block = await jukeboxContract.provider.getBlock(receipt.blockNumber);
          const blockTimestamp = block ? BigInt(block.timestamp) : BigInt(Math.floor(Date.now() / 1000));
          
          // For USDC payments, we don't have the title from the event
          // We'll use a generic title and let the frontend provide the real title
          return {
            buyer: from,
            youtubeId: expected.youtubeId,
            title: "Song Purchase", // Will be overridden by frontend data
            price: value.toString(),
            timestamp: blockTimestamp,
            transactionHash
          };
        }
      } catch (error) {
        // Skip logs that can't be parsed
        continue;
      }
    }
    
    console.log(`❌ No valid USDC Transfer to treasury found`);
    return null;
  } catch (error) {
    console.error('Error verifying USDC payment:', error);
    return null;
  }
}