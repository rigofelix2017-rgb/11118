export function xpForLevel(level: number): number {
  return 100 * level * level
}

export function levelFromXp(totalXp: number): number {
  let level = 0
  while (totalXp >= xpForLevel(level + 1)) {
    level++
  }
  return level
}
