import type { MouseEvent } from 'react'
import type { Cell as CellType } from '../../logic/board'
import './Cell.scss'

type CellProps = {
  cell: CellType
  gameOver: boolean
  onReveal: () => void
  onFlag: () => void
}

const getContent = (cell: CellType, gameOver: boolean): string => {
  if (cell.mine && (cell.revealed || gameOver)) return '*'
  if (!cell.revealed && cell.flagged) return 'F'
  if (cell.revealed && cell.adjacent > 0) return String(cell.adjacent)
  return ''
}

const getAriaLabel = (cell: CellType, gameOver: boolean): string => {
  if (cell.mine && (cell.revealed || gameOver)) return 'Mina'
  if (!cell.revealed && cell.flagged) return 'Oflagowane pole'
  if (!cell.revealed) return 'Ukryte pole'
  if (cell.adjacent > 0) return `Pole odkryte, ${cell.adjacent} sasiadujacych min`
  return 'Puste pole'
}

export const Cell = ({ cell, gameOver, onReveal, onFlag }: CellProps) => {
  const showMine = cell.mine && (cell.revealed || gameOver)

  const className = [
    'cell',
    cell.revealed && 'cell--revealed',
    !cell.revealed && cell.flagged && 'cell--flagged',
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
      onClick={onReveal}
      onContextMenu={handleContextMenu}
      disabled={gameOver || cell.revealed}
      aria-label={getAriaLabel(cell, gameOver)}
    >
      {getContent(cell, gameOver)}
    </button>
  )
}
