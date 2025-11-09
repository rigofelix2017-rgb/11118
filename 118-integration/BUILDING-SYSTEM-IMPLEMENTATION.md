# Building System Implementation Guide

Complete implementation of the interactive building system for void2. Buildings are clickable 3D objects in the game world that open detailed modal dialogs.

## Overview

**Interactive Buildings**: Players can click on buildings (central-tower, town-hall, energy-crystal, watchtower, corner-market, void-monument, jukebox) to open a detailed information modal.

**Features**:
- Rich building information with descriptions, features, and actions
- Category-based color coding (Government, Civic, Energy, Defense, Commerce, Mystery, Entertainment)
- Status indicators (operational, maintenance, under_construction)
- Interactive action buttons (visit, access, trade, etc.)
- Responsive grid layout for features
- Scrollable content for long descriptions

## Quick Start

```tsx
import { BuildingModal } from '@/components/building-modal';
import { Pseudo3DObject } from '@/lib/object-3d-renderer';

function Game() {
  const [selectedBuilding, setSelectedBuilding] = useState<Pseudo3DObject | null>(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  
  const handleBuildingClick = (building: Pseudo3DObject) => {
    setSelectedBuilding(building);
    setShowBuildingModal(true);
  };
  
  return (
    <>
      <BuildingModal
        isOpen={showBuildingModal}
        onClose={() => setShowBuildingModal(false)}
        building={selectedBuilding}
      />
    </>
  );
}
```

## Building Types

### 1. Central Tower (Government)
- Command Center
- Communication Array
- Council Chamber
- Defense Systems (unavailable)
- Actions: Access Command Center, View City Reports

### 2. Town Hall (Civic)
- Assembly Hall
- Public Services
- Information Center
- Administrative Offices
- Actions: Attend Town Meeting, Citizen Services

### 3. Energy Crystal (Energy)
- Energy Generation
- Crystal Resonance
- Luminescent Core
- Energy Barrier (unavailable)
- Actions: Harvest Energy, Attune to Crystal

### 4. Watchtower (Defense)
- Observation Deck
- Defense Position
- Signal Beacon
- Guard Quarters
- Actions: Take Watch, Sound Alarm

### 5. Corner Market (Commerce)
- Trading Floor
- Merchant Quarters
- Trade Board
- Storage Warehouse
- Actions: Browse Market, Trade Items

### 6. Void Monument (Mystery)
- Void Energy
- Ancient Runes
- Protective Aura (unavailable)
- Historical Artifact
- Actions: Study Runes, Sense Energy

### 7. Jukebox (Entertainment)
- Music Library
- Social Hub
- Interactive Interface
- Sound System
- Actions: Play Music, Add Song

## Component Structure

### BuildingModal Props

```typescript
interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Pseudo3DObject | null;
}
```

### Building Types (from object-3d-renderer.ts)

```typescript
export interface Pseudo3DObject {
  id: string;
  position: Position;
  type: 'building' | 'tower' | 'platform' | 'monument' | 'crystal' | 'jukebox' | 'house';
  width: number;
  height: number;
  depth: number;
  color: string;
  name?: string;
  interactive?: boolean;
  metadata?: {
    houseSlot?: number;
    accountId?: string | null;
    ownerName?: string | null;
  };
}
```

## Integration with Game Engine

**Click Detection**: Game engine detects clicks on buildings and triggers modal

```tsx
// In game page
const handleObjectClick = (obj: Pseudo3DObject) => {
  if (obj.type === 'building' || obj.type === 'tower' || 
      obj.type === 'monument' || obj.type === 'crystal' || 
      obj.type === 'jukebox') {
    setSelectedBuilding(obj);
    setShowBuildingModal(true);
  }
};
```

## Features

### Category Color Coding
- **Government**: Purple badges
- **Civic**: Blue badges
- **Energy**: Cyan badges
- **Defense**: Red badges
- **Commerce**: Yellow badges
- **Mystery**: Indigo badges
- **Entertainment**: Pink badges

### Status Badges
- **Operational**: Green (most buildings)
- **Maintenance**: Yellow
- **Under Construction**: Blue

### Feature Cards
Grid layout (1 col mobile, 2 cols desktop) with:
- Icon (lucide-react)
- Name
- Description
- Availability badge if unavailable

### Action Buttons
Full-width buttons with:
- Icon
- Action name
- Description
- Disabled state if unavailable
- onClick handler

## Dependencies

**UI Components**:
- Dialog, DialogContent, DialogHeader, DialogTitle
- Button
- ScrollArea
- Separator
- Badge
- Card, CardContent, CardDescription, CardHeader, CardTitle

**Icons** (lucide-react):
- Building, Building2, MapPin, Zap, Users, Cog, Star, Info
- ArrowRight, Crown, Shield, Gem

**Types**:
- Pseudo3DObject from object-3d-renderer.ts

## Customization

### Add New Building Type

```tsx
case 'your-building-id':
  return {
    description: 'Your building description...',
    category: 'YourCategory',
    status: 'operational',
    features: [
      {
        icon: YourIcon,
        name: 'Feature Name',
        description: 'Feature description',
        available: true
      }
    ],
    actions: [
      ...commonActions, // Visit action
      {
        id: 'custom_action',
        name: 'Your Action',
        description: 'Action description',
        icon: YourIcon,
        available: true,
        action: () => console.log('Custom action')
      }
    ]
  };
```

### Add New Category Color

```tsx
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'YourCategory': return 'bg-color-500/20 text-color-400 border-color-500/50';
    // ...
  }
};
```

## Testing

**Test IDs Available**:
- `building-modal`: Main modal container
- `building-modal-title`: Building name
- `building-category-badge`: Category badge
- `building-status-badge`: Status badge
- `building-description`: Description text
- `building-feature-${index}`: Feature cards
- `building-action-${actionId}`: Action buttons
- `building-modal-close`: Close button

## Implementation Files

- `building-modal.tsx`: Main component (607 lines)
- `object-3d-renderer.ts`: Pseudo3DObject type definition

## Status
✅ **Ready for upload to 11118**
