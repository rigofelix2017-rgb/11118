import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Music, Search, Play, Clock, Users, DollarSign, SkipForward, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JukeboxSong } from '@shared/schema';
import { ethers } from 'ethers';
import { WELL_KNOWN_TOKENS, ERC20_ABI } from '@/lib/token-config';
import { useGlobalAudioPlayer } from '@/components/global-audio-player';
import { useEvmAddress, useIsSignedIn } from '@coinbase/cdp-hooks';
import { SendEvmTransactionButton } from '@coinbase/cdp-react';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt: string;
}

interface JukeboxProps {
  currentPlayer?: { walletAddress: string; displayName: string } | null;
  isAdmin?: boolean;
}

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function Jukebox({ currentPlayer, isAdmin }: JukeboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  // Use embedded wallet hooks
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  
  // Jukebox audio effects - use a lightweight approach
  const playJukeboxClick = useCallback(() => {
    try {
      // Create a simple click sound using Web Audio API directly
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
      console.log('🎵 Jukebox click');
    } catch (error) {
      console.warn('Failed to play jukebox click:', error);
    }
  }, []);

  // Use global audio player instead of local one
  const { isPlayerReady, currentSong: globalCurrentSong, playerState } = useGlobalAudioPlayer();

  // Get current queue and price - API returns {queue: [], currentSong: {...}}
  const { data: queueData, isLoading: queueLoading } = useQuery<{queue: JukeboxSong[], currentSong: JukeboxSong | null}>({
    queryKey: ['/api/jukebox/queue'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: priceData } = useQuery<{ price: string }>({
    queryKey: ['/api/jukebox/price'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Use global current song, but still get queue from API
  const currentSong = globalCurrentSong;
  const upcomingQueue = queueData?.queue || [];
  
  const songPrice = priceData?.price ? (Number(priceData.price) / 1e6).toFixed(2) : '1.00'; // Convert from USDC wei to USDC

  // Debug: Show USDC balance
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const checkUSDCBalance = useCallback(async () => {
    if (!isSignedIn || !evmAddress) return;
    
    setIsCheckingBalance(true);
    try {
      // Use Base mainnet provider directly
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const USDC_TOKEN = WELL_KNOWN_TOKENS.find(token => token.symbol === 'USDC')!;
      const usdcContract = new ethers.Contract(USDC_TOKEN.address, ERC20_ABI, provider);
      const balance = await usdcContract.balanceOf(evmAddress);
      setUsdcBalance(ethers.formatUnits(balance, USDC_TOKEN.decimals));
    } catch (error) {
      console.error('Error checking USDC balance:', error);
    } finally {
      setIsCheckingBalance(false);
    }
  }, [isSignedIn, evmAddress]);

  useEffect(() => {
    checkUSDCBalance();
  }, [checkUSDCBalance]);

  // Note: YouTube Player API and playback is now handled by GlobalAudioPlayer

  // Search YouTube videos
  const searchVideos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    playJukeboxClick(); // Play click sound when searching
    setIsSearching(true);
    try {
      const response = await fetch(`/api/jukebox/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        toast({
          title: 'Search Failed',
          description: 'Failed to search for videos. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'An error occurred while searching.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast, playJukeboxClick]);

  // Add song to queue mutation
  const addSongMutation = useMutation({
    mutationFn: async (songData: {
      youtubeId: string;
      title: string;
      artist: string;
      duration: number;
      thumbnailUrl: string;
      payerAddress: string;
      transactionHash: string;
      price: string;
    }) => {
      const response = await fetch('/api/jukebox/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add song');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jukebox/queue'] });
      // Refresh balance to show updated amount after purchase
      checkUSDCBalance();
      toast({
        title: '🎵 Song Added!',
        description: 'Your song has been added to the queue.',
      });
      setSearchResults([]);
      setSearchQuery('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Song',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Skip song mutation (admin only)
  const skipSongMutation = useMutation({
    mutationFn: async () => {
      // This would need to be implemented with admin authentication
      const response = await fetch('/api/jukebox/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to skip song');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jukebox/queue'] });
      toast({
        title: '⏭️ Song Skipped',
        description: 'Current song has been skipped.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Skip Song',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSearch = () => {
    playJukeboxClick(); // Play click sound for search
    searchVideos(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // State for managing selected video for purchase and transaction flow
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [transactionStep, setTransactionStep] = useState<'idle' | 'checking' | 'approval' | 'purchase'>('idle');
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const handleAddSong = async (video: YouTubeSearchResult) => {
    playJukeboxClick(); // Play click sound for adding song
    
    if (!isSignedIn || !evmAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your embedded wallet to add songs.',
        variant: 'destructive',
      });
      return;
    }

    // Set the selected video and start checking allowance
    setSelectedVideo(video);
    setTransactionStep('checking');
    
    try {
      const needsApproval = await checkUSDCAllowance();
      setNeedsApproval(needsApproval);
      setTransactionStep(needsApproval ? 'approval' : 'purchase');
    } catch (error) {
      console.error('Error checking USDC allowance:', error);
      toast({
        title: 'Error',
        description: 'Failed to check USDC allowance. Please try again.',
        variant: 'destructive',
      });
      setTransactionStep('idle');
      setSelectedVideo(null);
    }
  };

  // Contract configuration
  const JUKEBOX_CONTRACT_ADDRESS = "0x5026a8ff0CF9c29CDd17661a2E09Fd3417c05311";
  const USDC_TOKEN = WELL_KNOWN_TOKENS.find(token => token.symbol === 'USDC')!;

  // Check if USDC allowance is sufficient for the purchase
  const checkUSDCAllowance = async (): Promise<boolean> => {
    if (!evmAddress || !priceData?.price) return false;
    
    try {
      // Use Base mainnet provider
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const usdcContract = new ethers.Contract(USDC_TOKEN.address, ERC20_ABI, provider);
      
      // Get current allowance and required price
      const currentAllowance = await usdcContract.allowance(evmAddress, JUKEBOX_CONTRACT_ADDRESS);
      const requiredPrice = BigInt(priceData.price);
      
      // Return true if approval is needed (allowance is insufficient)
      return currentAllowance < requiredPrice;
    } catch (error) {
      console.error('Error checking USDC allowance:', error);
      throw error;
    }
  };

  // Function to build transaction data for USDC approval
  const buildApprovalTransaction = () => {
    // Encode the approve function call
    const iface = new ethers.Interface(ERC20_ABI);
    
    // Approve a larger amount to avoid repeated approvals (approve 100 USDC)
    const approvalAmount = ethers.parseUnits('100', USDC_TOKEN.decimals);
    const data = iface.encodeFunctionData("approve", [JUKEBOX_CONTRACT_ADDRESS, approvalAmount]);
    
    return {
      to: USDC_TOKEN.address as `0x${string}`,
      data: data as `0x${string}`,
      value: BigInt(0),
      chainId: 8453, // Base mainnet
      type: "eip1559" as const,
    };
  };
  
  // Function to build transaction data for purchaseSong
  const buildPurchaseTransaction = (video: YouTubeSearchResult) => {
    const videoId = typeof video.id === 'string' ? video.id : (video.id as any)?.videoId || String(video.id);
    
    // Encode the function call data
    const iface = new ethers.Interface([
      "function purchaseSong(string memory youtubeId, string memory title) external"
    ]);
    
    const data = iface.encodeFunctionData("purchaseSong", [videoId, video.title.toString()]);
    
    return {
      to: JUKEBOX_CONTRACT_ADDRESS as `0x${string}`,
      data: data as `0x${string}`,
      value: BigInt(0), // USDC payment is handled by the contract
      chainId: 8453, // Base mainnet
      type: "eip1559" as const,
    };
  };

  // Handle successful approval transaction
  const handleApprovalSuccess = (hash: string) => {
    console.log('Approval transaction successful:', hash);
    
    toast({
      title: '✅ USDC Approved',
      description: 'Now you can purchase the song.',
    });
    
    // Move to purchase step
    setTransactionStep('purchase');
  };

  // Handle successful purchase transaction
  const handlePurchaseSuccess = (hash: string, video: YouTubeSearchResult) => {
    console.log('Purchase transaction successful:', hash);
    
    // Process video ID
    const videoId = typeof video.id === 'string' ? video.id : (video.id as any)?.videoId || String(video.id);
    
    // Build song data for backend
    const songData = {
      youtubeId: videoId,
      title: video.title.toString(),
      artist: video.channelTitle.toString(),
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl.toString(),
      payerAddress: evmAddress!,
      transactionHash: hash,
      price: priceData?.price || "1000000", // Default price in case of missing data
    };

    // Add to queue via API
    addSongMutation.mutate(songData);
    
    // Reset transaction state
    setSelectedVideo(null);
    setTransactionStep('idle');
    setNeedsApproval(false);
    
    // Refresh balance
    checkUSDCBalance();
  };

  // Handle transaction error
  const handleTransactionError = (error: Error) => {
    console.error('Transaction failed:', error);
    
    let errorMessage = 'Transaction failed. Please try again.';
    let title = 'Transaction Failed';
    
    if (transactionStep === 'approval') {
      title = 'Approval Failed';
      errorMessage = 'USDC approval failed. Please try again.';
    } else if (transactionStep === 'purchase') {
      title = 'Purchase Failed';
      errorMessage = 'Song purchase failed. Please try again.';
    }
    
    if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for this transaction.';
    } else if (error.message?.includes('gas')) {
      errorMessage = 'Transaction failed due to gas issues.';
    } else if (error.message?.includes('rejected')) {
      errorMessage = 'Transaction was cancelled.';
    }
    
    toast({
      title,
      description: errorMessage,
      variant: 'destructive',
    });
    
    // Reset transaction state on error
    setSelectedVideo(null);
    setTransactionStep('idle');
    setNeedsApproval(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="w-full max-w-md bg-retro-black border-2 border-retro-green text-retro-green font-mono">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="w-5 h-5" />
          JUKEBOX
          <Badge variant="outline" className="ml-auto border-retro-green text-retro-green">
            ${songPrice} USDC
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Song */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Play className="w-4 h-4" />
            NOW PLAYING
          </div>
          {currentSong ? (
            <div className="bg-retro-black border border-retro-green rounded p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm leading-tight mb-1" title={currentSong.title}>
                    {currentSong.title}
                  </div>
                  <div className="text-xs opacity-80 mb-2">
                    by {currentSong.artist}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(currentSong.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {currentSong.payerAddress.slice(0, 6)}...{currentSong.payerAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm opacity-60">
              No song currently playing
            </div>
          )}
        </div>

        {/* Global Audio Player Status */}
        {currentSong && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Play className="w-4 h-4" />
              GLOBAL AUDIO PLAYER
            </div>
            <div className="bg-retro-black border border-retro-green rounded p-3">
              <div className="text-center">
                <div className="text-lg mb-2">🎵</div>
                <div className="text-sm font-bold mb-1">
                  Status: {isPlayerReady ? (playerState === 'playing' ? 'Playing' : 'Ready') : 'Initializing'}
                </div>
                <div className="text-xs opacity-80 mb-2">
                  {currentSong.title}
                </div>
                <div className="text-xs opacity-60">
                  Music plays globally - close this interface anytime!
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator className="bg-retro-green" />

        {/* Search */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Search className="w-4 h-4" />
            SEARCH YOUTUBE
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search for songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-retro-black border-retro-green text-retro-green placeholder:text-retro-green/60 min-h-[44px]"
              data-testid="input-search-youtube"
              style={{ touchAction: 'manipulation' }}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              size="sm"
              className="bg-retro-black border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black touch-manipulation min-h-[44px] min-w-[44px]"
              data-testid="button-search-youtube"
              style={{ touchAction: 'manipulation' }}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-bold">SEARCH RESULTS</div>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {searchResults.map((video) => (
                  <div
                    key={video.id}
                    className="bg-retro-black border border-retro-green rounded p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs leading-tight mb-1" title={video.title}>
                          {video.title.length > 40 ? `${video.title.substring(0, 40)}...` : video.title}
                        </div>
                        <div className="text-xs opacity-80 mb-1">
                          {video.channelTitle}
                        </div>
                        <div className="text-xs opacity-60">
                          {formatDuration(video.duration)} • {formatTimeAgo(new Date(video.publishedAt).getTime())}
                        </div>
                      </div>
                      {selectedVideo?.id === video.id && evmAddress ? (
                        transactionStep === 'checking' ? (
                          <Button
                            size="sm"
                            disabled
                            className="bg-retro-black border-retro-green text-retro-green text-xs px-2 touch-manipulation min-h-[44px] min-w-[60px]"
                          >
                            Checking...
                          </Button>
                        ) : transactionStep === 'approval' ? (
                          <SendEvmTransactionButton
                            account={evmAddress}
                            network="base"
                            transaction={buildApprovalTransaction()}
                            onSuccess={handleApprovalSuccess}
                            onError={handleTransactionError}
                            pendingLabel="Approving..."
                            className="bg-retro-black border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black text-xs px-2 touch-manipulation min-h-[44px] min-w-[60px]"
                            data-testid={`button-approve-${video.id}`}
                          >
                            Approve USDC
                          </SendEvmTransactionButton>
                        ) : transactionStep === 'purchase' ? (
                          <SendEvmTransactionButton
                            account={evmAddress}
                            network="base"
                            transaction={buildPurchaseTransaction(video)}
                            onSuccess={(hash) => handlePurchaseSuccess(hash, video)}
                            onError={handleTransactionError}
                            pendingLabel="Buying..."
                            className="bg-retro-black border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black text-xs px-2 touch-manipulation min-h-[44px] min-w-[60px]"
                            data-testid={`button-purchase-${video.id}`}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${songPrice}
                          </SendEvmTransactionButton>
                        ) : null
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddSong(video)}
                          disabled={addSongMutation.isPending || !isSignedIn || transactionStep !== 'idle'}
                          className="bg-retro-black border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black text-xs px-2 touch-manipulation min-h-[44px] min-w-[60px]"
                          data-testid={`button-add-song-${video.id}`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${songPrice}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator className="bg-retro-green" />

        {/* Queue */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Music className="w-4 h-4" />
            UP NEXT ({upcomingQueue.length})
          </div>
          {upcomingQueue.length > 0 ? (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {upcomingQueue.slice(0, 5).map((song: JukeboxSong, index: number) => (
                  <div
                    key={song.id}
                    className="bg-retro-black border border-retro-green rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-retro-green text-retro-green">
                        #{index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs leading-tight" title={song.title}>
                          {song.title.length > 30 ? `${song.title.substring(0, 30)}...` : song.title}
                        </div>
                        <div className="text-xs opacity-80">
                          by {song.payerAddress.slice(0, 6)}...{song.payerAddress.slice(-4)} • {formatDuration(song.duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingQueue.length > 5 && (
                  <div className="text-center text-xs opacity-60">
                    +{upcomingQueue.length - 5} more songs in queue
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-4 text-sm opacity-60">
              Queue is empty
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-retro-green">
          <div className="flex flex-col items-center gap-1 text-xs opacity-80">
            <div className="flex items-center gap-2">
              <Youtube className="w-3 h-3" />
              Pay ${songPrice} USDC to add songs
            </div>
            {currentPlayer && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Your Balance: {isCheckingBalance ? 'Loading...' : `${parseFloat(usdcBalance).toFixed(2)} USDC`}
                {parseFloat(usdcBalance) < parseFloat(songPrice) && (
                  <span className="text-red-400 font-bold">⚠️ Insufficient USDC</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}