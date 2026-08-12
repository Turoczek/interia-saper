import { describe, expect, it } from 'vitest'
import { chordReveal } from './chord'
import { createBoard, revealCell, toggleFlag, type Level } from './board'

// 3x2 board, index = y*3+x:
//   0 1 2
//   3 4 5   (mine at 5)
const gridLevel: Level = {
  id: 'grid',
  name: 'Grid',
  width: 3,
  height: 2,
  mineCount: 1,
  mines: [[2, 1]],
}

describe('chordReveal', () => {
  it('reveals the remaining neighbor once flags correctly mark the mine', () => {
    let board = createBoard(gridLevel)
    board = revealCell(board, 0) // cascades to reveal 0, 1, 3, 4; leaves 2 and 5 (mine) hidden
    board = toggleFlag(board, 5) // flag the actual mine

    const after = chordReveal(board, 4)

    expect(after.cells[2].revealed).toBe(true)
    expect(after.state).not.toBe('lost')
  })

  it('loses when the flag was placed on the wrong cell', () => {
    let board = createBoard(gridLevel)
    board = revealCell(board, 0)
    board = toggleFlag(board, 2) // flag the wrong (safe) cell, not the mine

    const after = chordReveal(board, 4)

    expect(after.state).toBe('lost')
  })

  it('does nothing when the flagged count does not match the number', () => {
    let board = createBoard(gridLevel)
    board = revealCell(board, 0)

    const after = chordReveal(board, 4)

    expect(after).toBe(board)
  })

  it('is a no-op on a hidden cell, a mine, or an out-of-range index', () => {
    const board = createBoard(gridLevel)

    expect(chordReveal(board, 2)).toBe(board)
    expect(() => chordReveal(board, 9999)).not.toThrow()
    expect(chordReveal(board, 9999)).toBe(board)
  })
})
