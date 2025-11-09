"use client"

export function useFeeDistribution() {
  // Fee distribution breakdown per tokenomics
  const distributionBreakdown = {
    xVoid: 40, // 40% to xVOID stakers
    psx: 20, // 20% to PSX Treasury
    create: 20, // 20% to CREATE DAO
    cdn: 10, // 10% to CDN Partners
    vault: 10, // 10% to Vault Reserve
  }

  return {
    distributionBreakdown,
  }
}
