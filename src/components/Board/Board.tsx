import type { CSSProperties } from 'react'
import type { Board as BoardType } from '../../logic/board'
import { Cell } from '../Cell/Cell'
import './Board.scss'

type BoardProps = {
  board: BoardType
  onReveal: (index: number) => void
  onFlag: (index: number) => void
  onChord: (index: number) => void
}

export const Board = ({ board, onReveal, onFlag, onChord }: BoardProps) => {
  const lost = board.state === 'lost'
  const gameOver = board.state === 'won' || lost

  const style = {
    '--board-columns': board.width,
  } as CSSProperties

  return (
    <div className="board" style={style} role="group" aria-label="Plansza sapera">
      {board.cells.map((cell, index) => (
        <Cell
          key={index}
          cell={cell}
          gameOver={gameOver}
          lost={lost}
          onReveal={() => onReveal(index)}
          onFlag={() => onFlag(index)}
          onChord={() => onChord(index)}
        />
      ))}
    </div>
  )
}
