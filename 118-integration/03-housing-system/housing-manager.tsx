import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HouseInterior } from './house-interior';
import { FurnitureShop } from './furniture-shop';
import type { Pseudo3DObject } from '@/lib/object-3d-renderer';
import type { GamePlayer } from '@/lib/game';

type HousingView = 'none' | 'house' | 'shop';

interface HousingManagerProps {
  currentAccountId: string;
  playerName: string;
  currentPlayer: GamePlayer | null;
  houseObjects: Pseudo3DObject[];
  onUpdateHouseData?: (houseSlot: number, accountId: string | null, ownerName: string | null) => void;
  onViewChange?: (view: HousingView) => void;
}

interface House {
  id: string;
  accountId: string;
  houseSlot: number;
  privacy: string;
}

interface Player {
  accountId: string;
  displayName: string;
}

export function HousingManager({ 
  currentAccountId, 
  playerName, 
  currentPlayer,
  houseObjects,
  onUpdateHouseData,
  onViewChange
}: HousingManagerProps) {
  const [view, setView] = useState<HousingView>('none');
  
  // Notify parent when view changes
  useEffect(() => {
    onViewChange?.(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  const [visitingHouse, setVisitingHouse] = useState<{ accountId: string; ownerName: string } | null>(null);
  const [nearbyHouse, setNearbyHouse] = useState<{ houseSlot: number; accountId: string | null; ownerName: string | null; isOwn: boolean } | null>(null);

  // Fetch all houses
  const { data: houses } = useQuery<House[]>({
    queryKey: ['/api/houses']
  });

  // Fetch all players to get display names
  const { data: players } = useQuery<Player[]>({
    queryKey: ['/api/players']
  });

  // Update house objects with ownership data when houses or players change
  useEffect(() => {
    if (!houses || !players || !onUpdateHouseData) return;

    // Create a map of accountId to displayName
    const accountToName = new Map(players.map(p => [p.accountId, p.displayName]));

    // Create a map of houseSlot to house data
    const slotToHouse = new Map(houses.map(h => [h.houseSlot, h]));

    // Update all house objects
    for (let i = 0; i < 20; i++) {
      const house = slotToHouse.get(i);
      if (house) {
        const ownerName = accountToName.get(house.accountId) || 'Unknown';
        onUpdateHouseData(i, house.accountId, ownerName);
      } else {
        onUpdateHouseData(i, null, null);
      }
    }
  }, [houses, players, onUpdateHouseData]);

  // Check proximity to houses
  useEffect(() => {
    if (!currentPlayer || !houseObjects.length) {
      setNearbyHouse(null);
      return;
    }

    const interactionDistance = 60; // pixels

    // Find nearby house
    for (const houseObj of houseObjects) {
      if (houseObj.type !== 'house') continue;

      const dx = currentPlayer.position.x - houseObj.position.x;
      const dy = currentPlayer.position.y - houseObj.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < interactionDistance && houseObj.metadata) {
        const isOwn = houseObj.metadata.accountId === currentAccountId;
        setNearbyHouse({
          houseSlot: houseObj.metadata.houseSlot!,
          accountId: houseObj.metadata.accountId || null,
          ownerName: houseObj.metadata.ownerName || null,
          isOwn
        });
        return;
      }
    }

    setNearbyHouse(null);
  }, [currentPlayer, houseObjects, currentAccountId]);

  // Handle E key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && nearbyHouse && view === 'none') {
        if (nearbyHouse.isOwn || nearbyHouse.accountId) {
          // Enter the house
          const ownerAccountId = nearbyHouse.accountId || currentAccountId;
          const ownerName = nearbyHouse.ownerName || playerName;
          handleEnterHouse(ownerAccountId, ownerName);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nearbyHouse, view, currentAccountId, playerName]);

  const handleEnterHouse = (accountId: string, ownerName: string) => {
    setVisitingHouse({ accountId, ownerName });
    setView('house');
  };

  const handleExitHouse = () => {
    setVisitingHouse(null);
    setView('none');
  };

  const handleOpenShop = () => {
    setView('shop');
  };

  const handleCloseShop = () => {
    setView('house');
  };

  return (
    <>
      {/* Proximity prompt */}
      {nearbyHouse && view === 'none' && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg"
          data-testid="text-house-prompt">
          {nearbyHouse.isOwn ? (
            <div className="text-center">
              <div className="font-bold">Your House</div>
              <div className="text-sm text-gray-300">Press E to Enter</div>
            </div>
          ) : nearbyHouse.ownerName ? (
            <div className="text-center">
              <div className="font-bold">{nearbyHouse.ownerName}'s House</div>
              <div className="text-sm text-gray-300">Press E to Visit</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="font-bold">Unclaimed House</div>
              <div className="text-sm text-gray-300">Available for purchase</div>
            </div>
          )}
        </div>
      )}

      {view === 'house' && visitingHouse && (
        <HouseInterior
          accountId={visitingHouse.accountId}
          ownerName={visitingHouse.ownerName}
          onClose={handleExitHouse}
          onOpenShop={handleOpenShop}
          isOwner={visitingHouse.accountId === currentAccountId}
        />
      )}

      {view === 'shop' && (
        <FurnitureShop onClose={handleCloseShop} />
      )}
    </>
  );
}
