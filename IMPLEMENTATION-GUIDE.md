# 119 Project - Complete API Integration Guide

## 🎯 Current Status

### ✅ Completed (Phase 1-5)
- **11 Core Systems**: All frontend components built (186KB code)
- **47 API Endpoints**: Complete RESTful API with mock data
- **Database Schema**: 50+ tables in Prisma schema
- **Web3 Hooks**: 5 custom hooks for blockchain operations
- **Mobile HUD**: Complete mobile interface system

### ⏳ In Progress (Phase 6)
- **API Infrastructure**: Validation, middleware, response helpers
- **Documentation**: Complete API documentation

### 📋 Next Steps (Phase 7-8)
- Connect Prisma to API routes
- Mobile optimization pass
- Integration testing

---

## 📂 Project Structure

```
119/
├── app/
│   ├── api/
│   │   ├── achievements/         # 3 endpoints
│   │   ├── quests/               # 2 endpoints
│   │   ├── trades/               # 5 endpoints
│   │   ├── parties/              # 5 endpoints
│   │   ├── leaderboards/         # 2 endpoints
│   │   ├── crafting/             # 5 endpoints
│   │   ├── auction/              # 6 endpoints
│   │   ├── bank/                 # 8 endpoints
│   │   ├── emotes/               # 3 endpoints
│   │   ├── photos/               # 3 endpoints
│   │   └── events/               # 4 endpoints
│   └── [other Next.js pages]
├── components/
│   └── systems/
│       ├── achievement-system.tsx
│       ├── trading-system.tsx
│       ├── party-system.tsx
│       ├── leaderboards-system.tsx
│       ├── crafting-system.tsx
│       ├── auction-house.tsx
│       ├── bank-system.tsx
│       ├── emote-system.tsx
│       ├── photo-mode.tsx
│       ├── event-calendar.tsx
│       └── quest-system.tsx
├── lib/
│   ├── api/
│   │   ├── validation.ts        # Zod schemas
│   │   ├── response.ts          # Response helpers
│   │   └── middleware.ts        # Auth, rate limiting, CORS
│   ├── mobile-hud-context.tsx
│   └── [other utilities]
├── hooks/
│   └── web3/
│       ├── useTip.ts
│       ├── useNFT.ts
│       ├── useStake.ts
│       ├── useGovernance.ts
│       └── useCasino.ts
├── prisma/
│   └── schema.prisma            # 50+ tables
└── [config files]
```

---

## 🔌 Connecting APIs to Database

### Step 1: Install Dependencies

```bash
npm install @prisma/client zod
npm install -D prisma
```

### Step 2: Initialize Prisma Client

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Step 3: Update API Routes

**Before (Mock):**
```typescript
export async function GET(request: NextRequest) {
  const mockAchievements = [...];
  return NextResponse.json(mockAchievements);
}
```

**After (Prisma):**
```typescript
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const achievements = await prisma.achievement.findMany({
      where: {
        userId: request.user.id,
        category: category === 'all' ? undefined : category,
      },
      include: {
        rewards: true,
      },
    });

    return successResponse(achievements);
  } catch (error) {
    return errorResponse('Failed to fetch achievements');
  }
});
```

### Step 4: Add Validation

```typescript
import { validateRequest, claimAchievementSchema } from '@/lib/api/validation';
import { badRequestError } from '@/lib/api/response';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { data, error } = await validateRequest(request, claimAchievementSchema);
  
  if (error) {
    return badRequestError(error);
  }

  // Process with validated data
  const achievement = await prisma.achievement.findUnique({
    where: { id: data.achievementId },
  });

  // ... rest of logic
});
```

---

## 🎨 Frontend Integration

### Using API Routes in Components

**Example: Achievement System**

```typescript
import { useEffect, useState } from 'react';

export default function AchievementSystem() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements(category = 'all') {
    try {
      setLoading(true);
      const response = await fetch(`/api/achievements?category=${category}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAchievements(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  async function claimReward(achievementId: string) {
    try {
      const response = await fetch('/api/achievements/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ achievementId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Show success notification
        // Update local state
        fetchAchievements();
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  }

  // ... rest of component
}
```

---

## 🔒 Authentication Setup

### Option 1: NextAuth.js

```bash
npm install next-auth @next-auth/prisma-adapter
```

**Configure `app/api/auth/[...nextauth]/route.ts`:**

```typescript
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Add providers (Google, Discord, etc.)
  ],
  callbacks: {
    session: async ({ session, user }) => {
      session.user.id = user.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Option 2: Clerk

```bash
npm install @clerk/nextjs
```

### Option 3: Custom JWT

Use the middleware in `lib/api/middleware.ts` and implement JWT verification.

---

## 🚀 Deployment Checklist

### Database
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
```

### API Configuration
- [ ] Set up rate limiting (Redis for production)
- [ ] Configure CORS for allowed origins
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Add API analytics

### Security
- [ ] Enable HTTPS
- [ ] Set up CSP headers
- [ ] Implement API key rotation
- [ ] Add request validation middleware
- [ ] Set up DDoS protection

### Performance
- [ ] Enable API response caching
- [ ] Set up database connection pooling
- [ ] Add Redis for session storage
- [ ] Configure CDN for static assets

---

## 📊 Testing

### Unit Tests (Jest)

```typescript
import { GET } from '@/app/api/achievements/route';

describe('Achievements API', () => {
  it('should return achievements', async () => {
    const request = new Request('http://localhost/api/achievements');
    const response = await GET(request);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Integration Tests

```bash
npm install -D @playwright/test
npx playwright test
```

### Load Testing

```bash
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/achievements
```

---

## 📈 Monitoring

### Setup Application Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export function trackAPICall(endpoint: string, duration: number, status: number) {
  // Log to monitoring service
}
```

### Key Metrics to Track
- API response times
- Error rates per endpoint
- Database query performance
- Rate limit hits
- Authentication failures

---

## 🔄 WebSocket Integration (Future)

For real-time features:

```typescript
// lib/websocket.ts
import { Server } from 'socket.io';

export function initializeWebSocket(server: any) {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    // Handle trade updates
    socket.on('trade:update', (data) => {
      io.to(data.partnerId).emit('trade:update', data);
    });
    
    // Handle party updates
    socket.on('party:update', (data) => {
      io.to(`party:${data.partyId}`).emit('party:update', data);
    });
  });
  
  return io;
}
```

---

## 🎯 Performance Optimization

### API Response Caching

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 60
): Promise<T> {
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}
```

### Database Optimization

```prisma
// Add indexes for common queries
model Achievement {
  @@index([userId, category])
  @@index([isUnlocked, userId])
}

model Quest {
  @@index([userId, type])
  @@index([expiresAt])
}
```

---

## 📝 API Usage Examples

See [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for complete API reference.

### Quick Examples

```bash
# Get achievements
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/achievements?category=combat

# Claim quest reward
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questId": "quest_123"}' \
  http://localhost:3000/api/quests/claim

# Create trade
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"partnerId": "user_456", "items": [{"itemId": "sword_1", "quantity": 1}]}' \
  http://localhost:3000/api/trades/create
```

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
- Enable CORS middleware in API routes
- Check allowed origins configuration

**2. Rate Limiting**
- Adjust rate limit settings in middleware
- Use Redis for distributed rate limiting

**3. Database Connection**
- Check DATABASE_URL environment variable
- Verify Prisma client is generated: `npx prisma generate`
- Check connection pooling settings

**4. TypeScript Errors**
- Run `npm install` to ensure all types are installed
- Generate Prisma types: `npx prisma generate`

---

## 📚 Additional Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Validation](https://zod.dev/)
- [NextAuth.js](https://next-auth.js.org/)

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Status:** Ready for Database Integration
