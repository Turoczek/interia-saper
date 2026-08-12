import type { MouseEvent } from 'react'
import type { Cell as CellType } from '../../logic/board'
import './Cell.scss'

type CellProps = {
  cell: CellType
  gameOver: boolean
  lost: boolean
  onReveal: () => void
  onFlag: () => void
  onChord: () => void
}

const getContent = (cell: CellType, showMine: boolean, showFlag: boolean): string => {
  if (showMine) return '*'
  if (showFlag) return 'F'
  if (cell.revealed && cell.adjacent > 0) return String(cell.adjacent)
  return ''
}

const getAriaLabel = (cell: CellType, showMine: boolean, showFlag: boolean): string => {
  if (showMine) return 'Mina'
  if (showFlag) return 'Oflagowane pole'
  if (!cell.revealed) return 'Ukryte pole'
  if (cell.adjacent > 0) return `Pole odkryte, ${cell.adjacent} sąsiadujących min`
  return 'Puste pole'
}

export const Cell = ({ cell, gameOver, lost, onReveal, onFlag, onChord }: CellProps) => {
  const showMine = cell.mine && (cell.revealed || lost)
  const showFlag = !cell.revealed && cell.flagged

  const className = [
    'cell',
    cell.revealed && 'cell--revealed',
    showFlag && 'cell--flagged',
    showMine && 'cell--mine',
    cell.revealed && cell.mine && 'cell--exploded',
    cell.revealed && !cell.mine && cell.adjacent > 0 && `cell--digit-${cell.adjacent}`,
  ]
    .filter(Boolean)
    .join(' ')

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    onFlag()
  }

  return (
    <button
      type="button"
      className={className}
      onClick={cell.revealed ? onChord : onReveal}
      onContextMenu={handleContextMenu}
      aria-disabled={gameOver}
      aria-label={getAriaLabel(cell, showMine, showFlag)}
    >
      {getContent(cell, showMine, showFlag)}
    </button>
  )
}
