import type { Level } from '../logic/board'

type LevelsFile = {
  levels: Level[]
}

const isTuple = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number'

const isLevel = (value: unknown): value is Level => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    typeof candidate.mineCount === 'number' &&
    Array.isArray(candidate.mines) &&
    candidate.mines.every(isTuple)
  )
}

const isLevelsFile = (value: unknown): value is LevelsFile => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return Array.isArray(candidate.levels) && candidate.levels.every(isLevel)
}

export const loadLevels = async (url = '/saper-plansze.json'): Promise<Level[]> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch levels (status ${response.status})`)
  }

  const data: unknown = await response.json()
  if (!isLevelsFile(data)) {
    throw new Error('Levels file has an invalid shape')
  }

  return data.levels
}
