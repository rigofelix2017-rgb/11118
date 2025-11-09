// Contract ABIs for the PSX-VOID ecosystem

export const VOID_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tradingEnabled() view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
] as const

export const FOUNDERS_NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function schizoMintActive() view returns (bool)",
  "function whitelistMintActive() view returns (bool)",
  "function publicMintActive() view returns (bool)",
  "function schizoPrice() view returns (uint256)",
  "function whitelistPrice() view returns (uint256)",
  "function publicPrice() view returns (uint256)",
  "function schizoMint(uint256 quantity, bytes32[] calldata proof)",
  "function whitelistMint(uint256 quantity, bytes32[] calldata proof) payable",
  "function publicMint(uint256 quantity) payable",
  "function totalSupply() view returns (uint256)",
  "event SchizoMint(address indexed minter, uint256 quantity)",
  "event WhitelistMint(address indexed minter, uint256 quantity)",
  "event PublicMint(address indexed minter, uint256 quantity)",
] as const

export const XVOID_VAULT_ABI = [
  "function stake(uint256 amount, uint256 lockPeriod)",
  "function unstake()",
  "function getStakeInfo(address user) view returns (uint256 stakedAmount, uint256 xVoidBalance, uint256 lockEnd, uint256 multiplier, bool isLocked)",
  "function totalStakedVOID() view returns (uint256)",
  "function totalRewardsDistributed() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "event Staked(address indexed user, uint256 amount, uint256 lockEnd, uint256 multiplier)",
  "event Unstaked(address indexed user, uint256 amount)",
] as const

export const METAVERSE_LAND_ABI = [
  "function parcels(uint256 tokenId) view returns (int256 x, int256 z, uint256 size, string zone, uint256 price, bool isListed)",
  "function buyParcel(uint256 tokenId) payable",
  "function listParcel(uint256 tokenId, uint256 price)",
  "function unlistParcel(uint256 tokenId)",
  "function getParcelsByOwner(address owner) view returns (uint256[])",
  "function balanceOf(address owner) view returns (uint256)",
  "event ParcelPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price)",
] as const

export const SKU_FACTORY_ABI = [
  "function createSKU(uint256 price, uint256 supply, string metadataURI) returns (uint256)",
  "function purchaseSKU(uint256 skuId, uint256 quantity) payable",
  "function getSKU(uint256 skuId) view returns (address creator, uint256 price, uint256 supply, uint256 minted, string metadataURI, uint256 creatorShare, bool active)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "event SKUCreated(uint256 indexed skuId, address indexed creator, uint256 price, uint256 supply, string metadataURI)",
  "event SKUPurchased(uint256 indexed skuId, address indexed buyer, uint256 quantity, uint256 totalPrice)",
] as const

export const FEE_DISTRIBUTOR_ABI = [
  "function distributeFees()",
  "function totalDistributed() view returns (uint256)",
  "event FeesDistributed(uint256 xVoidAmount, uint256 psxAmount, uint256 createAmount, uint256 cdnAmount, uint256 vaultAmount)",
] as const
