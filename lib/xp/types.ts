export type XpTrack = "explorer" | "builder" | "operator"

export interface PlayerXp {
  totalXp: number
  explorerXp: number
  builderXp: number
  operatorXp: number
  level: number
}

export interface DailyTask {
  id: string
  label: string
  description: string
  xpReward: number
  progress: number
  target: number
  completed: boolean
  track: XpTrack
}

export type XpEventType =
  | "ZONE_FIRST_VISIT"
  | "ZONE_DAILY_VISIT"
  | "DISTRICT_LOOP"
  | "MOVEMENT_CHUNK"
  | "SKU_MINT"
  | "SKU_SALE"
  | "LAND_REVENUE"
  | "VOID_SWAP"
  | "XVOID_STAKE"
  | "PSX_PLEDGE"
  | "GOV_VOTE"
  | "GOV_PROPOSAL_PASSED"
  | "PROXIMITY_CHAT_MESSAGE"

export interface XpAward {
  track: XpTrack
  amount: number
}
