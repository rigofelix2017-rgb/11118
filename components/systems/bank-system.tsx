// Bank/Vault System Component
// Secure storage, shared vault, item loans, withdraw; haptic(HapticPattern.LIGHT)al limits

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

interface VaultItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  deposit; haptic(HapticPattern.LIGHT)edAt: Date;
}

interface Transaction {
  id: string;
  type: 'deposit; haptic(HapticPattern.LIGHT)' | 'withdraw; haptic(HapticPattern.LIGHT)' | 'transfer' | 'loan' | 'interest';
  itemName?: string;
  amount: number;
  timestamp: Date;
  description: string;
}

export function BankSystem() {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTab, setSelectedTab] = useState<'vault' | 'currency' | 'shared' | 'history'>('vault');
  const [voidBalance, setVoidBalance] = useState(0);
  const [stakedVoid, setStakedVoid] = useState(0);
  const [interestRate, setInterestRate] = useState(5); // 5% APY
  const [withdraw; haptic(HapticPattern.LIGHT)alLimit, setWithdraw; haptic(HapticPattern.LIGHT)alLimit] = useState(10000);
  const [withdraw; haptic(HapticPattern.LIGHT)nToday, setWithdraw; haptic(HapticPattern.LIGHT)nToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBankData();
  }, [selectedTab]);

  const fetchBankData = async () => {
    try {
      setIsLoading(true);
      
      if (selectedTab === 'vault' || selectedTab === 'shared') {
        const response = await fetch(`/api/bank/${selectedTab}`);
        const data = await response.json();
        setVaultItems(data);
      }
      
      if (selectedTab === 'currency') {
        const response = await fetch('/api/bank/currency');
        const data = await response.json();
        setVoidBalance(data.balance);
        setStakedVoid(data.staked);
        setInterestRate(data.interestRate);
        setWithdraw; haptic(HapticPattern.LIGHT)alLimit(data.dailyLimit);
        setWithdraw; haptic(HapticPattern.LIGHT)nToday(data.withdraw; haptic(HapticPattern.LIGHT)nToday);
      }
      
      if (selectedTab === 'history') {
        const response = await fetch('/api/bank/transactions');
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch bank data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (`n    <MobileOptimizedWrapper title="Bank" showHeader={true}>`n      <div className="space-y-4">
      {/* Header Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedTab('vault')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
              selectedTab === 'vault'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            🔒 Personal Vault
          </button>
          <button
            onClick={() => setSelectedTab('currency')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
              selectedTab === 'currency'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            💰 VOID Staking
          </button>
          <button
            onClick={() => setSelectedTab('shared')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
              selectedTab === 'shared'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            👥 Shared Vault
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
              selectedTab === 'history'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            📜 History
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {selectedTab === 'vault' && <VaultView items={vaultItems} onUpdate={fetchBankData} />}
          {selectedTab === 'currency' && (
            <CurrencyView
              balance={voidBalance}
              staked={stakedVoid}
              interestRate={interestRate}
              dailyLimit={withdraw; haptic(HapticPattern.LIGHT)alLimit}
              withdraw; haptic(HapticPattern.LIGHT)nToday={withdraw; haptic(HapticPattern.LIGHT)nToday}
              onUpdate={fetchBankData}
            />
          )}
          {selectedTab === 'shared' && <VaultView items={vaultItems} shared onUpdate={fetchBankData} />}
          {selectedTab === 'history' && <HistoryView transactions={transactions} />}
        </>
      )}
    </div>
  );
}

function VaultView({ items, shared = false, onUpdate }: { items: VaultItem[]; shared?: boolean; onUpdate: () => void }) {
  const [showDeposit; haptic(HapticPattern.LIGHT), setShowDeposit; haptic(HapticPattern.LIGHT)] = useState(false);
  const { pushNotification } = useMobileHUD();
  const haptic = useHaptic();
  const { ref: pullRef } = usePullToRefresh(fetchBankData);

  const handleWithdraw; haptic(HapticPattern.LIGHT) = async (itemId: string) => {
    try {
      const response = await fetch('/api/bank/withdraw; haptic(HapticPattern.LIGHT)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, shared }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Withdraw; haptic(HapticPattern.LIGHT)al Successful',
          message: 'Item moved to inventory',
          duration: 3000,
        });
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to withdraw; haptic(HapticPattern.LIGHT) item:', error);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  return (`n    <MobileOptimizedWrapper title="Bank" showHeader={true}>`n      <div className="space-y-4">
      {/* Stats */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{shared ? 'Shared Vault' : 'Personal Vault'}</p>
            <p className="text-xs text-muted-foreground">
              {items.length} items • Total value: {totalValue.toLocaleString()} 💰
            </p>
          </div>
          <button
            onClick={() => setShowDeposit; haptic(HapticPattern.LIGHT)(true)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
          >
            Deposit; haptic(HapticPattern.LIGHT)
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏦</p>
            <p>Vault is empty</p>
            <p className="text-sm mt-1">Deposit; haptic(HapticPattern.LIGHT) items to keep them safe!</p>
          </div>
        ) : (
          items.map((item) => (
            <VaultItemCard key={item.id} item={item} onWithdraw; haptic(HapticPattern.LIGHT)={() => handleWithdraw; haptic(HapticPattern.LIGHT)(item.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function VaultItemCard({ item, onWithdraw; haptic(HapticPattern.LIGHT) }: { item: VaultItem; onWithdraw; haptic(HapticPattern.LIGHT): () => void }) {
  const rarityColors = {
    common: 'border-gray-500/30',
    uncommon: 'border-green-500/30',
    rare: 'border-blue-500/30',
    epic: 'border-purple-500/30',
    legendary: 'border-orange-500/30',
  };

  const daysSinceDeposit; haptic(HapticPattern.LIGHT) = Math.floor((new Date().getTime() - new Date(item.deposit; haptic(HapticPattern.LIGHT)edAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={cn("p-3 rounded-lg border-2", rarityColors[item.rarity], "bg-muted")}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{item.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-bold">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            x{item.quantity} • {item.value.toLocaleString()} 💰 each
          </p>
          <p className="text-xs text-muted-foreground">
            Stored {daysSinceDeposit; haptic(HapticPattern.LIGHT)}d ago
          </p>
        </div>
        <button
          onClick={onWithdraw; haptic(HapticPattern.LIGHT)}
          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20"
        >
          Withdraw; haptic(HapticPattern.LIGHT)
        </button>
      </div>
    </div>
  );
}

function CurrencyView({
  balance,
  staked,
  interestRate,
  dailyLimit,
  withdraw; haptic(HapticPattern.LIGHT)nToday,
  onUpdate,
}: {
  balance: number;
  staked: number;
  interestRate: number;
  dailyLimit: number;
  withdraw; haptic(HapticPattern.LIGHT)nToday: number;
  onUpdate: () => void;
}) {
  const [deposit; haptic(HapticPattern.LIGHT)Amount, setDeposit; haptic(HapticPattern.LIGHT)Amount] = useState(0);
  const [withdraw; haptic(HapticPattern.LIGHT)Amount, setWithdraw; haptic(HapticPattern.LIGHT)Amount] = useState(0);
  const { pushNotification } = useMobileHUD();
  const haptic = useHaptic();
  const { ref: pullRef } = usePullToRefresh(fetchBankData);

  const dailyInterest = (staked * (interestRate / 100)) / 365;
  const remainingLimit = dailyLimit - withdraw; haptic(HapticPattern.LIGHT)nToday;

  const handleDeposit; haptic(HapticPattern.LIGHT) = async () => {
    try {
      const response = await fetch('/api/bank/deposit; haptic(HapticPattern.LIGHT)-void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: deposit; haptic(HapticPattern.LIGHT)Amount }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Deposit; haptic(HapticPattern.LIGHT) Successful',
          message: `Staked ${deposit; haptic(HapticPattern.LIGHT)Amount} VOID`,
          duration: 3000,
        });
        setDeposit; haptic(HapticPattern.LIGHT)Amount(0);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to deposit; haptic(HapticPattern.LIGHT):', error);
    }
  };

  const handleWithdraw; haptic(HapticPattern.LIGHT) = async () => {
    try {
      const response = await fetch('/api/bank/withdraw; haptic(HapticPattern.LIGHT)-void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdraw; haptic(HapticPattern.LIGHT)Amount }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Withdraw; haptic(HapticPattern.LIGHT)al Successful',
          message: `Withdrew ${withdraw; haptic(HapticPattern.LIGHT)Amount} VOID`,
          duration: 3000,
        });
        setWithdraw; haptic(HapticPattern.LIGHT)Amount(0);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to withdraw; haptic(HapticPattern.LIGHT):', error);
    }
  };

  return (`n    <MobileOptimizedWrapper title="Bank" showHeader={true}>`n      <div className="space-y-4">
      {/* Staking Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-muted rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Staked Balance</p>
          <p className="text-2xl font-bold">{staked.toLocaleString()} 💰</p>
        </div>
        <div className="p-4 bg-muted rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Daily Interest</p>
          <p className="text-2xl font-bold text-green-500">+{dailyInterest.toFixed(2)} 💰</p>
        </div>
        <div className="p-4 bg-muted rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">APY</p>
          <p className="text-xl font-bold">{interestRate}%</p>
        </div>
        <div className="p-4 bg-muted rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Available Today</p>
          <p className="text-xl font-bold">{remainingLimit.toLocaleString()} 💰</p>
        </div>
      </div>

      {/* Deposit; haptic(HapticPattern.LIGHT) */}
      <div className="p-4 bg-muted rounded-lg border border-border space-y-3">
        <h4 className="font-bold text-sm">Deposit; haptic(HapticPattern.LIGHT) VOID</h4>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={balance}
            value={deposit; haptic(HapticPattern.LIGHT)Amount}
            onChange={(e) => setDeposit; haptic(HapticPattern.LIGHT)Amount(parseInt(e.target.value) || 0)}
            placeholder="Amount to deposit; haptic(HapticPattern.LIGHT)"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary"
          />
          <button
            onClick={handleDeposit; haptic(HapticPattern.LIGHT)}
            disabled={deposit; haptic(HapticPattern.LIGHT)Amount <= 0 || deposit; haptic(HapticPattern.LIGHT)Amount > balance}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Deposit; haptic(HapticPattern.LIGHT)
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Available: {balance.toLocaleString()} VOID
        </p>
      </div>

      {/* Withdraw; haptic(HapticPattern.LIGHT) */}
      <div className="p-4 bg-muted rounded-lg border border-border space-y-3">
        <h4 className="font-bold text-sm">Withdraw; haptic(HapticPattern.LIGHT) VOID</h4>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={Math.min(staked, remainingLimit)}
            value={withdraw; haptic(HapticPattern.LIGHT)Amount}
            onChange={(e) => setWithdraw; haptic(HapticPattern.LIGHT)Amount(parseInt(e.target.value) || 0)}
            placeholder="Amount to withdraw; haptic(HapticPattern.LIGHT)"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary"
          />
          <button
            onClick={handleWithdraw; haptic(HapticPattern.LIGHT)}
            disabled={withdraw; haptic(HapticPattern.LIGHT)Amount <= 0 || withdraw; haptic(HapticPattern.LIGHT)Amount > staked || withdraw; haptic(HapticPattern.LIGHT)Amount > remainingLimit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Withdraw; haptic(HapticPattern.LIGHT)
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Daily limit: {withdraw; haptic(HapticPattern.LIGHT)nToday.toLocaleString()} / {dailyLimit.toLocaleString()} used
        </p>
      </div>
    </div>
  );
}

function HistoryView({ transactions }: { transactions: Transaction[] }) {
  const typeIcons = {
    deposit; haptic(HapticPattern.LIGHT): '📥',
    withdraw; haptic(HapticPattern.LIGHT): '📤',
    transfer: '🔄',
    loan: '🤝',
    interest: '💹',
  };

  return (
    <div className="space-y-2">
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">📜</p>
          <p>No transaction history</p>
        </div>
      ) : (
        transactions.map((tx) => (
          <div key={tx.id} className="p-3 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{typeIcons[tx.type]}</span>
                <div>
                  <p className="text-sm font-medium capitalize">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-bold",
                  tx.type === 'deposit; haptic(HapticPattern.LIGHT)' || tx.type === 'interest' ? "text-green-500" : "text-red-500"
                )}>
                  {tx.type === 'deposit; haptic(HapticPattern.LIGHT)' || tx.type === 'interest' ? '+' : '-'}{tx.amount} 💰
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
