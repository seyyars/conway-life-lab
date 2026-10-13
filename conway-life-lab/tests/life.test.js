import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countAlive,
  countLiveNeighbors,
  createGrid,
  gridFromPattern,
  nextGeneration,
  randomGrid,
  validateStatePayload,
} from '../src/life.js';

const key = (grid) => grid.map((row) => row.join('')).join('\n');

test('createGrid returns an empty grid with the requested dimensions', () => {
  assert.equal(key(createGrid(2, 3)), '000\n000');
  assert.throws(() => createGrid(0, 3), RangeError);
  assert.throws(() => createGrid(2, -1), RangeError);
});

test('a stable 2x2 block survives unchanged', () => {
  const grid = createGrid(6, 6);
  grid[2][2] = grid[2][3] = grid[3][2] = grid[3][3] = 1;
  assert.equal(key(nextGeneration(grid)), key(grid));
  assert.equal(countAlive(grid), 4);
});

test('a blinker oscillates between horizontal and vertical states', () => {
  const grid = createGrid(5, 5);
  grid[2][1] = grid[2][2] = grid[2][3] = 1;
  const vertical = createGrid(5, 5);
  vertical[1][2] = vertical[2][2] = vertical[3][2] = 1;
  assert.equal(key(nextGeneration(grid)), key(vertical));
  assert.equal(key(nextGeneration(vertical)), key(grid));
});

test('an isolated live cell dies from underpopulation', () => {
  const grid = createGrid(3, 3);
  grid[1][1] = 1;
  assert.equal(countAlive(nextGeneration(grid)), 0);
});

test('a dead cell with exactly three neighbours is born', () => {
  const grid = createGrid(3, 3);
  grid[0][0] = grid[0][1] = grid[1][0] = 1;
  assert.equal(nextGeneration(grid)[1][1], 1);
});

test('bounded and wrap-around edge modes count edge neighbours differently', () => {
  const grid = createGrid(3, 3);
  grid[2][2] = 1;
  assert.equal(countLiveNeighbors(grid, 0, 0), 0);
  assert.equal(countLiveNeighbors(grid, 0, 0, { wrap: true }), 1);
});

test('nextGeneration does not mutate its input grid', () => {
  const grid = gridFromPattern('glider', 10, 10);
  const before = key(grid);
  nextGeneration(grid);
  assert.equal(key(grid), before);
});

test('pattern loader produces the known live-cell count for a glider', () => {
  const grid = gridFromPattern('glider', 20, 20);
  assert.equal(countAlive(grid), 5);
});

test('randomGrid supports deterministic random generators and validates density', () => {
  const values = [0.1, 0.9, 0.2, 0.8];
  let index = 0;
  const grid = randomGrid(2, 2, 0.5, () => values[index++]);
  assert.equal(key(grid), '10\n10');
  assert.throws(() => randomGrid(2, 2, 1.1), RangeError);
});

test('saved state validation clones a well-formed board and rejects invalid cells', () => {
  const payload = {
    format: 'conway-life-lab-state-v1',
    rows: 2,
    cols: 2,
    generation: 7,
    wrapEdges: true,
    grid: [[1, 0], [0, 1]],
  };
  const restored = validateStatePayload(payload);
  assert.deepEqual(restored, { grid: [[1, 0], [0, 1]], generation: 7, wrap: true });
  assert.notEqual(restored.grid, payload.grid);
  assert.throws(() => validateStatePayload({ ...payload, grid: [[2, 0], [0, 1]] }), TypeError);
});


test('the classic pulsar has 48 live cells and returns after three generations', () => {
  const grid = gridFromPattern('pulsar', 30, 30);
  assert.equal(countAlive(grid), 48);
  const afterThree = nextGeneration(nextGeneration(nextGeneration(grid)));
  assert.equal(key(afterThree), key(grid));
});

test('all presets fit on a 40x40 board and contain only binary cells', () => {
  for (const name of ['glider', 'blinker', 'toad', 'beacon', 'r-pentomino', 'pulsar', 'gosper-gun']) {
    const grid = gridFromPattern(name, 40, 40);
    assert.equal(grid.length, 40, name);
    assert.ok(grid.every((row) => row.length === 40 && row.every((cell) => cell === 0 || cell === 1)), name);
    assert.ok(countAlive(grid) > 0, name);
  }
});
