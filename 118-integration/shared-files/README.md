# Shared Files - Copy These to Your Project

## Overview

These files provide the missing dependencies required by 118-integration components. **Copy each file to the specified location in your project.**

---

## Files to Copy

### 1. token-config.ts
**Copy to:** `src/lib/token-config.ts`

**Purpose:** Token addresses and configuration for USDC, ETH, VOID, PSX

**Required by:**
- 02-tipping-system/
- 09-agency-ecosystem/staking-system/
- 09-agency-ecosystem/sku-system/

**After copying:**
1. Update VOID and PSX token addresses after deployment
2. Update testnet addresses if using Base Sepolia
3. No additional changes needed

---

### 2. utils.ts
**Copy to:** `src/lib/utils.ts`

**Purpose:** Tailwind CSS class merging (`cn` function) + utility helpers

**Required by:** ALL components

**Dependencies:**
```bash
npm install clsx tailwind-merge
```

**After copying:**
- No changes needed
- Used by all shadcn/ui components

---

### 3. wagmi-config.ts
**Copy to:** `src/lib/wagmi-config.ts`

**Purpose:** Wagmi Web3 configuration for wallet connections

**Required by:**
- 04-smart-wallet/
- 02-tipping-system/
- 09-agency-ecosystem/ (all systems)

**Dependencies:**
```bash
npm install wagmi viem @coinbase/onchainkit
```

**After copying:**
1. Wrap your app with `WagmiProvider`:

```tsx
// app/layout.tsx or pages/_app.tsx
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi-config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

2. Install additional dependencies:
```bash
npm install @tanstack/react-query
```

---

### 4. mobile-layout-context.tsx
**Copy to:** `src/contexts/mobile-layout-context.tsx`

**Purpose:** Keyboard detection and safe area insets for mobile

**Required by:**
- 05-mobile-controls/

**After copying:**
1. Wrap your app with the provider:

```tsx
// app/layout.tsx
import { MobileLayoutProvider } from '@/contexts/mobile-layout-context';

export default function RootLayout({ children }) {
  return (
    <MobileLayoutProvider>
      {children}
    </MobileLayoutProvider>
  );
}
```

2. Add safe area CSS to `globals.css`:

```css
/* Support iOS safe areas (notch, home indicator) */
@supports (padding: env(safe-area-inset-top)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
```

---

### 5. use-player-state.ts
**Copy to:** `src/hooks/use-player-state.ts`

**Purpose:** Session management and player state

**Required by:**
- 04-smart-wallet/ (intro flow)
- All features that need player data

**After copying:**
1. Ensure backend routes are implemented:
   - POST /api/session/login
   - GET /api/session/me
   - POST /api/session/complete-intro
   - POST /api/session/logout

2. Use in components:

```tsx
import { usePlayerState } from '@/hooks/use-player-state';

export default function MyComponent() {
  const { address, isNew, hasCompletedIntro, completeIntro } = usePlayerState();

  if (isNew) {
    return <IntroScreen onComplete={completeIntro} />;
  }

  return <GameWorld />;
}
```

---

## Installation Checklist

- [ ] Copy all 5 files to specified locations
- [ ] Install dependencies:
  ```bash
  npm install clsx tailwind-merge wagmi viem @coinbase/onchainkit @tanstack/react-query
  ```
- [ ] Update `tsconfig.json` with path aliases (see PREREQUISITES.md)
- [ ] Wrap app with `WagmiProvider` and `MobileLayoutProvider`
- [ ] Update token addresses after deployment
- [ ] Implement backend session routes
- [ ] Add safe area CSS to `globals.css`

---

## Troubleshooting

### "Cannot find module '@/lib/utils'"
**Solution:** Check `tsconfig.json` has correct path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "cn is not defined"
**Solution:** Ensure `utils.ts` is copied to `src/lib/utils.ts` and dependencies installed

### "useAccount is not a function"
**Solution:** 
1. Install wagmi: `npm install wagmi viem`
2. Wrap app with `WagmiProvider`

### Mobile controls not detecting keyboard
**Solution:** Ensure `MobileLayoutProvider` wraps your entire app

### Session endpoints return 404
**Solution:** Implement backend routes (see SERVER-ROUTES-REFERENCE.md)

---

## Next Steps

1. Copy all files to your project
2. Install dependencies
3. Configure providers in app root
4. Update token addresses
5. Implement backend routes
6. Test each feature individually

For complete integration guide, see **PREREQUISITES.md**.
