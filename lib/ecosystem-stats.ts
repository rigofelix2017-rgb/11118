/**
 * Calculate ecosystem-wide statistics and metrics
 * Based on the PSX-VOID whitepaper economics
 */

export interface EcosystemStats {
  // Revenue metrics
  totalVolume: number
  dailyFees: number
  monthlyFees: number
  annualizedFees: number

  // Distribution metrics
  creatorEarnings: number
  xVOIDStakerEarnings: number
  psxTreasuryEarnings: number
  createDAOEarnings: number
  cdnPartnerEarnings: number
  vaultReserveEarnings: number

  // Token metrics
  voidPrice: number
  psxPrice: number
  createPrice: number
  agencyPrice: number

  // Staking metrics
  totalStaked: number
  stakingAPY: number
  xVOIDTotalSupply: number

  // Metaverse metrics
  landSales: number
  activePlayers: number

  // SKU metrics
  totalSKUs: number
  skuSales: number
}

export function calculateEcosystemStats(
  totalDistributed: string,
  totalStaked: string,
  totalRewards: string,
): EcosystemStats {
  const distributed = Number.parseFloat(totalDistributed)
  const staked = Number.parseFloat(totalStaked)
  const rewards = Number.parseFloat(totalRewards)

  // Fee distribution percentages
  const CREATOR_SHARE = 0.45
  const XVOID_SHARE = 0.3
  const PSX_SHARE = 0.15
  const CREATE_SHARE = 0.1
  const CDN_SHARE = 0.1
  const VAULT_SHARE = 0.05

  return {
    totalVolume: distributed * 500, // Reverse calculate from 0.20% fee
    dailyFees: distributed / 30, // Assuming monthly data
    monthlyFees: distributed,
    annualizedFees: distributed * 12,

    creatorEarnings: distributed * CREATOR_SHARE,
    xVOIDStakerEarnings: distributed * XVOID_SHARE,
    psxTreasuryEarnings: distributed * PSX_SHARE,
    createDAOEarnings: distributed * CREATE_SHARE,
    cdnPartnerEarnings: distributed * CDN_SHARE,
    vaultReserveEarnings: distributed * VAULT_SHARE,

    voidPrice: 0.001, // Placeholder - would fetch from oracle/DEX
    psxPrice: 0.05,
    createPrice: 0.03,
    agencyPrice: 1.0,

    totalStaked: staked,
    stakingAPY: staked > 0 ? (rewards / staked) * 100 * XVOID_SHARE : 0,
    xVOIDTotalSupply: staked,

    landSales: 0, // Would track from MetaverseLand contract events
    activePlayers: 0, // Would track from multiplayer server

    totalSKUs: 0, // Would track from SKUFactory contract events
    skuSales: 0,
  }
}
