export interface District {
  id: string
  name: string
  centerX: number
  centerZ: number
  sizeX: number
  sizeZ: number
  color: string
  parcelCount: number
  description: string
  requirements?: {
    minLevel?: number
    token?: string
  }
}

export const DISTRICTS: District[] = [
  {
    id: "spawn-zone",
    name: "Spawn Zone",
    centerX: 0,
    centerZ: 0,
    sizeX: 200,
    sizeZ: 200,
    color: "#06FFA5",
    parcelCount: 400,
    description: "The central hub of VOID City. Home to PSX HQ and the main gathering area for all players.",
  },
  {
    id: "residential-north",
    name: "Residential North",
    centerX: 0,
    centerZ: -250,
    sizeX: 200,
    sizeZ: 200,
    color: "#3B82F6",
    parcelCount: 400,
    description: "Peaceful residential district with family homes and apartments. A quiet neighborhood for living.",
  },
  {
    id: "commercial-east",
    name: "Commercial East",
    centerX: 250,
    centerZ: 0,
    sizeX: 200,
    sizeZ: 200,
    color: "#F59E0B",
    parcelCount: 400,
    description: "Bustling commercial district filled with shops, restaurants, and businesses.",
  },
  {
    id: "defi-district",
    name: "DeFi District",
    centerX: -250,
    centerZ: 0,
    sizeX: 200,
    sizeZ: 200,
    color: "#8B5CF6",
    parcelCount: 400,
    description: "The financial heart of VOID. Trade, stake, and manage your crypto assets here.",
    requirements: {
      minLevel: 5,
    },
  },
  {
    id: "entertainment-south",
    name: "Entertainment South",
    centerX: 0,
    centerZ: 250,
    sizeX: 200,
    sizeZ: 200,
    color: "#EC4899",
    parcelCount: 400,
    description: "Casino, gaming halls, and entertainment venues. The nightlife capital of VOID City.",
  },
  {
    id: "social-plaza",
    name: "Social Plaza",
    centerX: -250,
    centerZ: -250,
    sizeX: 200,
    sizeZ: 200,
    color: "#10B981",
    parcelCount: 400,
    description: "Community gathering spaces, event venues, and social hubs. Connect with other players here.",
  },
  {
    id: "tech-sector",
    name: "Tech Sector",
    centerX: 250,
    centerZ: -250,
    sizeX: 200,
    sizeZ: 200,
    color: "#06B6D4",
    parcelCount: 400,
    description: "Innovation and technology hub. Creator spaces and development studios.",
  },
  {
    id: "luxury-district",
    name: "Luxury District",
    centerX: 250,
    centerZ: 250,
    sizeX: 200,
    sizeZ: 200,
    color: "#EAB308",
    parcelCount: 400,
    description: "High-end properties and exclusive venues. The most prestigious addresses in VOID City.",
    requirements: {
      token: "FOUNDER_NFT",
    },
  },
  {
    id: "industrial-zone",
    name: "Industrial Zone",
    centerX: -250,
    centerZ: 250,
    sizeX: 200,
    sizeZ: 200,
    color: "#64748B",
    parcelCount: 400,
    description: "Manufacturing and production facilities. Resource generation and crafting zones.",
  },
]

export function getDistrictAt(x: number, z: number): District | null {
  for (const district of DISTRICTS) {
    const halfSizeX = district.sizeX / 2
    const halfSizeZ = district.sizeZ / 2

    const minX = district.centerX - halfSizeX
    const maxX = district.centerX + halfSizeX
    const minZ = district.centerZ - halfSizeZ
    const maxZ = district.centerZ + halfSizeZ

    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
      return district
    }
  }

  return null
}

export function getDistrictById(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id)
}
