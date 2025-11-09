import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Wallet, ArrowRight, RefreshCw, DollarSign, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'react-qr-code';
import { ethers } from 'ethers';
import { ERC20_ABI, WELL_KNOWN_TOKENS } from '@/lib/token-config';

interface WalletOnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  walletAddress: string;
}

type OnboardingStep = 'deposit' | 'approvals' | 'complete';

interface StepStatus {
  deposit: boolean;
  jukeboxApproval: boolean;
  tippingApprovals: boolean;
}

// Contract addresses
const JUKEBOX_CONTRACT_ADDRESS = '0x5026a8ff0CF9c29CDd17661a2E09Fd3417c05311';
const TIPPING_CONTRACT_ADDRESS = '0xfD81b26d6a2F555E3B9613e478FD0DF27d3a168C';

// Max approval amount (effectively unlimited)
const MAX_APPROVAL = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

export function WalletOnboardingFlow({ 
  open, 
  onOpenChange, 
  onComplete, 
  walletAddress 
}: WalletOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('deposit');
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    deposit: false,
    jukeboxApproval: false,
    tippingApprovals: false,
  });
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isApproving, setIsApproving] = useState<{
    jukebox: boolean;
    tipping: boolean;
  }>({
    jukebox: false,
    tipping: false,
  });
  const { toast } = useToast();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Auto-refresh balance every 10 seconds when on deposit step
  useEffect(() => {
    if (currentStep === 'deposit' && open) {
      checkBalance();
      const interval = setInterval(checkBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [currentStep, open, walletAddress]);

  const checkBalance = async () => {
    if (!walletAddress) return;
    
    setIsCheckingBalance(true);
    try {
      // Using public Base RPC to check balance
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const balance = await provider.getBalance(walletAddress);
      const ethAmount = ethers.formatEther(balance);
      setEthBalance(ethAmount);
      
      // If balance > 0 and not already marked as deposited, mark as complete
      if (parseFloat(ethAmount) > 0 && !stepStatus.deposit) {
        setStepStatus(prev => ({ ...prev, deposit: true }));
        toast({
          title: "ETH Deposit Detected!",
          description: `${parseFloat(ethAmount).toFixed(4)} ETH deposited successfully`,
        });
        
        // Small delay then move to approvals
        setTimeout(() => {
          setCurrentStep('approvals');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const approveToken = async (tokenAddress: string, spenderAddress: string, tokenSymbol: string): Promise<boolean> => {
    if (!walletClient) {
      toast({
        title: "Wallet Error",
        description: "Wallet not connected",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Use the embedded wallet client to send transaction
      if (!walletClient.account) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction data for ERC20 approve
      const approveData = ethers.Interface.from(ERC20_ABI).encodeFunctionData('approve', [spenderAddress, MAX_APPROVAL]);
      
      // Send transaction using wallet client (embedded wallet)
      const hash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data: approveData as `0x${string}`,
        account: walletClient.account,
        chain: walletClient.chain,
      });
      
      toast({
        title: "Transaction Sent",
        description: `Approving ${tokenSymbol}... Please wait for confirmation.`,
      });

      // Wait for confirmation using public client
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast({
        title: "Approval Successful",
        description: `${tokenSymbol} approved for unlimited spending`,
      });

      return true;
    } catch (error) {
      console.error(`Error approving ${tokenSymbol}:`, error);
      toast({
        title: "Approval Failed",
        description: `Failed to approve ${tokenSymbol}. Please try again.`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleJukeboxApproval = async () => {
    setIsApproving(prev => ({ ...prev, jukebox: true }));
    
    try {
      const usdcToken = WELL_KNOWN_TOKENS.find(token => token.symbol === 'USDC');
      if (!usdcToken) {
        throw new Error('USDC token not found');
      }

      const success = await approveToken(usdcToken.address, JUKEBOX_CONTRACT_ADDRESS, 'USDC');
      
      if (success) {
        setStepStatus(prev => ({ ...prev, jukeboxApproval: true }));
        checkAllApprovalsComplete();
      }
    } finally {
      setIsApproving(prev => ({ ...prev, jukebox: false }));
    }
  };

  const handleTippingApprovals = async () => {
    setIsApproving(prev => ({ ...prev, tipping: true }));
    
    try {
      const tokens = ['USDC', 'PSX'];
      let allSuccessful = true;

      for (const tokenSymbol of tokens) {
        const token = WELL_KNOWN_TOKENS.find(t => t.symbol === tokenSymbol);
        if (!token) {
          console.warn(`${tokenSymbol} token not found`);
          continue;
        }

        const success = await approveToken(token.address, TIPPING_CONTRACT_ADDRESS, tokenSymbol);
        if (!success) {
          allSuccessful = false;
        }
      }

      // Note: ETH doesn't need approval as it's native
      if (allSuccessful) {
        setStepStatus(prev => ({ ...prev, tippingApprovals: true }));
        toast({
          title: "All Approvals Complete",
          description: "USDC, PSX, and ETH are ready for tipping",
        });
        checkAllApprovalsComplete();
      }
    } finally {
      setIsApproving(prev => ({ ...prev, tipping: false }));
    }
  };

  const checkAllApprovalsComplete = () => {
    setTimeout(() => {
      const currentStatus = stepStatus;
      if (currentStatus.jukeboxApproval && currentStatus.tippingApprovals) {
        setCurrentStep('complete');
        // Auto-advance after 5 seconds if user doesn't click the button
        setTimeout(() => {
          if (currentStep === 'complete') {
            onComplete();
            onOpenChange(false);
          }
        }, 5000);
      }
    }, 100);
  };

  const skipForNow = () => {
    onComplete();
    onOpenChange(false);
  };

  const currentProgress = 
    stepStatus.deposit && stepStatus.jukeboxApproval && stepStatus.tippingApprovals ? 100 :
    stepStatus.deposit && (stepStatus.jukeboxApproval || stepStatus.tippingApprovals) ? 75 :
    stepStatus.deposit ? 50 : 25;

  const renderDepositStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-500/20 rounded-full">
          <Wallet className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Fund Your Wallet</h3>
          <p className="text-gray-400">
            Deposit ETH to your embedded wallet to start playing and tipping
          </p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-white">Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-2 sm:p-4 bg-white rounded-lg">
            <div className="max-w-[150px] sm:max-w-[180px] md:max-w-[200px] w-full">
              <QRCode 
                value={walletAddress} 
                size={200}
                style={{
                  height: "auto",
                  maxWidth: "100%",
                  width: "100%",
                }}
                data-testid="qr-code-wallet" 
              />
            </div>
          </div>
          
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-gray-400">Or copy your wallet address:</p>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-700 rounded-lg overflow-hidden min-w-0">
              <code className="flex-1 text-xs sm:text-sm text-white truncate min-w-0 block" data-testid="text-wallet-address">
                {walletAddress}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyAddress}
                className="h-8 w-8 p-0 flex-shrink-0"
                data-testid="button-copy-address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Current Balance:</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={parseFloat(ethBalance) > 0 ? "default" : "secondary"}
                  data-testid="badge-eth-balance"
                >
                  {parseFloat(ethBalance).toFixed(4)} ETH
                </Badge>
                {isCheckingBalance && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkBalance}
              disabled={isCheckingBalance}
              className="w-full"
              data-testid="button-refresh-balance"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingBalance ? 'animate-spin' : ''}`} />
              Refresh Balance
            </Button>
          </div>
        </CardContent>
      </Card>

      {parseFloat(ethBalance) > 0 && (
        <div className="text-center">
          <p className="text-green-400 mb-4">✅ ETH detected! Moving to contract approvals...</p>
        </div>
      )}
    </div>
  );

  const renderApprovalsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-500/20 rounded-full">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Approve Contracts</h3>
          <p className="text-gray-400">
            Grant permissions for seamless in-game transactions
          </p>
        </div>
      </div>

      <div className="space-y-4 min-w-0">
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white truncate">Jukebox Contract</h4>
                <p className="text-sm text-gray-400 break-words">Approve unlimited USDC for song purchases</p>
              </div>
              <Button 
                onClick={handleJukeboxApproval}
                disabled={stepStatus.jukeboxApproval || isApproving.jukebox}
                className="flex-shrink-0 whitespace-nowrap"
                data-testid="button-approve-jukebox"
              >
                {isApproving.jukebox ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </div>
                ) : stepStatus.jukeboxApproval ? (
                  '✅ Approved'
                ) : (
                  'Approve USDC'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white truncate">Tipping Contract</h4>
                <p className="text-sm text-gray-400 break-words">Approve unlimited USDC, PSX, and ETH for tips</p>
              </div>
              <Button 
                onClick={handleTippingApprovals}
                disabled={stepStatus.tippingApprovals || isApproving.tipping}
                className="flex-shrink-0 whitespace-nowrap"
                data-testid="button-approve-tipping"
              >
                {isApproving.tipping ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </div>
                ) : stepStatus.tippingApprovals ? (
                  '✅ Approved'
                ) : (
                  'Approve USDC, PSX, ETH'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={skipForNow} className="flex-1" data-testid="button-skip">
          Skip for Now
        </Button>
        <Button 
          onClick={() => setCurrentStep('complete')}
          disabled={!stepStatus.jukeboxApproval || !stepStatus.tippingApprovals}
          className="flex-1"
          data-testid="button-continue"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-500/20 rounded-full">
        <Check className="w-8 h-8 text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white">Setup Complete!</h3>
        <p className="text-gray-400">
          Your wallet is ready for the game. Welcome aboard!
        </p>
      </div>
      <Button
        onClick={() => {
          onComplete();
          onOpenChange(false);
        }}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        data-testid="button-continue-to-game"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Continue to Game
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        skipForNow();
      }
    }}>
      <DialogContent 
        className="vintage-panel-raised max-w-lg w-[95vw] sm:w-full overflow-hidden"
      >
        <DialogHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-cyan-400" />
            <DialogTitle className="text-xl font-bold vintage-text-3d text-cyan-400">
              Wallet Setup
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Complete your wallet setup to start playing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-2 overflow-x-hidden">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Progress</span>
              <span>{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" data-testid="progress-onboarding" />
          </div>

          {/* Step Content */}
          {currentStep === 'deposit' && renderDepositStep()}
          {currentStep === 'approvals' && renderApprovalsStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}