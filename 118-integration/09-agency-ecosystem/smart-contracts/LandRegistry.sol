// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LandRegistry
 * @notice Manages metaverse land parcels with integrated V4 hooks fee distribution
 * 
 * Features:
 * - 10,000 parcels (100x100 grid)
 * - Multiple zones (Public, Residential, Commercial, Premium, Glizzy World)
 * - Business licenses (Retail, Entertainment, Services, Gaming)
 * - PSX token requirement for premium areas
 * - Integration with housing system
 * - 80% revenue to community play-to-earn
 */
contract LandRegistry is ERC721, Ownable, ReentrancyGuard {
    // Tokens
    IERC20 public immutable voidToken;
    IERC20 public immutable psxToken;
    address public immutable hookRouter;
    
    // Zone types
    enum Zone {
        PUBLIC,
        RESIDENTIAL,
        COMMERCIAL,
        PREMIUM,
        GLIZZY_WORLD
    }
    
    // Business license types
    enum LicenseType {
        NONE,
        RETAIL,
        ENTERTAINMENT,
        SERVICES,
        GAMING
    }
    
    // Parcel data
    struct Parcel {
        uint256 id;
        address owner;
        uint256 price;
        Zone zone;
        bool hasHouse;
        LicenseType businessLicense;
        uint256 businessRevenue; // Accumulated business revenue
        uint16 x;
        uint16 y;
    }
    
    // State
    uint256 public constant GRID_SIZE = 100;
    uint256 public constant TOTAL_PARCELS = GRID_SIZE * GRID_SIZE; // 10,000
    uint256 public constant GLIZZY_WORLD_PSX_REQUIREMENT = 100_000 * 10**18; // 100k PSX
    
    mapping(uint256 => Parcel) public parcels;
    mapping(address => uint256[]) public ownerParcels;
    
    // License prices (in VOID)
    mapping(LicenseType => uint256) public licensePrices;
    
    // Revenue tracking for play-to-earn (80% to community)
    uint256 public communityRevenuePool;
    uint256 public totalBusinessRevenue;
    
    // Events
    event ParcelPurchased(uint256 indexed parcelId, address indexed buyer, uint256 price);
    event LicensePurchased(uint256 indexed parcelId, LicenseType licenseType, uint256 price);
    event HouseBuilt(uint256 indexed parcelId, address indexed owner);
    event BusinessRevenueEarned(uint256 indexed parcelId, uint256 amount);
    event CommunityRevenueClaimed(address indexed claimer, uint256 amount);
    
    constructor(
        address _voidToken,
        address _psxToken,
        address _hookRouter
    ) ERC721("Metaverse Land Parcel", "LAND") {
        voidToken = IERC20(_voidToken);
        psxToken = IERC20(_psxToken);
        hookRouter = _hookRouter;
        
        // Set license prices
        licensePrices[LicenseType.RETAIL] = 50 * 10**18; // 50 VOID
        licensePrices[LicenseType.ENTERTAINMENT] = 75 * 10**18; // 75 VOID
        licensePrices[LicenseType.SERVICES] = 50 * 10**18; // 50 VOID
        licensePrices[LicenseType.GAMING] = 100 * 10**18; // 100 VOID
        
        // Initialize parcels
        _initializeParcels();
    }
    
    /**
     * @notice Initialize all 10,000 parcels with zones and prices
     */
    function _initializeParcels() private {
        for (uint16 y = 0; y < GRID_SIZE; y++) {
            for (uint16 x = 0; x < GRID_SIZE; x++) {
                uint256 id = uint256(y) * GRID_SIZE + uint256(x);
                
                Zone zone = Zone.PUBLIC;
                uint256 price = 100 * 10**18; // 100 VOID default
                
                // Center area = Premium
                if (x >= 40 && x < 60 && y >= 40 && y < 60) {
                    zone = Zone.PREMIUM;
                    price = 500 * 10**18;
                }
                // Glizzy World corner (requires 100k PSX)
                else if (x >= 80 && y >= 80) {
                    zone = Zone.GLIZZY_WORLD;
                    price = 1000 * 10**18;
                }
                // Commercial zones
                else if ((x >= 35 && x < 65) || (y >= 35 && y < 65)) {
                    zone = Zone.COMMERCIAL;
                    price = 300 * 10**18;
                }
                // Residential zones
                else if ((x >= 20 && x < 80) && (y >= 20 && y < 80)) {
                    zone = Zone.RESIDENTIAL;
                    price = 200 * 10**18;
                }
                
                parcels[id] = Parcel({
                    id: id,
                    owner: address(0),
                    price: price,
                    zone: zone,
                    hasHouse: false,
                    businessLicense: LicenseType.NONE,
                    businessRevenue: 0,
                    x: x,
                    y: y
                });
            }
        }
    }
    
    /**
     * @notice Purchase a parcel with VOID tokens
     */
    function purchaseParcel(uint256 parcelId) external nonReentrant {
        require(parcelId < TOTAL_PARCELS, "Invalid parcel ID");
        Parcel storage parcel = parcels[parcelId];
        require(parcel.owner == address(0), "Parcel already owned");
        
        // Check PSX requirement for Glizzy World
        if (parcel.zone == Zone.GLIZZY_WORLD) {
            require(
                psxToken.balanceOf(msg.sender) >= GLIZZY_WORLD_PSX_REQUIREMENT,
                "Insufficient PSX for Glizzy World"
            );
        }
        
        // Transfer VOID tokens
        require(
            voidToken.transferFrom(msg.sender, address(this), parcel.price),
            "VOID transfer failed"
        );
        
        // Distribute fees through V4 hooks (20% to ecosystem)
        uint256 ecosystemFee = parcel.price / 5; // 20%
        uint256 toOwner = parcel.price - ecosystemFee;
        
        // Send to hook router for distribution
        voidToken.transfer(hookRouter, ecosystemFee);
        
        // 80% to community pool (play-to-earn)
        communityRevenuePool += toOwner;
        
        // Mint parcel NFT
        _mint(msg.sender, parcelId);
        
        // Update parcel
        parcel.owner = msg.sender;
        ownerParcels[msg.sender].push(parcelId);
        
        emit ParcelPurchased(parcelId, msg.sender, parcel.price);
    }
    
    /**
     * @notice Purchase a business license for a parcel
     */
    function purchaseLicense(uint256 parcelId, LicenseType licenseType) external nonReentrant {
        require(ownerOf(parcelId) == msg.sender, "Not parcel owner");
        require(licenseType != LicenseType.NONE, "Invalid license type");
        
        Parcel storage parcel = parcels[parcelId];
        require(parcel.businessLicense == LicenseType.NONE, "License already exists");
        
        uint256 price = licensePrices[licenseType];
        
        // Transfer VOID tokens
        require(
            voidToken.transferFrom(msg.sender, address(this), price),
            "VOID transfer failed"
        );
        
        // Distribute fees (20% to ecosystem, 80% to community)
        uint256 ecosystemFee = price / 5;
        uint256 toCommunity = price - ecosystemFee;
        
        voidToken.transfer(hookRouter, ecosystemFee);
        communityRevenuePool += toCommunity;
        
        // Grant license
        parcel.businessLicense = licenseType;
        
        emit LicensePurchased(parcelId, licenseType, price);
    }
    
    /**
     * @notice Build a house on owned parcel (integrates with house-interior.tsx)
     */
    function buildHouse(uint256 parcelId) external {
        require(ownerOf(parcelId) == msg.sender, "Not parcel owner");
        Parcel storage parcel = parcels[parcelId];
        require(!parcel.hasHouse, "House already exists");
        
        parcel.hasHouse = true;
        
        emit HouseBuilt(parcelId, msg.sender);
    }
    
    /**
     * @notice Record business revenue (called by business contracts)
     * @dev 80% goes to parcel owner, 20% to ecosystem via hooks
     */
    function recordBusinessRevenue(uint256 parcelId, uint256 amount) external {
        Parcel storage parcel = parcels[parcelId];
        require(parcel.businessLicense != LicenseType.NONE, "No business license");
        
        // Transfer VOID from business contract
        require(
            voidToken.transferFrom(msg.sender, address(this), amount),
            "VOID transfer failed"
        );
        
        // 80% to parcel owner
        uint256 ownerShare = (amount * 80) / 100;
        
        // 20% to ecosystem (split via hooks)
        uint256 ecosystemShare = amount - ownerShare;
        
        voidToken.transfer(parcel.owner, ownerShare);
        voidToken.transfer(hookRouter, ecosystemShare);
        
        parcel.businessRevenue += ownerShare;
        totalBusinessRevenue += amount;
        
        emit BusinessRevenueEarned(parcelId, ownerShare);
    }
    
    /**
     * @notice Get all parcels owned by an address
     */
    function getOwnerParcels(address owner) external view returns (uint256[] memory) {
        return ownerParcels[owner];
    }
    
    /**
     * @notice Get parcel details
     */
    function getParcelDetails(uint256 parcelId) external view returns (
        address owner,
        uint256 price,
        Zone zone,
        bool hasHouse,
        LicenseType businessLicense,
        uint256 businessRevenue,
        uint16 x,
        uint16 y
    ) {
        Parcel memory parcel = parcels[parcelId];
        return (
            parcel.owner,
            parcel.price,
            parcel.zone,
            parcel.hasHouse,
            parcel.businessLicense,
            parcel.businessRevenue,
            parcel.x,
            parcel.y
        );
    }
    
    /**
     * @notice Get parcels by zone
     */
    function getParcelsByZone(Zone zone) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](TOTAL_PARCELS);
        uint256 count = 0;
        
        for (uint256 i = 0; i < TOTAL_PARCELS; i++) {
            if (parcels[i].zone == zone) {
                result[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory trimmed = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            trimmed[i] = result[i];
        }
        
        return trimmed;
    }
    
    /**
     * @notice Check if address can access Glizzy World
     */
    function canAccessGlizzyWorld(address account) external view returns (bool) {
        return psxToken.balanceOf(account) >= GLIZZY_WORLD_PSX_REQUIREMENT;
    }
    
    /**
     * @notice Update license prices (owner only)
     */
    function updateLicensePrice(LicenseType licenseType, uint256 newPrice) external onlyOwner {
        require(licenseType != LicenseType.NONE, "Invalid license type");
        licensePrices[licenseType] = newPrice;
    }
}
