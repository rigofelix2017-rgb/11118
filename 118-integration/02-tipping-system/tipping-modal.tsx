import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTippingContract } from '@/lib/tipping-contract';
import { Token, tokenManager } from '@/lib/token-config';
import { Coins } from 'lucide-react';
import { useUISounds } from '@/hooks/use-ui-sounds';

interface TippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
  recipientName: string;
}

const QUICK_TIP_AMOUNTS = ['0.001', '0.01', '0.1'];

export function TippingModal({ isOpen, onClose, recipientAddress, recipientName }: TippingModalProps) {
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { toast } = useToast();
  const { contract: tippingContract, isInitialized, isConnected } = useTippingContract();
  const { playModalOpen, playModalClose, playButtonClick, playTabSwitch } = useUISounds();

  const tipAmount = selectedAmount || customAmount;

  const handleQuickTip = (amount: string) => {
    playButtonClick();
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount('');
  };

  const handleCloseModal = () => {
    playModalClose();
    onClose();
  };

  // Play modal open sound when modal opens
  useEffect(() => {
    if (isOpen) {
      playModalOpen();
    }
  }, [isOpen, playModalOpen]);

  // Load available tokens when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadTokens = async () => {
        try {
          // Try to sync tokens from contract (may fail for embedded wallets)
          if (isInitialized && isConnected) {
            await tippingContract.syncTokenAllowlist();
          }
          const tokens = tokenManager.getAllTokens();
          setAvailableTokens(tokens);
          
          // Default to ETH if available
          const ethToken = tokens.find(t => t.isNative);
          if (ethToken) {
            setSelectedToken(ethToken);
          } else if (tokens.length > 0) {
            setSelectedToken(tokens[0]);
          }
        } catch (error) {
          console.error('Failed to load tokens:', error);
          // Fallback to ETH only
          const ethToken = tokenManager.getTokenBySymbol('ETH');
          if (ethToken) {
            setAvailableTokens([ethToken]);
            setSelectedToken(ethToken);
          }
        }
      };
      
      loadTokens();
    }
  }, [isOpen]);

  // Load user balance when token changes
  useEffect(() => {
    if (selectedToken && isOpen) {
      const loadBalance = async () => {
        setLoadingBalance(true);
        try {
          // Check if we can call contract methods (external wallets)
          if (isInitialized && isConnected) {
            const balance = await tippingContract.getTokenBalance(selectedToken);
            setUserBalance(balance);
          } else {
            // For embedded wallets or when not fully connected, skip balance check
            setUserBalance('--'); // Show placeholder instead of 0
          }
        } catch (error) {
          console.error('Failed to load balance:', error);
          // For embedded wallets, this is expected - show placeholder
          setUserBalance('--');
        } finally {
          setLoadingBalance(false);
        }
      };
      
      loadBalance();
    }
  }, [selectedToken, isOpen, isInitialized, isConnected]);

  const handleTokenChange = (tokenAddress: string) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setSelectedToken(token);
      // Reset amounts when changing tokens
      setSelectedAmount('');
      setCustomAmount('');
    }
  };

  const handleSendTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid tip amount',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedToken) {
      toast({
        title: 'No Token Selected',
        description: 'Please select a token to tip',
        variant: 'destructive',
      });
      return;
    }

    // Check if user has enough balance (skip check for embedded wallets)
    if (userBalance !== '--') {
      const userBalanceNum = parseFloat(userBalance);
      const tipAmountNum = parseFloat(tipAmount);
      if (tipAmountNum > userBalanceNum) {
        toast({
          title: 'Insufficient Balance',
          description: `You only have ${userBalance} ${selectedToken.symbol} available`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const txHash = await tippingContract.tipToken(selectedToken, recipientAddress, tipAmount, message);
      
      toast({
        title: 'Tip Sent! 🪙',
        description: `Sent ${tipAmount} ${selectedToken.symbol} to ${recipientName}`,
      });

      // Reset form and close modal
      setSelectedAmount('');
      setCustomAmount('');
      setMessage('');
      handleCloseModal();
      
    } catch (error: any) {
      console.error('Tip failed:', error);
      toast({
        title: 'Tip Failed',
        description: error.message || 'Failed to send tip',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="bg-retro-black border-2 border-retro-green text-retro-green font-mono max-w-md">
        <DialogHeader>
          <DialogTitle className="text-retro-green font-mono text-lg">
            💰 TIP PLAYER
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="border border-retro-green/30 p-3 rounded">
            <div className="text-xs text-retro-cyan">RECIPIENT:</div>
            <div className="text-retro-green font-bold">{recipientName}</div>
            <div className="text-xs text-retro-green/70">{recipientAddress}</div>
          </div>

          {/* Token Selection */}
          <div>
            <div className="text-sm text-retro-cyan mb-2">TOKEN TO TIP:</div>
            <Select value={selectedToken?.address || ''} onValueChange={handleTokenChange}>
              <SelectTrigger className="bg-retro-black border-2 border-retro-green text-retro-green font-mono" data-testid="select-token">
                <SelectValue placeholder="Select token..." />
              </SelectTrigger>
              <SelectContent className="bg-retro-black border-retro-green text-retro-green font-mono">
                {availableTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address} className="font-mono">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      <span>{token.symbol}</span>
                      <span className="text-retro-cyan">- {token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* User Balance */}
            {selectedToken && (
              <div className="mt-2 text-xs text-retro-cyan">
                Your balance: {loadingBalance ? 'Loading...' : `${userBalance} ${selectedToken.symbol}`}
              </div>
            )}
          </div>

          {/* Quick Tip Buttons */}
          {selectedToken && (
            <div>
              <div className="text-sm text-retro-cyan mb-2">QUICK TIP:</div>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_TIP_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => handleQuickTip(amount)}
                    className={`retro-button px-3 py-2 text-sm font-mono ${
                      selectedAmount === amount
                        ? 'bg-retro-green text-retro-black'
                        : 'bg-retro-black border-2 border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-black'
                    }`}
                    data-testid={`button-quick-tip-${amount}`}
                  >
                    {amount} {selectedToken.symbol}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          {selectedToken && (
            <div>
              <div className="text-sm text-retro-cyan mb-2">CUSTOM AMOUNT:</div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="0.001"
                  className="bg-retro-black border-2 border-retro-green text-retro-green placeholder:text-retro-green/50 font-mono pr-16"
                  data-testid="input-custom-amount"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-retro-green text-sm">
                  {selectedToken.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <div className="text-sm text-retro-cyan mb-2">MESSAGE (OPTIONAL):</div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something nice..."
              maxLength={100}
              className="bg-retro-black border-2 border-retro-green text-retro-green placeholder:text-retro-green/50 font-mono resize-none"
              rows={3}
              data-testid="textarea-tip-message"
            />
            <div className="text-xs text-retro-green/70 mt-1">
              {message.length}/100 characters
            </div>
          </div>

          {/* Total */}
          {selectedToken && (
            <div className="border border-retro-green/30 p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-retro-cyan">TOTAL:</span>
                <span className="text-retro-green font-bold text-lg">
                  {tipAmount || '0'} {selectedToken.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCloseModal}
              className="flex-1 retro-button bg-retro-black border-2 border-retro-green/50 text-retro-green/70 hover:bg-retro-green/10 font-mono"
              data-testid="button-cancel-tip"
            >
              CANCEL
            </Button>
            <Button
              onClick={() => {
                playButtonClick();
                handleSendTip();
              }}
              disabled={!tipAmount || parseFloat(tipAmount) <= 0 || isLoading}
              className="flex-1 retro-button bg-retro-green text-retro-black hover:bg-retro-green/80 font-mono font-bold"
              data-testid="button-send-tip"
            >
              {isLoading ? 'SENDING...' : 'SEND TIP 🪙'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}