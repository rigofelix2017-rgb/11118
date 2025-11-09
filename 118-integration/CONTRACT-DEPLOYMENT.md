# Smart Contract Deployment Guide

## Overview

This guide covers deploying all smart contracts required by the 118-integration package.

**Total Contracts Needed:** 7 contracts (2 deployed + 5 to deploy)

---

## Already Deployed (Base Mainnet)

### 1. Jukebox Contract ✅
- **Address:** `0x5026a8ff0CF9c29CDd17661a2E09Fd3417c05311`
- **Network:** Base Mainnet (Chain ID: 8453)
- **Status:** Production-ready, fully functional
- **Usage:** 01-jukebox-system/
- **Action Required:** None - reuse existing contract

### 2. Tipping Contract ✅
- **Address:** `0xfD81b26d6a2F555E3B9613e478FD0DF27d3a168C`
- **Network:** Base Mainnet (Chain ID: 8453)
- **Status:** Production-ready, fully functional
- **Usage:** 02-tipping-system/
- **Action Required:** None - reuse existing contract

---

## Contracts to Deploy

### 3. LandRegistry.sol ⏳
- **Location:** `09-agency-ecosystem/smart-contracts/LandRegistry.sol`
- **Type:** ERC-721 (NFT)
- **Purpose:** 10,000 land parcels with business zones
- **Dependencies:** OpenZeppelin ERC-721, Ownable
- **Estimated Gas:** ~2,500,000 gas (~$10-20 on Base)

### 4. HookRouter.sol ⏳
- **Location:** `09-agency-ecosystem/smart-contracts/HookRouter.sol`
- **Type:** Uniswap V4 Hook
- **Purpose:** 35-45% creator fees on SKU trades
- **Dependencies:** Uniswap V4 interfaces, BaseHook
- **Estimated Gas:** ~3,000,000 gas (~$12-25 on Base)

### 5. SKURegistry.sol ⏳
- **Type:** Custom registry
- **Purpose:** Universal content (emotes, avatars, furniture)
- **Status:** **NOT INCLUDED** - must be created
- **Template:** See below

### 6. XVoidVault.sol ⏳
- **Type:** ERC-4626 Vault
- **Purpose:** VOID staking with 25-125% APY
- **Status:** **NOT INCLUDED** - must be created
- **Template:** See below

### 7. PSXPledgeVault.sol ⏳
- **Type:** Custom vault
- **Purpose:** PSX → VOID conversion (1:100 ratio)
- **Status:** **NOT INCLUDED** - must be created
- **Template:** See below

---

## Deployment Methods

### Option A: Foundry (Recommended)

**Installation:**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Setup:**
```bash
# Initialize Foundry project
cd 118-integration/smart-contracts
forge init

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install Uniswap/v4-core
```

**Deploy Script:**
```solidity
// script/DeployLandRegistry.s.sol
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/LandRegistry.sol";

contract DeployLandRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        LandRegistry landRegistry = new LandRegistry();
        
        console.log("LandRegistry deployed to:", address(landRegistry));

        vm.stopBroadcast();
    }
}
```

**Deploy to Base Mainnet:**
```bash
# Set environment variables
export PRIVATE_KEY=your_private_key_here
export BASE_RPC_URL=https://mainnet.base.org

# Deploy LandRegistry
forge script script/DeployLandRegistry.s.sol:DeployLandRegistry \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify

# Verify on Basescan
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/LandRegistry.sol:LandRegistry \
  --chain-id 8453 \
  --etherscan-api-key $BASESCAN_API_KEY
```

---

### Option B: Hardhat

**Installation:**
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
```

**Setup:**
```bash
# Initialize Hardhat project
npx hardhat

# Install dependencies
npm install @openzeppelin/contracts @uniswap/v4-core
```

**Deploy Script:**
```javascript
// scripts/deploy-land-registry.js
const hre = require("hardhat");

async function main() {
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  
  await landRegistry.deployed();
  
  console.log("LandRegistry deployed to:", landRegistry.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Deploy to Base Mainnet:**
```bash
# Configure hardhat.config.js
module.exports = {
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    }
  }
};

# Deploy
npx hardhat run scripts/deploy-land-registry.js --network base

# Verify
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

---

## Contract Templates (Missing Contracts)

### SKURegistry.sol Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SKURegistry is Ownable {
    struct SKU {
        string name;
        string category; // "emote", "avatar", "furniture", "wearable"
        address creator;
        uint256 price; // In VOID tokens
        string metadataURI;
        bool active;
    }

    mapping(uint256 => SKU) public skus;
    mapping(address => uint256[]) public creatorSKUs;
    uint256 public nextSKUId;

    event SKUCreated(uint256 indexed skuId, address indexed creator, string category);
    event SKUPurchased(uint256 indexed skuId, address indexed buyer);

    function createSKU(
        string memory name,
        string memory category,
        uint256 price,
        string memory metadataURI
    ) external returns (uint256) {
        uint256 skuId = nextSKUId++;
        
        skus[skuId] = SKU({
            name: name,
            category: category,
            creator: msg.sender,
            price: price,
            metadataURI: metadataURI,
            active: true
        });

        creatorSKUs[msg.sender].push(skuId);
        
        emit SKUCreated(skuId, msg.sender, category);
        return skuId;
    }

    function purchaseSKU(uint256 skuId) external payable {
        SKU storage sku = skus[skuId];
        require(sku.active, "SKU not active");
        require(msg.value >= sku.price, "Insufficient payment");

        // Transfer payment to creator (90%) and protocol (10%)
        uint256 creatorShare = (msg.value * 90) / 100;
        uint256 protocolShare = msg.value - creatorShare;

        payable(sku.creator).transfer(creatorShare);
        payable(owner()).transfer(protocolShare);

        emit SKUPurchased(skuId, msg.sender);
    }

    function getSKU(uint256 skuId) external view returns (SKU memory) {
        return skus[skuId];
    }

    function getCreatorSKUs(address creator) external view returns (uint256[] memory) {
        return creatorSKUs[creator];
    }
}
```

---

### XVoidVault.sol Template (ERC-4626)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract XVoidVault is ERC4626, Ownable {
    struct StakePosition {
        uint256 amount;
        uint256 lockDuration;
        uint256 lockedUntil;
        uint256 multiplier; // 100 = 1x, 500 = 5x
    }

    mapping(address => StakePosition) public positions;

    constructor(address voidToken) 
        ERC4626(IERC20(voidToken))
        ERC20("Staked VOID", "xVOID")
    {}

    function stake(uint256 amount, uint256 lockDuration) external {
        require(lockDuration >= 30 days, "Minimum 30 days");
        
        uint256 multiplier = getMultiplier(lockDuration);
        
        positions[msg.sender] = StakePosition({
            amount: amount,
            lockDuration: lockDuration,
            lockedUntil: block.timestamp + lockDuration,
            multiplier: multiplier
        });

        // Transfer VOID from user
        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
        
        // Mint xVOID based on multiplier
        uint256 xVoidAmount = (amount * multiplier) / 100;
        _mint(msg.sender, xVoidAmount);
    }

    function unstake() external {
        StakePosition storage position = positions[msg.sender];
        require(block.timestamp >= position.lockedUntil, "Still locked");
        
        uint256 amount = position.amount;
        uint256 xVoidAmount = (amount * position.multiplier) / 100;
        
        // Burn xVOID
        _burn(msg.sender, xVoidAmount);
        
        // Return VOID
        IERC20(asset()).transfer(msg.sender, amount);
        
        delete positions[msg.sender];
    }

    function getMultiplier(uint256 lockDuration) public pure returns (uint256) {
        if (lockDuration >= 730 days) return 500; // 2 years = 5x (125% APY)
        if (lockDuration >= 365 days) return 300; // 1 year = 3x (75% APY)
        if (lockDuration >= 30 days) return 120;  // 30 days = 1.2x (25% APY)
        return 100; // Default 1x
    }
}
```

---

### PSXPledgeVault.sol Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PSXPledgeVault is Ownable {
    IERC20 public psxToken;
    IERC20 public voidToken;

    uint256 public constant CONVERSION_RATIO = 100; // 1 PSX = 100 VOID

    mapping(address => uint256) public pledgedPSX;
    mapping(address => uint256) public claimableVOID;

    event PSXPledged(address indexed user, uint256 psxAmount, uint256 voidAmount);
    event VOIDClaimed(address indexed user, uint256 amount);

    constructor(address _psxToken, address _voidToken) {
        psxToken = IERC20(_psxToken);
        voidToken = IERC20(_voidToken);
    }

    function pledgePSX(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        // Transfer PSX from user
        psxToken.transferFrom(msg.sender, address(this), amount);
        
        // Calculate VOID amount
        uint256 voidAmount = amount * CONVERSION_RATIO;
        
        pledgedPSX[msg.sender] += amount;
        claimableVOID[msg.sender] += voidAmount;
        
        emit PSXPledged(msg.sender, amount, voidAmount);
    }

    function claimVOID() external {
        uint256 amount = claimableVOID[msg.sender];
        require(amount > 0, "Nothing to claim");
        
        claimableVOID[msg.sender] = 0;
        
        // Transfer VOID to user
        voidToken.transfer(msg.sender, amount);
        
        emit VOIDClaimed(msg.sender, amount);
    }

    function withdrawPSX(uint256 amount) external {
        require(pledgedPSX[msg.sender] >= amount, "Insufficient pledged PSX");
        
        pledgedPSX[msg.sender] -= amount;
        
        // Deduct corresponding VOID
        uint256 voidAmount = amount * CONVERSION_RATIO;
        if (claimableVOID[msg.sender] >= voidAmount) {
            claimableVOID[msg.sender] -= voidAmount;
        }
        
        // Return PSX
        psxToken.transfer(msg.sender, amount);
    }
}
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Install Foundry or Hardhat
- [ ] Install dependencies (OpenZeppelin, Uniswap V4)
- [ ] Create deployment scripts
- [ ] Test on Base Sepolia testnet first
- [ ] Audit contracts (if budget allows)

### Testnet Deployment (Base Sepolia)
```bash
# Base Sepolia RPC
export BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deploy to testnet first
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast

# Test all functions
# - Create land parcel
# - Stake VOID
# - Pledge PSX
# - Create SKU
```

### Mainnet Deployment
- [ ] Fund deployer wallet with ETH (estimate 0.05 ETH for all contracts)
- [ ] Double-check contract code
- [ ] Deploy LandRegistry
- [ ] Deploy HookRouter
- [ ] Deploy SKURegistry
- [ ] Deploy XVoidVault
- [ ] Deploy PSXPledgeVault
- [ ] Verify all contracts on Basescan
- [ ] Update frontend contract addresses

### Post-Deployment
- [ ] Update environment variables with addresses
- [ ] Update contract addresses in:
  - `09-agency-ecosystem/land-system/land-parcel-manager.tsx`
  - `09-agency-ecosystem/sku-system/sku-inventory-system.tsx`
  - `09-agency-ecosystem/staking-system/xvoid-staking-vault.tsx`
  - `09-agency-ecosystem/staking-system/psx-pledging-system.tsx`
  - `shared-files/token-config.ts`
- [ ] Test frontend integration
- [ ] Monitor contract activity
- [ ] Set up Tenderly/Etherscan notifications

---

## Update Frontend Addresses

After deployment, update these files:

### 1. shared-files/token-config.ts
```typescript
export const SUPPORTED_TOKENS = {
  VOID: {
    address: '0xYourVoidTokenAddress', // UPDATE THIS
    // ...
  },
  PSX: {
    address: '0xYourPSXTokenAddress', // UPDATE THIS
    // ...
  }
};
```

### 2. land-parcel-manager.tsx
```typescript
// Line 80-191: Replace 0x000... addresses
const LAND_REGISTRY_ADDRESS = '0xYourLandRegistryAddress'; // UPDATE
```

### 3. sku-inventory-system.tsx
```typescript
const SKU_REGISTRY_ADDRESS = '0xYourSKURegistryAddress'; // UPDATE
```

### 4. xvoid-staking-vault.tsx
```typescript
const XVOID_VAULT_ADDRESS = '0xYourXVoidVaultAddress'; // UPDATE
```

### 5. psx-pledging-system.tsx
```typescript
const PSX_PLEDGE_VAULT_ADDRESS = '0xYourPSXPledgeVaultAddress'; // UPDATE
```

---

## Gas Cost Estimates (Base Mainnet)

| Contract | Deploy Gas | Cost (0.1 gwei) | Cost (1 gwei) |
|----------|-----------|-----------------|---------------|
| LandRegistry | 2,500,000 | ~$10 | ~$100 |
| HookRouter | 3,000,000 | ~$12 | ~$120 |
| SKURegistry | 2,000,000 | ~$8 | ~$80 |
| XVoidVault | 2,500,000 | ~$10 | ~$100 |
| PSXPledgeVault | 1,500,000 | ~$6 | ~$60 |
| **Total** | **11,500,000** | **~$46** | **~$460** |

**Note:** Base has extremely low gas fees compared to Ethereum mainnet.

---

## Security Considerations

### Audit Requirements
- **Critical:** HookRouter (handles Uniswap V4 fees)
- **High:** XVoidVault (holds staked funds)
- **High:** PSXPledgeVault (token conversion)
- **Medium:** LandRegistry (NFT ownership)
- **Low:** SKURegistry (marketplace only)

### Recommended Auditors
- OpenZeppelin Defender
- Certik
- Trail of Bits
- Consensys Diligence

### Cost: $5,000 - $50,000 depending on auditor

---

## Troubleshooting

### Error: "Insufficient funds"
**Solution:** Fund deployer wallet with at least 0.05 ETH on Base

### Error: "Contract creation code exceeds maximum size"
**Solution:** Enable optimizer in Foundry/Hardhat config:
```javascript
// foundry.toml
[profile.default]
optimizer = true
optimizer_runs = 200
```

### Error: "Verification failed"
**Solution:** Ensure contract matches exactly, including constructor args

---

## Next Steps

1. Choose deployment method (Foundry recommended)
2. Create missing contract templates (SKURegistry, XVoidVault, PSXPledgeVault)
3. Deploy to Base Sepolia testnet
4. Test all contract functions
5. Deploy to Base Mainnet
6. Update frontend addresses
7. Test integration end-to-end

---

**Last Updated:** November 8, 2025  
**Network:** Base (Chain ID: 8453)  
**Total Deployment Cost:** ~$50-100 (Base) vs ~$5,000-10,000 (Ethereum)
