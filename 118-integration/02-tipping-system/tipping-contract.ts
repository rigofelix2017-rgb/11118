import { ethers } from 'ethers';
import { Token, TokenManager, tokenManager, ERC20_ABI } from './token-config';
import { useEthersConnection } from './wagmi-ethers-adapters';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';

// Base mainnet configuration
const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_MAINNET_RPC = 'https://mainnet.base.org';

// Your deployed contract address
const TIPPING_CONTRACT_ADDRESS = '0xfD81b26d6a2F555E3B9613e478FD0DF27d3a168C';

// Enhanced Contract ABI with token support and admin functions
const TIPPING_CONTRACT_ABI = [
  // Original ETH tipping function
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "string", "name": "message", "type": "string" }
    ],
    "name": "tip",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // New ERC20 token tipping function
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "string", "name": "message", "type": "string" }
    ],
    "name": "tipToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Admin functions
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint8", "name": "decimals", "type": "uint8" }
    ],
    "name": "addToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "removeToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "admin", "type": "address" }
    ],
    "name": "addAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "admin", "type": "address" }
    ],
    "name": "removeAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Token withdrawal functions
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "withdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawAllTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "isTokenAllowed",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "isAdmin",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllowedTokens",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "getTokenInfo",
    "outputs": [
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint8", "name": "decimals", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Original functions
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerStats",
    "outputs": [
      { "internalType": "uint256", "name": "tipped", "type": "uint256" },
      { "internalType": "uint256", "name": "received", "type": "uint256" },
      { "internalType": "uint256", "name": "pending", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGlobalStats",
    "outputs": [
      { "internalType": "uint256", "name": "tipsCount", "type": "uint256" },
      { "internalType": "uint256", "name": "volume", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "message", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "TipSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "TipWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "uint8", "name": "decimals", "type": "uint8" }
    ],
    "name": "TokenAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "TokenRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "admin", "type": "address" }
    ],
    "name": "AdminAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "admin", "type": "address" }
    ],
    "name": "AdminRemoved",
    "type": "event"
  }
];

export interface TipEvent {
  from: string;
  to: string;
  token: string; // Token contract address (0x0 for ETH)
  amount: string;
  message: string;
  timestamp: number;
  txHash: string;
  tokenSymbol?: string; // For display purposes
}

export interface ReceivedTip {
  from: string;
  fromName?: string;
  token: string;
  amount: string;
  message?: string;
  timestamp: number;
  txHash: string;
  tokenSymbol?: string;
}

export interface PlayerStats {
  tipped: string;
  received: string;
  pending: string;
}

export interface GlobalStats {
  tipsCount: string;
  volume: string;
}

export class TippingContract {
  private contract: ethers.Contract | null = null;
  private readOnlyContract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | ethers.FallbackProvider | null = null;
  private readOnlyProvider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(signer?: ethers.JsonRpcSigner, provider?: ethers.JsonRpcProvider | ethers.FallbackProvider) {
    // Always create a read-only provider for contract calls that don't require signatures
    this.readOnlyProvider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
    this.readOnlyContract = new ethers.Contract(TIPPING_CONTRACT_ADDRESS, TIPPING_CONTRACT_ABI, this.readOnlyProvider);
    
    if (signer && provider) {
      this.signer = signer;
      this.provider = provider;
      this.contract = new ethers.Contract(TIPPING_CONTRACT_ADDRESS, TIPPING_CONTRACT_ABI, this.signer);
    }
  }

  isInitialized(): boolean {
    return !!(this.contract && this.provider && this.signer);
  }

  async ensureCorrectNetwork(): Promise<void> {
    // Use read-only provider for network check to avoid embedded wallet limitations
    if (!this.readOnlyProvider) {
      throw new Error('Read-only provider not available');
    }

    try {
      const network = await this.readOnlyProvider.getNetwork();
      if (Number(network.chainId) !== BASE_MAINNET_CHAIN_ID) {
        throw new Error(`Please switch to Base Mainnet (Chain ID: ${BASE_MAINNET_CHAIN_ID}). Currently on Chain ID: ${network.chainId}`);
      }
    } catch (error) {
      console.error('Network check failed:', error);
      throw error;
    }
  }

  // Network switching is now handled by Wagmi

  async tip(recipientAddress: string, amountInEth: string, message: string = ''): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const amountInWei = ethers.parseEther(amountInEth);
      const tx = await this.contract.tip(recipientAddress, message, {
        value: amountInWei
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Tip transaction failed:', error);
      throw error;
    }
  }

  async withdraw(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.withdraw();
      return tx.hash;
    } catch (error) {
      console.error('Withdraw transaction failed:', error);
      throw error;
    }
  }

  async withdrawToken(tokenAddress: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.withdrawToken(tokenAddress);
      return tx.hash;
    } catch (error) {
      console.error('Token withdraw transaction failed:', error);
      throw error;
    }
  }

  async withdrawAllTokens(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.withdrawAllTokens();
      return tx.hash;
    } catch (error) {
      console.error('Withdraw all tokens transaction failed:', error);
      throw error;
    }
  }

  async getPlayerStats(playerAddress: string): Promise<PlayerStats> {
    if (!this.readOnlyContract) {
      throw new Error('Read-only contract not initialized.');
    }

    try {
      const [tipped, received, pending] = await this.readOnlyContract.getPlayerStats(playerAddress);
      return {
        tipped: ethers.formatEther(tipped),
        received: ethers.formatEther(received),
        pending: ethers.formatEther(pending)
      };
    } catch (error) {
      console.error('Failed to get player stats:', error);
      throw error;
    }
  }

  async getGlobalStats(): Promise<GlobalStats> {
    if (!this.readOnlyContract) {
      throw new Error('Read-only contract not initialized.');
    }

    try {
      const [tipsCount, volume] = await this.readOnlyContract.getGlobalStats();
      return {
        tipsCount: tipsCount.toString(),
        volume: ethers.formatEther(volume)
      };
    } catch (error) {
      console.error('Failed to get global stats:', error);
      throw error;
    }
  }

  // Listen for tip events using polling-only approach to avoid embedded wallet RPC limitations
  onTipSent(callback: (event: TipEvent) => void): () => void {
    if (!this.readOnlyContract || !this.readOnlyProvider) {
      throw new Error('Read-only contract not initialized');
    }

    const eventFilter = this.readOnlyContract.filters.TipSent();
    let lastProcessedBlock = 0;
    
    // Check for events using polling only (no live subscriptions to avoid filter errors)
    const checkRecentEvents = async () => {
      try {
        const currentBlock = await this.readOnlyProvider!.getBlockNumber();
        const fromBlock = lastProcessedBlock > 0 ? Math.max(lastProcessedBlock + 1, currentBlock - 100) : Math.max(0, currentBlock - 20);
        
        const recentEvents = await this.readOnlyContract!.queryFilter(eventFilter, fromBlock, currentBlock);
        
        for (const event of recentEvents) {
          if ('args' in event && event.args) {
            const token = event.args[2];
            const tokenInfo = tokenManager.getToken(token);
            const tipEvent: TipEvent = {
              from: event.args[0],
              to: event.args[1], 
              token,
              amount: tokenInfo ? tokenManager.formatTokenAmount(event.args[3].toString(), tokenInfo) : ethers.formatEther(event.args[3]),
              message: event.args[4] || '',
              timestamp: Number(event.args[5]),
              txHash: event.transactionHash,
              tokenSymbol: tokenInfo?.symbol || 'ETH'
            };
            callback(tipEvent);
          }
        }
        
        lastProcessedBlock = currentBlock;
      } catch (error) {
        console.warn('Failed to check recent events:', error);
      }
    };
    
    // Check recent events immediately
    checkRecentEvents();
    
    // Check for recent events periodically (every 15 seconds)
    const intervalId = setInterval(checkRecentEvents, 15000);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }

  // Get current user address
  async getCurrentAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.getAddress();
  }

  async getReceivedTips(userAddress?: string): Promise<ReceivedTip[]> {
    if (!this.readOnlyContract || !this.readOnlyProvider) {
      console.warn('Read-only contract not initialized');
      return [];
    }

    try {
      // Sync token allowlist first so we have current token info for proper symbol display
      await this.syncTokenAllowlist();
      
      const address = userAddress || await this.getCurrentAddress();
      console.log(`Fetching tips for address: ${address}`);
      
      // Get current block number and use a larger range for initial deployment
      const currentBlock = await this.readOnlyProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Expand range to last 10000 blocks
      console.log(`Searching blocks ${fromBlock} to ${currentBlock}`);
      
      // Try a simpler approach - get all TipSent events first
      let events: any[] = [];
      try {
        // First, try to get all TipSent events
        const allEventsFilter = this.readOnlyContract.filters.TipSent();
        const allEvents = await this.readOnlyContract.queryFilter(allEventsFilter, fromBlock, currentBlock);
        console.log(`Found ${allEvents.length} total tip events`);
        
        // Filter client-side for events where this user is the recipient
        events = allEvents.filter(event => {
          if ('args' in event && event.args) {
            const recipient = event.args[1].toLowerCase();
            const isForThisUser = recipient === address.toLowerCase();
            if (isForThisUser) {
              console.log(`Found tip for user: from ${event.args[0]} to ${event.args[1]}, token ${event.args[2]}`);
            }
            return isForThisUser; // args[1] is the 'to' address
          }
          return false;
        });
        console.log(`Found ${events.length} tips for address ${address}`);
      } catch (generalError) {
        // Fallback to original approach
        try {
          const filter = this.readOnlyContract.filters.TipSent(null, address);
          events = await this.readOnlyContract.queryFilter(filter, fromBlock, currentBlock);
        } catch (specificError) {
          events = [];
        }
      }
      
      const tips: ReceivedTip[] = [];
      for (const event of events) {
        if ('args' in event && event.args) {
          try {
            // Use current timestamp if block fetch fails
            let timestamp = Math.floor(Date.now() / 1000);
            try {
              const block = await this.readOnlyProvider.getBlock(event.blockNumber);
              timestamp = block!.timestamp;
            } catch (blockError) {
              console.warn('Using current timestamp for event');
            }
            
            const token = event.args[2];
            const tokenInfo = tokenManager.getToken(token);
            
            // Format amount using ethers.js to avoid BigInt issues
            let formattedAmount: string;
            if (tokenInfo) {
              formattedAmount = ethers.formatUnits(event.args[3], tokenInfo.decimals);
            } else {
              formattedAmount = ethers.formatEther(event.args[3]);
            }
            
            tips.push({
              from: event.args[0],
              token,
              amount: formattedAmount,
              message: event.args[4] || undefined,
              timestamp: timestamp,
              txHash: event.transactionHash,
              tokenSymbol: tokenInfo?.symbol || 'ETH'
            });
          } catch (eventError) {
            console.warn('Failed to process event:', eventError);
          }
        }
      }
      
      // Sort by timestamp, newest first
      return tips.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error: any) {
      // For a new contract with no events, this is expected
      console.log('No tips found (this is normal for a new contract):', error?.message || error);
      return [];
    }
  }

  // ============ ERC20 Token Tipping Methods ============

  async tipToken(token: Token, recipientAddress: string, amount: string, message: string = ''): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Parse amount according to token decimals
      const parsedAmount = tokenManager.parseTokenAmount(amount, token);
      
      // Check if token is native ETH
      if (token.isNative) {
        return await this.tip(recipientAddress, amount, message);
      }

      // For ERC20 tokens, first check/approve allowance
      const currentAddress = await this.getCurrentAddress();
      const erc20Contract = new ethers.Contract(token.address, ERC20_ABI, this.signer);
      
      // Use read-only provider for checking allowance
      const erc20ReadContract = new ethers.Contract(token.address, ERC20_ABI, this.readOnlyProvider);
      const allowance = await erc20ReadContract.allowance(currentAddress, TIPPING_CONTRACT_ADDRESS);
      const requiredAmount = BigInt(parsedAmount);
      
      if (allowance < requiredAmount) {
        // Need to approve the spending
        const approveTx = await erc20Contract.approve(TIPPING_CONTRACT_ADDRESS, requiredAmount);
        // Use read-only provider for transaction confirmation to avoid embedded wallet RPC limitations
        await this.readOnlyProvider!.waitForTransaction(approveTx.hash);
      }

      // Check if token is allowed before attempting tip
      const isAllowed = await this.isTokenAllowed(token.address);
      console.log(`Token ${token.symbol} (${token.address}) allowed status:`, isAllowed);
      
      if (!isAllowed) {
        throw new Error(`Token ${token.symbol} is not in the contract's allowlist. Please add it via the admin panel first.`);
      }
      
      console.log(`Attempting to tip ${ethers.formatUnits(parsedAmount, token.decimals)} ${token.symbol} to ${recipientAddress}`);
      
      // Now execute the tip
      const tx = await this.contract.tipToken(token.address, recipientAddress, parsedAmount, message);
      return tx.hash;
    } catch (error) {
      console.error('Token tip transaction failed:', error);
      throw error;
    }
  }

  async getTokenBalance(token: Token, address?: string): Promise<string> {
    if (!this.readOnlyProvider) {
      throw new Error('Read-only provider not initialized');
    }

    try {
      const userAddress = address || await this.getCurrentAddress();
      
      // Check if we're on the correct network using read-only provider
      const network = await this.readOnlyProvider.getNetwork();
      if (Number(network.chainId) !== BASE_MAINNET_CHAIN_ID) {
        console.warn(`Wrong network for token balance check. Expected ${BASE_MAINNET_CHAIN_ID}, got ${network.chainId}`);
        // Network switching is now handled by Wagmi - suggest user to switch manually
        throw new Error(`Please switch to Base Mainnet in your wallet. Currently on Chain ID: ${network.chainId}`);
      }
      
      if (token.isNative) {
        const balance = await this.readOnlyProvider.getBalance(userAddress);
        return ethers.formatEther(balance);
      } else {
        // Validate token address
        if (!token.address || token.address === '0x0000000000000000000000000000000000000000') {
          console.error('Invalid token address for ERC20 token:', token);
          return '0';
        }
        
        console.log(`Checking balance for token ${token.symbol} at address ${token.address} for user ${userAddress}`);
        const erc20Contract = new ethers.Contract(token.address, ERC20_ABI, this.readOnlyProvider);
        
        // Test if contract exists and has balanceOf method
        try {
          const balance = await erc20Contract.balanceOf(userAddress);
          console.log(`Raw balance for ${token.symbol}:`, balance.toString());
          // Use ethers.js formatUnits for proper BigInt handling
          const formattedBalance = ethers.formatUnits(balance, token.decimals);
          console.log(`Formatted balance for ${token.symbol}:`, formattedBalance);
          return formattedBalance;
        } catch (contractError: any) {
          console.error(`Contract call failed for ${token.symbol}:`, {
            address: token.address,
            error: contractError.message || contractError,
            code: contractError.code,
            reason: contractError.reason
          });
          throw contractError;
        }
      }
    } catch (error) {
      console.error('Failed to get token balance for', token.symbol, ':', error);
      return '0';
    }
  }

  // ============ Admin Token Management Methods ============

  async addToken(token: Token): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.addToken(
        token.address,
        token.symbol,
        token.name,
        token.decimals
      );
      
      // Update local token manager
      tokenManager.addToken(token);
      
      return tx.hash;
    } catch (error) {
      console.error('Add token transaction failed:', error);
      throw error;
    }
  }

  async removeToken(tokenAddress: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.removeToken(tokenAddress);
      
      // Update local token manager
      tokenManager.removeToken(tokenAddress);
      
      return tx.hash;
    } catch (error) {
      console.error('Remove token transaction failed:', error);
      throw error;
    }
  }

  // ============ Admin Management Methods ============

  async addAdmin(adminAddress: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.addAdmin(adminAddress);
      return tx.hash;
    } catch (error) {
      console.error('Add admin transaction failed:', error);
      throw error;
    }
  }

  async removeAdmin(adminAddress: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Make sure wallet is connected.');
    }
    
    await this.ensureCorrectNetwork();

    try {
      const tx = await this.contract.removeAdmin(adminAddress);
      return tx.hash;
    } catch (error) {
      console.error('Remove admin transaction failed:', error);
      throw error;
    }
  }

  async isAdmin(address?: string): Promise<boolean> {
    if (!this.readOnlyContract) {
      throw new Error('Read-only contract not initialized');
    }

    try {
      const userAddress = address || await this.getCurrentAddress();
      return await this.readOnlyContract.isAdmin(userAddress);
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }

  // ============ Allowlist Query Methods ============

  async getAllowedTokens(): Promise<string[]> {
    if (!this.readOnlyContract) {
      throw new Error('Read-only contract not initialized');
    }

    try {
      return await this.readOnlyContract.getAllowedTokens();
    } catch (error) {
      console.error('Failed to get allowed tokens:', error);
      return [];
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<Token | null> {
    if (!this.readOnlyContract) {
      throw new Error('Read-only contract not initialized');
    }

    try {
      const [symbol, name, decimals] = await this.readOnlyContract.getTokenInfo(tokenAddress);
      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        chainId: BASE_MAINNET_CHAIN_ID,
        isNative: tokenAddress === '0x0000000000000000000000000000000000000000'
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  async isTokenAllowed(tokenAddress: string): Promise<boolean> {
    if (!this.readOnlyContract) {
      throw new Error('Read-only contract not initialized');
    }

    try {
      return await this.readOnlyContract.isTokenAllowed(tokenAddress);
    } catch (error) {
      console.error('Failed to check token allowlist:', error);
      return false;
    }
  }

  async syncTokenAllowlist(): Promise<void> {
    try {
      const allowedTokenAddresses = await this.getAllowedTokens();
      
      // Clear current tokens and rebuild from contract
      const currentTokens = tokenManager.getAllTokens();
      currentTokens.forEach(token => {
        if (!token.isNative) {
          tokenManager.removeToken(token.address);
        }
      });

      // Add all allowed tokens from contract
      for (const address of allowedTokenAddresses) {
        const tokenInfo = await this.getTokenInfo(address);
        if (tokenInfo) {
          tokenManager.addToken(tokenInfo);
        }
      }
    } catch (error) {
      console.error('Failed to sync token allowlist:', error);
    }
  }
}

/**
 * React hook that provides a properly initialized TippingContract instance
 * This hook automatically connects to the user's Wagmi wallet
 */
export function useTippingContract() {
  const { address, isConnected } = useAccount();
  const { signer, provider, isConnected: ethersConnected } = useEthersConnection({ chainId: BASE_MAINNET_CHAIN_ID });

  const contract = useMemo(() => {
    if (!signer || !provider || !isConnected || !ethersConnected) {
      return new TippingContract(); // Return uninitialized contract
    }
    
    try {
      return new TippingContract(signer, provider);
    } catch (error) {
      console.error('Failed to create TippingContract:', error);
      return new TippingContract(); // Return uninitialized contract
    }
  }, [signer, provider, isConnected, ethersConnected]);

  return {
    contract,
    isInitialized: contract.isInitialized(),
    isConnected: isConnected && ethersConnected,
    address
  };
}

// Legacy singleton for backward compatibility during migration
// Components should gradually migrate to use the hook instead
export const tippingContract = new TippingContract();