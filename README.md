# EduMath Grade 1–3

EduMath Grade 1–3 is a cross-platform mathematics practice application for elementary-school learners in Grades 1–3. The core learning concept is **10 Minutes Math**: a learner should be able to open the app and complete a short mathematics practice session in approximately ten minutes.

This repository is intentionally scoped to mathematics for Grades 1–3. It is not a generic education platform.

## Milestone status

- **M1 — Foundation Bootstrap: COMPLETE**
- **M2 — Curriculum & Canonical Skill Engine: COMPLETE**
- **M3 — Question Generation Engine: NOT STARTED**

M1 was closed on 2026-10-06. M2 extends the M1 proof into an auditable curriculum-independent mathematics skill graph while preserving the deterministic Grade 1 addition vertical slice.

## Technical stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript
- Expo Router
- Node's test runner executed through `tsx`
- ESLint using `eslint-config-expo`

Android is the first release target. The codebase remains compatible with iOS by using Expo/React Native cross-platform primitives and by keeping native-platform-specific code out of the core domain layer.

## Architectural principles

### Offline-first, not offline-only

The core learning loop is designed so curriculum rules, question generation, validation, future adaptation, localization, and learner progress can operate locally. The project currently has no backend dependency.

### Algorithm-first question generation

EduMath does not depend on a large stored question bank. Questions are intended to be generated from explicit rules, mathematical constraints, controlled randomness, and deterministic validation.

### Curriculum controls the system

The curriculum layer defines what may be learned. Future adaptation will decide what should be learned next only inside those constraints. The question engine controls how a valid question is generated; it does not invent curriculum requirements.

### Canonical skills

The internal mathematics model uses curriculum-independent canonical skill IDs. Provider- or country-specific curriculum objectives will map onto these canonical skills later rather than creating separate mathematics engines.

M2 defines **60 canonical Grade 1–3 skills** across:

- number;
- operations;
- algebra foundations;
- measurement;
- geometry;
- data.

The graph covers number sense, counting, comparison, place value, fractions, addition, subtraction, multiplication/division foundations, equality, patterns, length, mass, time, money, 2D/3D shapes, position, classification, tables, pictograms, and unit-scale bar charts.

M2 does **not** claim official alignment with Cambridge, Indonesia's national curriculum, Thailand's national curriculum, or Montessori.

### Skill progression is a prerequisite DAG

Progression is derived from explicit prerequisite relationships rather than a second manually maintained sequence. This avoids contradictory ordering metadata.

The original M1 chain remains a regression contract:

```text
number_recognition_10
        ↓
addition_concept
        ↓
addition_within_10
```

The M2 graph engine can validate the graph, produce a deterministic topological progression, and return the transitive prerequisite closure for a skill.

### Generator capability metadata

Each canonical skill declares the generator capability it will eventually require, such as counting, number comparison, place value, addition, fraction, time, shape, or data interpretation.

This is capability metadata only. M2 does not implement the broad generator suite; that work belongs to M3.

### Representation metadata

Skills declare the mathematical representations they can support, including symbolic, visual, concrete, number-line, clock, money, table, pictogram, and bar-chart representations.

Representation metadata does not imply that every representation UI is implemented yet. Visual/pedagogical delivery belongs primarily to later milestones.

### Multilingual separation

The question engine emits mathematical semantics. The localization layer renders those semantics in English, Indonesian, or Thai. There are no language-specific mathematics generators.

## M2 graph validation

The curriculum engine rejects or detects:

- duplicate skill IDs;
- missing declared canonical skills;
- unknown prerequisites;
- self-prerequisites;
- repeated prerequisite edges;
- cyclic prerequisites;
- malformed grade applicability metadata;
- prerequisites introduced after a dependent skill;
- invalid domain/topic combinations;
- skills with no declared representation;
- malformed numeric ranges or allowed-denominator constraints.

The canonical catalog is validated automatically in the test suite.

## Repository structure

```text
app/                              # Thin Expo Router entry points
src/
  core/
    curriculum/
      canonicalSkills.ts          # 60 canonical Grade 1–3 skills
      skillGraph.ts               # DAG validation, ordering, prerequisite closure
      skillIds.ts                 # Stable canonical skill identifiers
      taxonomy.ts                 # Allowed domain/topic relationships
    question-engine/              # Seeded deterministic generation
    validation/                   # Mathematical invariant checks
    types.ts                      # Shared domain types
  features/practice/              # Minimal M1 practice UI
  localization/                   # EN / ID / TH rendering
tests/
  curriculum/                     # M2 curriculum/graph tests
  question-engine/                # M1 generator regression tests
docs/
  m2-curriculum-engine.md         # M2 rationale, boundaries, and source basis
.github/workflows/ci.yml          # Automated quality gate
```

Additional architecture boundaries for adaptation, persistence, and visual mathematics will be introduced only when their milestones require concrete implementation.

## Existing deterministic vertical slice

The existing M1 generator remains unchanged:

**Grade 1 — Addition within 10**

It retains seeded deterministic generation, explicit difficulty caps, mathematical validation, and independent EN / ID / TH rendering.

M2 intentionally does not add dozens of question generators.

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

At M2 implementation verification, the suite contains 17 tests: 12 curriculum/skill-graph tests plus the 5 existing M1 regression tests.

## Curriculum and pedagogy claims

The M2 canonical catalog is an internal mathematical ontology, not a provider curriculum.

External curriculum sources were reviewed to make sure the canonical model covers the major mathematical areas encountered in primary Grades/Stages 1–3, but M2 deliberately does not encode formal provider mappings. Those mappings belong to M7 and must be separately verified before any official alignment claim is made.

Montessori remains a future pedagogy/learning-path profile. Until properly validated, any future implementation should use wording such as **Montessori-inspired**, not claim official Montessori alignment.

## M2 completion criteria

M2 is considered complete when:

- the Grade 1–3 canonical skill catalog is explicit and stable;
- skill IDs are type-safe;
- domain/topic relationships are explicit;
- prerequisites form a validated DAG;
- deterministic progression can be derived;
- malformed graph conditions are covered by automated tests;
- the M1 deterministic generator remains unchanged and green;
- TypeScript, lint, and all tests pass in GitHub Actions.

See `docs/m2-curriculum-engine.md` for the design rationale and boundary with M3/M7.
