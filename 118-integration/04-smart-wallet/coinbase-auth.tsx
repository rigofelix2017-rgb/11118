import { useState, useEffect } from 'react';
import { useSignInWithEmail, useVerifyEmailOTP, useSignOut } from "@coinbase/cdp-hooks";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mail, Shield, Loader2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletOnboardingFlow } from './wallet-onboarding-flow';
import { useQuery } from '@tanstack/react-query';

interface CoinbaseAuthProps {
  onAuthenticated: (walletAddress: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserStatusResponse {
  isNewUser: boolean;
}

export function CoinbaseAuth({ onAuthenticated, open, onOpenChange }: CoinbaseAuthProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { signOut } = useSignOut();
  const [flowId, setFlowId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'choose' | 'wallet' | 'email'>('email');
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  // Check if user is first-time
  const { data: userStatus, isLoading: isCheckingUserStatus } = useQuery<UserStatusResponse>({
    queryKey: ['/api/wallet/is-new', address],
    enabled: !!address && isConnected,
    staleTime: 0, // Always fresh check
  });


  // Auto-trigger authentication callback when wallet is ready
  useEffect(() => {
    if (isConnected && address && userStatus && !isCheckingUserStatus) {
      // Use setTimeout to avoid React warning about state updates during render
      setTimeout(() => {
        toast({
          title: "Wallet connected successfully!",
          description: "Your embedded wallet is ready to use",
        });
      }, 0);

      // Check if this is a first-time user
      if (userStatus?.isNewUser) {
        // Show onboarding flow for new users
        setShowOnboarding(true);
        onOpenChange(false); // Close the auth modal
      } else {
        // Direct to main app for returning users
        onAuthenticated(address);
        onOpenChange(false); // Close the modal
      }
    }
  }, [isConnected, address, userStatus, isCheckingUserStatus, onAuthenticated, onOpenChange, toast]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    if (address) {
      onAuthenticated(address);
    }
    setShowOnboarding(false);
  };

  // Hide auth UI when authenticated and not showing onboarding
  if (isConnected && address && !showOnboarding && userStatus && !isCheckingUserStatus) {
    return null;
  }

  const handleEmailSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setTimeout(() => {
        toast({
          title: "Verification code sent",
          description: `Check your email at ${email} for the 6-digit code`,
        });
      }, 0);
    } catch (error) {
      console.error("Email sign in failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send verification code";
      setError(errorMessage);
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!flowId || !otp) return;
    
    // If already connected, don't attempt verification
    if (isConnected && address) {
      setError("You're already signed in with this wallet. Close this dialog to continue.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await verifyEmailOTP({ flowId, otp });
      console.log("Signed in with Coinbase wallet!", user.evmAccounts?.[0]);
      
      // Email verification successful - embedded wallet will be connected automatically
      console.log('📧 Email verified, embedded wallet connecting...');
      
      setTimeout(() => {
        toast({
          title: "Wallet connected successfully!",
          description: "Your embedded wallet is ready to use",
        });
      }, 0);
    } catch (error) {
      console.error("OTP verification failed:", error);
      let errorMessage = "Invalid verification code. Please try again.";
      
      // Try to get error message from various possible formats
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
      }
      
      // Check if already authenticated
      if (errorMessage.toLowerCase().includes('already authenticated') || 
          errorMessage.toLowerCase().includes('user is already authenticated') ||
          errorMessage.toLowerCase().includes('already signed in')) {
        setError("You're already signed in. Please close this dialog or sign out to use a different account.");
      } else {
        setError(errorMessage);
      }
      
      setTimeout(() => {
        toast({
          title: "Verification failed",
          description: errorMessage,
          variant: "destructive",
        });
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Coinbase CDP (clears browser session)
      await signOut();
      
      // Disconnect from wagmi
      disconnect();
      
      // Clear all local state
      setFlowId(null);
      setEmail('');
      setOtp('');
      setError(null);
      
      setTimeout(() => {
        toast({
          title: "Signed out",
          description: "You've been signed out successfully. You can now sign in again.",
        });
      }, 0);
    } catch (error) {
      console.error("Sign out error:", error);
      setTimeout(() => {
        toast({
          title: "Sign out failed",
          description: "There was an error signing out. Please refresh the page.",
          variant: "destructive",
        });
      }, 0);
    }
  };

  const handleForceReload = async () => {
    try {
      // Sign out from Coinbase CDP
      await signOut();
    } catch (error) {
      console.error("Sign out error during reload:", error);
    }
    
    // Clear ALL browser storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload the page completely
    window.location.reload();
  };


  if (authMethod === 'email') {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="vintage-panel-raised max-w-md w-[95vw] sm:w-full overflow-hidden p-0 border-2 border-[#0052FF]">
            {/* Coinbase Header - Prominent Branding */}
            <div className="bg-gradient-to-br from-[#0052FF] to-[#0041CC] p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg className="h-16 w-16" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="1024" height="1024" rx="512" fill="white"/>
                  <path d="M512 768C629.5 768 725.333 672.167 725.333 554.667C725.333 437.167 629.5 341.333 512 341.333C394.5 341.333 298.667 437.167 298.667 554.667C298.667 672.167 394.5 768 512 768ZM512 256C676.728 256 810.667 389.939 810.667 554.667C810.667 719.395 676.728 853.333 512 853.333C347.272 853.333 213.333 719.395 213.333 554.667C213.333 389.939 347.272 256 512 256Z" fill="#0052FF"/>
                  <path d="M512.5 426C495.5 426 481.5 440 481.5 457V652C481.5 669 495.5 683 512.5 683C529.5 683 543.5 669 543.5 652V457C543.5 440 529.5 426 512.5 426Z" fill="#0052FF"/>
                  <path d="M628 535H397C380 535 366 549 366 566C366 583 380 597 397 597H628C645 597 659 583 659 566C659 549 645 535 628 535Z" fill="#0052FF"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Coinbase Wallet</h2>
              <p className="text-blue-100 text-sm">Secure embedded wallet authentication</p>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6">
              {/* Error Display */}
              {error && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm flex-1">{error}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                      className="ml-auto h-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {(error.toLowerCase().includes('already signed in') || 
                    error.toLowerCase().includes('already authenticated') ||
                    error.toLowerCase().includes('already auth')) && (
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Your browser still has authentication data saved.
                      </p>
                      <Button
                        onClick={handleForceReload}
                        variant="default"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        data-testid="button-force-reload"
                      >
                        Clear Everything & Reload Page
                      </Button>
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full"
                        data-testid="button-sign-out"
                      >
                        Try Sign Out First
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-3 text-sm">
                <div className={`flex items-center space-x-2 ${!flowId ? 'text-[#0052FF]' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${!flowId ? 'border-[#0052FF] bg-[#0052FF]/10' : 'border-muted-foreground'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Email</span>
                </div>
                <div className="w-12 h-0.5 bg-border" />
                <div className={`flex items-center space-x-2 ${flowId ? 'text-[#0052FF]' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${flowId ? 'border-[#0052FF] bg-[#0052FF]/10' : 'border-muted-foreground'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Verify</span>
                </div>
              </div>
              
              {flowId ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold flex items-center gap-2 mb-2 text-foreground">
                      <Shield className="w-4 h-4 text-[#0052FF]" />
                      Enter verification code
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Check your email for the 6-digit code
                    </p>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-xl tracking-widest font-mono h-14 border-2 focus:border-[#0052FF] focus:ring-[#0052FF]"
                      data-testid="input-otp"
                    />
                  </div>
                  <Button 
                    onClick={handleOtpSubmit} 
                    disabled={isLoading || !otp}
                    className="w-full h-12 text-base font-semibold bg-[#0052FF] hover:bg-[#0041CC] text-white"
                    data-testid="button-verify-otp"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Verify & Connect Wallet
                      </div>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold flex items-center gap-2 mb-2 text-foreground">
                      <Mail className="w-4 h-4 text-[#0052FF]" />
                      Email address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="h-12 border-2 focus:border-[#0052FF] focus:ring-[#0052FF]"
                      data-testid="input-email"
                    />
                  </div>
                  <Button 
                    onClick={handleEmailSubmit} 
                    disabled={isLoading || !email}
                    className="w-full h-12 text-base font-semibold bg-[#0052FF] hover:bg-[#0041CC] text-white"
                    data-testid="button-send-code"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Send Verification Code
                      </div>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Footer Info */}
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Your wallet is secured by Coinbase
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      
      {/* Onboarding Flow for First-Time Users */}
      {showOnboarding && address && (
        <WalletOnboardingFlow
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          onComplete={handleOnboardingComplete}
          walletAddress={address}
        />
      )}
      </>
    );
  }

  // This should never render since we default to email
  return null;
}