import { useEffect, useState } from 'react'
import type { Level } from '../logic/board'
import { loadLevels } from './levels'

export type LevelsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; levels: Level[] }

export const useLevels = (): LevelsState => {
  const [state, setState] = useState<LevelsState>({ status: 'loading' })

  useEffect(() => {
    loadLevels()
      .then((levels) => setState({ status: 'ready', levels }))
      .catch((err: unknown) => {
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Nie udało się wczytać plansz',
        })
      })
  }, [])

  return state
}
