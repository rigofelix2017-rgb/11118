import type { XpEventType, XpAward } from "./types"

export function baseXpForEvent(type: XpEventType, value?: number): XpAward {
  switch (type) {
    case "ZONE_FIRST_VISIT":
      return { track: "explorer", amount: 50 }
    case "ZONE_DAILY_VISIT":
      return { track: "explorer", amount: 10 }
    case "DISTRICT_LOOP":
      return { track: "explorer", amount: 30 }
    case "MOVEMENT_CHUNK":
      return { track: "explorer", amount: 5 }
    case "PROXIMITY_CHAT_MESSAGE":
      return { track: "explorer", amount: 30 }
    case "SKU_MINT":
      return { track: "builder", amount: 100 }
    case "SKU_SALE":
      return { track: "builder", amount: 20 }
    case "LAND_REVENUE":
      return { track: "builder", amount: 25 }
    case "VOID_SWAP":
      return { track: "operator", amount: Math.floor((value ?? 0) / 100) }
    case "XVOID_STAKE":
      return { track: "operator", amount: 50 }
    case "PSX_PLEDGE":
      return { track: "operator", amount: 30 }
    case "GOV_VOTE":
      return { track: "operator", amount: 25 }
    case "GOV_PROPOSAL_PASSED":
      return { track: "operator", amount: 100 }
  }
}
