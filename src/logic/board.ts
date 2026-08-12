export type Level = {
  id: string;
  name: string;
  width: number;
  height: number;
  mineCount: number;
  mines: [number, number][];
};

export type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

export type Board = {
  width: number;
  height: number;
  cells: Cell[];
  state: "idle" | "playing" | "won" | "lost";
};

function neighborIndexes(
  index: number,
  width: number,
  height: number,
): number[] {
  const x = index % width;
  const y = Math.floor(index / width);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        result.push(ny * width + nx);
      }
    }
  }
  return result;
}

function sanitizeMinePositions(level: Level): Set<number> {
  const indexes = new Set<number>();
  for (const [x, y] of level.mines) {
    if (x < 0 || x >= level.width || y < 0 || y >= level.height) continue;
    indexes.add(y * level.width + x);
  }
  return indexes;
}

function withRecomputedAdjacency(
  cells: Cell[],
  width: number,
  height: number,
): Cell[] {
  return cells.map((cell, index) => ({
    ...cell,
    adjacent: neighborIndexes(index, width, height).filter((n) => cells[n].mine)
      .length,
  }));
}

export function createBoard(level: Level): Board {
  const { width, height } = level;
  const minePositions = sanitizeMinePositions(level);
  const cells: Cell[] = Array.from({ length: width * height }, (_, index) => ({
    mine: minePositions.has(index),
    revealed: false,
    flagged: false,
    adjacent: 0,
  }));

  return {
    width,
    height,
    cells: withRecomputedAdjacency(cells, width, height),
    state: "idle",
  };
}

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({ ...cell }));
}

function findFirstSafeIndex(cells: Cell[], excludeIndex: number): number {
  for (let i = 0; i < cells.length; i++) {
    if (i !== excludeIndex && !cells[i].mine) return i;
  }
  return -1;
}

function revealFrom(
  cells: Cell[],
  width: number,
  height: number,
  start: number,
): void {
  const stack: number[] = [start];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const index = stack.pop() as number;
    if (visited.has(index)) continue;
    visited.add(index);

    const cell = cells[index];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;

    if (cell.mine || cell.adjacent !== 0) continue;

    for (const neighbor of neighborIndexes(index, width, height)) {
      if (!cells[neighbor].revealed && !cells[neighbor].flagged) {
        stack.push(neighbor);
      }
    }
  }
}

function resolveOutcome(cells: Cell[], revealedIndex: number): Board["state"] {
  if (cells[revealedIndex].mine) return "lost";
  for (const cell of cells) {
    if (!cell.mine && !cell.revealed) return "playing";
  }
  return "won";
}

export function revealCell(board: Board, index: number): Board {
  if (board.state === "won" || board.state === "lost") return board;

  const target = board.cells[index];
  if (!target || target.revealed || target.flagged) return board;

  let cells = cloneCells(board.cells);

  if (board.state === "idle" && cells[index].mine) {
    const safeIndex = findFirstSafeIndex(cells, index);
    if (safeIndex !== -1) {
      cells[index].mine = false;
      cells[safeIndex].mine = true;
      cells = withRecomputedAdjacency(cells, board.width, board.height);
    }
  }

  revealFrom(cells, board.width, board.height, index);

  return {
    ...board,
    cells,
    state: resolveOutcome(cells, index),
  };
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.state === "won" || board.state === "lost") return board;

  const target = board.cells[index];
  if (!target || target.revealed) return board;

  const cells = board.cells.map((cell, i) =>
    i === index ? { ...cell, flagged: !cell.flagged } : cell,
  );

  return { ...board, cells };
}
