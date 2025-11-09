// Bank/Vault System Component
// Secure storage, shared vault, item loans, withdrawal limits

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';

interface VaultItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  depositedAt: Date;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'loan' | 'interest';
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
  const [withdrawalLimit, setWithdrawalLimit] = useState(10000);
  const [withdrawnToday, setWithdrawnToday] = useState(0);
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
        setWithdrawalLimit(data.dailyLimit);
        setWithdrawnToday(data.withdrawnToday);
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

  return (
    <div className="space-y-4">
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
              dailyLimit={withdrawalLimit}
              withdrawnToday={withdrawnToday}
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
  const [showDeposit, setShowDeposit] = useState(false);
  const { pushNotification } = useMobileHUD();

  const handleWithdraw = async (itemId: string) => {
    try {
      const response = await fetch('/api/bank/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, shared }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Withdrawal Successful',
          message: 'Item moved to inventory',
          duration: 3000,
        });
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to withdraw item:', error);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  return (
    <div className="space-y-4">
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
            onClick={() => setShowDeposit(true)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
          >
            Deposit
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏦</p>
            <p>Vault is empty</p>
            <p className="text-sm mt-1">Deposit items to keep them safe!</p>
          </div>
        ) : (
          items.map((item) => (
            <VaultItemCard key={item.id} item={item} onWithdraw={() => handleWithdraw(item.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function VaultItemCard({ item, onWithdraw }: { item: VaultItem; onWithdraw: () => void }) {
  const rarityColors = {
    common: 'border-gray-500/30',
    uncommon: 'border-green-500/30',
    rare: 'border-blue-500/30',
    epic: 'border-purple-500/30',
    legendary: 'border-orange-500/30',
  };

  const daysSinceDeposit = Math.floor((new Date().getTime() - new Date(item.depositedAt).getTime()) / (1000 * 60 * 60 * 24));

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
            Stored {daysSinceDeposit}d ago
          </p>
        </div>
        <button
          onClick={onWithdraw}
          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20"
        >
          Withdraw
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
  withdrawnToday,
  onUpdate,
}: {
  balance: number;
  staked: number;
  interestRate: number;
  dailyLimit: number;
  withdrawnToday: number;
  onUpdate: () => void;
}) {
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const { pushNotification } = useMobileHUD();

  const dailyInterest = (staked * (interestRate / 100)) / 365;
  const remainingLimit = dailyLimit - withdrawnToday;

  const handleDeposit = async () => {
    try {
      const response = await fetch('/api/bank/deposit-void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Deposit Successful',
          message: `Staked ${depositAmount} VOID`,
          duration: 3000,
        });
        setDepositAmount(0);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to deposit:', error);
    }
  };

  const handleWithdraw = async () => {
    try {
      const response = await fetch('/api/bank/withdraw-void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Withdrawal Successful',
          message: `Withdrew ${withdrawAmount} VOID`,
          duration: 3000,
        });
        setWithdrawAmount(0);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Deposit */}
      <div className="p-4 bg-muted rounded-lg border border-border space-y-3">
        <h4 className="font-bold text-sm">Deposit VOID</h4>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={balance}
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
            placeholder="Amount to deposit"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary"
          />
          <button
            onClick={handleDeposit}
            disabled={depositAmount <= 0 || depositAmount > balance}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Deposit
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Available: {balance.toLocaleString()} VOID
        </p>
      </div>

      {/* Withdraw */}
      <div className="p-4 bg-muted rounded-lg border border-border space-y-3">
        <h4 className="font-bold text-sm">Withdraw VOID</h4>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={Math.min(staked, remainingLimit)}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)}
            placeholder="Amount to withdraw"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary"
          />
          <button
            onClick={handleWithdraw}
            disabled={withdrawAmount <= 0 || withdrawAmount > staked || withdrawAmount > remainingLimit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Daily limit: {withdrawnToday.toLocaleString()} / {dailyLimit.toLocaleString()} used
        </p>
      </div>
    </div>
  );
}

function HistoryView({ transactions }: { transactions: Transaction[] }) {
  const typeIcons = {
    deposit: '📥',
    withdraw: '📤',
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
                  tx.type === 'deposit' || tx.type === 'interest' ? "text-green-500" : "text-red-500"
                )}>
                  {tx.type === 'deposit' || tx.type === 'interest' ? '+' : '-'}{tx.amount} 💰
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
