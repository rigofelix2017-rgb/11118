export type Building = {
  id: string
  type: "residential" | "commercial" | "mixed" | "special"
  x: number
  z: number
  width: number
  depth: number
  height: number
  modelPath?: string
  forSale?: boolean
  price?: number
}

export type Road = {
  id: string
  from: [number, number, number]
  to: [number, number, number]
  width: number
}

export const WORLD_BOUNDS = {
  minX: -2000,
  maxX: 2000,
  minZ: -2000,
  maxZ: 2000,
}

export const CITY_BOUNDS = {
  minX: -300,
  maxX: 300,
  minZ: -120,
  maxZ: 120,
}

// ===== CITY GRID SYSTEM =====
// Main Avenue (horizontal): z = 0, width 14 (z: -7 to +7)
// North Street: z = -40, width 10 (z: -45 to -35)
// South Street: z = 40, width 10 (z: 35 to 45)
// Cross Street (vertical): x = 0, width 12 (x: -6 to +6)
// West Street: x = -60, width 8 (x: -64 to -56)
// East Street: x = 60, width 8 (x: 56 to 64)

// Sidewalks: 2 units on each side of roads
// Building plots MUST be at least 3 units away from road centers

export const ROADS: Road[] = [
  // Horizontal Roads
  { id: "main-avenue", from: [-300, 0, 0], to: [300, 0, 0], width: 14 },
  { id: "north-street", from: [-300, 0, -40], to: [300, 0, -40], width: 10 },
  { id: "south-street", from: [-300, 0, 40], to: [300, 0, 40], width: 10 },

  // Vertical Roads
  { id: "cross-street", from: [0, 0, -120], to: [0, 0, 120], width: 12 },
  { id: "west-street", from: [-60, 0, -120], to: [-60, 0, 120], width: 8 },
  { id: "east-street", from: [60, 0, -120], to: [60, 0, 120], width: 8 },
]

export const BUILDINGS: Building[] = [
  // ==================== NORTHWEST DISTRICT ====================
  // Between West Street (x=-60) and Cross Street (x=0), North of North Street (z < -45)

  // PSX HQ (Special Building at spawn) - ADJUSTED away from roads
  {
    id: "psx-hq",
    type: "special",
    x: -30,
    z: -65,
    width: 18,
    depth: 18,
    height: 28,
    forSale: false,
  },

  // Commercial buildings near HQ
  {
    id: "nw-commercial-1",
    type: "commercial",
    x: -85,
    z: -65,
    width: 14,
    depth: 14,
    height: 22,
    forSale: true,
    price: 50000,
  },
  {
    id: "nw-commercial-2",
    type: "commercial",
    x: -85,
    z: -90,
    width: 12,
    depth: 12,
    height: 20,
    forSale: true,
    price: 45000,
  },
  {
    id: "nw-commercial-3",
    type: "commercial",
    x: -30,
    z: -90,
    width: 13,
    depth: 13,
    height: 21,
    forSale: true,
    price: 48000,
  },

  // ==================== NORTH-CENTER DISTRICT ====================
  // Between Cross Street (x=0) and East Street (x=60), North of North Street (z < -45)

  {
    id: "nc-mixed-1",
    type: "mixed",
    x: 25,
    z: -65,
    width: 15,
    depth: 15,
    height: 24,
    forSale: true,
    price: 55000,
  },
  {
    id: "nc-commercial-1",
    type: "commercial",
    x: 80,
    z: -65,
    width: 13,
    depth: 13,
    height: 21,
    forSale: true,
    price: 47000,
  },
  {
    id: "nc-commercial-2",
    type: "commercial",
    x: 25,
    z: -90,
    width: 12,
    depth: 12,
    height: 19,
    forSale: true,
    price: 44000,
  },
  {
    id: "nc-mixed-2",
    type: "mixed",
    x: 80,
    z: -90,
    width: 14,
    depth: 14,
    height: 23,
    forSale: true,
    price: 52000,
  },

  // ==================== WEST-CENTER DISTRICT ====================
  // West of West Street (x < -64), between North and South Streets

  {
    id: "wc-residential-1",
    type: "residential",
    x: -90,
    z: -20,
    width: 11,
    depth: 11,
    height: 16,
    forSale: true,
    price: 35000,
  },
  {
    id: "wc-residential-2",
    type: "residential",
    x: -90,
    z: 20,
    width: 10,
    depth: 10,
    height: 15,
    forSale: true,
    price: 33000,
  },

  // ==================== CENTER-WEST DISTRICT ====================
  // Between West Street (x=-60) and Cross Street (x=0), between North and South Streets

  {
    id: "cw-commercial-1",
    type: "commercial",
    x: -30,
    z: -20,
    width: 13,
    depth: 13,
    height: 20,
    forSale: true,
    price: 46000,
  },
  {
    id: "cw-mixed-1",
    type: "mixed",
    x: -30,
    z: 20,
    width: 14,
    depth: 14,
    height: 22,
    forSale: true,
    price: 51000,
  },

  // ==================== CENTER-EAST DISTRICT ====================
  // Between Cross Street (x=0) and East Street (x=60), between North and South Streets

  // DEX Plaza (Special Building) - ADJUSTED
  {
    id: "dex-plaza",
    type: "special",
    x: 25,
    z: -20,
    width: 16,
    depth: 16,
    height: 26,
    forSale: false,
  },
  {
    id: "ce-commercial-1",
    type: "commercial",
    x: 25,
    z: 20,
    width: 13,
    depth: 13,
    height: 21,
    forSale: true,
    price: 49000,
  },

  // ==================== EAST-CENTER DISTRICT ====================
  // East of East Street (x > 64), between North and South Streets

  {
    id: "ec-residential-1",
    type: "residential",
    x: 90,
    z: -20,
    width: 10,
    depth: 10,
    height: 14,
    forSale: true,
    price: 32000,
  },
  {
    id: "ec-residential-2",
    type: "residential",
    x: 90,
    z: 20,
    width: 11,
    depth: 11,
    height: 16,
    forSale: true,
    price: 36000,
  },

  // ==================== SOUTHWEST DISTRICT ====================
  // Between West Street (x=-60) and Cross Street (x=0), South of South Street (z > 45)

  // Casino District
  {
    id: "sw-casino-1",
    type: "commercial",
    x: -85,
    z: 65,
    width: 16,
    depth: 16,
    height: 28,
    forSale: true,
    price: 75000,
  },
  {
    id: "sw-casino-2",
    type: "commercial",
    x: -30,
    z: 65,
    width: 15,
    depth: 15,
    height: 26,
    forSale: true,
    price: 70000,
  },
  {
    id: "sw-casino-3",
    type: "commercial",
    x: -85,
    z: 90,
    width: 14,
    depth: 14,
    height: 24,
    forSale: true,
    price: 65000,
  },
  {
    id: "sw-mixed-1",
    type: "mixed",
    x: -30,
    z: 90,
    width: 13,
    depth: 13,
    height: 22,
    forSale: true,
    price: 53000,
  },

  // ==================== SOUTH-CENTER DISTRICT ====================
  // Between Cross Street (x=0) and East Street (x=60), South of South Street (z > 45)

  {
    id: "sc-residential-1",
    type: "residential",
    x: 25,
    z: 65,
    width: 12,
    depth: 12,
    height: 18,
    forSale: true,
    price: 38000,
  },
  {
    id: "sc-residential-2",
    type: "residential",
    x: 80,
    z: 65,
    width: 11,
    depth: 11,
    height: 17,
    forSale: true,
    price: 37000,
  },
  {
    id: "sc-residential-3",
    type: "residential",
    x: 25,
    z: 90,
    width: 10,
    depth: 10,
    height: 15,
    forSale: true,
    price: 34000,
  },
  {
    id: "sc-residential-4",
    type: "residential",
    x: 80,
    z: 90,
    width: 12,
    depth: 12,
    height: 19,
    forSale: true,
    price: 40000,
  },
]

export function buildingColliders() {
  return BUILDINGS.map((b) => ({
    x: b.x,
    z: b.z,
    width: b.width,
    depth: b.depth,
  }))
}

// Helper to check if coordinates are on a road
export function isOnRoad(x: number, z: number): boolean {
  // Check horizontal roads
  if (Math.abs(z) <= 7) return true // Main Avenue
  if (Math.abs(z + 40) <= 5) return true // North Street
  if (Math.abs(z - 40) <= 5) return true // South Street

  // Check vertical roads
  if (Math.abs(x) <= 6) return true // Cross Street
  if (Math.abs(x + 60) <= 4) return true // West Street
  if (Math.abs(x - 60) <= 4) return true // East Street

  return false
}

// Get all properties by type
export function getPropertiesByType(type: Building["type"]) {
  return BUILDINGS.filter((b) => b.type === type)
}

// Get all properties for sale
export function getPropertiesForSale() {
  return BUILDINGS.filter((b) => b.forSale === true)
}
