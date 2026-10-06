# EduMath Grade 1–3

EduMath Grade 1–3 is a cross-platform mathematics practice application for elementary-school learners in Grades 1–3. The core learning concept is **10 Minutes Math**: a learner should be able to open the app and complete a short mathematics practice session in approximately ten minutes.

This repository is intentionally scoped to mathematics for Grades 1–3. It is not a generic education platform.

## Milestone status

- **M1 — Foundation Bootstrap: COMPLETE**
- **M2 — Curriculum & Canonical Skill Engine: COMPLETE**
- **M3 — Question Generation Engine: COMPLETE**

M1, M2, and M3 were completed on 2026-10-06. M2 defines the canonical mathematics skill model; M3 consumes that model through a typed, deterministic question-generation registry while preserving the original M1 Grade 1 addition regression contract.

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

EduMath does not depend on a large stored question bank. Questions are generated from explicit mathematical rules, canonical constraints, controlled randomness, difficulty rules, and deterministic validation.

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

M2 does **not** claim official alignment with Cambridge, Indonesia's national curriculum, Thailand's national curriculum, or Montessori.

### Skill progression is a prerequisite DAG

Progression is derived from explicit prerequisite relationships rather than a second manually maintained sequence.

The original M1 chain remains a regression contract:

```text
number_recognition_10
        ↓
addition_concept
        ↓
addition_within_10
```

### Typed deterministic question generation

M3 introduces a typed `QuestionGenerator` contract and explicit registry. A generator declares:

- supported canonical skills;
- capability;
- grades;
- difficulty levels;
- question types;
- representations;
- required canonical constraint fields;
- deterministic generation;
- generator-specific validation.

Registry dispatch checks the request against M2 canonical metadata before generation and checks the produced semantic question afterward.

Unsupported canonical skills fail explicitly. M3 completion does **not** mean all 60 canonical skills already have generators; M3 establishes and verifies the architecture and representative generator families used to add further coverage safely.

### Generator registry integrity

The registry automatically detects malformed generator metadata including:

- duplicate generator IDs;
- duplicate skill ownership;
- empty descriptor metadata;
- duplicate descriptor values;
- capability mismatch with M2;
- non-canonical grades;
- non-canonical representations;
- missing required canonical constraints.

### Semantic question model

M3 uses discriminated semantic question structures rather than language-specific prose.

Implemented question types:

- `numeric-choice`;
- `relation-choice`;
- `fraction-choice`;
- `time-choice`.

Implemented semantic representations include:

- symbolic;
- visual;
- clock.

Localization remains responsible for child-facing English, Indonesian, and Thai wording.

## M3 representative generators

The completed M3 architecture includes six deterministic representative generators:

- `addition_within_10` — Grade 1, preserved M1 regression generator;
- `subtraction_within_10` — Grade 1;
- `compare_order_numbers_20` — Grade 1;
- `multiplication_facts_2_5_10` — Grades 2–3;
- `unit_fractions` — Grades 2–3, consumes canonical `allowedDenominators`;
- `tell_time_hour_half_hour` — Grades 1–2, semantic clock representation.

The registered generator suite therefore exercises Grades 1, 2, and 3 and representative capabilities for addition, subtraction, number comparison, multiplication, fractions, and time.

The locked M1 reference remains:

```text
seed 20261006 → 4 + 1 = 5
```

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
    question-engine/
      generator.ts                # Typed generator contract
      registry.ts                 # Dispatch and compatibility checks
      registryValidation.ts       # Registry integrity validation
      seededRandom.ts             # Deterministic PRNG
      ...                         # Representative generator modules
    validation/                   # Generator-specific mathematical validators
    types.ts                      # Shared semantic question/domain types
  features/practice/              # Minimal M1 practice UI
  localization/                   # EN / ID / TH semantic rendering
tests/
  curriculum/                     # M2 curriculum/graph tests
  question-engine/                # M1 regressions + M3 generator/registry tests
docs/
  m2-curriculum-engine.md         # M2 rationale and boundaries
  m3-question-generation-engine.md # M3 architecture and completion lock
.github/workflows/ci.yml          # Automated quality gate
```

Full visual pedagogy components are intentionally not implemented by M3. Visual and clock generators emit semantic representation data; later UI work can render those semantics without moving mathematical rules into React screens.

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

The M2 completion baseline contained 17 tests.

The final M3 implementation quality gate before documentation lock was GitHub Actions run 20:

```text
Head SHA : fbe3ab566635d66b820ed69a53f27dfcba992752
Tests    : 56
Passed   : 56
Failed   : 0
Skipped  : 0
```

The M3 suite includes high-volume per-generator invariant tests plus a generic registry matrix that runs every registered skill across its declared grades, difficulty levels, and deterministic seed samples.

## Curriculum and pedagogy claims

The canonical catalog remains an internal mathematical ontology, not a provider curriculum.

Formal Cambridge, Indonesian, and Thai curriculum mapping belongs to M7 and must be separately verified before any official alignment claim is made.

Montessori remains a future pedagogy/learning-path profile. Until properly validated, any future implementation should use wording such as **Montessori-inspired**, not claim official Montessori alignment.

## M3 completion criteria

M3 is complete because:

- a typed generator contract is established;
- registry dispatch consumes M2 canonical skill metadata;
- unsupported skills fail explicitly;
- grade, difficulty, question-type, representation, capability, and canonical-constraint compatibility are enforced;
- registry metadata integrity is automatically validated;
- generation remains seed-deterministic;
- mathematical generation and validation remain separate;
- semantic mathematics remains separate from localization;
- representative generators cover Grades 1–3 and materially different mathematical patterns;
- `resultRange`, `valueRange`, and `allowedDenominators` constraint patterns are exercised;
- symbolic, visual, and clock semantic representations are exercised;
- high-volume invariant and generic registry-matrix tests pass;
- the M1 locked seed remains unchanged;
- TypeScript, lint, and unit tests pass in GitHub Actions.

See `docs/m2-curriculum-engine.md` for M2 and `docs/m3-question-generation-engine.md` for the M3 design and completion lock.
