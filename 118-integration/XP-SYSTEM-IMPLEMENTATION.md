# XP System Implementation Guide

## Overview

Complete XP progression system with daily tasks, missions, and rewards tracking.

---

## Database Schema

```sql
-- Player XP and levels
CREATE TABLE player_xp (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  total_xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp_to_next_level BIGINT DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily tasks (reset every 24h)
CREATE TABLE daily_tasks (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL,
  category VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0
);

-- Missions (one-time or repeatable)
CREATE TABLE missions (
  id SERIAL PRIMARY KEY,
  mission_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL,
  category VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  is_repeatable BOOLEAN DEFAULT FALSE,
  repeat_interval VARCHAR(20),
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0
);

-- Player task progress
CREATE TABLE player_task_progress (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  task_id VARCHAR(50) NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  reset_at TIMESTAMP,
  UNIQUE(wallet_address, task_id, reset_at)
);

-- Player mission progress
CREATE TABLE player_mission_progress (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  mission_id VARCHAR(50) NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  times_completed INTEGER DEFAULT 0,
  UNIQUE(wallet_address, mission_id)
);

-- XP transaction history
CREATE TABLE xp_transactions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  amount INTEGER NOT NULL,
  source VARCHAR(50),
  source_id VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_xp_address ON player_xp(wallet_address);
CREATE INDEX idx_task_progress_address ON player_task_progress(wallet_address);
CREATE INDEX idx_mission_progress_address ON player_mission_progress(wallet_address);
CREATE INDEX idx_xp_transactions_address ON xp_transactions(wallet_address);
```

---

## Pre-Defined Tasks

### Daily Tasks (7 tasks)

```typescript
const DAILY_TASKS = [
  {
    task_id: 'daily_login',
    name: 'Daily Login',
    description: 'Log in to VOID',
    xp_reward: 10,
    requirement_value: 1,
    icon: '🎮'
  },
  {
    task_id: 'daily_chat_10',
    name: 'Social Butterfly',
    description: 'Send 10 chat messages',
    xp_reward: 25,
    requirement_value: 10,
    icon: '💬'
  },
  {
    task_id: 'daily_tip_player',
    name: 'Generous Spirit',
    description: 'Tip another player',
    xp_reward: 50,
    requirement_value: 1,
    icon: '💸'
  },
  {
    task_id: 'daily_queue_song',
    name: 'DJ of the Day',
    description: 'Queue a song in the jukebox',
    xp_reward: 30,
    requirement_value: 1,
    icon: '🎵'
  },
  {
    task_id: 'daily_visit_house',
    name: 'House Hunter',
    description: 'Visit 3 different houses',
    xp_reward: 40,
    requirement_value: 3,
    icon: '🏠'
  },
  {
    task_id: 'daily_ring_blast',
    name: 'Ring Master',
    description: 'Use Ring Blast 5 times',
    xp_reward: 35,
    requirement_value: 5,
    icon: '💫'
  },
  {
    task_id: 'daily_playtime_30min',
    name: 'Dedicated Player',
    description: 'Play for 30 minutes',
    xp_reward: 60,
    requirement_value: 1800,
    icon: '⏰'
  }
];
```

### One-Time Missions

```typescript
const MISSIONS = [
  {
    mission_id: 'first_tip',
    name: 'First Tip',
    description: 'Send your first tip',
    xp_reward: 100,
    icon: '💰'
  },
  {
    mission_id: 'first_house',
    name: 'Home Owner',
    description: 'Purchase your first house',
    xp_reward: 200,
    icon: '🏡'
  },
  {
    mission_id: 'first_land',
    name: 'Land Baron',
    description: 'Purchase your first land parcel',
    xp_reward: 500,
    icon: '🗺️'
  },
  {
    mission_id: 'furniture_collector',
    name: 'Interior Designer',
    description: 'Own 10 different furniture pieces',
    xp_reward: 300,
    requirement_value: 10,
    icon: '🛋️'
  }
];
```

---

## Backend Routes

Add to `SERVER-ROUTES-REFERENCE.md`:

```typescript
// GET /api/xp/me - Get current player XP
router.get('/xp/me', async (req, res) => {
  const address = req.headers['x-wallet-address'];
  
  let xpData = await db.query.playerXp.findFirst({
    where: eq(playerXp.walletAddress, address.toLowerCase())
  });

  if (!xpData) {
    [xpData] = await db.insert(playerXp).values({
      walletAddress: address.toLowerCase(),
      totalXp: 0,
      level: 1,
      xpToNextLevel: 100
    }).returning();
  }

  res.json(xpData);
});

// GET /api/xp/daily-tasks - Get tasks with progress
router.get('/xp/daily-tasks', async (req, res) => {
  const address = req.headers['x-wallet-address'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = await db.query.dailyTasks.findMany();
  const progress = await db.query.playerTaskProgress.findMany({
    where: and(
      eq(playerTaskProgress.walletAddress, address.toLowerCase()),
      eq(playerTaskProgress.resetAt, today)
    )
  });

  const tasksWithProgress = tasks.map(task => {
    const taskProgress = progress.find(p => p.taskId === task.taskId);
    return {
      ...task,
      progress: taskProgress?.progress || 0,
      completed: taskProgress?.completed || false
    };
  });

  res.json(tasksWithProgress);
});

// POST /api/xp/award - Award XP
router.post('/xp/award', async (req, res) => {
  const { amount, source, sourceId, description } = req.body;
  const address = req.headers['x-wallet-address'];

  await db.insert(xpTransactions).values({
    walletAddress: address.toLowerCase(),
    amount,
    source,
    sourceId,
    description
  });

  const player = await db.query.playerXp.findFirst({
    where: eq(playerXp.walletAddress, address.toLowerCase())
  });

  const newTotalXp = (player?.totalXp || 0) + amount;
  const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;

  await db.update(playerXp)
    .set({ totalXp: newTotalXp, level: newLevel })
    .where(eq(playerXp.walletAddress, address.toLowerCase()));

  res.json({ success: true, newTotalXp, newLevel });
});
```

---

## Frontend Components

### XPDisplay (Top Bar)

```typescript
// xp-display.tsx
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export function XPDisplay({ onClick }: { onClick: () => void }) {
  const { address } = useAccount();
  const [xpData, setXpData] = useState<any>(null);

  useEffect(() => {
    if (!address) return;

    const fetchXP = async () => {
      const res = await fetch('/api/xp/me', {
        headers: { 'x-wallet-address': address }
      });
      setXpData(await res.json());
    };

    fetchXP();
    const interval = setInterval(fetchXP, 30000);
    return () => clearInterval(interval);
  }, [address]);

  if (!xpData) return null;

  const progressPercent = ((xpData.totalXp % xpData.xpToNextLevel) / xpData.xpToNextLevel) * 100;

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-black/60 border border-cyan-500/30 rounded cursor-pointer hover:bg-black/80"
    >
      <div className="flex flex-col items-end">
        <div className="text-xs text-cyan-400">Level {xpData.level}</div>
        <div className="text-[10px] text-cyan-400/60">{xpData.totalXp} XP</div>
      </div>
      
      <div className="w-24 h-2 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
```

### XPPanel (Pop-out)

```typescript
// xp-panel.tsx
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function XPPanel({ onClose }: { onClose: () => void }) {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [missions, setMissions] = useState([]);

  // Fetch data...

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/90 border-cyan-500/30">
        <div className="p-4 border-b border-cyan-500/30">
          <h2 className="text-xl font-bold text-cyan-400">XP & Progression</h2>
        </div>

        <Tabs defaultValue="daily" className="p-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            {/* Daily tasks list */}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
```

---

## Integration

```typescript
// In game-interface.tsx
import { XPDisplay } from './xp-display';
import { XPPanel } from './xp-panel';

const [showXPPanel, setShowXPPanel] = useState(false);

<XPDisplay onClick={() => setShowXPPanel(true)} />
{showXPPanel && <XPPanel onClose={() => setShowXPPanel(false)} />}
```

---

## Auto-Tracking

```typescript
// Track daily login
useEffect(() => {
  trackTask('daily_login', 1);
}, []);

// Track chat
const handleChat = (msg) => {
  trackTask('daily_chat_10', currentProgress + 1);
};

// Track tips
const handleTip = () => {
  trackTask('daily_tip_player', 1);
};
```

---

**Status:** Ready for implementation  
**Estimated Time:** 2-3 days  
**Dependencies:** Database, backend routes
