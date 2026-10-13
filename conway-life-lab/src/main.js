import {
  PATTERNS,
  countAlive,
  createGrid,
  gridFromPattern,
  nextGeneration,
  randomGrid,
  validateStatePayload,
} from './life.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#lifeCanvas');
const context = canvas.getContext('2d');
const playButton = $('#playButton');
const stepButton = $('#stepButton');
const sizeSelect = $('#sizeSelect');
const patternSelect = $('#patternSelect');
const speedInput = $('#speedInput');
const densityInput = $('#densityInput');
const wrapInput = $('#wrapInput');
const importFile = $('#importFile');

const state = {
  size: Number(sizeSelect.value),
  grid: createGrid(Number(sizeSelect.value), Number(sizeSelect.value)),
  generation: 0,
  running: false,
  timer: null,
  speed: Number(speedInput.value),
  density: Number(densityInput.value) / 100,
  wrap: wrapInput.checked,
};

function announce(message) {
  $('#notice').textContent = message;
}

function stopSimulation() {
  state.running = false;
  if (state.timer !== null) window.clearInterval(state.timer);
  state.timer = null;
  updateRunControls();
}

function startSimulation() {
  if (state.running) return;
  state.running = true;
  state.timer = window.setInterval(tick, 1000 / state.speed);
  updateRunControls();
  announce('Simulation is running. Click a cell after pausing to edit the board.');
}

function updateRunControls() {
  playButton.innerHTML = state.running
    ? '<span class="button-icon" aria-hidden="true">Ⅱ</span> Pause simulation'
    : '<span class="button-icon" aria-hidden="true">▶</span> Run simulation';
  playButton.setAttribute('aria-pressed', String(state.running));
  $('#runStatus').textContent = state.running ? 'Running · Evolving by the rules' : 'Paused · Ready to evolve';
  $('#liveIndicator').classList.toggle('is-running', state.running);
}

function resetGeneration() {
  state.generation = 0;
}

function tick() {
  state.grid = nextGeneration(state.grid, { wrap: state.wrap });
  state.generation += 1;
  render();
}

function updateSpeed() {
  state.speed = Number(speedInput.value);
  $('#speedOutput').value = `${state.speed} gen/s`;
  $('#speedOutput').textContent = `${state.speed} gen/s`;
  if (state.running) {
    window.clearInterval(state.timer);
    state.timer = window.setInterval(tick, 1000 / state.speed);
  }
}

function render() {
  const bounds = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, bounds.width);
  const cssHeight = Math.max(1, bounds.height);
  const dpr = window.devicePixelRatio || 1;
  const actualWidth = Math.round(cssWidth * dpr);
  const actualHeight = Math.round(cssHeight * dpr);

  if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
    canvas.width = actualWidth;
    canvas.height = actualHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const styles = getComputedStyle(document.documentElement);
  const background = styles.getPropertyValue('--board-bg').trim() || '#080f1b';
  const cellColor = styles.getPropertyValue('--cell-live').trim() || '#57e6b1';
  const gridColor = styles.getPropertyValue('--grid-line').trim() || 'rgba(150, 175, 200, 0.10)';
  context.fillStyle = background;
  context.fillRect(0, 0, cssWidth, cssHeight);

  const rows = state.grid.length;
  const cols = state.grid[0].length;
  const cellWidth = cssWidth / cols;
  const cellHeight = cssHeight / rows;
  const inset = Math.min(1.4, cellWidth * 0.13, cellHeight * 0.13);

  context.fillStyle = cellColor;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (state.grid[row][col] !== 1) continue;
      context.fillRect(
        col * cellWidth + inset,
        row * cellHeight + inset,
        Math.max(0.5, cellWidth - 2 * inset),
        Math.max(0.5, cellHeight - 2 * inset),
      );
    }
  }

  if (cellWidth >= 5 && cellHeight >= 5) {
    context.strokeStyle = gridColor;
    context.lineWidth = 0.55;
    context.beginPath();
    for (let col = 0; col <= cols; col += 1) {
      const x = col * cellWidth;
      context.moveTo(x, 0);
      context.lineTo(x, cssHeight);
    }
    for (let row = 0; row <= rows; row += 1) {
      const y = row * cellHeight;
      context.moveTo(0, y);
      context.lineTo(cssWidth, y);
    }
    context.stroke();
  }

  const alive = countAlive(state.grid);
  const total = rows * cols;
  const percentage = total ? (alive / total) * 100 : 0;
  $('#generationCount').textContent = state.generation.toLocaleString();
  $('#aliveCount').textContent = alive.toLocaleString();
  $('#alivePercent').textContent = `${percentage.toFixed(1)}% of board`;
  $('#populationState').textContent = alive === 0 ? 'Empty' : alive / total > 0.6 ? 'Dense' : alive / total < 0.08 ? 'Sparse' : 'Active';
  $('#populationHint').textContent = alive === 0 ? 'Add some life to begin' : `${total.toLocaleString()} total cells`;
  $('#boardSizeLabel').textContent = `${rows} × ${cols} GRID`;
}

function loadPattern(name) {
  stopSimulation();
  state.grid = gridFromPattern(name, state.size, state.size);
  resetGeneration();
  patternSelect.value = name;
  render();
  announce(`${PATTERNS[name].label} loaded. Run the simulation or step through one generation at a time.`);
}

function clearBoard() {
  stopSimulation();
  state.grid = createGrid(state.size, state.size);
  resetGeneration();
  render();
  announce('Board cleared. Choose a pattern, randomize, or click cells to start building.');
}

function randomizeBoard() {
  stopSimulation();
  state.grid = randomGrid(state.size, state.size, state.density);
  resetGeneration();
  render();
  announce(`Board randomized at ${Math.round(state.density * 100)}% fill density.`);
}

function downloadState() {
  const payload = {
    format: 'conway-life-lab-state-v1',
    rows: state.grid.length,
    cols: state.grid[0].length,
    generation: state.generation,
    wrapEdges: state.wrap,
    grid: state.grid,
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `conway-life-state-${state.grid.length}x${state.grid[0].length}-gen-${state.generation}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  announce('Current board exported as a JSON state file.');
}

async function importState(file) {
  try {
    const payload = JSON.parse(await file.text());
    const restored = validateStatePayload(payload);
    if (restored.grid.length !== restored.grid[0].length) {
      throw new TypeError('Only square boards are supported by this version');
    }
    if (![20, 30, 40, 50, 60, 80].includes(restored.grid.length)) {
      throw new TypeError('Supported board sizes are 20, 30, 40, 50, 60, and 80');
    }
    stopSimulation();
    state.grid = restored.grid;
    state.size = restored.grid.length;
    state.generation = restored.generation;
    state.wrap = restored.wrap;
    sizeSelect.value = String(state.size);
    wrapInput.checked = state.wrap;
    render();
    announce(`Imported ${state.size} × ${state.size} board at generation ${state.generation}.`);
  } catch (error) {
    announce(`Could not import state: ${error.message}`);
  } finally {
    importFile.value = '';
  }
}

playButton.addEventListener('click', () => {
  if (state.running) {
    stopSimulation();
    announce('Simulation paused. You can edit cells or step forward.');
  } else {
    startSimulation();
  }
});
stepButton.addEventListener('click', () => {
  stopSimulation();
  tick();
  announce(`Advanced to generation ${state.generation}.`);
});
$('#loadPatternButton').addEventListener('click', () => loadPattern(patternSelect.value));
$('#randomButton').addEventListener('click', randomizeBoard);
$('#clearButton').addEventListener('click', clearBoard);
$('#exportButton').addEventListener('click', downloadState);
$('#importButton').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', () => {
  if (importFile.files?.[0]) void importState(importFile.files[0]);
});
speedInput.addEventListener('input', updateSpeed);
densityInput.addEventListener('input', () => {
  state.density = Number(densityInput.value) / 100;
  $('#densityOutput').value = `${densityInput.value}%`;
  $('#densityOutput').textContent = `${densityInput.value}%`;
});
sizeSelect.addEventListener('change', () => {
  stopSimulation();
  state.size = Number(sizeSelect.value);
  state.grid = createGrid(state.size, state.size);
  resetGeneration();
  render();
  announce(`Created an empty ${state.size} × ${state.size} board.`);
});
wrapInput.addEventListener('change', () => {
  state.wrap = wrapInput.checked;
  announce(state.wrap ? 'Wrap-around edges enabled.' : 'Finite board edges enabled.');
});
canvas.addEventListener('click', (event) => {
  if (state.running) {
    announce('Pause the simulation before editing cells.');
    return;
  }
  const bounds = canvas.getBoundingClientRect();
  const row = Math.floor(((event.clientY - bounds.top) / bounds.height) * state.grid.length);
  const col = Math.floor(((event.clientX - bounds.left) / bounds.width) * state.grid[0].length);
  if (row < 0 || row >= state.grid.length || col < 0 || col >= state.grid[0].length) return;
  state.grid[row][col] = state.grid[row][col] ? 0 : 1;
  render();
});
document.querySelectorAll('[data-pattern]').forEach((button) => {
  button.addEventListener('click', () => loadPattern(button.dataset.pattern));
});
document.addEventListener('keydown', (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (state.running) stopSimulation(); else startSimulation();
  } else if (event.key.toLowerCase() === 'n') {
    stopSimulation();
    tick();
    announce(`Advanced to generation ${state.generation}.`);
  }
});
window.addEventListener('resize', render);

// Set up a non-empty but small initial pattern so the first launch is immediately explorable.
loadPattern('r-pentomino');
updateSpeed();
$('#densityOutput').value = `${densityInput.value}%`;
$('#densityOutput').textContent = `${densityInput.value}%`;
