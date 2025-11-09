// Photo Mode System Component
// Camera controls, filters, screenshot capture, NFT minting, gallery

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';
import { 
  MobileOptimizedWrapper, 
  MobileButton, 
  MobileInput 
} from '@/components/mobile/MobileOptimizedComponents';
import { useHaptic, usePullToRefresh } from '@/lib/mobile-optimization-hooks';
import { HapticPattern } from '@/lib/mobile-optimization';

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  timestamp: Date;
  location: string;
  likes: number;
  isPublic: boolean;
  isNFT: boolean;
  nftMinted?: boolean;
  nftTokenId?: string;
  filters: string[];
  frame?: string;
}

interface CameraSettings {
  fov: number; // Field of view (40-120)
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  filter: string;
  frame: string | null;
  hideUI: boolean;
  hidePlayer: boolean;
  freezeTime: boolean;
}

export function PhotoMode() {
  const [isActive, setIsActive] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedTab, setSelectedTab] = useState<'camera' | 'gallery'>('camera');
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    fov: 60,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    filter: 'none',
    frame: null,
    hideUI: true,
    hidePlayer: false,
    freezeTime: false,
  });
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filters = [
    { id: 'none', name: 'None', preview: '🎨' },
    { id: 'sepia', name: 'Sepia', preview: '📜' },
    { id: 'grayscale', name: 'B&W', preview: '⬛' },
    { id: 'vintage', name: 'Vintage', preview: '📷' },
    { id: 'neon', name: 'Neon', preview: '💫' },
    { id: 'cyberpunk', name: 'Cyberpunk', preview: '🌃' },
    { id: 'sunset', name: 'Sunset', preview: '🌅' },
    { id: 'midnight', name: 'Midnight', preview: '🌙' },
  ];

  const frames = [
    { id: null, name: 'None', preview: '❌' },
    { id: 'classic', name: 'Classic', preview: '🖼️' },
    { id: 'modern', name: 'Modern', preview: '🎨' },
    { id: 'neon', name: 'Neon', preview: '💠' },
    { id: 'gold', name: 'Gold', preview: '🏆' },
  ];

  return (
    <MobileOptimizedWrapper title="Photo Mode" showHeader={true}>
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('camera')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedTab === 'camera'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            📷 Camera
          </button>
          <button
            onClick={() => setSelectedTab('gallery')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedTab === 'gallery'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            🖼️ Gallery ({photos.length})
          </button>
        </div>

        {selectedTab === 'camera' && (
          <button
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              isActive
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isActive ? 'Exit Photo Mode' : 'Enter Photo Mode'}
          </button>
        )}
      </div>

      {/* Content */}
      {selectedTab === 'camera' && (
        <CameraView
          isActive={isActive}
          settings={cameraSettings}
          onSettingsChange={setCameraSettings}
          filters={filters}
          frames={frames}
          onCapture={() => {
            fetchPhotos();
          }}
        />
      )}

      {selectedTab === 'gallery' && (
        <GalleryView
          photos={photos}
          onPhotoSelect={setSelectedPhoto}
          onUpdate={fetchPhotos}
        />
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={fetchPhotos}
        />
      )}
    </div>
  );
}

function CameraView({
  isActive,
  settings,
  onSettingsChange,
  filters,
  frames,
  onCapture,
}: {
  isActive: boolean;
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
  filters: { id: string; name: string; preview: string }[];
  frames: { id: string | null; name: string; preview: string }[];
  onCapture: () => void;
}) {
  const { pushNotification, preferences } = useMobileHUD();
  const haptic = useHaptic();

  const handleCapture = async () => {
    try {
      const response = await fetch('/api/photos/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Photo Captured!',
          message: 'Saved to your gallery',
          duration: 3000,
        });

        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate([30, 20, 30]);
        }

        onCapture();
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
    }
  };

  if (!isActive) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-6xl mb-4">📷</p>
        <p className="text-lg font-bold mb-2">Photo Mode</p>
        <p className="text-sm">
          Enter photo mode to capture stunning moments in the metaverse
        </p>
      </div>
    );
  }

  return (
    <MobileOptimizedWrapper title="Photo Mode" showHeader={true}>
      <div className="space-y-4">
      {/* Camera Preview */}
      <div className="aspect-video bg-muted rounded-lg border-2 border-border flex items-center justify-center relative overflow-hidden">
        <span className="text-4xl">📸</span>
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white rounded text-xs">
          LIVE
        </div>
        {settings.filter !== 'none' && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white rounded text-xs">
            {settings.filter.toUpperCase()}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="space-y-3">
        {/* FOV */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Field of View</label>
            <span className="text-sm text-muted-foreground">{settings.fov}°</span>
          </div>
          <input
            type="range"
            min={40}
            max={120}
            value={settings.fov}
            onChange={(e) => onSettingsChange({ ...settings, fov: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Filters */}
        <div>
          <label className="block text-sm font-medium mb-2">Filter</label>
          <div className="grid grid-cols-4 gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onSettingsChange({ ...settings, filter: filter.id })}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  settings.filter === filter.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted"
                )}
              >
                <div className="text-2xl mb-1">{filter.preview}</div>
                <div className="text-xs">{filter.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Frames */}
        <div>
          <label className="block text-sm font-medium mb-2">Frame</label>
          <div className="grid grid-cols-5 gap-2">
            {frames.map((frame) => (
              <button
                key={frame.id || 'none'}
                onClick={() => onSettingsChange({ ...settings, frame: frame.id })}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  settings.frame === frame.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted"
                )}
              >
                <div className="text-2xl mb-1">{frame.preview}</div>
                <div className="text-xs">{frame.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hideUI}
              onChange={(e) => onSettingsChange({ ...settings, hideUI: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Hide UI</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hidePlayer}
              onChange={(e) => onSettingsChange({ ...settings, hidePlayer: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Hide Player</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.freezeTime}
              onChange={(e) => onSettingsChange({ ...settings, freezeTime: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Freeze Time</span>
          </label>
        </div>

        {/* Capture Button */}
        <button
          onClick={handleCapture}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:bg-primary/90"
        >
          📸 Capture Photo
        </button>
      </div>
    </div>
  );
}

function GalleryView({
  photos,
  onPhotoSelect,
  onUpdate,
}: {
  photos: Photo[];
  onPhotoSelect: (photo: Photo) => void;
  onUpdate: () => void;
}) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-liked'>('newest');

  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return b.likes - a.likes;
  });

  return (
    <MobileOptimizedWrapper title="Photo Mode" showHeader={true}>
      <div className="space-y-4">
      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary text-sm"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="most-liked">Most Liked</option>
      </select>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        {sortedPhotos.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">📷</p>
            <p>No photos yet</p>
            <p className="text-sm mt-1">Capture your first moment!</p>
          </div>
        ) : (
          sortedPhotos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onPhotoSelect(photo)}
              className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white font-medium truncate">{photo.location}</p>
                <p className="text-xs text-white/80">❤️ {photo.likes}</p>
              </div>
              {photo.isNFT && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs">
                  💎
                </div>
              )}
              {/* Placeholder - would show actual image */}
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-4xl">🖼️</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function PhotoDetailModal({
  photo,
  onClose,
  onUpdate,
}: {
  photo: Photo;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [showMintNFT, setShowMintNFT] = useState(false);
  const { pushNotification } = useMobileHUD();
  const haptic = useHaptic();

  const handleMintNFT = async () => {
    try {
      const response = await fetch('/api/photos/mint-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'NFT Minted!',
          message: 'Your photo is now an NFT',
          duration: 5000,
        });
        setShowMintNFT(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    }
  };

  const handleShare = async () => {
    // Implement sharing logic
    pushNotification({
      type: 'info',
      title: 'Shared!',
      message: 'Photo link copied to clipboard',
      duration: 3000,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">{photo.location}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <span className="text-6xl">🖼️</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {new Date(photo.timestamp).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-4">
              <span>❤️ {photo.likes}</span>
              {photo.isNFT && <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded">NFT</span>}
              {photo.isPublic && <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded">Public</span>}
            </div>
          </div>

          {/* Filters & Frame */}
          {photo.filters.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Filters: </span>
              <span>{photo.filters.join(', ')}</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShare}
              className="py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              Share
            </button>
            {!photo.nftMinted && (
              <button
                onClick={() => setShowMintNFT(true)}
                className="py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
              >
                Mint as NFT
              </button>
            )}
          </div>
        </div>
      </div>

      {showMintNFT && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm">
            <h4 className="text-lg font-bold mb-4">Mint Photo as NFT</h4>
            <p className="text-sm text-muted-foreground mb-4">
              This will create an NFT of your photo on the blockchain. Cost: 0.01 ETH
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleMintNFT}
                className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
              >
                Confirm Mint
              </button>
              <button
                onClick={() => setShowMintNFT(false)}
                className="px-4 py-2 bg-muted rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
