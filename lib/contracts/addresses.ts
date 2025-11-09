// Contract addresses for the PSX-VOID ecosystem
// Update these after deployment

export const CONTRACT_ADDRESSES = {
  // Core Tokens
  VOID_TOKEN: process.env.NEXT_PUBLIC_VOID_TOKEN_ADDRESS || "",
  PSX_TOKEN: process.env.NEXT_PUBLIC_PSX_TOKEN_ADDRESS || "",
  CREATE_TOKEN: process.env.NEXT_PUBLIC_CREATE_TOKEN_ADDRESS || "",

  // NFTs
  FOUNDERS_NFT: process.env.NEXT_PUBLIC_FOUNDERS_NFT_ADDRESS || "",
  METAVERSE_LAND: process.env.NEXT_PUBLIC_METAVERSE_LAND_ADDRESS || "",

  // Staking & Vaults
  XVOID_VAULT: process.env.NEXT_PUBLIC_XVOID_VAULT_ADDRESS || "",

  // SKU System
  SKU_FACTORY: process.env.NEXT_PUBLIC_SKU_FACTORY_ADDRESS || "",

  // Fee Distribution
  FEE_DISTRIBUTOR: process.env.NEXT_PUBLIC_FEE_DISTRIBUTOR_ADDRESS || "",

  // Treasuries
  PSX_TREASURY: process.env.NEXT_PUBLIC_PSX_TREASURY_ADDRESS || "",
  CREATE_DAO: process.env.NEXT_PUBLIC_CREATE_DAO_ADDRESS || "",
  CDN_PARTNERS: process.env.NEXT_PUBLIC_CDN_PARTNERS_ADDRESS || "",
  VAULT_RESERVE: process.env.NEXT_PUBLIC_VAULT_RESERVE_ADDRESS || "",
  INCUBATION_VAULT: process.env.NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS || "",
} as const

export const CHAIN_ID = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "8453") // Base mainnet
