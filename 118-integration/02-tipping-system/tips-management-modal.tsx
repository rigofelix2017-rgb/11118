import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTippingContract, ReceivedTip } from '@/lib/tipping-contract';
// Utility function moved inline since web3 utils removed
const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
import { ExternalLink, Coins, TrendingUp, Users } from 'lucide-react';

interface TipsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerAddress: string;
  players: Array<{ walletAddress: string; displayName: string }>;
}

interface TokenBalance {
  symbol: string;
  amount: string;
  tokenAddress: string;
}

export function TipsManagementModal({ 
  isOpen, 
  onClose, 
  currentPlayerAddress,
  players 
}: TipsManagementModalProps) {
  const [receivedTips, setReceivedTips] = useState<ReceivedTip[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();
  const { contract: tippingContract, isInitialized, isConnected } = useTippingContract();

  const loadTipsData = async () => {
    if (!currentPlayerAddress) return;
    
    if (!isInitialized || !isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to view tip history.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Loading tips data for player:', currentPlayerAddress);
    setLoading(true);
    try {
      // Get received tips from events
      console.log('Calling getReceivedTips...');
      const tips = await tippingContract.getReceivedTips(currentPlayerAddress);
      console.log('Received tips:', tips);
      
      // Add player names to tips
      const tipsWithNames = tips.map(tip => {
        const fromPlayer = players.find(p => p.walletAddress.toLowerCase() === tip.from.toLowerCase());
        return {
          ...tip,
          fromName: fromPlayer?.displayName || truncateAddress(tip.from)
        };
      });
      
      // Group tips by token and calculate balances for each token type
      const tokenBalanceMap = new Map<string, { amount: number; symbol: string; tokenAddress: string }>();
      
      tips.forEach(tip => {
        const tokenKey = tip.token || '0x0'; // Use '0x0' for ETH
        const symbol = tip.tokenSymbol || 'ETH';
        const amount = parseFloat(tip.amount);
        
        if (tokenBalanceMap.has(tokenKey)) {
          tokenBalanceMap.get(tokenKey)!.amount += amount;
        } else {
          tokenBalanceMap.set(tokenKey, {
            amount: amount,
            symbol: symbol,
            tokenAddress: tip.token || '0x0'
          });
        }
      });
      
      // Convert map to array for display
      const balances = Array.from(tokenBalanceMap.values()).map(balance => ({
        symbol: balance.symbol,
        amount: balance.amount.toFixed(4),
        tokenAddress: balance.tokenAddress
      }));
      
      setTokenBalances(balances);
      setReceivedTips(tipsWithNames);
      
    } catch (error) {
      console.error('Failed to load tips data:', error);
      toast({
        title: 'Error',
        description: 'Could not load tip history. This is normal if you haven\'t received tips yet.',
        variant: 'default',
      });
      // Set empty state instead of failing
      setReceivedTips([]);
      setTokenBalances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTipsData();
    }
  }, [isOpen, currentPlayerAddress]);

  const handleWithdraw = async () => {
    const hasBalance = tokenBalances.some(balance => parseFloat(balance.amount) > 0);
    if (!hasBalance) return;
    
    if (!isInitialized || !isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to withdraw tokens.',
        variant: 'destructive',
      });
      return;
    }
    
    setWithdrawing(true);
    try {
      const txHash = await tippingContract.withdrawAllTokens();
      
      toast({
        title: '💰 Withdrawal Submitted!',
        description: `Transaction: ${txHash.slice(0, 10)}...`,
      });
      
      // Reset balances and refresh data after withdrawal
      setTokenBalances([]);
      setTimeout(() => {
        loadTipsData();
      }, 3000);
      
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast({
        title: 'Withdrawal Failed',
        description: 'Failed to withdraw tips. Make sure you have Base ETH for gas.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const openTransaction = (txHash: string) => {
    window.open(`https://basescan.org/tx/${txHash}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-retro-black border-2 border-retro-green text-retro-green font-mono">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-retro-green flex items-center gap-2">
            💰 MY TIPS
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-retro-cyan">Loading tips data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance Section */}
            <div className="bg-retro-black border border-retro-green p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-retro-cyan flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Your Balance
                </h3>
                {tokenBalances.some(balance => parseFloat(balance.amount) > 0) && (
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="bg-retro-green text-retro-black hover:bg-retro-cyan font-mono font-bold"
                    data-testid="button-withdraw-tips"
                  >
                    {withdrawing ? 'Withdrawing...' : 'Withdraw All'}
                  </Button>
                )}
              </div>
              
              {tokenBalances.length === 0 ? (
                <div className="text-center py-4 text-retro-cyan">
                  No tokens received yet
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-retro-cyan text-xs text-center">YOUR TOKEN BALANCES</div>
                  {tokenBalances.map((balance, index) => (
                    <div key={balance.tokenAddress} className="flex justify-between items-center bg-retro-black border border-retro-green/30 rounded p-2">
                      <div className="text-sm font-bold text-retro-cyan">
                        {balance.symbol}
                      </div>
                      <div className="text-lg font-bold text-retro-green">
                        {balance.amount}
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2 border-t border-retro-green/30">
                    <div className="text-retro-cyan text-xs">TOTAL TIPS</div>
                    <div className="text-lg font-bold">
                      {receivedTips.length}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Tips */}
            <div>
              <h3 className="text-lg font-bold text-retro-cyan mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Tips
              </h3>
              
              {receivedTips.length === 0 ? (
                <div className="text-center py-6 text-retro-cyan">
                  No tips received yet. Start interacting with other players!
                </div>
              ) : (
                <ScrollArea className="h-[200px] border border-retro-green rounded p-2">
                  <div className="space-y-2">
                    {receivedTips.slice(0, 10).map((tip, index) => (
                      <div key={`${tip.txHash}-${index}`}>
                        <div className="flex justify-between items-start py-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-retro-cyan" />
                              <span className="font-bold">{tip.fromName}</span>
                              <span className="text-retro-cyan">tipped you</span>
                              <span className="font-bold text-retro-green">{tip.amount} {tip.tokenSymbol || 'ETH'}</span>
                            </div>
                            {tip.message && (
                              <div className="text-xs text-retro-cyan mt-1 ml-6">
                                "{tip.message}"
                              </div>
                            )}
                            <div className="text-xs text-retro-cyan mt-1 ml-6">
                              {formatTimestamp(tip.timestamp)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTransaction(tip.txHash)}
                            className="text-retro-cyan hover:text-retro-green"
                            data-testid={`button-view-transaction-${index}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        {index < receivedTips.length - 1 && <Separator className="bg-retro-green" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                className="bg-retro-black border-2 border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black font-mono font-bold"
                data-testid="button-close-tips-modal"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}