export type GameZone = {
  id: string
  name: string
  title: string
  subtitle?: string
  description: string
  icon?: string
  color: string
  radius: number
  position: { x: number; y: number; z: number }
  actions: { id: string; label: string; primary?: boolean }[]
}

export const ZONES: GameZone[] = [
  {
    id: "psx-hq",
    name: "PSX HQ",
    title: "PSX Agency HQ",
    subtitle: "Command node for creators",
    description: "Manage IP, missions, and on-chain campaigns.",
    icon: "◆",
    color: "#06FFA5",
    radius: 7, // Reduced from 25 to 7 - zone pad now fits plaza
    position: { x: 0, y: 0, z: 0 },
    actions: [
      { id: "open-dashboard", label: "Open Agency Dashboard", primary: true },
      { id: "view-missions", label: "View Active Missions" },
    ],
  },
  {
    id: "dex-plaza",
    name: "DEX Plaza",
    title: "On-Chain DEX Terminal",
    subtitle: "Swap, LP, rebalance",
    description: "Access PSX pairs, farm fees, and track VOID-style flows.",
    icon: "₿",
    color: "#00D9FF",
    radius: 6, // Reduced from 18 to 6 for tighter pad
    position: { x: 60, y: 0, z: -40 },
    actions: [
      { id: "open-dex", label: "Open DEX Widget", primary: true },
      { id: "view-pairs", label: "View Featured Pairs" },
    ],
  },
  {
    id: "casino-strip",
    name: "Casino Strip",
    title: "Neon Casino Row",
    subtitle: "Risk engine",
    description: "Spin, roll, and experiment with VOID-style mini-games.",
    icon: "🎰",
    color: "#FF006E",
    radius: 7, // Reduced from 20 to 7
    position: { x: -60, y: 0, z: -60 },
    actions: [
      { id: "open-casino", label: "Enter Casino", primary: true },
      { id: "view-odds", label: "View Win Rates" },
    ],
  },
  {
    id: "housing",
    name: "Housing District",
    title: "Creator Housing Blocks",
    subtitle: "Apartments, studios, storage",
    description: "Procedural housing tied to wallets, IP, and roles.",
    icon: "🏙",
    color: "#8B5CF6",
    radius: 6, // Reduced from 22 to 6
    position: { x: 80, y: 0, z: 60 },
    actions: [
      { id: "open-housing", label: "Enter Housing", primary: true },
      { id: "manage-land", label: "Manage Land / Rooms" },
    ],
  },
  {
    id: "signal-lab",
    name: "Signal Lab",
    title: "Signal Processing Lab",
    subtitle: "Lore, ciphers, PSX transmissions",
    description: "Drop fables, decode ciphers, and tune into The Signal.",
    icon: "📡",
    color: "#F72585",
    radius: 6, // Reduced from 18 to 6
    position: { x: -50, y: 0, z: 70 },
    actions: [
      { id: "open-signal", label: "Open Signal Terminal", primary: true },
      { id: "view-lore", label: "Browse Lore Drops" },
    ],
  },
]
