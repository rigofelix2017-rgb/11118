"use client"

import { useState, useCallback } from "react"
import { DEFAULT_WIDGETS, type Widget, type WidgetSize, type WidgetPosition } from "@/lib/widget-system"

export function useWidgetManager() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w)))
  }, [])

  const minimizeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, isMinimized: true } : w)))
  }, [])

  const maximizeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, isMinimized: false } : w)))
  }, [])

  const updateWidgetPosition = useCallback((widgetId: string, position: WidgetPosition) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, position } : w)))
  }, [])

  const updateWidgetSize = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, size } : w)))
  }, [])

  const toggleGroup = useCallback(
    (groupName: string) => {
      setSelectedGroup((prev) => (prev === groupName ? null : groupName))
      setWidgets((prev) =>
        prev.map((w) => (w.group === groupName ? { ...w, isVisible: selectedGroup !== groupName } : w)),
      )
    },
    [selectedGroup],
  )

  const getWidgetsByGroup = useCallback(
    (groupName: string) => {
      return widgets.filter((w) => w.group === groupName)
    },
    [widgets],
  )

  const getVisibleWidgets = useCallback(() => {
    return widgets.filter((w) => w.isVisible)
  }, [widgets])

  return {
    widgets,
    toggleWidget,
    minimizeWidget,
    maximizeWidget,
    updateWidgetPosition,
    updateWidgetSize,
    toggleGroup,
    getWidgetsByGroup,
    getVisibleWidgets,
  }
}
