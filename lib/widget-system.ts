export type WidgetSize = "small" | "medium" | "large"
export type WidgetPosition = { x: number; y: number }

export interface Widget {
  id: string
  name: string
  component: string
  size: WidgetSize
  position: WidgetPosition
  isMinimized: boolean
  isVisible: boolean
  group?: string
}

export const DEFAULT_WIDGETS: Widget[] = [
  {
    id: "property-manager",
    name: "Property Manager",
    component: "PropertyManagerWidget",
    size: "large",
    position: { x: 20, y: 20 },
    isMinimized: false,
    isVisible: false,
  },
  {
    id: "map",
    name: "City Map",
    component: "MapWidget",
    size: "large",
    position: { x: 50, y: 50 },
    isMinimized: false,
    isVisible: false,
  },
  {
    id: "wallet",
    name: "Wallet",
    component: "WalletWidget",
    size: "medium",
    position: { x: window.innerWidth - 370, y: 20 },
    isMinimized: false,
    isVisible: true,
  },
  {
    id: "chat",
    name: "Chat",
    component: "ChatWidget",
    size: "medium",
    position: { x: 20, y: window.innerHeight - 420 },
    isMinimized: true,
    isVisible: true,
    group: "communication",
  },
  {
    id: "notifications",
    name: "Notifications",
    component: "NotificationsWidget",
    size: "small",
    position: { x: window.innerWidth - 270, y: 80 },
    isMinimized: true,
    isVisible: true,
  },
]

export const WIDGET_SIZES = {
  small: { width: 250, height: 200 },
  medium: { width: 350, height: 300 },
  large: { width: 500, height: 400 },
}

export function getWidgetDimensions(size: WidgetSize) {
  return WIDGET_SIZES[size]
}
