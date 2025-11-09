import { useRef, useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JukeboxSong } from '@shared/schema';
import { AudioPlayer } from '@/lib/audio-player';

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface GlobalAudioPlayerContextType {
  isPlayerReady: boolean;
  currentSong: JukeboxSong | null;
  playerState: 'unstarted' | 'playing' | 'paused' | 'ended';
  initializePlayer: () => void;
  audioPlayer: AudioPlayer | null;
}

const GlobalAudioPlayerContext = createContext<GlobalAudioPlayerContextType>({
  isPlayerReady: false,
  currentSong: null,
  playerState: 'unstarted',
  initializePlayer: () => {},
  audioPlayer: null,
});

export const useGlobalAudioPlayer = () => useContext(GlobalAudioPlayerContext);

interface GlobalAudioPlayerProviderProps {
  children: ReactNode;
}

export function GlobalAudioPlayerProvider({ children }: GlobalAudioPlayerProviderProps) {
  const playerRef = useRef<any>(null); // YouTube player instance
  const playerDivRef = useRef<HTMLDivElement>(null); // Div for YouTube player
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState<'unstarted' | 'playing' | 'paused' | 'ended'>('unstarted');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create global AudioPlayer instance for UI sounds
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  
  // Initialize AudioPlayer on mount
  useEffect(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new AudioPlayer();
      console.log('🎵 Global AudioPlayer instance created for UI sounds');
    }
    
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.destroy();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Get current queue data - API returns {queue: [], currentSong: {...}}
  const { data: queueData, refetch: refetchQueue } = useQuery<{queue: JukeboxSong[], currentSong: JukeboxSong | null}>({
    queryKey: ['/api/jukebox/queue'],
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: isInitialized, // Only start polling after initialization
  });

  const currentSong = queueData?.currentSong || null;

  // Listen for jukebox events from WebSocket
  useEffect(() => {
    const handleJukeboxUpdate = (event: CustomEvent) => {
      console.log('🎵 Received jukebox update:', event.detail.type);
      refetchQueue(); // Refresh queue data when jukebox events occur
    };

    window.addEventListener('jukebox-update', handleJukeboxUpdate as EventListener);
    return () => window.removeEventListener('jukebox-update', handleJukeboxUpdate as EventListener);
  }, [refetchQueue]);
  

  // Periodic synchronization to handle drift
  const startSyncronization = () => {
    // Clear any existing interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Start new sync interval every 15 seconds - using Void Monk server timing for better accuracy
    syncIntervalRef.current = setInterval(async () => {
      if (playerRef.current && currentSong && playerState === 'playing') {
        try {
          // Get server's authoritative timing
          const response = await fetch('/api/jukebox/server-time');
          const { syncInfo } = await response.json();
          
          if (syncInfo && syncInfo.songId === currentSong.id && syncInfo.isPlaying) {
            const serverExpectedPosition = syncInfo.elapsedSeconds;
            const actualPosition = playerRef.current.getCurrentTime();
            const timeDiff = Math.abs(serverExpectedPosition - actualPosition);
            
            // If drift is more than 2 seconds, resync with server timing
            if (timeDiff > 2 && serverExpectedPosition < syncInfo.duration) {
              console.log(`🎵 Void Monk resync: server ${serverExpectedPosition.toFixed(1)}s, actual ${actualPosition.toFixed(1)}s`);
              playerRef.current.seekTo(serverExpectedPosition, true);
            }
          }
        } catch (error) {
          console.error('Error during Void Monk sync check:', error);
          
          // Fallback to local timing if server is unavailable
          if (currentSong.playedAt) {
            const expectedPosition = (Date.now() - currentSong.playedAt) / 1000;
            const actualPosition = playerRef.current.getCurrentTime();
            const timeDiff = Math.abs(expectedPosition - actualPosition);
            
            if (timeDiff > 2 && expectedPosition < currentSong.duration) {
              playerRef.current.seekTo(expectedPosition, true);
            }
          }
        }
      }
    }, 15000); // Check every 15 seconds for better accuracy
  };

  // Cleanup sync interval
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Initialize YouTube Player API
  const initializePlayer = () => {
    if (isInitialized) return; // Prevent double initialization
    
    console.log('🎵 Initializing global audio player...');

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Global callback for when API is ready
      (window as any).onYouTubeIframeAPIReady = () => {
        setIsInitialized(true);
        createYouTubePlayer();
      };
    } else if (window.YT && window.YT.Player) {
      // API is already loaded and ready
      setIsInitialized(true);
      createYouTubePlayer();
    } else {
      // API exists but might not be ready yet, wait for it
      console.log('🎵 YouTube API exists but not ready, waiting...');
      const checkReady = () => {
        if (window.YT && window.YT.Player) {
          setIsInitialized(true);
          createYouTubePlayer();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    }
  };

  // Create YouTube player with event listeners
  const createYouTubePlayer = () => {
    if (!playerDivRef.current || playerRef.current) return;
    
    // Safety check: ensure YouTube API is ready
    if (!window.YT || !window.YT.Player) {
      console.error('🎵 YouTube API not ready, cannot create player');
      return;
    }

    console.log('🎵 Creating YouTube player with event listeners...');
    
    try {
      playerRef.current = new window.YT.Player(playerDivRef.current, {
      height: '80',
      width: '320',
      playerVars: {
        autoplay: 1,
        controls: 1,
        showinfo: 0,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          console.log('🎵 YouTube player ready!');
          setIsPlayerReady(true);
        },
        onStateChange: (event: any) => {
          console.log('🎵 Player state changed:', event.data);
          
          // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          switch (event.data) {
            case window.YT.PlayerState.PLAYING:
              setPlayerState('playing');
              break;
            case window.YT.PlayerState.PAUSED:
              setPlayerState('paused');
              break;
            case window.YT.PlayerState.ENDED:
              // Don't advance - server will handle this automatically
              setPlayerState('ended');
              console.log('🎵 Song ended - waiting for server to advance');
              break;
            default:
              break;
          }
        },
        onError: (event: any) => {
          console.error('🎵 YouTube player error:', event.data);
        }
      }
    });
    } catch (error) {
      console.error('🎵 Failed to create YouTube player:', error);
    }
  };

  // Sync with Void Monk server timing - the authoritative timekeeper
  const syncWithVoidMonk = async () => {
    if (!currentSong || !isPlayerReady) return;

    try {
      const response = await fetch('/api/jukebox/server-time');
      const { serverTime, syncInfo } = await response.json();
      
      if (syncInfo && syncInfo.songId === currentSong.id && syncInfo.isPlaying) {
        const elapsedSeconds = syncInfo.elapsedSeconds;
        
        console.log(`🎵 Void Monk sync: song started ${elapsedSeconds.toFixed(1)}s ago (server authoritative)`);
        
        // Use a short delay to ensure video is loaded before seeking
        setTimeout(() => {
          if (playerRef.current && elapsedSeconds > 0 && elapsedSeconds < syncInfo.duration) {
            playerRef.current.seekTo(elapsedSeconds, true);
            console.log(`🎵 Seeked to ${elapsedSeconds.toFixed(1)}s (Void Monk sync)`);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('🎵 Failed to sync with Void Monk:', error);
      // Fallback to old method if server sync fails
      if (currentSong.playedAt && currentSong.status === 'playing') {
        const elapsedSeconds = Math.max(0, (Date.now() - currentSong.playedAt) / 1000);
        console.log(`🎵 Fallback sync: song started ${elapsedSeconds.toFixed(1)}s ago`);
        setTimeout(() => {
          if (playerRef.current && elapsedSeconds > 0 && elapsedSeconds < currentSong.duration) {
            playerRef.current.seekTo(elapsedSeconds, true);
          }
        }, 1000);
      }
    }
  };

  // Auto-start function for stuck songs
  const autoStartSong = async () => {
    try {
      console.log('🎵 Attempting auto-start for stuck song...');
      const response = await fetch('/api/jukebox/trigger-autoplay', { method: 'POST' });
      if (response.ok) {
        console.log('🎵 Auto-start trigger sent successfully');
        setTimeout(() => refetchQueue(), 1000); // Refresh after 1 second
      }
    } catch (error) {
      console.error('🎵 Failed to trigger auto-start:', error);
    }
  };

  // Handle song changes and playback with Void Monk synchronization
  useEffect(() => {
    if (!isPlayerReady || !currentSong || !playerRef.current) return;

    // Only change song if it's different from the last one
    if (lastSongId === currentSong.id) return;
    
    console.log(`🎵 Global player loading new song: ${currentSong.title} (${currentSong.youtubeId}) - Status: ${currentSong.status}`);
    
    // If song is pending, try to auto-start it
    if (currentSong.status === 'pending') {
      console.log('🎵 Song is pending, attempting auto-start...');
      autoStartSong();
      return; // Don't load the video yet, wait for server to mark it as playing
    }
    
    try {
      // Load new video
      playerRef.current.loadVideoById(currentSong.youtubeId);
      setLastSongId(currentSong.id);
      setPlayerState('playing');
      
      // Sync with server's authoritative timing (Void Monk)
      syncWithVoidMonk();
      
      // Start periodic synchronization for this song
      startSyncronization();
    } catch (error) {
      console.error('Error loading video:', error);
    }
  }, [isPlayerReady, currentSong, lastSongId]);

  const contextValue: GlobalAudioPlayerContextType = {
    isPlayerReady,
    currentSong,
    playerState,
    initializePlayer,
    audioPlayer: audioPlayerRef.current,
  };

  return (
    <GlobalAudioPlayerContext.Provider value={contextValue}>
      {children}
      
      {/* Global Audio Player - Always present but hidden */}
      {isInitialized && (
        <div className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden pointer-events-none z-[-1]">
          <div
            ref={playerDivRef}
            id="global-youtube-player"
            style={{ width: '320px', height: '80px' }}
          />
        </div>
      )}
    </GlobalAudioPlayerContext.Provider>
  );
}

// Export global context for backwards compatibility
export { GlobalAudioPlayerContext };