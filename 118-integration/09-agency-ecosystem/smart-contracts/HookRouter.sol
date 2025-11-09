// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HookRouter
 * @notice V4 Hooks system with dynamic fee distribution
 * 
 * Fee Distribution (0.20% base fee on all transactions):
 * - 35-45% to Creators (adaptive based on volume)
 * - 25% to xVOID Stakers
 * - 15% to PSX Treasury (buybacks)
 * - 10% to CREATE DAO (incubation)
 * - 10% to Partners (DEX, 1155, CDN)
 * - 5% to Vault Reserve (safety buffer)
 * 
 * Features:
 * - Dynamic adjustment factor boosts new/small creators automatically
 * - Transparent on-chain fee tracking
 * - Multiple hook types (trade, mint, transfer, burn)
 */
contract HookRouter is Ownable, ReentrancyGuard {
    // Tokens
    IERC20 public immutable voidToken;
    IERC20 public immutable psxToken;
    
    // Fee recipients
    address public xVoidVault;
    address public psxTreasury;
    address public createDAO;
    address public partnerDistributor;
    address public vaultReserve;
    
    // Fee percentages (basis points, 10000 = 100%)
    uint256 public constant BASE_FEE = 20; // 0.20%
    uint256 public creatorFeeMin = 3500; // 35%
    uint256 public creatorFeeMax = 4500; // 45%
    uint256 public xVoidFee = 2500; // 25%
    uint256 public psxFee = 1500; // 15%
    uint256 public createFee = 1000; // 10%
    uint256 public partnerFee = 1000; // 10%
    uint256 public vaultFee = 500; // 5%
    
    // Creator registry
    struct Creator {
        address wallet;
        uint256 totalVolume; // Total trading volume for adjustment
        uint256 targetVolume; // Target volume for full rewards
        uint256 feesEarned; // Total fees earned
        bool registered;
    }
    
    mapping(address => Creator) public creators;
    mapping(address => address) public assetToCreator; // Asset address => Creator address
    
    // Volume tracking
    mapping(address => uint256) public dailyVolume; // Asset => daily volume
    uint256 public totalEcosystemVolume;
    
    // Hook types
    enum HookType {
        TRADE,
        MINT,
        TRANSFER,
        BURN,
        SKU_PURCHASE,
        LAND_PURCHASE,
        LICENSE_PURCHASE
    }
    
    // Events
    event FeeDistributed(
        address indexed asset,
        address indexed creator,
        uint256 totalFee,
        uint256 creatorShare,
        uint256 xVoidShare,
        uint256 psxShare,
        uint256 createShare,
        uint256 partnerShare,
        uint256 vaultShare
    );
    
    event CreatorRegistered(address indexed creator, address indexed asset);
    event VolumeRecorded(address indexed asset, uint256 amount);
    
    constructor(
        address _voidToken,
        address _psxToken,
        address _xVoidVault,
        address _psxTreasury,
        address _createDAO,
        address _partnerDistributor,
        address _vaultReserve
    ) {
        voidToken = IERC20(_voidToken);
        psxToken = IERC20(_psxToken);
        xVoidVault = _xVoidVault;
        psxTreasury = _psxTreasury;
        createDAO = _createDAO;
        partnerDistributor = _partnerDistributor;
        vaultReserve = _vaultReserve;
    }
    
    /**
     * @notice Register a creator for an asset
     */
    function registerCreator(
        address creatorWallet,
        address asset,
        uint256 targetVolume
    ) external onlyOwner {
        require(!creators[creatorWallet].registered, "Creator already registered");
        
        creators[creatorWallet] = Creator({
            wallet: creatorWallet,
            totalVolume: 0,
            targetVolume: targetVolume,
            feesEarned: 0,
            registered: true
        });
        
        assetToCreator[asset] = creatorWallet;
        
        emit CreatorRegistered(creatorWallet, asset);
    }
    
    /**
     * @notice Main hook function - called on every transaction
     * @param asset The asset being traded
     * @param amount The transaction amount
     * @param hookType The type of hook being triggered
     */
    function onTransaction(
        address asset,
        uint256 amount,
        HookType hookType
    ) external nonReentrant returns (uint256) {
        // Calculate base fee (0.20%)
        uint256 totalFee = (amount * BASE_FEE) / 10000;
        
        // Transfer fee from caller
        require(
            voidToken.transferFrom(msg.sender, address(this), totalFee),
            "Fee transfer failed"
        );
        
        // Get creator
        address creatorAddress = assetToCreator[asset];
        require(creatorAddress != address(0), "Creator not registered");
        
        Creator storage creator = creators[creatorAddress];
        
        // Calculate dynamic adjustment factor
        uint256 adjustmentFactor = _calculateAdjustmentFactor(creator, amount);
        
        // Calculate creator share (35-45% based on adjustment)
        uint256 creatorShare = (totalFee * adjustmentFactor) / 10000;
        
        // Remaining fees distributed to other recipients
        uint256 remaining = totalFee - creatorShare;
        
        uint256 xVoidShare = (remaining * xVoidFee) / 10000;
        uint256 psxShare = (remaining * psxFee) / 10000;
        uint256 createShare = (remaining * createFee) / 10000;
        uint256 partnerShare = (remaining * partnerFee) / 10000;
        uint256 vaultShare = remaining - xVoidShare - psxShare - createShare - partnerShare;
        
        // Distribute fees
        voidToken.transfer(creator.wallet, creatorShare);
        voidToken.transfer(xVoidVault, xVoidShare);
        voidToken.transfer(psxTreasury, psxShare);
        voidToken.transfer(createDAO, createShare);
        voidToken.transfer(partnerDistributor, partnerShare);
        voidToken.transfer(vaultReserve, vaultShare);
        
        // Update creator stats
        creator.totalVolume += amount;
        creator.feesEarned += creatorShare;
        
        // Update volume tracking
        dailyVolume[asset] += amount;
        totalEcosystemVolume += amount;
        
        emit FeeDistributed(
            asset,
            creator.wallet,
            totalFee,
            creatorShare,
            xVoidShare,
            psxShare,
            createShare,
            partnerShare,
            vaultShare
        );
        
        emit VolumeRecorded(asset, amount);
        
        return totalFee;
    }
    
    /**
     * @notice Calculate dynamic adjustment factor for creator fees
     * @dev Boosts fees for new/small creators automatically
     * 
     * Formula: adjustmentFactor = clamp(targetVolume / actualVolume, 0.8, 1.2)
     * - New creators get boosted fees (up to 45%)
     * - Established creators get base fees (35%)
     * - Smoothly transitions as volume grows
     */
    function _calculateAdjustmentFactor(
        Creator memory creator,
        uint256 currentAmount
    ) private view returns (uint256) {
        if (creator.totalVolume == 0) {
            // New creator - maximum boost (45%)
            return creatorFeeMax;
        }
        
        uint256 actualVolume = creator.totalVolume + currentAmount;
        uint256 targetVolume = creator.targetVolume;
        
        if (targetVolume == 0 || actualVolume >= targetVolume) {
            // Reached target or no target set - base fee (35%)
            return creatorFeeMin;
        }
        
        // Calculate ratio: targetVolume / actualVolume
        // Higher ratio = more boost (further from target)
        uint256 ratio = (targetVolume * 10000) / actualVolume;
        
        // Clamp between creatorFeeMin (35%) and creatorFeeMax (45%)
        if (ratio < creatorFeeMin) {
            return creatorFeeMin;
        } else if (ratio > creatorFeeMax) {
            return creatorFeeMax;
        } else {
            return ratio;
        }
    }
    
    /**
     * @notice Get current creator fee percentage for an asset
     */
    function getCreatorFeePercent(address asset) external view returns (uint256) {
        address creatorAddress = assetToCreator[asset];
        if (creatorAddress == address(0)) return 0;
        
        Creator memory creator = creators[creatorAddress];
        return _calculateAdjustmentFactor(creator, 0);
    }
    
    /**
     * @notice Get creator stats
     */
    function getCreatorStats(address creatorAddress) external view returns (
        uint256 totalVolume,
        uint256 targetVolume,
        uint256 feesEarned,
        uint256 currentFeePercent
    ) {
        Creator memory creator = creators[creatorAddress];
        return (
            creator.totalVolume,
            creator.targetVolume,
            creator.feesEarned,
            _calculateAdjustmentFactor(creator, 0)
        );
    }
    
    /**
     * @notice Update fee percentages (governance only)
     */
    function updateFeePercentages(
        uint256 _creatorFeeMin,
        uint256 _creatorFeeMax,
        uint256 _xVoidFee,
        uint256 _psxFee,
        uint256 _createFee,
        uint256 _partnerFee,
        uint256 _vaultFee
    ) external onlyOwner {
        // Ensure total = 100%
        require(
            _xVoidFee + _psxFee + _createFee + _partnerFee + _vaultFee <= 10000,
            "Total exceeds 100%"
        );
        
        creatorFeeMin = _creatorFeeMin;
        creatorFeeMax = _creatorFeeMax;
        xVoidFee = _xVoidFee;
        psxFee = _psxFee;
        createFee = _createFee;
        partnerFee = _partnerFee;
        vaultFee = _vaultFee;
    }
    
    /**
     * @notice Update fee recipients (governance only)
     */
    function updateRecipients(
        address _xVoidVault,
        address _psxTreasury,
        address _createDAO,
        address _partnerDistributor,
        address _vaultReserve
    ) external onlyOwner {
        xVoidVault = _xVoidVault;
        psxTreasury = _psxTreasury;
        createDAO = _createDAO;
        partnerDistributor = _partnerDistributor;
        vaultReserve = _vaultReserve;
    }
    
    /**
     * @notice Reset daily volume (called by oracle/keeper)
     */
    function resetDailyVolume(address[] calldata assets) external onlyOwner {
        for (uint256 i = 0; i < assets.length; i++) {
            dailyVolume[assets[i]] = 0;
        }
    }
    
    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
