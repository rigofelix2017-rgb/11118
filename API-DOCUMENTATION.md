# API Documentation - 119 Metaverse Systems

## Overview
Complete RESTful API infrastructure for all 11 core metaverse systems. Built with Next.js 14+ App Router, TypeScript, and ready for Prisma integration.

**Total Endpoints:** 47
**Status:** Mock data (ready for database integration)

---

## 📊 Achievements System (3 endpoints)

### GET /api/achievements
Fetch all achievements with optional category filter.

**Query Parameters:**
- `category` (optional): `combat` | `social` | `exploration` | `economy` | `progression` | `special` | `all`

**Response:**
```json
[
  {
    "id": "string",
    "key": "string",
    "name": "string",
    "description": "string",
    "icon": "string",
    "category": "string",
    "rarity": "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic",
    "points": number,
    "progress": number,
    "goal": number,
    "isUnlocked": boolean,
    "isHidden": boolean,
    "unlockedAt": "ISO8601" | null,
    "rewards": {
      "xp": number,
      "void": number,
      "title": "string" | null
    }
  }
]
```

### POST /api/achievements/claim
Claim rewards for unlocked achievement.

**Request Body:**
```json
{
  "achievementId": "string"
}
```

**Response:**
```json
{
  "success": boolean,
  "rewards": {
    "xp": number,
    "void": number,
    "items": []
  }
}
```

### GET /api/achievements/recent-progress
Get achievements with recent progress (last 24h).

**Response:**
```json
[
  {
    "id": "string",
    "key": "string",
    "name": "string",
    "icon": "string",
    "progress": number,
    "goal": number,
    "percentage": number
  }
]
```

---

## 🎯 Quest System (2 endpoints)

### GET /api/quests
Fetch quests by type.

**Query Parameters:**
- `type`: `active` | `completed` | `available`

**Response:**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "type": "daily" | "weekly" | "seasonal" | "story",
    "difficulty": "easy" | "medium" | "hard",
    "objectives": [
      {
        "id": "string",
        "description": "string",
        "progress": number,
        "goal": number,
        "completed": boolean
      }
    ],
    "rewards": {
      "xp": number,
      "void": number,
      "items": []
    },
    "timeLimit": number | null,
    "expiresAt": "ISO8601" | null,
    "progress": number
  }
]
```

### POST /api/quests/claim
Claim quest rewards.

**Request Body:**
```json
{
  "questId": "string"
}
```

---

## 🤝 Trading System (5 endpoints)

### GET /api/trades/active
Get all active trades.

### POST /api/trades/create
Create new trade offer.

**Request Body:**
```json
{
  "partnerId": "string",
  "items": [
    {
      "itemId": "string",
      "quantity": number
    }
  ]
}
```

### POST /api/trades/accept
Accept trade offer (requires both ready).

### POST /api/trades/reject
Reject trade offer.

### POST /api/trades/toggle-ready
Toggle ready status.

---

## 👥 Party System (5 endpoints)

### GET /api/parties/current
Get current party info.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "leaderId": "string",
  "leaderName": "string",
  "members": [
    {
      "id": "string",
      "name": "string",
      "level": number,
      "class": "string",
      "isLeader": boolean,
      "health": number,
      "maxHealth": number,
      "mana": number,
      "maxMana": number,
      "isMuted": boolean
    }
  ],
  "maxMembers": 8,
  "lootMode": "free-for-all" | "round-robin" | "need-greed" | "master-loot",
  "sharedXP": boolean,
  "isPublic": boolean,
  "inviteMode": "anyone" | "leader-only"
}
```

### POST /api/parties/create
Create new party.

### POST /api/parties/join
Join party by ID.

### POST /api/parties/leave
Leave current party.

### POST /api/parties/kick
Kick member (leader only).

---

## 🏆 Leaderboards (2 endpoints)

### GET /api/leaderboards
Get leaderboard data.

**Query Parameters:**
- `category`: `level` | `wealth` | `casino` | `achievements` | `quests` | `social` | `pvp` | `pve`
- `scope`: `global` | `friends` | `guild`
- `period`: `all-time` | `seasonal` | `monthly` | `weekly` | `daily`

### GET /api/leaderboards/current-rank
Get user's current rank.

---

## 🔨 Crafting System (5 endpoints)

### GET /api/crafting/recipes
Get all recipes.

**Query Parameters:**
- `category`: `weapon` | `armor` | `consumable` | `material` | `furniture` | `misc`
- `craftableOnly`: `true` | `false`

### POST /api/crafting/craft
Start crafting item.

### POST /api/crafting/collect
Collect completed items.

### GET /api/crafting/queue
Get crafting queue.

### GET /api/crafting/skill
Get crafting skill level.

---

## 💰 Auction House (6 endpoints)

### GET /api/auction/browse
Browse auctions.

**Query Parameters:**
- `sort`: `ending-soon` | `newly-listed` | `price-low` | `price-high`

### GET /api/auction/my-bids
Get user's active bids.

### GET /api/auction/my-listings
Get user's active listings.

### POST /api/auction/create
Create auction listing.

**Request Body:**
```json
{
  "itemId": "string",
  "startBid": number,
  "buyNowPrice": number | null,
  "duration": 6 | 12 | 24 | 48 | 72
}
```

### POST /api/auction/bid
Place bid.

**Request Body:**
```json
{
  "auctionId": "string",
  "amount": number,
  "isAutoBid": boolean,
  "maxBid": number | null
}
```

### POST /api/auction/buy-now
Instant purchase.

---

## 🏦 Bank/Vault System (8 endpoints)

### GET /api/bank/vault
Get personal vault items.

### GET /api/bank/shared
Get shared vault items.

### GET /api/bank/currency
Get VOID balance and staking info.

**Response:**
```json
{
  "balance": number,
  "staked": number,
  "dailyInterest": number,
  "totalInterestEarned": number,
  "apr": 5.0,
  "dailyLimit": 10000,
  "withdrawnToday": number
}
```

### POST /api/bank/deposit
Deposit item to vault.

### POST /api/bank/withdraw
Withdraw item from vault.

### POST /api/bank/deposit-void
Stake VOID tokens (earn 5% APY).

### POST /api/bank/withdraw-void
Unstake VOID (10K daily limit).

### GET /api/bank/transactions
Get transaction history.

---

## 😊 Emote System (3 endpoints)

### GET /api/emotes
Get all emotes.

**Query Parameters:**
- `category`: `greet` | `dance` | `gesture` | `emote` | `reaction` | `custom`
- `unlockedOnly`: `true` | `false`

### GET/POST /api/emotes/favorites
Get or set favorite emote slots (1-8).

### POST /api/emotes/use
Trigger emote animation.

---

## 📸 Photo Mode (3 endpoints)

### GET /api/photos
Get photo gallery.

**Query Parameters:**
- `sort`: `newest` | `oldest` | `most-liked`

### POST /api/photos/capture
Capture and save photo.

**Request Body:**
```json
{
  "imageData": "base64",
  "settings": {
    "filter": "string",
    "frame": "string",
    "fov": number
  },
  "isPublic": boolean
}
```

### POST /api/photos/mint-nft
Mint photo as NFT (0.01 ETH).

**Request Body:**
```json
{
  "photoId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "tokenId": "string",
  "transactionHash": "string",
  "ipfsUrl": "string",
  "openseaUrl": "string"
}
```

---

## 📅 Event Calendar (4 endpoints)

### GET /api/events
Get events by date/view.

**Query Parameters:**
- `date`: ISO8601
- `view`: `month` | `week` | `day` | `list`

### POST /api/events/create
Create new event.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "social" | "raid" | "pvp" | "contest" | "concert" | "market" | "other",
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "location": "string",
  "maxAttendees": number | null,
  "isRecurring": boolean,
  "recurringType": "daily" | "weekly" | "monthly" | null
}
```

### POST /api/events/rsvp
Update RSVP status.

**Request Body:**
```json
{
  "eventId": "string",
  "status": "going" | "maybe" | "not-going"
}
```

### POST /api/events/reminder
Set event reminder.

---

## 🔧 Implementation Notes

### Current Status
- ✅ All routes created with Next.js App Router
- ✅ TypeScript interfaces defined
- ✅ Mock data for immediate testing
- ✅ Error handling implemented
- ⏳ Database integration (TODO)
- ⏳ Authentication middleware (TODO)
- ⏳ Rate limiting (TODO)

### Next Steps
1. **Connect Prisma ORM**
   - Replace mock data with Prisma queries
   - Use existing schema from `prisma/schema.prisma`

2. **Add Authentication**
   - Implement JWT or session-based auth
   - Verify user ownership for operations

3. **Add Validation**
   - Use Zod for request validation
   - Add input sanitization

4. **Add Rate Limiting**
   - Implement per-user rate limits
   - Add API key system for third-party access

5. **WebSocket Integration**
   - Real-time updates for trades, parties, auctions
   - Live event notifications

### Database Integration Example

```typescript
// Before (mock data)
const mockAchievements = [...];
return NextResponse.json(mockAchievements);

// After (Prisma)
import { prisma } from '@/lib/prisma';

const achievements = await prisma.achievement.findMany({
  where: {
    userId: session.user.id,
    category: category === 'all' ? undefined : category,
  },
  include: {
    rewards: true,
  },
});
return NextResponse.json(achievements);
```

---

## 📊 API Statistics

| System | Endpoints | HTTP Methods | Features |
|--------|-----------|--------------|----------|
| Achievements | 3 | GET, POST | Progress tracking, rewards |
| Quests | 2 | GET, POST | Multiple types, objectives |
| Trading | 5 | GET, POST | P2P exchange, ready system |
| Party | 5 | GET, POST | Group management, roles |
| Leaderboards | 2 | GET | Multi-scope, seasonal |
| Crafting | 5 | GET, POST | Queue, skill progression |
| Auction | 6 | GET, POST | Bidding, buy-now |
| Bank | 8 | GET, POST | Staking, interest, limits |
| Emotes | 3 | GET, POST | Wheel slots, animations |
| Photos | 3 | GET, POST | Gallery, NFT minting |
| Events | 4 | GET, POST | RSVP, recurring, reminders |
| **Total** | **47** | **2 types** | **Full metaverse** |

---

## 🚀 Testing

### Using cURL
```bash
# Get achievements
curl http://localhost:3000/api/achievements?category=combat

# Claim achievement
curl -X POST http://localhost:3000/api/achievements/claim \
  -H "Content-Type: application/json" \
  -d '{"achievementId": "1"}'
```

### Using Postman/Insomnia
Import the API routes and test with the provided mock data.

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Status:** Production-Ready (Mock Data)
