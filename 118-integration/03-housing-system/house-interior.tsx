import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Home, X, Save, Edit, ShoppingCart, LogOut, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface PlacedFurniture {
  id?: string;
  furnitureId: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

interface House {
  id: string;
  accountId: string;
  theme: string;
  privacy: 'public' | 'private' | 'friends';
  floorType: string;
  wallpaperType: string;
  createdAt: number;
}

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  xpCost: number;
  width: number;
  height: number;
  color: string;
  isInteractive: boolean;
  interactionType: string | null;
  description: string | null;
}

interface InventoryItem {
  id: string;
  furnitureId: string;
  quantity: number;
}

interface HouseInteriorProps {
  accountId: string;
  ownerName: string;
  onClose: () => void;
  onOpenShop: () => void;
  isOwner: boolean;
}

interface PlayerPosition {
  x: number;
  y: number;
  z: number; // for depth sorting
}

export function HouseInterior({ accountId, ownerName, onClose, onOpenShop, isOwner }: HouseInteriorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [furniture, setFurniture] = useState<PlacedFurniture[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [draggingFurniture, setDraggingFurniture] = useState<{id: string; offsetX: number; offsetY: number} | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const { toast } = useToast();

  // Character state
  const [playerPos, setPlayerPos] = useState<PlayerPosition>({ x: 200, y: 200, z: 200 });
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>();

  // Room dimensions in world coordinates
  const ROOM_SIZE = 400; // Square room in world space
  const ROOM_WIDTH = 900;
  const ROOM_HEIGHT = 700;

  // Fetch house data
  const { data: house } = useQuery<House>({
    queryKey: ['/api/housing/house', accountId],
    enabled: !!accountId,
  });

  // Fetch furniture catalog
  const { data: furnitureCatalog = [] } = useQuery<FurnitureItem[]>({
    queryKey: ['/api/housing/catalog'],
  });

  // Fetch player's furniture inventory
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/housing/inventory'],
    enabled: isOwner,
  });

  // Fetch house layout
  const { data: layout = [] } = useQuery<PlacedFurniture[]>({
    queryKey: ['/api/housing/layout', house?.id],
    enabled: !!house?.id,
  });

  // Create furniture lookup map (memoized to prevent infinite re-renders)
  const furnitureMap = useMemo(() => 
    new Map(furnitureCatalog.map(f => [f.id, f])),
    [furnitureCatalog]
  );

  useEffect(() => {
    if (layout) {
      setFurniture(layout);
    }
  }, [layout]);

  // Fade in animation on mount
  useEffect(() => {
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  // Isometric projection with X-axis rotation
  const worldToIso = (x: number, y: number, z: number = 0) => {
    // More dramatic isometric angle
    const isoX = (x - y) * 0.866; // cos(30°)
    const isoY = (x + y) * 0.5 - z * 0.7; // Higher Z influence for X-axis rotation
    return { 
      x: ROOM_WIDTH / 2 + isoX, 
      y: ROOM_HEIGHT / 2 + 50 + isoY 
    };
  };

  // Inverse isometric projection (screen to world at z=0)
  const isoToWorld = (screenX: number, screenY: number) => {
    // Convert screen coords to isometric space
    const isoX = screenX - ROOM_WIDTH / 2;
    const isoY = screenY - (ROOM_HEIGHT / 2 + 50);
    
    // Solve the inverse of the isometric transformation
    // isoX = (x - y) * 0.866
    // isoY = (x + y) * 0.5
    // Solving for x and y:
    const x = (isoX / 0.866 + isoY / 0.5) / 2;
    const y = (isoY / 0.5 - isoX / 0.866) / 2;
    
    return { x, y };
  };

  // Helper functions for color manipulation
  const darkenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  };

  const lightenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * amount);
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  };

  // Draw all four walls with proper isometric projection
  const drawWalls = (ctx: CanvasRenderingContext2D) => {
    const wallHeight = 200;
    const wallColor = '#d4c4b0';
    
    // Define corner points
    const backLeft = worldToIso(0, 0, wallHeight);
    const backRight = worldToIso(ROOM_SIZE, 0, wallHeight);
    const frontRight = worldToIso(ROOM_SIZE, ROOM_SIZE, wallHeight);
    const frontLeft = worldToIso(0, ROOM_SIZE, wallHeight);
    
    const backLeftFloor = worldToIso(0, 0, 0);
    const backRightFloor = worldToIso(ROOM_SIZE, 0, 0);
    const frontRightFloor = worldToIso(ROOM_SIZE, ROOM_SIZE, 0);
    const frontLeftFloor = worldToIso(0, ROOM_SIZE, 0);

    // Back wall
    ctx.fillStyle = wallColor;
    ctx.beginPath();
    ctx.moveTo(backLeftFloor.x, backLeftFloor.y);
    ctx.lineTo(backLeft.x, backLeft.y);
    ctx.lineTo(backRight.x, backRight.y);
    ctx.lineTo(backRightFloor.x, backRightFloor.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a89070';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left wall
    ctx.fillStyle = darkenColor(wallColor, 0.2);
    ctx.beginPath();
    ctx.moveTo(backLeftFloor.x, backLeftFloor.y);
    ctx.lineTo(backLeft.x, backLeft.y);
    ctx.lineTo(frontLeft.x, frontLeft.y);
    ctx.lineTo(frontLeftFloor.x, frontLeftFloor.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#988970';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right wall
    ctx.fillStyle = darkenColor(wallColor, 0.15);
    ctx.beginPath();
    ctx.moveTo(backRightFloor.x, backRightFloor.y);
    ctx.lineTo(backRight.x, backRight.y);
    ctx.lineTo(frontRight.x, frontRight.y);
    ctx.lineTo(frontRightFloor.x, frontRightFloor.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#988970';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Front wall (semi-transparent cutaway)
    ctx.fillStyle = 'rgba(212, 196, 176, 0.15)';
    ctx.strokeStyle = 'rgba(168, 144, 112, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(frontLeftFloor.x, frontLeftFloor.y);
    ctx.lineTo(frontLeft.x, frontLeft.y);
    ctx.lineTo(frontRight.x, frontRight.y);
    ctx.lineTo(frontRightFloor.x, frontRightFloor.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Draw floor
  const drawFloor = (ctx: CanvasRenderingContext2D) => {
    const floorColor = '#c19461';
    
    const backLeft = worldToIso(0, 0, 0);
    const backRight = worldToIso(ROOM_SIZE, 0, 0);
    const frontRight = worldToIso(ROOM_SIZE, ROOM_SIZE, 0);
    const frontLeft = worldToIso(0, ROOM_SIZE, 0);

    // Draw floor
    ctx.fillStyle = floorColor;
    ctx.beginPath();
    ctx.moveTo(backLeft.x, backLeft.y);
    ctx.lineTo(backRight.x, backRight.y);
    ctx.lineTo(frontRight.x, frontRight.y);
    ctx.lineTo(frontLeft.x, frontLeft.y);
    ctx.closePath();
    ctx.fill();

    // Draw floor grid
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 8;
    for (let i = 0; i <= gridSize; i++) {
      const t = i / gridSize;
      const start = worldToIso(0, t * ROOM_SIZE, 0);
      const end = worldToIso(ROOM_SIZE, t * ROOM_SIZE, 0);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const start2 = worldToIso(t * ROOM_SIZE, 0, 0);
      const end2 = worldToIso(t * ROOM_SIZE, ROOM_SIZE, 0);
      ctx.beginPath();
      ctx.moveTo(start2.x, start2.y);
      ctx.lineTo(end2.x, end2.y);
      ctx.stroke();
    }
  };

  // Draw character
  const drawCharacter = (ctx: CanvasRenderingContext2D) => {
    const charSize = 30;
    const charHeight = 50;
    
    const screenPos = worldToIso(playerPos.x, playerPos.y, 0);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenPos.x, screenPos.y, charSize * 0.4, charSize * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body (simple isometric sprite)
    const bodyTop = worldToIso(playerPos.x, playerPos.y, charHeight);
    
    // Legs
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(screenPos.x - 12, screenPos.y - 10, 10, 15);
    ctx.fillRect(screenPos.x + 2, screenPos.y - 10, 10, 15);
    
    // Torso
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(screenPos.x - 15, bodyTop.y, 30, screenPos.y - bodyTop.y);
    
    // Head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bodyTop.x, bodyTop.y - 8, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'black';
    ctx.fillRect(bodyTop.x - 6, bodyTop.y - 10, 3, 3);
    ctx.fillRect(bodyTop.x + 3, bodyTop.y - 10, 3, 3);
  };

  // Draw 3D isometric furniture
  const drawFurniture3D = (ctx: CanvasRenderingContext2D, item: PlacedFurniture, catalogItem: FurnitureItem, isSelected: boolean) => {
    const { x, y, rotation } = item;
    const { width, height, color } = catalogItem;
    
    // Convert furniture position to world coordinates
    const furnitureZ = Math.max(width, height) * 0.5;
    const screenPos = worldToIso(x, y, 0);
    const topPos = worldToIso(x, y, furnitureZ);
    
    const depth = Math.min(width, height) * 0.6;
    
    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(screenPos.x, screenPos.y, width * 0.4, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple box representation in isometric
    const corners = [
      worldToIso(x - width/2, y - height/2, 0),
      worldToIso(x + width/2, y - height/2, 0),
      worldToIso(x + width/2, y + height/2, 0),
      worldToIso(x - width/2, y + height/2, 0),
      worldToIso(x - width/2, y - height/2, furnitureZ),
      worldToIso(x + width/2, y - height/2, furnitureZ),
      worldToIso(x + width/2, y + height/2, furnitureZ),
      worldToIso(x - width/2, y + height/2, furnitureZ),
    ];
    
    // Front face
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(corners[3].x, corners[3].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fill();
    
    // Right face
    ctx.fillStyle = darkenColor(color, 0.25);
    ctx.beginPath();
    ctx.moveTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.closePath();
    ctx.fill();
    
    // Top face
    ctx.fillStyle = lightenColor(color, 0.2);
    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fill();
    
    // Selection highlight
    if (isSelected && editMode) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      
      // Draw outline around top face
      ctx.beginPath();
      ctx.moveTo(corners[4].x, corners[4].y);
      ctx.lineTo(corners[5].x, corners[5].y);
      ctx.lineTo(corners[6].x, corners[6].y);
      ctx.lineTo(corners[7].x, corners[7].y);
      ctx.closePath();
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    }
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(catalogItem.name.split(' ')[0], screenPos.x, topPos.y - 10);
    
    ctx.restore();
  };

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Draw in correct order for depth
    drawFloor(ctx);
    drawWalls(ctx);
    
    // Collect all renderable objects with depth
    const renderables: Array<{ depth: number; draw: () => void }> = [];
    
    // Add furniture
    furniture.forEach((item, index) => {
      const catalogItem = furnitureMap.get(item.furnitureId);
      if (!catalogItem) return;
      
      const furnitureId = item.id || String(index);
      const isSelected = selectedFurniture === furnitureId;
      
      renderables.push({
        depth: item.x + item.y, // Simple depth based on position
        draw: () => drawFurniture3D(ctx, item, catalogItem, isSelected)
      });
    });
    
    // Add character
    renderables.push({
      depth: playerPos.x + playerPos.y,
      draw: () => drawCharacter(ctx)
    });
    
    // Sort by depth and render
    renderables.sort((a, b) => a.depth - b.depth);
    renderables.forEach(r => r.draw());

    ctx.restore();

  }, [house, ROOM_WIDTH, ROOM_HEIGHT, furniture, selectedFurniture, editMode, furnitureMap, playerPos]);

  // Character movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressed.current.add(key);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Movement update loop
  useEffect(() => {
    const speed = 3;
    
    const updateMovement = () => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;

        // Check keys
        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
          newY -= speed;
        }
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
          newY += speed;
        }
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
          newX -= speed;
        }
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
          newX += speed;
        }

        // Boundary checking
        const margin = 20;
        newX = Math.max(margin, Math.min(ROOM_SIZE - margin, newX));
        newY = Math.max(margin, Math.min(ROOM_SIZE - margin, newY));

        // Simple collision detection with furniture
        for (const item of furniture) {
          const catalogItem = furnitureMap.get(item.furnitureId);
          if (!catalogItem) continue;

          const furnitureRadius = Math.max(catalogItem.width, catalogItem.height) / 2 + 15;
          const dx = newX - item.x;
          const dy = newY - item.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < furnitureRadius) {
            // Push player away from furniture
            const angle = Math.atan2(dy, dx);
            newX = item.x + Math.cos(angle) * furnitureRadius;
            newY = item.y + Math.sin(angle) * furnitureRadius;
          }
        }

        if (newX !== prev.x || newY !== prev.y) {
          return { ...prev, x: newX, y: newY };
        }
        return prev;
      });

      animationFrameRef.current = requestAnimationFrame(updateMovement);
    };

    animationFrameRef.current = requestAnimationFrame(updateMovement);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [furniture, furnitureMap, ROOM_SIZE]);

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (items: PlacedFurniture[]) => {
      if (!house?.id) throw new Error('No house ID');
      const response = await fetch(`/api/housing/layout/${house.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error('Failed to save layout');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'House Saved',
        description: 'Your house layout has been saved!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/housing/layout', house?.id] });
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save house layout',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveLayoutMutation.mutate(furniture);
  };

  const toggleEditMode = () => {
    if (editMode && isOwner) {
      handleSave();
    }
    setEditMode(!editMode);
  };

  const handleExit = () => {
    setFadeIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Canvas mouse down for furniture interaction in edit mode
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert screen position to world coordinates
    const worldPos = isoToWorld(mouseX, mouseY);
    
    // Check if clicking on furniture (iterate in reverse for z-index)
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      const catalogItem = furnitureMap.get(item.furnitureId);
      if (!catalogItem) continue;
      
      // Check distance in world space
      const dx = worldPos.x - item.x;
      const dy = worldPos.y - item.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const furnitureRadius = Math.max(catalogItem.width, catalogItem.height) / 2;
      
      if (distance < furnitureRadius + 20) {
        const furnitureId = item.id || String(i);
        setSelectedFurniture(furnitureId);
        // Store offset in world coordinates
        setDraggingFurniture({ id: furnitureId, offsetX: item.x - worldPos.x, offsetY: item.y - worldPos.y });
        return;
      }
    }
    
    // Clicked on empty space
    setSelectedFurniture(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingFurniture || !editMode || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert screen position to world coordinates
    const worldPos = isoToWorld(mouseX, mouseY);
    
    // Update furniture position using world coordinates
    setFurniture(prev => prev.map((item, index) => {
      const itemId = item.id || String(index);
      if (itemId === draggingFurniture.id) {
        const newX = worldPos.x + draggingFurniture.offsetX;
        const newY = worldPos.y + draggingFurniture.offsetY;
        
        // Keep within room bounds
        const clampedX = Math.max(30, Math.min(ROOM_SIZE - 30, newX));
        const clampedY = Math.max(30, Math.min(ROOM_SIZE - 30, newY));
        
        return { ...item, x: clampedX, y: clampedY };
      }
      return item;
    }));
  };

  const handleMouseUp = () => {
    setDraggingFurniture(null);
  };

  // Rotation handler
  const rotateFurniture = () => {
    if (!selectedFurniture || !editMode) return;
    
    setFurniture(prev => prev.map((item, index) => {
      const furnitureId = item.id || String(index);
      if (furnitureId === selectedFurniture) {
        const newRotation = (item.rotation + 90) % 360;
        return { ...item, rotation: newRotation };
      }
      return item;
    }));
  };

  // Keyboard controls for rotation and deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editMode || !selectedFurniture) return;
      
      if (e.key.toLowerCase() === 'r') {
        rotateFurniture();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeFurniture(selectedFurniture);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, selectedFurniture, furniture]);

  // Place furniture from inventory
  const placeFurnitureFromInventory = (furnitureId: string) => {
    const catalogItem = furnitureMap.get(furnitureId);
    if (!catalogItem) return;

    // Place furniture in center of room
    const newItem: PlacedFurniture = {
      furnitureId,
      x: ROOM_SIZE / 2,
      y: ROOM_SIZE / 2,
      rotation: 0,
      zIndex: furniture.length + 1,
    };

    setFurniture([...furniture, newItem]);
    toast({
      title: 'Furniture Placed',
      description: `${catalogItem.name} added to your house. Drag to reposition.`,
    });
  };

  // Remove furniture from layout
  const removeFurniture = (furnitureId: string) => {
    setFurniture(prev => prev.filter((item, index) => {
      const id = item.id || String(index);
      return id !== furnitureId;
    }));
    setSelectedFurniture(null);
    toast({
      title: 'Furniture Removed',
      description: 'Item removed from layout. Click Save to persist changes.',
    });
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
      data-testid="house-interior"
    >
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 backdrop-blur-md border-b-2 border-cyan-400/50 flex items-center justify-between px-6 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <Home className="w-6 h-6 text-cyan-100" />
          <h2 className="text-2xl font-bold text-white drop-shadow-md">
            {isOwner ? 'My House' : `${ownerName}'s House`}
          </h2>
          {!isOwner && (
            <span className="text-sm text-cyan-200 bg-cyan-800/40 px-3 py-1 rounded-full">
              Visiting
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenShop}
                className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-semibold"
                data-testid="button-open-shop"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Shop
              </Button>
              <Button
                variant={editMode ? 'default' : 'secondary'}
                size="sm"
                onClick={toggleEditMode}
                className={editMode ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600 text-white'}
                data-testid="button-toggle-edit"
              >
                {editMode ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleExit}
            className="bg-red-500/80 hover:bg-red-600 text-white font-semibold"
            data-testid="button-exit-house"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Exit House
          </Button>
        </div>
      </div>

      {/* Controls hint */}
      {!editMode && (
        <div className="absolute left-4 top-20 bg-slate-900/90 backdrop-blur-md rounded-lg border-2 border-cyan-600/50 shadow-xl p-4 z-20">
          <h4 className="text-sm font-bold text-cyan-300 mb-2">Controls</h4>
          <div className="text-xs text-cyan-100 space-y-1">
            <p><kbd className="px-2 py-1 bg-slate-700 rounded">W A S D</kbd> or <kbd className="px-1 py-0.5 bg-slate-700 rounded">↑ ← ↓ →</kbd> Move</p>
          </div>
        </div>
      )}

      {/* Main Room Container */}
      <div className="absolute inset-0 flex items-center justify-center pt-16">
        <div 
          ref={containerRef}
          className="relative"
          style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas for room and furniture */}
          <canvas
            ref={canvasRef}
            width={ROOM_WIDTH}
            height={ROOM_HEIGHT}
            className="absolute top-0 left-0 rounded-lg shadow-2xl border-4 border-cyan-700/50 cursor-pointer"
            data-testid="house-canvas"
            onMouseDown={handleCanvasMouseDown}
          />

          {/* Empty State */}
          {furniture.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-cyan-100 bg-slate-900/60 px-8 py-6 rounded-xl backdrop-blur-sm border-2 border-cyan-500/30">
                <Home className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold mb-2">Empty House</p>
                {isOwner && (
                  <p className="text-sm text-cyan-300">
                    Visit the shop to buy furniture and decorate your space!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Panel */}
      {editMode && isOwner && (
        <div className="absolute right-4 top-20 bottom-16 w-72 bg-slate-900/95 backdrop-blur-md rounded-lg border-2 border-cyan-600/50 shadow-2xl overflow-hidden flex flex-col z-20">
          <div className="p-4 bg-gradient-to-r from-cyan-700 to-blue-700 border-b border-cyan-600">
            <h3 className="text-lg font-bold text-white">Furniture Inventory</h3>
            <p className="text-xs text-cyan-200">Click to place items</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {inventory.length === 0 ? (
              <div className="text-center py-8 text-cyan-300">
                <p className="text-sm">No furniture yet!</p>
                <p className="text-xs text-cyan-400 mt-2">Visit the shop to buy furniture</p>
              </div>
            ) : (
              inventory.map(item => {
                const catalogItem = furnitureMap.get(item.furnitureId);
                if (!catalogItem) return null;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 hover:border-cyan-500 cursor-pointer transition-all"
                    onClick={() => placeFurnitureFromInventory(item.furnitureId)}
                    data-testid={`inventory-item-${item.furnitureId}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: catalogItem.color }}
                      >
                        <span className="text-white text-[10px] font-bold text-center">
                          {catalogItem.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {catalogItem.name}
                        </p>
                        <p className="text-xs text-cyan-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedFurniture && (
            <div className="p-4 bg-slate-800/90 border-t border-cyan-600">
              <p className="text-xs text-cyan-300 mb-2">Selected Item Controls:</p>
              <div className="space-y-1 text-xs text-cyan-100">
                <p><kbd className="px-2 py-1 bg-slate-700 rounded">R</kbd> Rotate</p>
                <p><kbd className="px-2 py-1 bg-slate-700 rounded">Del</kbd> Remove</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
