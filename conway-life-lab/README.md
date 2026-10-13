# Conway Life Lab

An interactive, dependency-free browser playground for **Conway's Game of Life**, with a separately tested simulation engine and a roadmap toward reproducible computational experiments.

**Persian documentation:** [README.fa.md](README.fa.md).

> **Status:** `v0.1.0` — initial playable version. The research roadmap is prospective; no novel scientific result is claimed.

## Highlights

- Run, pause, or advance the simulation one generation at a time.
- Edit individual cells directly on the board.
- Load familiar patterns: Glider, Blinker, Toad, Beacon, R-pentomino, Pulsar, and Gosper glider gun.
- Randomize the board with a configurable live-cell density.
- Choose a board size from 20×20 to 80×80.
- Compare finite edges with wrap-around (toroidal) boundaries.
- Inspect generation count and population statistics.
- Export and import a simulation state as JSON.
- Run the engine's automated tests using Node.js; no third-party runtime packages are required.

## Run locally

The browser app uses JavaScript ES modules, so serve the folder over HTTP rather than opening `index.html` directly as a `file://` URL.

### Option A: Python

```bash
python -m http.server 8000
```

Open <http://localhost:8000> in your browser.

### Option B: Node.js

If a local static server is already installed, use it to serve this folder. No bundler is needed.

## Run tests

Install Node.js 20 or newer, then run:

```bash
npm test
```

The tests cover grid creation, survival and birth rules, a stable block, the blinker oscillator, edge behavior, non-mutating generation updates, pattern loading, deterministic random inputs, and state-file validation. GitHub Actions runs the same test suite for pushes and pull requests.

## Publish with GitHub Pages

This is a static site; it does not need a server-side backend or build step.

1. Create a public GitHub repository named `conway-life-lab`.
2. Upload the contents of this project folder to the repository root (upload the files and folders themselves, not the enclosing ZIP).
3. In the repository, open **Settings → Pages**.
4. Under the build/deployment section, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
5. Wait for GitHub Pages to finish its deployment and open the published URL shown on the Pages settings screen.

The workflow in `.github/workflows/test.yml` checks the simulation engine; it is separate from Pages deployment.

## Controls

| Action | How |
| --- | --- |
| Run or pause | Click **Run simulation** / **Pause simulation**, or press `Space` |
| Next generation | Click **Step** or press `N` |
| Toggle a cell | Click or tap a cell while paused |
| Load a known pattern | Choose a pattern and click **Load pattern**, or use a pattern card |
| Change simulation speed | Use the speed slider |
| Change random fill density | Use the density slider, then click **Randomize board** |
| Change board size | Select a new board size; this creates an empty board |
| Save/restore a board | Use **Export state** and **Import state** |

## Conway's rules

For every generation, each cell is evaluated against its eight neighbours:

1. A live cell with two or three live neighbours survives.
2. A dead cell with exactly three live neighbours becomes alive.
3. All other cells are dead in the next generation.

With wrap-around edges enabled, the top and bottom edges connect, as do the left and right edges. Otherwise, cells beyond the board are treated as absent.

## Project structure

```text
conway-life-lab/
├── .github/workflows/test.yml  # Automated engine tests
├── docs/RESEARCH_ROADMAP.md    # Proposed, not yet completed, research plan
├── src/life.js                 # Pure simulation engine and pattern definitions
├── src/main.js                 # Browser controls and canvas renderer
├── tests/life.test.js          # Node.js test suite
├── index.html
├── styles.css
├── package.json
├── LICENSE
└── README.md
```

## Technical design

The simulation engine in `src/life.js` is separate from the DOM and canvas UI. This lets tests check the rules independently from the visual display and makes the engine easier to reuse in later experiments. The browser app uses plain HTML, CSS, and JavaScript; no framework or runtime dependency is required.

## Research direction

A possible later direction is a reproducible study of how initial density, board size, and boundary conditions influence population dynamics. See [`docs/RESEARCH_ROADMAP.md`](docs/RESEARCH_ROADMAP.md). This is only a proposed direction: a literature review, a clear research question, repeatable experiments, and evidence of a meaningful contribution would be required before preparing a paper.

## License

MIT. See [`LICENSE`](LICENSE).
