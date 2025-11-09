// Achievement System Component
// Handles achievement tracking, progress, unlocks, and rewards

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
