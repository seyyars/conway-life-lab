/** Pure simulation logic for Conway's Game of Life. No browser APIs required. */

export const PATTERNS = Object.freeze({
  glider: {
    label: 'Glider',
    cells: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  },
  blinker: {
    label: 'Blinker',
    cells: [[0, 0], [0, 1], [0, 2]],
  },
  toad: {
    label: 'Toad',
    cells: [[0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2]],
  },
  beacon: {
    label: 'Beacon',
    cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 2], [2, 3], [3, 2], [3, 3]],
  },
  'r-pentomino': {
    label: 'R-pentomino',
    cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  },
  pulsar: {
    label: 'Pulsar',
    cells: [
      ...[2, 3, 4, 8, 9, 10].flatMap((row) => [
        [row, 0], [row, 5], [row, 7], [row, 12],
      ]),
      ...[0, 5, 7, 12].flatMap((row) => [
        [row, 2], [row, 3], [row, 4], [row, 8], [row, 9], [row, 10],
      ]),
    ],
  },
  'gosper-gun': {
    label: 'Gosper glider gun',
    // Coordinates are [row, column], transposed from the conventional [x, y] list.
    cells: [
      [5, 1], [6, 1], [5, 2], [6, 2],
      [5, 11], [6, 11], [7, 11], [4, 12], [8, 12], [3, 13], [9, 13], [3, 14], [9, 14], [6, 15], [4, 16], [8, 16], [5, 17], [6, 17], [7, 17], [6, 18],
      [3, 21], [4, 21], [3, 22], [4, 22], [7, 21], [7, 22], [6, 23], [8, 23], [2, 25], [3, 25], [8, 25], [9, 25],
      [5, 35], [6, 35], [5, 36], [6, 36],
    ],
  },
});

export function createGrid(rows, cols) {
  assertDimension(rows, 'rows');
  assertDimension(cols, 'cols');
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function assertDimension(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0]) || grid[0].length === 0) {
    throw new TypeError('grid must be a non-empty rectangular array');
  }
  const cols = grid[0].length;
  if (!grid.every((row) => Array.isArray(row) && row.length === cols)) {
    throw new TypeError('grid must be rectangular');
  }
}

export function countLiveNeighbors(grid, row, col, { wrap = false } = {}) {
  assertGrid(grid);
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      let r = row + dr;
      let c = col + dc;

      if (wrap) {
        r = (r + rows) % rows;
        c = (c + cols) % cols;
      } else if (r < 0 || r >= rows || c < 0 || c >= cols) {
        continue;
      }

      if (grid[r][c] === 1) count += 1;
    }
  }
  return count;
}

export function nextGeneration(grid, { wrap = false } = {}) {
  assertGrid(grid);
  const rows = grid.length;
  const cols = grid[0].length;
  const next = createGrid(rows, cols);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const neighbors = countLiveNeighbors(grid, row, col, { wrap });
      const alive = grid[row][col] === 1;
      next[row][col] = alive
        ? Number(neighbors === 2 || neighbors === 3)
        : Number(neighbors === 3);
    }
  }
  return next;
}

export function countAlive(grid) {
  assertGrid(grid);
  return grid.reduce((total, row) => total + row.reduce((sum, cell) => sum + Number(cell === 1), 0), 0);
}

export function randomGrid(rows, cols, density = 0.22, random = Math.random) {
  assertDimension(rows, 'rows');
  assertDimension(cols, 'cols');
  if (typeof density !== 'number' || density < 0 || density > 1) {
    throw new RangeError('density must be between 0 and 1');
  }
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Number(random() < density)),
  );
}

export function gridFromPattern(patternName, rows, cols) {
  assertDimension(rows, 'rows');
  assertDimension(cols, 'cols');
  const pattern = PATTERNS[patternName];
  if (!pattern) throw new RangeError(`Unknown pattern: ${patternName}`);

  const grid = createGrid(rows, cols);
  const patternRows = Math.max(...pattern.cells.map(([r]) => r)) + 1;
  const patternCols = Math.max(...pattern.cells.map(([, c]) => c)) + 1;
  const offsetRow = Math.floor((rows - patternRows) / 2);
  const offsetCol = Math.floor((cols - patternCols) / 2);

  for (const [r, c] of pattern.cells) {
    const targetRow = r + offsetRow;
    const targetCol = c + offsetCol;
    if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
      grid[targetRow][targetCol] = 1;
    }
  }
  return grid;
}

export function validateStatePayload(payload) {
  if (!payload || payload.format !== 'conway-life-lab-state-v1') {
    throw new TypeError('Unrecognized state file format');
  }
  const grid = payload.grid;
  assertGrid(grid);
  const rows = grid.length;
  const cols = grid[0].length;
  if (payload.rows !== rows || payload.cols !== cols) {
    throw new TypeError('State dimensions do not match the grid data');
  }
  if (!grid.every((row) => row.every((cell) => cell === 0 || cell === 1))) {
    throw new TypeError('Every grid cell must be either 0 or 1');
  }
  const generation = Number(payload.generation);
  if (!Number.isInteger(generation) || generation < 0) {
    throw new TypeError('Generation must be a non-negative integer');
  }
  return {
    grid: grid.map((row) => row.slice()),
    generation,
    wrap: Boolean(payload.wrapEdges),
  };
}
