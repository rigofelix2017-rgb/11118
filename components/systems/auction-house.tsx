// Auction House System Component
// Timed bidding, buy-now prices, bid history, auto-bid system

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';

interface AuctionListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  itemIcon: string;
  itemRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  startingBid: number;
  currentBid: number;
  buyNowPrice?: number;
  highestBidder?: string;
  isHighestBidder?: boolean;
  endTime: Date;
  bids: number;
  description?: string;
}

export function AuctionHouse() {
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [myBids, setMyBids] = useState<AuctionListing[]>([]);
  const [myListings, setMyListings] = useState<AuctionListing[]>([]);
  const [selectedTab, setSelectedTab] = useState<'browse' | 'my-bids' | 'my-listings'>('browse');
  const [sortBy, setSortBy] = useState<'ending-soon' | 'newly-listed' | 'price-low' | 'price-high'>('ending-soon');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, [selectedTab, sortBy]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      let endpoint = '/api/auction/browse';
      
      if (selectedTab === 'my-bids') endpoint = '/api/auction/my-bids';
      if (selectedTab === 'my-listings') endpoint = '/api/auction/my-listings';
      
      const response = await fetch(`${endpoint}?sort=${sortBy}`);
      const data = await response.json();
      
      if (selectedTab === 'browse') setListings(data);
      if (selectedTab === 'my-bids') setMyBids(data);
      if (selectedTab === 'my-listings') setMyListings(data);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentListings = selectedTab === 'browse' ? listings : selectedTab === 'my-bids' ? myBids : myListings;
  const filteredListings = currentListings.filter(l => 
    l.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('browse')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all text-sm",
              selectedTab === 'browse'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            Browse
          </button>
          <button
            onClick={() => setSelectedTab('my-bids')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all text-sm",
              selectedTab === 'my-bids'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            My Bids ({myBids.length})
          </button>
          <button
            onClick={() => setSelectedTab('my-listings')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all text-sm",
              selectedTab === 'my-listings'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            My Listings ({myListings.length})
          </button>
        </div>

        <button
          onClick={() => setShowCreateListing(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90"
        >
          + List Item
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary text-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary text-sm"
        >
          <option value="ending-soon">⏱️ Ending Soon</option>
          <option value="newly-listed">🆕 Newly Listed</option>
          <option value="price-low">💰 Price: Low to High</option>
          <option value="price-high">💎 Price: High to Low</option>
        </select>
      </div>

      {/* Listings */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏛️</p>
            <p>No auctions found</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <AuctionListingCard key={listing.id} listing={listing} onUpdate={fetchAuctions} />
          ))
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <CreateListingModal
          onClose={() => setShowCreateListing(false)}
          onCreated={() => {
            setShowCreateListing(false);
            fetchAuctions();
          }}
        />
      )}
    </div>
  );
}

function AuctionListingCard({ listing, onUpdate }: { listing: AuctionListing; onUpdate: () => void }) {
  const [showBidModal, setShowBidModal] = useState(false);
  const { pushNotification, preferences } = useMobileHUD();

  const timeRemaining = getTimeRemaining(new Date(listing.endTime));
  const isEndingSoon = new Date(listing.endTime).getTime() - new Date().getTime() < 3600000; // < 1 hour

  const handleBuyNow = async () => {
    try {
      const response = await fetch('/api/auction/buy-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Purchase Complete!',
          message: `You bought ${listing.itemName}`,
          duration: 3000,
        });

        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }

        onUpdate();
      }
    } catch (error) {
      console.error('Failed to buy item:', error);
    }
  };

  const rarityColors = {
    common: 'border-gray-500/30',
    uncommon: 'border-green-500/30',
    rare: 'border-blue-500/30',
    epic: 'border-purple-500/30',
    legendary: 'border-orange-500/30',
  };

  return (
    <>
      <div className={cn(
        "p-4 rounded-lg border-2 transition-all",
        rarityColors[listing.itemRarity],
        listing.isHighestBidder ? "bg-primary/5" : "bg-muted"
      )}>
        <div className="flex items-start gap-3">
          {/* Item Icon */}
          <span className="text-4xl">{listing.itemIcon}</span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm truncate">{listing.itemName}</h4>
              {listing.isHighestBidder && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-medium">
                  Winning ✓
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">
              Seller: {listing.sellerName} • {listing.quantity}x
            </p>

            {/* Pricing */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Current Bid:</span>
                <span className="text-sm font-bold">{listing.currentBid} 💰</span>
              </div>
              {listing.buyNowPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Buy Now:</span>
                  <span className="text-sm font-bold text-primary">{listing.buyNowPrice} 💰</span>
                </div>
              )}
            </div>

            {/* Time & Bids */}
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "font-medium",
                isEndingSoon ? "text-red-500" : "text-muted-foreground"
              )}>
                ⏱️ {timeRemaining}
              </span>
              <span className="text-muted-foreground">{listing.bids} bids</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowBidModal(true)}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Place Bid
          </button>
          {listing.buyNowPrice && (
            <button
              onClick={handleBuyNow}
              className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
            >
              Buy Now
            </button>
          )}
        </div>
      </div>

      {showBidModal && (
        <PlaceBidModal
          listing={listing}
          onClose={() => setShowBidModal(false)}
          onBid={() => {
            setShowBidModal(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}

function PlaceBidModal({
  listing,
  onClose,
  onBid,
}: {
  listing: AuctionListing;
  onClose: () => void;
  onBid: () => void;
}) {
  const [bidAmount, setBidAmount] = useState(listing.currentBid + 1);
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState(listing.currentBid + 10);
  const { pushNotification } = useMobileHUD();

  const handlePlaceBid = async () => {
    try {
      const response = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          amount: bidAmount,
          autoBid: autoBidEnabled ? maxAutoBid : undefined,
        }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Bid Placed!',
          message: `You bid ${bidAmount} 💰 on ${listing.itemName}`,
          duration: 3000,
        });
        onBid();
      }
    } catch (error) {
      console.error('Failed to place bid:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-sm w-full">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Place Bid</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bid Amount</label>
            <input
              type="number"
              min={listing.currentBid + 1}
              value={bidAmount}
              onChange={(e) => setBidAmount(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum bid: {listing.currentBid + 1} 💰
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBidEnabled}
                onChange={(e) => setAutoBidEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable Auto-Bid</span>
            </label>

            {autoBidEnabled && (
              <input
                type="number"
                min={bidAmount}
                value={maxAutoBid}
                onChange={(e) => setMaxAutoBid(parseInt(e.target.value))}
                placeholder="Max auto-bid amount"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
              />
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePlaceBid}
              disabled={bidAmount <= listing.currentBid}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Place Bid
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [startingBid, setStartingBid] = useState(1);
  const [buyNowPrice, setBuyNowPrice] = useState<number | undefined>();
  const [duration, setDuration] = useState(24);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/auction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingBid,
          buyNowPrice,
          durationHours: duration,
        }),
      });

      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Create Auction</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Starting Bid</label>
            <input
              type="number"
              min={1}
              value={startingBid}
              onChange={(e) => setStartingBid(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Buy Now Price (Optional)</label>
            <input
              type="number"
              min={startingBid}
              value={buyNowPrice || ''}
              onChange={(e) => setBuyNowPrice(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty to disable"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            >
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              Create Listing
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff < 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
