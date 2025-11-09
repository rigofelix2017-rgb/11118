import { type Building, BUILDINGS } from "./city-assets"

export interface PropertyOwnership {
  propertyId: string
  owner: string // wallet address
  purchaseDate: number
  purchasePrice: number
  currentValue: number
}

export interface PropertyListing {
  building: Building
  isOwned: boolean
  owner?: string
  listingPrice: number
  appreciation: number // percentage change
  monthlyIncome?: number // rental income for commercial properties
}

// In-memory property registry (will be replaced with on-chain data later)
class PropertyRegistry {
  private ownedProperties: Map<string, PropertyOwnership> = new Map()
  private marketData: Map<string, { basePrice: number; valueMultiplier: number }> = new Map()

  constructor() {
    // Initialize market data for all properties
    BUILDINGS.forEach((building) => {
      const basePrice = building.price || this.calculateBasePrice(building)
      this.marketData.set(building.id, {
        basePrice,
        valueMultiplier: 1.0,
      })
    })
  }

  // Calculate base price based on building characteristics
  private calculateBasePrice(building: Building): number {
    const sizeValue = building.width * building.depth * 1000
    const heightValue = building.height * 500
    const typeMultiplier = {
      residential: 1.0,
      commercial: 1.5,
      mixed: 1.3,
      special: 2.0,
    }[building.type]

    return Math.floor((sizeValue + heightValue) * typeMultiplier)
  }

  // Get all properties with their listing information
  getAllListings(): PropertyListing[] {
    return BUILDINGS.map((building) => {
      const ownership = this.ownedProperties.get(building.id)
      const marketData = this.marketData.get(building.id)!
      const currentValue = Math.floor(marketData.basePrice * marketData.valueMultiplier)

      return {
        building,
        isOwned: !!ownership,
        owner: ownership?.owner,
        listingPrice: currentValue,
        appreciation: (marketData.valueMultiplier - 1) * 100,
        monthlyIncome: building.type === "commercial" ? Math.floor(currentValue * 0.05) : undefined,
      }
    })
  }

  // Get properties by type
  getPropertiesByType(type: Building["type"]): PropertyListing[] {
    return this.getAllListings().filter((listing) => listing.building.type === type)
  }

  // Get available properties (for sale)
  getAvailableProperties(): PropertyListing[] {
    return this.getAllListings().filter((listing) => !listing.isOwned && listing.building.forSale)
  }

  // Get owned properties by wallet
  getOwnedProperties(walletAddress: string): PropertyListing[] {
    return this.getAllListings().filter((listing) => listing.owner === walletAddress)
  }

  // Purchase a property
  purchaseProperty(propertyId: string, buyer: string, price: number): boolean {
    const existing = this.ownedProperties.get(propertyId)
    if (existing) {
      console.error("[v0] Property already owned")
      return false
    }

    const building = BUILDINGS.find((b) => b.id === propertyId)
    if (!building || !building.forSale) {
      console.error("[v0] Property not available for sale")
      return false
    }

    this.ownedProperties.set(propertyId, {
      propertyId,
      owner: buyer,
      purchaseDate: Date.now(),
      purchasePrice: price,
      currentValue: price,
    })

    console.log("[v0] Property purchased:", propertyId, "by", buyer)
    return true
  }

  // Get property details
  getPropertyDetails(propertyId: string): PropertyListing | null {
    const building = BUILDINGS.find((b) => b.id === propertyId)
    if (!building) return null

    const ownership = this.ownedProperties.get(propertyId)
    const marketData = this.marketData.get(propertyId)!
    const currentValue = Math.floor(marketData.basePrice * marketData.valueMultiplier)

    return {
      building,
      isOwned: !!ownership,
      owner: ownership?.owner,
      listingPrice: currentValue,
      appreciation: (marketData.valueMultiplier - 1) * 100,
      monthlyIncome: building.type === "commercial" ? Math.floor(currentValue * 0.05) : undefined,
    }
  }

  // Simulate market value changes
  updateMarketValues() {
    this.marketData.forEach((data, propertyId) => {
      // Random market fluctuation between -2% and +3%
      const change = Math.random() * 0.05 - 0.02
      data.valueMultiplier *= 1 + change
      // Clamp between 0.5x and 3x
      data.valueMultiplier = Math.max(0.5, Math.min(3.0, data.valueMultiplier))
    })
  }

  // Get portfolio statistics for a wallet
  getPortfolioStats(walletAddress: string) {
    const owned = this.getOwnedProperties(walletAddress)
    const totalValue = owned.reduce((sum, listing) => sum + listing.listingPrice, 0)
    const totalIncome = owned.reduce((sum, listing) => sum + (listing.monthlyIncome || 0), 0)
    const totalInvested = owned.reduce((sum, listing) => {
      const ownership = this.ownedProperties.get(listing.building.id)
      return sum + (ownership?.purchasePrice || 0)
    }, 0)

    return {
      propertiesOwned: owned.length,
      totalValue,
      totalInvested,
      totalProfit: totalValue - totalInvested,
      monthlyIncome: totalIncome,
      roi: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
    }
  }
}

// Singleton instance
export const propertyRegistry = new PropertyRegistry()

// Simulate market updates every 30 seconds
if (typeof window !== "undefined") {
  setInterval(() => {
    propertyRegistry.updateMarketValues()
  }, 30000)
}
