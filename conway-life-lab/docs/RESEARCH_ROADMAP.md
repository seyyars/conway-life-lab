# Research and validation roadmap

This document records possible research directions. It does **not** claim that the project currently contains novel scientific findings.

## Candidate question

How do initial live-cell density and boundary conditions affect extinction time and population trajectories in finite Conway's Game of Life boards?

## Why this needs careful work

Conway's Game of Life has a substantial existing literature. A useful paper must start with a focused literature review and a defensible contribution, rather than presenting a new implementation of a well-known automaton as novel research.

## Proposed experimental protocol (future phase)

1. Review prior work on cellular automata, finite-size effects, random initial conditions, and Life's population dynamics.
2. Define the independent variables before running experiments: board size, initial live-cell density, boundary mode, and random seed.
3. Use a deterministic pseudo-random number generator so each initial board can be reproduced from its seed.
4. Predefine measurable outcomes, such as extinction by a fixed generation, first extinction time, and population at specified checkpoints.
5. Run enough independent trials to estimate uncertainty; report sample sizes, confidence intervals, exclusions, and all parameters.
6. Compare against simple baselines and publish the full experiment scripts and raw machine-readable results.
7. Avoid claims of novelty or generality until the literature review and results support them.

## Planned engineering steps

- Add deterministic seeded initial-condition generation.
- Add a batch runner that sweeps densities, boundary modes, and board sizes.
- Export trial-level CSV files and summary statistics.
- Add tests that verify experiment reproducibility.
- Document the computing environment and exact commands for every reported result.

The interactive browser app is the initial deliverable; the experimental tooling is a later milestone, not a completed feature in v0.1.0.
