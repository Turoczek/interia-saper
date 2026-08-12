import { revealCell, type Board } from './board'

const neighborIndexes = (index: number, width: number, height: number): number[] => {
  const x = index % width
  const y = Math.floor(index / width)
  const result: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        result.push(ny * width + nx)
      }
    }
  }
  return result
}

export const chordReveal = (board: Board, index: number): Board => {
  if (board.state === 'won' || board.state === 'lost') return board

  const cell = board.cells[index]
  if (!cell || !cell.revealed || cell.mine) return board

  const neighbors = neighborIndexes(index, board.width, board.height)
  const flaggedCount = neighbors.filter((n) => board.cells[n].flagged).length
  if (flaggedCount !== cell.adjacent) return board

  return neighbors.reduce((current, neighborIndex) => {
    const neighborCell = current.cells[neighborIndex]
    if (neighborCell.flagged || neighborCell.revealed) return current
    return revealCell(current, neighborIndex)
  }, board)
}
