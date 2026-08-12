import { describe, expect, it } from 'vitest'
import { createBoard, revealCell, toggleFlag, type Level } from './board'

// The 8 coordinates surrounding the center cell (1,1) of a 3x3 board.
const neighborsOfCenter: [number, number][] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
]

const makeLevel = (overrides: Partial<Level>): Level => ({
  id: 'test',
  name: 'Test',
  width: 3,
  height: 3,
  mineCount: 0,
  mines: [],
  ...overrides,
})

describe('createBoard', () => {
  it('builds a board with correct dimensions and adjacency counts', () => {
    const level = makeLevel({ width: 3, height: 3, mineCount: 1, mines: [[1, 1]] })
    const board = createBoard(level)

    expect(board.width).toBe(3)
    expect(board.height).toBe(3)
    expect(board.cells).toHaveLength(9)
    expect(board.state).toBe('idle')
    expect(board.cells[4].mine).toBe(true)
    expect(board.cells[0].adjacent).toBe(1)
    expect(board.cells[2].adjacent).toBe(1)
  })

  it('sanitizes malformed level data instead of crashing', () => {
    const duplicateAndOutOfBounds = makeLevel({
      width: 3,
      height: 3,
      mineCount: 99,
      mines: [[0, 0], [0, 0], [5, 5], [-1, 0]],
    })

    const board = createBoard(duplicateAndOutOfBounds)

    expect(board.cells.filter((cell) => cell.mine)).toHaveLength(1)
    expect(board.cells[0].mine).toBe(true)
  })
})

describe('liczba sasiadujacych min (0-8)', () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8])(
    'center cell reports adjacent = %i when exactly %i of its 8 neighbors are mines',
    (count) => {
      const level = makeLevel({
        width: 3,
        height: 3,
        mineCount: count,
        mines: neighborsOfCenter.slice(0, count),
      })

      const board = createBoard(level)

      expect(board.cells[4].mine).toBe(false)
      expect(board.cells[4].adjacent).toBe(count)
    },
  )

  it('a corner cell caps at its real neighbor count (3), not 8', () => {
    const level = makeLevel({
      width: 3,
      height: 3,
      mineCount: 3,
      mines: [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
    })

    const board = createBoard(level)

    expect(board.cells[0].adjacent).toBe(3)
  })

  it('an edge cell caps at its real neighbor count (5), not 8', () => {
    const level = makeLevel({
      width: 3,
      height: 3,
      mineCount: 5,
      mines: [
        [0, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    })

    const board = createBoard(level)

    expect(board.cells[1].adjacent).toBe(5)
  })
})

describe('pierwsze odkrycie', () => {
  it('relocates a mine hit on the first click to the lowest safe index', () => {
    const level = makeLevel({ width: 3, height: 1, mineCount: 1, mines: [[0, 0]] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.state).not.toBe('lost')
    expect(after.cells[0].mine).toBe(false)
    expect(after.cells[0].revealed).toBe(true)
    expect(after.cells[1].mine).toBe(true)
    expect(after.cells[0].adjacent).toBe(1)
  })

  it('loses on the first click when no safe cell exists to relocate the mine to', () => {
    const level = makeLevel({ width: 2, height: 1, mineCount: 2, mines: [[0, 0], [1, 0]] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.state).toBe('lost')
    expect(after.cells[0].mine).toBe(true)
  })
})

describe('kaskada', () => {
  it('reveals connected zero-adjacent cells and stops at numbered cells', () => {
    const level = makeLevel({ width: 5, height: 1, mineCount: 1, mines: [[4, 0]] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.cells[0].revealed).toBe(true)
    expect(after.cells[1].revealed).toBe(true)
    expect(after.cells[2].revealed).toBe(true)
    expect(after.cells[3].revealed).toBe(true)
    expect(after.cells[4].revealed).toBe(false)
  })

  it('never reveals past a flagged cell', () => {
    const level = makeLevel({ width: 5, height: 1, mineCount: 1, mines: [[4, 0]] })
    const board = createBoard(level)
    const withFlag = toggleFlag(board, 2)

    const after = revealCell(withFlag, 0)

    expect(after.cells[0].revealed).toBe(true)
    expect(after.cells[1].revealed).toBe(true)
    expect(after.cells[2].revealed).toBe(false)
    expect(after.cells[3].revealed).toBe(false)
  })
})

describe('warunek wygranej', () => {
  it('wins once every non-mine cell is revealed', () => {
    const level = makeLevel({ width: 2, height: 1, mineCount: 1, mines: [[1, 0]] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.state).toBe('won')
  })

  it('locks the board against further moves after the game ends', () => {
    const level = makeLevel({ width: 2, height: 1, mineCount: 1, mines: [[1, 0]] })
    const board = createBoard(level)
    const won = revealCell(board, 0)

    const noop = revealCell(won, 1)

    expect(noop).toBe(won)
  })
})

describe('flagi', () => {
  it('toggles a flag on and off on an unrevealed cell', () => {
    const board = createBoard(makeLevel({}))

    const flagged = toggleFlag(board, 0)
    expect(flagged.cells[0].flagged).toBe(true)

    const unflagged = toggleFlag(flagged, 0)
    expect(unflagged.cells[0].flagged).toBe(false)
  })

  it('cannot reveal a flagged cell nor flag a revealed cell', () => {
    const board = createBoard(makeLevel({}))

    const flagged = toggleFlag(board, 0)
    const stillHidden = revealCell(flagged, 0)
    expect(stillHidden.cells[0].revealed).toBe(false)

    const revealed = revealCell(board, 1)
    const stillUnflagged = toggleFlag(revealed, 1)
    expect(stillUnflagged.cells[1].flagged).toBe(false)
  })
})

describe('odporność na złe dane wejściowe', () => {
  it('treats an out-of-range index as a no-op instead of crashing', () => {
    const board = createBoard(makeLevel({}))

    expect(() => revealCell(board, 9999)).not.toThrow()
    expect(() => toggleFlag(board, -1)).not.toThrow()
    expect(revealCell(board, 9999)).toBe(board)
  })

  it('treats a non-integer or NaN index as a no-op instead of crashing', () => {
    const board = createBoard(makeLevel({}))

    expect(() => revealCell(board, 1.5)).not.toThrow()
    expect(() => revealCell(board, NaN)).not.toThrow()
    expect(() => toggleFlag(board, NaN)).not.toThrow()
    expect(revealCell(board, NaN)).toBe(board)
  })
})

describe('skrajne przypadki', () => {
  it('a 1x1 board with a mine and nowhere to relocate it loses on the first click', () => {
    const level = makeLevel({ width: 1, height: 1, mineCount: 1, mines: [[0, 0]] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.state).toBe('lost')
    expect(after.cells[0].mine).toBe(true)
  })

  it('revealing an already-revealed cell a second time is a no-op', () => {
    const level = makeLevel({ width: 2, height: 1, mineCount: 1, mines: [[1, 0]] })
    const board = createBoard(level)
    const revealed = revealCell(board, 0)

    const revealedAgain = revealCell(revealed, 0)

    expect(revealedAgain).toBe(revealed)
  })

  it('flagging cells before the first reveal does not consume the safe-first-click rule', () => {
    const level = makeLevel({ width: 3, height: 1, mineCount: 1, mines: [[0, 0]] })
    const board = createBoard(level)
    const withFlags = toggleFlag(toggleFlag(board, 2), 2)

    const after = revealCell(withFlags, 0)

    expect(after.state).not.toBe('lost')
    expect(after.cells[0].mine).toBe(false)
  })

  it('a mineless board is won in a single cascading click', () => {
    const level = makeLevel({ width: 4, height: 4, mineCount: 0, mines: [] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.state).toBe('won')
    expect(after.cells.every((cell) => cell.revealed)).toBe(true)
  })

  it('cascades across a large mineless board without a stack overflow', () => {
    const size = 120
    const level = makeLevel({ width: size, height: size, mineCount: 0, mines: [] })
    const board = createBoard(level)

    const after = revealCell(board, 0)

    expect(after.state).toBe('won')
    expect(after.cells).toHaveLength(size * size)
  })
})
