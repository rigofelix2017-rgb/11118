# 119 PROJECT - COMPLETE UI OVERHAUL & SYSTEM AUDIT

**Date**: November 8, 2025  
**Scope**: Mobile optimization, system gaps, database mapping, web3 integration  
**Goal**: Production-ready metaverse with optimized mobile UX

---

## 📱 PART 1: MOBILE UI OVERHAUL

### Current Mobile Components Audit

**Existing Mobile Components**:
1. ✅ `mobile-hud-controller.tsx` - Main HUD management
2. ✅ `mobile-hud-lite.tsx` - Simplified HUD
3. ✅ `mobile-touch-controls.tsx` - Touch input
4. ✅ `phone-interface.tsx` - In-game phone UI

**Issues to Fix**:
- [ ] **Inconsistent HUD states** - Multiple HUD controllers competing
- [ ] **Popouts not optimized** - Drawers/sheets may overlap joystick
- [ ] **No unified panel system** - Each feature has custom mobile layout
- [ ] **Touch targets too small** - Buttons < 44px on some components
- [ ] **No swipe gestures** - Missing modern mobile UX patterns
- [ ] **Keyboard conflicts** - Virtual keyboard pushes content

### Proposed Unified Mobile HUD System

```typescript
// NEW: components/mobile-hud-unified.tsx
interface MobileHUDState {
  activePanel: 'none' | 'inventory' | 'map' | 'social' | 'settings' | 'phone';
  joystickEnabled: boolean;
  notificationQueue: Notification[];
  quickActions: QuickAction[];
}

// Features:
- Collapsible bottom sheet for all panels
- Auto-hide joystick when panels open
- Swipe gestures (up=open panel, down=close)
- Touch-friendly 56px buttons
- Safe area insets for notches
- Haptic feedback on interactions
```

**Mobile-Optimized Panels**:
1. **Inventory Panel** (`enhanced-inventory-system.tsx`)
   - Needs: Swipe to delete, long-press to equip
   - Current: Click-heavy, small touch targets
   
2. **Map Panel** (`minimap.tsx` + `cyberpunk-city-map.tsx`)
   - Needs: Pinch-to-zoom, two-finger pan
   - Current: Desktop-only controls
   
3. **Social Panel** (`friend-system.tsx` + `online-friends-panel.tsx`)
   - Needs: Pull-to-refresh, swipe to message
   - Current: Static list with small buttons
   
4. **Phone Interface** (`phone-interface.tsx`)
   - Needs: Full-screen takeover, slide transitions
   - Current: Fixed position, may overlap controls

5. **XP/Achievements** (`xp-panel.tsx` + `xp-drawer.tsx`)
   - Needs: Slide-up notification, dismissible
   - Current: Always visible, clutters HUD

### Mobile Touch Controls Enhancement

**Current**: `mobile-touch-controls.tsx`  
**Issues**:
- Joystick may be too small (needs testing)
- No haptic feedback
- No visual press states
- Action buttons not customizable

**Improvements**:
```typescript
// Enhanced touch controls
interface TouchControlsConfig {
  joystickSize: 'small' | 'medium' | 'large'; // User preference
  joystickOpacity: number; // 0.5 - 1.0
  joystickPosition: { x: number; y: number }; // Customizable
  actionButtons: ActionButton[]; // Dynamic based on context
  hapticFeedback: boolean;
  showTouchIndicators: boolean; // Visual feedback
}

// Context-aware action buttons
- In building → [Enter, Inspect, Leave]
- In casino → [Bet, Spin, Cashout]
- Near player → [Chat, Trade, Tip]
- In vehicle → [Drive, Honk, Exit]
```

### Bottom Sheet System (Universal Popout)

**Create**: `components/mobile-bottom-sheet-manager.tsx`

```typescript
// Replaces all custom drawers/sheets
interface BottomSheetProps {
  content: React.ReactNode;
  snapPoints: number[]; // [0.25, 0.5, 0.9] - percentage of screen
  onClose: () => void;
  enableSwipeGestures: boolean;
  blockJoystick: boolean; // Hide controls when open
}

// Unified behavior:
- Swipe down to dismiss
- Swipe up to expand
- Backdrop tap to close
- Safe area insets
- Spring physics animation
```

**Components to Convert**:
- `inventory-system.tsx` → Bottom sheet
- `sku-inventory.tsx` → Bottom sheet
- `property-overlay.tsx` → Bottom sheet
- `xp-drawer.tsx` → Already drawer (enhance)
- `wallet-hud.tsx` → Bottom sheet for details
- `shop-interface.tsx` → Bottom sheet
- `casino-game.tsx` → Full screen takeover
- `governance-portal.tsx` → Bottom sheet

---

## 🗄️ PART 2: DATABASE REQUIREMENTS MAPPING

### User & Auth System

**Tables Needed**:
```sql
-- users (already exists?)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_banned BOOLEAN DEFAULT FALSE
);

-- user_profiles
CREATE TABLE user_profiles (
  user_id UUID REFERENCES users(id),
  display_name TEXT,
  bio TEXT,
  avatar_customization JSONB, -- Character appearance
  settings JSONB, -- UI preferences, mobile config
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  PRIMARY KEY (user_id)
);

-- user_sessions
CREATE TABLE user_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `user-profile-setup.tsx` → CREATE user_profiles
- `user-profile-edit.tsx` → UPDATE user_profiles
- `user-management-table.tsx` (admin) → SELECT users

### Inventory & Items System

**Tables Needed**:
```sql
-- items (master catalog)
CREATE TABLE items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'weapon', 'clothing', 'furniture', 'powerup'
  rarity TEXT, -- 'common', 'rare', 'legendary'
  icon_url TEXT,
  is_tradeable BOOLEAN DEFAULT TRUE,
  is_nft BOOLEAN DEFAULT FALSE,
  contract_address TEXT, -- If NFT
  token_id TEXT, -- If NFT
  metadata JSONB
);

-- user_inventory
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- furniture_instances (for housing)
CREATE TABLE furniture_instances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  house_id UUID REFERENCES houses(id),
  position JSONB, -- {x, y, z, rotation}
  placed_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `inventory-system.tsx` → SELECT user_inventory + items
- `enhanced-inventory-system.tsx` → Same + trade logic
- `sku-inventory.tsx` → Special SKU items
- `powerup-store.tsx` → SELECT items WHERE category='powerup'
- `shop-interface.tsx` → SELECT items WHERE is_tradeable=true

### Housing & Property System

**Tables Needed**:
```sql
-- houses (property parcels)
CREATE TABLE houses (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  parcel_number INTEGER UNIQUE,
  location JSONB, -- {x, y, district}
  house_type TEXT, -- 'apartment', 'mansion', 'penthouse'
  purchased_at TIMESTAMP,
  price NUMERIC,
  nft_token_id TEXT -- If NFT property
);

-- house_visitors (access control)
CREATE TABLE house_visitors (
  house_id UUID REFERENCES houses(id),
  visitor_id UUID REFERENCES users(id),
  last_visit TIMESTAMP DEFAULT NOW(),
  can_edit BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (house_id, visitor_id)
);
```

**Components Using**:
- `property-overlay.tsx` → House details
- `property-3d-preview.tsx` → Render house
- `property-mini-map.tsx` → Show location
- `PropertyMarketplace.tsx` → Buy/sell houses
- `interior-space.tsx` → Inside house view
- `model-building.tsx` + `building-constructor.tsx` → Build custom

### Social & Friends System

**Tables Needed**:
```sql
-- friendships
CREATE TABLE friendships (
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- direct_messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- group_chats
CREATE TABLE group_chats (
  id UUID PRIMARY KEY,
  name TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- group_members
CREATE TABLE group_members (
  group_id UUID REFERENCES group_chats(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- group_messages
CREATE TABLE group_messages (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES group_chats(id),
  sender_id UUID REFERENCES users(id),
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `friend-system.tsx` → friendships CRUD
- `online-friends-panel.tsx` → SELECT online friends
- `direct-message.tsx` → direct_messages CRUD
- `group-chat-manager.tsx` → group_chats + members + messages
- `GlobalChat.tsx` → Public chat (separate table)
- `proximity-chat.tsx` → Location-based (ephemeral, no DB)
- `voice-chat-system.tsx` → Real-time (Agora/WebRTC)

### Tipping & Transactions

**Tables Needed**:
```sql
-- tips
CREATE TABLE tips (
  id UUID PRIMARY KEY,
  tipper_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'VOID', -- Token symbol
  transaction_hash TEXT, -- Blockchain tx
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- transactions (general)
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT, -- 'tip', 'purchase', 'sale', 'stake', 'reward'
  amount NUMERIC,
  currency TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  metadata JSONB,
  transaction_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `tipping-system.tsx` → CREATE tips
- `wallet-hud.tsx` → Display balance + transactions
- `WalletBar.tsx` → Quick balance view

### XP & Achievements System

**Tables Needed**:
```sql
-- achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_reward INTEGER,
  rarity TEXT, -- 'common', 'rare', 'legendary'
  requirements JSONB -- {type: 'login_streak', count: 7}
);

-- user_achievements
CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress JSONB, -- For multi-step achievements
  PRIMARY KEY (user_id, achievement_id)
);

-- xp_logs
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  xp_gained INTEGER,
  source TEXT, -- 'achievement', 'quest', 'daily_login', 'casino_win'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `xp-panel.tsx` → Display XP progress
- `xp-drawer.tsx` → Recent XP gains
- **NEW**: `achievements-panel.tsx` (needs creation)

### Marketplace & Trading

**Tables Needed**:
```sql
-- marketplace_listings
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'VOID',
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'cancelled'
  listed_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP
);

-- trades (peer-to-peer)
CREATE TABLE trades (
  id UUID PRIMARY KEY,
  initiator_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
  initiator_offer JSONB, -- [{item_id, quantity}]
  recipient_offer JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**Components Using**:
- `sku-marketplace.tsx` → SKU trading
- `PropertyMarketplace.tsx` → Property trading
- **NEW**: `item-marketplace.tsx` (needs creation)

### Casino & Games

**Tables Needed**:
```sql
-- casino_games
CREATE TABLE casino_games (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- 'slots', 'blackjack', 'poker', 'roulette'
  min_bet NUMERIC,
  max_bet NUMERIC,
  house_edge NUMERIC, -- 0.05 = 5%
  is_active BOOLEAN DEFAULT TRUE
);

-- casino_bets
CREATE TABLE casino_bets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  game_id UUID REFERENCES casino_games(id),
  bet_amount NUMERIC NOT NULL,
  payout NUMERIC DEFAULT 0,
  result TEXT, -- 'win', 'loss', 'push'
  game_data JSONB, -- Specific game state
  placed_at TIMESTAMP DEFAULT NOW()
);

-- leaderboards
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  category TEXT, -- 'casino_winnings', 'xp_total', 'properties_owned'
  user_id UUID REFERENCES users(id),
  score NUMERIC,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `casino-game.tsx` → Play casino games
- `glizzy-world-casino.tsx` → Themed casino
- **NEW**: `leaderboard-panel.tsx` (needs creation)

### Governance & DAO

**Tables Needed**:
```sql
-- proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY,
  proposer_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'feature', 'economy', 'rules', 'treasury'
  status TEXT DEFAULT 'active', -- 'active', 'passed', 'rejected', 'executed'
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  voting_ends_at TIMESTAMP,
  executed_at TIMESTAMP
);

-- votes
CREATE TABLE votes (
  proposal_id UUID REFERENCES proposals(id),
  user_id UUID REFERENCES users(id),
  vote TEXT, -- 'for', 'against', 'abstain'
  voting_power NUMERIC, -- Based on tokens held
  voted_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (proposal_id, user_id)
);
```

**Components Using**:
- `governance-portal.tsx` → Proposal list
- `vote-buttons.tsx` → Cast votes
- `update-proposal-status.tsx` (admin) → Change status
- `create-plead-system.tsx` → Create proposals (typo: should be "plea"?)

### Location & Districts

**Tables Needed**:
```sql
-- districts
CREATE TABLE districts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- 'commercial', 'residential', 'entertainment', 'defi'
  bounds JSONB, -- {minX, maxX, minY, maxY}
  theme TEXT, -- 'cyberpunk', 'neon', 'industrial'
  metadata JSONB
);

-- district_buildings
CREATE TABLE district_buildings (
  id UUID PRIMARY KEY,
  district_id UUID REFERENCES districts(id),
  name TEXT,
  type TEXT, -- 'casino', 'club', 'tower', 'plaza'
  position JSONB, -- {x, y, z}
  owner_id UUID REFERENCES users(id), -- Null if public
  is_interactable BOOLEAN DEFAULT TRUE
);
```

**Components Using**:
- `cyberpunk-city-map.tsx` → Render districts
- `CityMap.tsx` → Alternative map view
- `district-boundaries.tsx` → Visual boundaries
- `defi-district-tower.tsx` → DeFi zone building
- `signals-plaza.tsx` → Social district
- `social-district-plaza.tsx` → Another social zone

### Vehicles (Future System)

**Tables Needed**:
```sql
-- vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  type TEXT, -- 'car', 'bike', 'hoverboard', 'drone'
  model TEXT,
  color TEXT,
  speed_multiplier NUMERIC DEFAULT 1.0,
  customization JSONB,
  is_nft BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMP DEFAULT NOW()
);

-- vehicle_spawns
CREATE TABLE vehicle_spawns (
  user_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  position JSONB,
  spawned_at TIMESTAMP DEFAULT NOW(),
  despawned_at TIMESTAMP,
  PRIMARY KEY (user_id, spawned_at)
);
```

**Components Using**:
- `vehicle-system.tsx` → Drive vehicles
- **NEW**: `vehicle-garage.tsx` (needs creation)

### Performance & Analytics

**Tables Needed**:
```sql
-- performance_metrics
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID,
  fps_average NUMERIC,
  latency_ms NUMERIC,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  os TEXT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- activity_logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT, -- 'login', 'logout', 'purchase', 'chat_sent'
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Components Using**:
- `performance-dashboard.tsx` → Display metrics
- `activity-log-table.tsx` (admin) → View logs
- `multiplayer-status.tsx` → Connection stats

---

## 🔗 PART 3: WEB3 INTEGRATION MAPPING

### Components Needing Web3 Hooks

**Category 1: Wallet Connection**
```typescript
// Components
- wallet-connect-button.tsx → useWallet(), useConnect()
- WalletBar.tsx → useBalance(), useWallet()
- wallet-hud.tsx → useBalance(), useTransactions()
- Web3Provider.tsx → WagmiConfig, providers setup

// Hooks Needed
- useWallet() → Current wallet address, ENS, connection status
- useBalance() → Native + token balances
- useConnect() → Connect/disconnect wallet
- useEnsName() → Resolve ENS domains
```

**Category 2: Smart Contract Interactions**
```typescript
// Components
- tipping-system.tsx → useTip() hook
- PropertyMarketplace.tsx → useBuyProperty(), useSellProperty()
- governance-portal.tsx → useProposal(), useVote()
- casino-game.tsx → useBet(), usePayout()
- business-submission-portal.tsx → useRegisterBusiness()
- hook-registry-portal.tsx → useRegisterHook()

// Hooks Needed
- useTip(recipientAddress, amount) → Send VOID tokens
- useContract(contractAddress, abi) → General contract interaction
- useContractRead(contract, method, args) → Read-only calls
- useContractWrite(contract, method, args) → State-changing calls
- useWaitForTransaction(txHash) → Wait for confirmation
```

**Category 3: NFT Interactions**
```typescript
// Components
- inventory-system.tsx → Display NFT items
- sku-marketplace.tsx → Trade NFT SKUs
- PropertyMarketplace.tsx → Trade NFT properties
- creator-hub-building.tsx → Mint creator NFTs

// Hooks Needed
- useNFTBalance(contractAddress) → Get user's NFTs
- useNFTMetadata(contractAddress, tokenId) → Get NFT details
- useNFTTransfer(to, tokenId) → Transfer NFT
- useMintNFT(contractAddress, metadata) → Mint new NFT
```

**Category 4: Staking & DeFi**
```typescript
// Components
- **NEW**: staking-vault.tsx (from LAME-INTEGRATION.md)
- **NEW**: liquidity-pool.tsx (needs creation)
- defi-district-tower.tsx → DeFi hub UI

// Hooks Needed
- useStake(amount) → Stake VOID tokens
- useUnstake(amount) → Unstake tokens
- useStakingRewards() → Get pending rewards
- useClaimRewards() → Claim staking rewards
- useLiquidityPool() → Add/remove liquidity
```

**Category 5: Gasless Transactions (Coinbase Smart Wallet)**
```typescript
// Components
- **All transaction components** → Use gasless relay

// Implementation
- Use CDP SDK paymaster
- Smart wallet creation (embedded)
- Batch transactions
- Session keys for gaming

// Reference: LAME-INTEGRATION.md in attached assets
```

### Smart Contracts Needed

**1. VOID Token Contract** (ERC-20)
```solidity
// Functions needed
- transfer(to, amount)
- approve(spender, amount)
- balanceOf(account)
- totalSupply()
```

**2. Tipping Contract**
```solidity
// Functions needed
- tip(recipient, amount, message)
- getTipHistory(user)
- getTotalTipped(user)
```

**3. Property NFT Contract** (ERC-721)
```solidity
// Functions needed
- mint(to, parcelNumber, metadata)
- transferProperty(from, to, tokenId)
- getPropertyMetadata(tokenId)
- setPropertyPrice(tokenId, price)
- buyProperty(tokenId) payable
```

**4. Marketplace Contract**
```solidity
// Functions needed
- listItem(tokenId, price)
- buyItem(listingId) payable
- cancelListing(listingId)
- updatePrice(listingId, newPrice)
```

**5. Governance Contract** (DAO)
```solidity
// Functions needed
- createProposal(title, description, category)
- vote(proposalId, support)
- executeProposal(proposalId)
- getVotingPower(user)
```

**6. Casino Contract** (Provably Fair)
```solidity
// Functions needed
- placeBet(gameId, amount, choice)
- resolveBet(betId, randomness)
- withdrawWinnings()
```

**7. Staking Vault Contract**
```solidity
// Functions needed
- stake(amount)
- unstake(amount)
- getRewards(user)
- claimRewards()
```

### Web3 Provider Architecture

```typescript
// app/Web3Provider.tsx structure

import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Setup
const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: '119 Metaverse',
      preference: 'smartWalletOnly' // Gasless txs
    })
  ],
  transports: {
    [base.id]: http()
  }
});

// Components need
<Web3Provider>
  <QueryClientProvider client={queryClient}>
    <WagmiConfig config={config}>
      <App />
    </WagmiConfig>
  </QueryClientProvider>
</Web3Provider>
```

---

## 🚧 PART 4: MISSING SYSTEMS TO CREATE

### High Priority (Core Gameplay)

**1. Quest System** (NEW)
```typescript
// components/quest-system.tsx
- Quest list (daily, weekly, seasonal)
- Quest tracking UI
- Reward claiming
- Progress bars
- Notifications

// Database: quests, user_quests tables
// Hooks: useQuests(), useCompleteQuest()
```

**2. Achievement System** (NEW)
```typescript
// components/achievement-panel.tsx
- Achievement gallery
- Progress tracking
- Unlock animations
- Rarity tiers
- Share achievements

// Database: achievements, user_achievements tables
// Hooks: useAchievements(), useUnlockAchievement()
```

**3. Trading System** (Enhance existing)
```typescript
// components/peer-to-peer-trade.tsx
- Trade window UI
- Offer/counter-offer
- Trade history
- Scam protection
- Trade confirmations

// Database: trades table (defined above)
// Hooks: useCreateTrade(), useAcceptTrade()
```

**4. Party/Group System** (NEW)
```typescript
// components/party-system.tsx
- Create party
- Invite members
- Shared XP
- Party chat
- Party quests

// Database: parties, party_members tables
// Hooks: useParty(), useInviteToParty()
```

**5. Leaderboards** (NEW)
```typescript
// components/leaderboard-panel.tsx
- Global rankings
- Friend rankings
- Weekly/all-time
- Multiple categories
- Reward tiers

// Database: leaderboards table (defined above)
// Hooks: useLeaderboard()
```

### Medium Priority (Economy)

**6. Crafting System** (NEW)
```typescript
// components/crafting-station.tsx
- Recipe list
- Material requirements
- Craft timer
- Batch crafting
- Recipe discovery

// Database: recipes, crafting_materials tables
// Hooks: useCraft(), useRecipes()
```

**7. Auction House** (Enhance marketplace)
```typescript
// components/auction-house.tsx
- Timed auctions
- Bid system
- Buyout price
- Auction history
- Notifications

// Database: auctions, bids tables
// Hooks: useCreateAuction(), usePlaceBid()
```

**8. Bank/Vault System** (NEW)
```typescript
// components/bank-interface.tsx
- Secure storage
- Loans (if economy supports)
- Interest on deposits
- Transaction history
- Currency exchange

// Database: bank_accounts, loans tables
// Hooks: useDeposit(), useWithdraw()
```

### Low Priority (Social)

**9. Emote/Gesture System** (NEW)
```typescript
// components/emote-wheel.tsx
- Radial menu for emotes
- Unlockable emotes
- Custom animations
- Emote shop

// Database: emotes, user_emotes tables
// Hooks: useEmote()
```

**10. Photo Mode** (NEW)
```typescript
// components/photo-mode.tsx
- Camera controls
- Filters
- Frame export
- NFT minting (photos as NFTs)
- Gallery

// Database: photos, photo_albums tables
// Hooks: useTakePhoto(), useMintPhotoNFT()
```

**11. Event Calendar** (NEW)
```typescript
// components/event-calendar.tsx
- Upcoming events
- RSVP system
- Event rewards
- Recurring events
- Push notifications

// Database: events, event_attendees tables
// Hooks: useEvents(), useRSVP()
```

---

## 📋 PART 5: COMPONENT-DATABASE-WEB3 CONNECTION MAP

### Legend
- 🗄️ = Needs database
- 🔗 = Needs web3 hook
- ⚠️ = Missing/incomplete
- ✅ = Complete

| Component | Database Tables | Web3 Hooks | Status |
|-----------|----------------|------------|--------|
| **User & Auth** |
| user-profile-setup.tsx | user_profiles | useWallet() | ⚠️ |
| user-profile-edit.tsx | user_profiles | - | ⚠️ |
| user-management-table.tsx | users, activity_logs | - | ⚠️ |
| **Inventory** |
| inventory-system.tsx | user_inventory, items | useNFTBalance() | ⚠️ |
| enhanced-inventory-system.tsx | user_inventory, items, trades | useNFTTransfer() | ⚠️ |
| sku-inventory.tsx | user_inventory (SKUs) | useNFTBalance() | ⚠️ |
| powerup-store.tsx | items, transactions | useContractWrite() | ⚠️ |
| **Housing** |
| property-overlay.tsx | houses, house_visitors | - | ⚠️ |
| property-3d-preview.tsx | houses | - | ⚠️ |
| PropertyMarketplace.tsx | houses, marketplace_listings | useBuyProperty() | ⚠️ |
| interior-space.tsx | furniture_instances | - | ⚠️ |
| model-building.tsx | district_buildings | - | ⚠️ |
| building-constructor.tsx | district_buildings | - | ⚠️ |
| **Social** |
| friend-system.tsx | friendships | - | ⚠️ |
| online-friends-panel.tsx | friendships, users | - | ⚠️ |
| direct-message.tsx | direct_messages | - | ⚠️ |
| group-chat-manager.tsx | group_chats, group_members, group_messages | - | ⚠️ |
| GlobalChat.tsx | global_messages | - | ⚠️ |
| proximity-chat.tsx | - (ephemeral) | - | ⚠️ |
| voice-chat-system.tsx | - (WebRTC) | - | ⚠️ |
| **Tipping & Wallet** |
| tipping-system.tsx | tips, transactions | useTip() | ⚠️ |
| wallet-connect-button.tsx | - | useConnect() | ✅ |
| wallet-hud.tsx | transactions | useBalance() | ⚠️ |
| WalletBar.tsx | - | useBalance() | ⚠️ |
| **XP & Progression** |
| xp-panel.tsx | user_profiles (xp), xp_logs | - | ⚠️ |
| xp-drawer.tsx | xp_logs | - | ⚠️ |
| **Marketplace** |
| sku-marketplace.tsx | marketplace_listings, items | useContractWrite() | ⚠️ |
| shop-interface.tsx | items, transactions | useContractWrite() | ⚠️ |
| **Casino** |
| casino-game.tsx | casino_bets, casino_games | useBet() | ⚠️ |
| glizzy-world-casino.tsx | casino_bets | useBet() | ⚠️ |
| **Governance** |
| governance-portal.tsx | proposals, votes | useProposal() | ⚠️ |
| vote-buttons.tsx | votes | useVote() | ⚠️ |
| update-proposal-status.tsx | proposals | - | ⚠️ |
| create-plead-system.tsx | proposals | useCreateProposal() | ⚠️ |
| **Districts & Map** |
| cyberpunk-city-map.tsx | districts, district_buildings | - | ⚠️ |
| CityMap.tsx | districts | - | ⚠️ |
| district-boundaries.tsx | districts | - | ⚠️ |
| defi-district-tower.tsx | district_buildings | - | ⚠️ |
| signals-plaza.tsx | district_buildings | - | ⚠️ |
| social-district-plaza.tsx | district_buildings | - | ⚠️ |
| **3D Rendering** |
| scene-3d.tsx | - | - | ✅ |
| world-grid-3d.tsx | - | - | ✅ |
| player-character-3d.tsx | user_profiles (avatar) | - | ⚠️ |
| remote-player-3d.tsx | - | - | ✅ |
| **Mobile UI** |
| mobile-hud-controller.tsx | user_profiles (settings) | - | ⚠️ |
| mobile-hud-lite.tsx | - | - | ⚠️ |
| mobile-touch-controls.tsx | user_profiles (controls config) | - | ⚠️ |
| phone-interface.tsx | - | - | ⚠️ |
| **Vehicles** |
| vehicle-system.tsx | vehicles, vehicle_spawns | - | ⚠️ |
| **Misc** |
| performance-dashboard.tsx | performance_metrics | - | ⚠️ |
| activity-log-table.tsx | activity_logs | - | ⚠️ |
| multiplayer-status.tsx | - | - | ✅ |
| loading-screen.tsx | - | - | ✅ |
| StartScreen.tsx | - | - | ✅ |
| **Weather & Atmosphere** |
| weather-system.tsx | - | - | ✅ |
| street-lights.tsx | - | - | ✅ |
| CRTOverlay.tsx | - | - | ✅ |
| psx-overlay.tsx | - | - | ✅ |
| y2k-dashboard.tsx | - | - | ✅ |
| **Creator Tools** |
| creator-hub-building.tsx | creator_content | useMintNFT() | ⚠️ |
| business-submission-portal.tsx | businesses | useRegisterBusiness() | ⚠️ |
| hook-registry-portal.tsx | hooks_registry | - | ⚠️ |
| **Admin** |
| zone-interaction.tsx | zones | - | ⚠️ |

### Summary Stats
- **Total Components**: ~80
- **Need Database**: ~45 (56%)
- **Need Web3**: ~20 (25%)
- **Complete**: ~15 (19%)
- **Missing/Incomplete**: ~65 (81%)

---

## 🎯 PART 6: IMPLEMENTATION PRIORITIES

### Phase 1: Mobile UX Foundation (Week 1)
1. ✅ Create `mobile-hud-unified.tsx` - Unified HUD manager
2. ✅ Create `mobile-bottom-sheet-manager.tsx` - Universal drawer
3. ✅ Enhance `mobile-touch-controls.tsx` - Better joystick + haptics
4. ✅ Update all panels to use bottom sheet system
5. ✅ Test on real devices (iOS + Android)

### Phase 2: Core Database Integration (Week 2-3)
1. ✅ Create database schema (all tables defined above)
2. ✅ Set up Prisma/Drizzle ORM
3. ✅ Create API routes for all tables
4. ✅ Implement authentication flow
5. ✅ Connect inventory system to DB
6. ✅ Connect user profiles to DB
7. ✅ Connect social features to DB

### Phase 3: Web3 Integration (Week 4-5)
1. ✅ Set up Wagmi + CDP SDK
2. ✅ Create all custom hooks (useTip, useBet, etc.)
3. ✅ Deploy smart contracts (testnet first)
4. ✅ Integrate wallet connection flow
5. ✅ Implement gasless transactions
6. ✅ Connect marketplace to blockchain
7. ✅ Add NFT support to inventory

### Phase 4: Missing Systems (Week 6-7)
1. ✅ Create quest system
2. ✅ Create achievement system
3. ✅ Create trading system
4. ✅ Create party system
5. ✅ Create leaderboards
6. ✅ Create bank/vault

### Phase 5: Polish & Optimization (Week 8)
1. ✅ Performance optimization (mobile)
2. ✅ Accessibility audit
3. ✅ Cross-browser testing
4. ✅ Load testing
5. ✅ Security audit
6. ✅ Bug fixes

---

## 📝 PART 7: DETAILED MOBILE HUD SPECIFICATION

### Unified Mobile HUD Layout

```
┌─────────────────────────────────────┐
│ Top Bar (collapsed)                 │ ← Safe area top
│ [Wallet] [XP] [Notifications]       │
├─────────────────────────────────────┤
│                                     │
│                                     │
│        Game World                   │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Joystick]         [Action Buttons] │ ← Hidden when panel open
├─────────────────────────────────────┤
│ Bottom Sheet (swipeable)            │ ← Snap points: 0%, 40%, 90%
│ [────────] Drag handle              │
│ [Inventory] [Map] [Social] [Phone]  │
│ ... panel content ...               │
└─────────────────────────────────────┘
  ↑ Safe area bottom
```

### Top Bar Components

**Left Side**:
- Wallet balance (tap to expand)
- Currency icon + amount
- Green/red indicator (gain/loss)

**Center**:
- XP bar (tap to see details)
- Level indicator
- Progress percentage

**Right Side**:
- Notification bell (badge count)
- Settings gear
- Menu hamburger

### Bottom Navigation Tabs

**Tabs** (visible when no panel open):
```
[🎒 Inventory] [🗺️ Map] [👥 Social] [📱 Phone] [⚙️ More]
```

**Tap behavior**:
- First tap: Open to 40% (preview)
- Second tap: Expand to 90% (full)
- Swipe up: Expand to 90%
- Swipe down: Collapse to 40% or close

### Panel Content Optimization

**Inventory Panel**:
```
┌─────────────────┐
│ [Search] [Filter]│
├─────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ │ ← Grid layout (3 cols)
│ │  │ │  │ │  │ │ ← 80x80px tap targets
│ └──┘ └──┘ └──┘ │
│ Item1 Item2 Item3│ ← Names below
│ [Equip] [Drop]   │ ← Context buttons
└─────────────────┘
```

**Map Panel**:
```
┌─────────────────┐
│ Minimap (full)  │
│   [You] 📍      │ ← Pinch to zoom
│     [Friend] 👤 │ ← Tap marker for info
│ [Building] 🏢   │ ← Two-finger pan
│                 │
│ [Recenter] [3D] │ ← Action buttons
└─────────────────┘
```

**Social Panel**:
```
┌─────────────────┐
│ [Friends][Groups]│ ← Tabs
├─────────────────┤
│ ● Alice (Online)│ ← Pull to refresh
│   [Chat][Trade] │ ← Swipe for actions
│ ○ Bob (Offline) │
│   [Message]     │
└─────────────────┘
```

**Phone Interface** (full screen takeover):
```
┌─────────────────┐
│ < Back    Phone │ ← Status bar
├─────────────────┤
│  [📞] [💬] [📧] │ ← App grid
│  [🏪] [🎮] [📸] │
│  [🎵] [📺] [⚙️] │
│                 │
│ [Home]          │ ← Bottom button
└─────────────────┘
```

### Touch Gestures Map

| Gesture | Action |
|---------|--------|
| Tap | Select/activate |
| Long press | Context menu |
| Swipe up (bottom) | Open panel |
| Swipe down (panel) | Close panel |
| Swipe left/right (list) | Quick actions |
| Pinch (map) | Zoom in/out |
| Two-finger drag | Pan map |
| Pull down (list) | Refresh |
| Double tap | Quick action (equip, use) |

### Haptic Feedback Events

| Event | Haptic Type |
|-------|-------------|
| Button tap | Light impact |
| Panel open/close | Medium impact |
| Item equipped | Success notification |
| Item dropped | Warning notification |
| Level up | Heavy impact |
| Achievement unlocked | Success + audio |
| Error | Error notification |
| Trade completed | Success notification |

---

## 🔧 PART 8: TECHNICAL IMPLEMENTATION GUIDE

### Mobile HUD Context (Global State)

```typescript
// contexts/mobile-hud-context.tsx
interface MobileHUDState {
  // Panel state
  activePanel: PanelType | null;
  panelSnapPoint: 0 | 0.4 | 0.9; // Percentage
  
  // UI state
  joystickEnabled: boolean;
  topBarVisible: boolean;
  bottomTabsVisible: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // User preferences
  hapticEnabled: boolean;
  joystickSize: 'small' | 'medium' | 'large';
  joystickOpacity: number;
  
  // Methods
  openPanel: (panel: PanelType, snapPoint?: number) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  setJoystickEnabled: (enabled: boolean) => void;
  pushNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}
```

### Bottom Sheet Component

```typescript
// components/mobile-bottom-sheet.tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints: number[]; // [0, 0.4, 0.9]
  initialSnap?: number;
  children: React.ReactNode;
  enableBackdrop?: boolean;
  enableSwipeGestures?: boolean;
}

// Features:
- Spring physics animation (react-spring)
- Drag handle indicator
- Backdrop overlay (tap to close)
- Snap to predefined points
- Velocity-based flick detection
- Safe area insets
- Prevent scroll when dragging
```

### Enhanced Touch Controls

```typescript
// components/mobile-touch-controls-v2.tsx
interface EnhancedTouchControlsProps {
  // Joystick config
  joystickSize: number; // 80-120px
  joystickPosition: { x: number; y: number };
  joystickOpacity: number; // 0.5-1.0
  onMove: (direction: { x: number; y: number }) => void;
  
  // Action buttons (dynamic)
  actions: ActionButton[];
  onAction: (actionId: string) => void;
  
  // Haptic feedback
  hapticEnabled: boolean;
  
  // Visual feedback
  showTouchIndicators: boolean;
  showJoystickPath: boolean;
}

interface ActionButton {
  id: string;
  icon: string; // Emoji or icon name
  label: string;
  position: { x: number; y: number }; // Relative
  size: number; // 44-64px
  color: string;
  enabled: boolean;
}
```

### Database Migration Script

```typescript
// migrations/001_initial_schema.ts
export async function up(db: Database) {
  // Create all tables in correct order (respecting foreign keys)
  await db.schema.createTable('users')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('wallet_address', 'text', col => col.unique().notNull())
    .addColumn('username', 'text', col => col.unique())
    // ... rest of columns
    .execute();
    
  // Repeat for all 50+ tables
  // Use transactions for atomicity
}
```

### Web3 Hooks Library

```typescript
// hooks/web3/useTip.ts
export function useTip() {
  const { writeContract } = useContractWrite();
  const { waitForTransaction } = useWaitForTransaction();
  
  const tip = async (recipientAddress: string, amount: bigint, message: string) => {
    // 1. Write to smart contract
    const txHash = await writeContract({
      address: TIPPING_CONTRACT_ADDRESS,
      abi: TippingABI,
      functionName: 'tip',
      args: [recipientAddress, amount, message],
      // Gasless via CDP paymaster
      paymaster: COINBASE_PAYMASTER_URL
    });
    
    // 2. Wait for confirmation
    await waitForTransaction({ hash: txHash });
    
    // 3. Update database
    await fetch('/api/tips', {
      method: 'POST',
      body: JSON.stringify({
        recipientAddress,
        amount: amount.toString(),
        message,
        txHash
      })
    });
    
    return txHash;
  };
  
  return { tip, isLoading, error };
}
```

### API Route Pattern

```typescript
// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // 2. Query database
    const inventory = await prisma.userInventory.findMany({
      where: { userId: user.id },
      include: { item: true } // Join items table
    });
    
    // 3. Return data
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Add item to inventory
}
```

---

## 📊 PART 9: METRICS & TESTING

### Mobile Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| FPS (mobile) | 30+ | 20+ |
| FPS (desktop) | 60+ | 30+ |
| Initial load | < 5s | < 10s |
| Panel open time | < 200ms | < 500ms |
| Touch response | < 50ms | < 100ms |
| API response | < 200ms | < 500ms |
| Memory usage (mobile) | < 300MB | < 500MB |
| Bundle size | < 3MB | < 5MB |

### Testing Checklist

**Mobile Devices**:
- [ ] iPhone 14 Pro (iOS 17)
- [ ] iPhone SE (iOS 16)
- [ ] Samsung Galaxy S23 (Android 13)
- [ ] Google Pixel 7 (Android 13)
- [ ] iPad Pro (iPadOS 17)

**Touch Gestures**:
- [ ] Joystick drag (8 directions)
- [ ] Action button taps
- [ ] Panel swipe up/down
- [ ] Pinch zoom (map)
- [ ] Two-finger pan (map)
- [ ] Long press (context menu)
- [ ] Pull to refresh (lists)

**Screen Orientations**:
- [ ] Portrait (primary)
- [ ] Landscape (secondary)
- [ ] Rotation handling

**Edge Cases**:
- [ ] Small screens (iPhone SE - 320px)
- [ ] Notched displays (iPhone X+)
- [ ] Foldable screens
- [ ] Tablet sizes (iPad)
- [ ] Virtual keyboard overlap
- [ ] Low memory devices
- [ ] Slow network (3G)

**Accessibility**:
- [ ] Screen reader support
- [ ] Minimum touch targets (44px)
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators
- [ ] Keyboard navigation (desktop)

---

## 🚀 NEXT STEPS

1. **Review this document** with team
2. **Prioritize features** (Phase 1-5)
3. **Create GitHub issues** for each component
4. **Set up project board** (Kanban)
5. **Begin Phase 1** (Mobile UX Foundation)

**Estimated Timeline**: 8 weeks to production-ready

---

**Document Version**: 1.0  
**Last Updated**: November 8, 2025  
**Status**: ✅ Comprehensive audit complete
