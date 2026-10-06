# EduMath Grade 1–3

EduMath Grade 1–3 is a cross-platform mathematics practice application for elementary-school learners in Grades 1–3. The core learning concept is **10 Minutes Math**: a learner should be able to open the app and complete a short mathematics practice session in approximately ten minutes.

This repository is intentionally scoped to mathematics for Grades 1–3. It is not a generic education platform.

## M1 — Foundation Bootstrap

Milestone 1 establishes a small, auditable Expo + React Native + TypeScript foundation and one deterministic Grade 1 vertical slice:

- Expo SDK 57 and Expo Router;
- TypeScript with strict checking;
- thin route files under `app/`;
- domain logic under `src/core/`;
- a minimal curriculum-independent canonical skill graph;
- one seeded generator for **Grade 1 — Addition within 10**;
- deterministic mathematical validation;
- English, Indonesian, and Thai rendering separated from mathematical semantics;
- a minimal answer-selection screen;
- automated type, lint, deterministic-generation, invariant, skill-graph, and localization checks.

M1 deliberately does **not** implement a full Grade 1–3 curriculum, curriculum-provider mappings, Montessori mode, adaptive ML, cloud accounts, analytics, billing, advertising, or a backend.

## Technical stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript
- Expo Router
- Node's test runner executed through `tsx`
- ESLint using `eslint-config-expo`

Android is the first release target. The codebase remains compatible with iOS by using Expo/React Native cross-platform primitives and by keeping native-platform-specific code out of the M1 domain layer.

## Architectural principles

### Offline-first, not offline-only

The core learning loop is designed so curriculum rules, question generation, validation, future adaptation, localization, and learner progress can operate locally. M1 introduces no backend dependency.

### Algorithm-first question generation

EduMath does not depend on a large stored question bank. The M1 generator creates questions from explicit rules and constraints. Later generators should preserve this model: semantic inputs, controlled randomness, deterministic validation, and reproducibility.

### Curriculum controls the system

The future curriculum layer defines what may be learned. Adaptation will decide what should be learned next only inside those constraints. The question engine controls how a valid question is generated; it does not invent curriculum requirements.

### Canonical skills

M1 proves a curriculum-independent skill chain:

```text
number_recognition_10
        ↓
addition_concept
        ↓
addition_within_10
```

Future curriculum profiles can map provider- or country-specific objectives onto these canonical skills without creating separate mathematics engines.

### Multilingual separation

The question engine emits mathematical semantics (`operation`, operands, expected answer, skill, difficulty). A localization layer renders those semantics in English, Indonesian, or Thai. There are no language-specific mathematics generators.

## Repository structure

```text
app/                         # Thin Expo Router entry points
src/
  core/
    curriculum/              # Canonical skill proof
    question-engine/         # Seeded deterministic generation
    validation/              # Mathematical invariant checks
  features/practice/         # Minimal M1 practice UI
  localization/              # EN / ID / TH rendering
tests/question-engine/       # Domain and localization tests
.github/workflows/ci.yml     # Automated quality gate
```

Additional architecture boundaries for adaptation, persistence, and visual mathematics will be introduced only when their milestones require concrete implementation.

## Run locally

Prerequisite: Node.js 22.13 or newer.

```bash
npm install
npm start
```

Then use Expo to open the project on Android, iOS, or another supported development target.

## Quality checks

```bash
npm run check
```

This runs:

1. `tsc --noEmit`
2. `expo lint`
3. deterministic/unit tests via `tsx --test`

The test suite samples generated questions to verify non-negative integer operands, results at or below 10, correct expected answers, explicit difficulty caps, deterministic reproduction for a fixed seed, canonical prerequisites, and localization rendering.

## Curriculum and pedagogy claims

M1 does not claim official alignment with Cambridge, Indonesia's national curriculum, Thailand's national curriculum, or Montessori. The architecture is designed to support later verified curriculum profiles and Montessori-inspired concrete-to-abstract pedagogy without allowing either to alter mathematical correctness rules.

## Current milestone status

**M1 — Foundation Bootstrap: COMPLETE.**

The repository structure and automated quality gate were verified on 2026-10-06. TypeScript validation, Expo linting, and all M1 unit tests passed. Future milestones should preserve these boundaries and keep the quality gate green.
