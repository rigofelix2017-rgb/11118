# Mobile Optimization Script for All Systems
$systems = @(
    "quest-system",
    "leaderboards-system",
    "emote-system",
    "bank-system",
    "trading-system",
    "crafting-system",
    "auction-house",
    "photo-mode",
    "party-system",
    "event-calendar"
)

foreach ($system in $systems) {
    $file = "components\systems\$system.tsx"
    if (-not (Test-Path $file)) {
        Write-Host "Skipping $system - file not found"
        continue
    }
    
    Write-Host "Processing $system..."
    $content = Get-Content $file -Raw
    
    # Check if already optimized
    if ($content -match "MobileOptimizedWrapper") {
        Write-Host "  Already optimized, skipping"
        continue
    }
    
    # Add mobile imports
    $imports = @"
import { 
  MobileOptimizedWrapper, 
  MobileButton, 
  MobileInput 
} from '@/components/mobile/MobileOptimizedComponents';
import { useHaptic, usePullToRefresh } from '@/lib/mobile-optimization-hooks';
import { HapticPattern } from '@/lib/mobile-optimization';
"@
    $content = $content -replace "(import { useMobileHUD } from '@/lib/mobile-hud-context';)", "`$1`n$imports"
    
    # Add hooks
    if ($content -match 'const \{ pushNotification') {
        $content = $content -replace '(const \{ pushNotification[^}]*\} = useMobileHUD\(\);)', "`$1`n  const haptic = useHaptic();"
    } elseif ($content -match 'useMobileHUD\(\)') {
        $content = $content -replace '(const [^\n]* = useMobileHUD\(\);)', "`$1`n  const haptic = useHaptic();"
    }
    
    # Replace inputs
    $content = $content -replace '<input\s+type="text"\s+placeholder="([^"]*)"\s+value=\{([^\}]*)\}\s+onChange=\{([^\}]*)\}\s+className="[^"]*"\s*\/>', '<MobileInput type="text" placeholder="$1" value={$2} onChange={$3} />'
    
    # Replace standard buttons with MobileButton (simple cases)
    $content = $content -replace '<button\s+onClick=\{([^\}]*)\}\s+className="([^"]*)"\s*>', '<MobileButton onClick={$1} className="$2">'
    $content = $content -replace '</button>', '</MobileButton>'
    
    Write-Host "  Mobile features added"
    $content | Set-Content $file -NoNewline
}

Write-Host "`nCompleted automated optimization pass"
