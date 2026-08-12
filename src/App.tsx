import { useEffect, useState } from 'react'
import { Board as BoardView } from './components/Board/Board'
import { useLevels } from './data/useLevels'
import { createBoard, revealCell, toggleFlag, type Board, type Level } from './logic/board'
import { chordReveal } from './logic/chord'
import './App.scss'

function App() {
  const levelsState = useLevels()
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)
  const [board, setBoard] = useState<Board | null>(null)

  useEffect(() => {
    if (levelsState.status !== 'ready') return
    const first = levelsState.levels[0]
    if (first) {
      setSelectedLevelId(first.id)
      setBoard(createBoard(first))
    }
  }, [levelsState])

  const selectLevel = (level: Level): void => {
    setSelectedLevelId(level.id)
    setBoard(createBoard(level))
  }

  const restart = (): void => {
    if (levelsState.status !== 'ready') return
    const level = levelsState.levels.find((l) => l.id === selectedLevelId)
    if (level) setBoard(createBoard(level))
  }

  const handleReveal = (index: number): void => {
    if (!board) return
    setBoard(revealCell(board, index))
  }

  const handleFlag = (index: number): void => {
    if (!board) return
    setBoard(toggleFlag(board, index))
  }

  const handleChord = (index: number): void => {
    if (!board) return
    setBoard(chordReveal(board, index))
  }

  return (
    <main className="app">
      <h1 className="app__title">Saper</h1>

      {levelsState.status === 'loading' && (
        <p className="status-message" role="status">
          Wczytywanie plansz...
        </p>
      )}

      {levelsState.status === 'error' && (
        <p className="status-message status-message--error" role="alert">
          {levelsState.message}
        </p>
      )}

      {levelsState.status === 'ready' && (
        <nav className="toolbar" aria-label="Wybór poziomu">
          {levelsState.levels.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-pressed={level.id === selectedLevelId}
              className={
                level.id === selectedLevelId
                  ? 'toolbar__level-button toolbar__level-button--active'
                  : 'toolbar__level-button'
              }
              onClick={() => selectLevel(level)}
            >
              {level.name}
            </button>
          ))}
          <button type="button" className="toolbar__restart-button" onClick={restart}>
            Restart
          </button>
        </nav>
      )}

      {board && (
        <>
          <p className="status-message" role="status">
            Stan: {board.state}
          </p>
          <BoardView
            board={board}
            onReveal={handleReveal}
            onFlag={handleFlag}
            onChord={handleChord}
          />
        </>
      )}
    </main>
  )
}

export default App
