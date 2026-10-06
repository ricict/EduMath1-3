# EduMath Grade 1–3

EduMath Grade 1–3 is a cross-platform mathematics practice application for elementary-school learners in Grades 1–3. The core learning concept is **10 Minutes Math**: a learner should be able to open the app and complete a short mathematics practice session in approximately ten minutes.

This repository is intentionally scoped to mathematics for Grades 1–3. It is not a generic education platform.

## Milestone status

- **M1 — Foundation Bootstrap: COMPLETE**
- **M2 — Curriculum & Canonical Skill Engine: COMPLETE**
- **M3 — Question Generation Engine: COMPLETE**
- **M4 — Learning Session & Offline Storage: COMPLETE**
- **M5 — Mastery & Adaptive Learning Engine: COMPLETE**
- **M6 — Visual Mathematics & Pedagogy: COMPLETE / TERMINAL-LOCKED**
- **M7 — Learner Journey & App Shell: COMPLETE / TERMINAL-LOCKED**

M1 through M7 are complete and locked. M6 terminally established the semantic-to-visual boundary and representative visual coverage. M7 terminally established the learner-facing app shell: Home, grade-aware Practice, Progress derived from completed M4 history through M5, Settings, and device-local EN/ID/TH plus selected-grade preferences in a namespace separate from M4. Development-only session/seed metadata has been removed from normal child-facing practice, unsupported contexts remain explicit, and M7 does not redefine curriculum, mastery, question generation, or visual mathematics.

## Technical stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript
- Expo Router
- Expo SQLite key-value storage
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
- `time-choice`;
- `shape-choice`.

Implemented semantic representations include symbolic, visual, number-line, clock, table, pictogram, and bar-chart surfaces.

Localization remains responsible for child-facing English, Indonesian, and Thai wording.

### Versioned offline learning sessions

M4 introduces a typed practice-session domain under `src/core/session/`.

A session records only the semantic information needed to run and reconstruct practice:

- opaque local session ID;
- canonical grade, `SkillId`, and difficulty;
- session-level deterministic seed;
- ordered question attempts;
- question generation context and generated question identity;
- semantic learner answers and correctness;
- active/paused/completed lifecycle;
- active-practice duration;
- schema version.

Question position `n` uses the deterministic seed rule:

```text
questionSeed = (sessionSeed + ordinal) modulo 2^32
```

The session layer calls M3 `generateQuestion(...)` through the registry. It does not call individual arithmetic/fraction/time generators directly and does not duplicate mathematical rules.

The default practice target is ten minutes, but it is a target rather than a hard wall-clock completion rule. Paused/background time is excluded from active-practice duration. Active state is checkpointed before persistence, and an unexpectedly interrupted persisted session is recovered conservatively so unknown offline time is not counted as practice.

### Local persistence

M4 persistence is versioned and storage-agnostic at the core boundary.

The concrete device adapter uses `expo-sqlite/kv-store`, which supplies persistent key-value storage without introducing an ORM or cloud dependency.

Stored sessions are validated on restore against:

- schema version;
- canonical grade/skill/difficulty;
- deterministic question seed and identity;
- question type and representation;
- semantic answer correctness;
- attempt ordering and lifecycle consistency;
- session timing consistency.

One resumable session pointer supports interruption/resumption. Completed sessions remain stored by ID and are indexed locally so later milestones can consume historical outcomes without M4 calculating mastery.

The current React Native practice screen is grade-aware and consumes the registered M3/M6 child-facing question surfaces through M4 session contracts. Generation, answer evaluation, timing, interruption/resumption, and persistence remain outside React presentation logic.


## M3 representative generators

The current registered generator suite contains **12 generators**. The M3 architecture remains incremental: these generators do not represent all 60 M2 canonical skills.

Current registered skills are:

- `number_recognition_10`;
- `addition_concept`;
- `tally_and_simple_tables`;
- `pictograms_simple`;
- `bar_charts_unit_scale`;
- `addition_within_10`;
- `subtraction_within_10`;
- `compare_order_numbers_20`;
- `identify_2d_shapes`;
- `multiplication_facts_2_5_10`;
- `unit_fractions`;
- `tell_time_hour_half_hour`.

Together they exercise Grades 1–3 and numeric, relation, fraction, time, shape, symbolic, visual, number-line, clock, table, pictogram, and bar-chart contracts while preserving explicit unsupported states for the remaining canonical skills.

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
    session/                      # M4 session lifecycle + persistence contracts
    types.ts                      # Shared semantic question/domain types
  features/
    journey/                      # M7 home/progress learner journey
    practice/                     # Thin session-driven practice UI
    settings/                     # M7 device-local presentation preferences
  infrastructure/storage/         # Expo SQLite session + preference adapters
  localization/                   # EN / ID / TH semantic and shell rendering
tests/
  curriculum/                     # M2 curriculum/graph tests
  question-engine/                # M1 regressions + M3 generator/registry tests
  session/                        # M4 lifecycle/persistence tests
  visual/                         # M6 visual/interaction regressions
  journey/                        # M7 journey/progress regressions
  settings/                       # M7 preference persistence regressions
docs/
  m2-curriculum-engine.md         # M2 rationale and boundaries
  m3-question-generation-engine.md # M3 architecture and completion lock
  m4-learning-session-offline-storage.md # M4 architecture and completion lock
  m5-mastery-adaptive-learning.md # M5 mastery/adaptive completion lock
  m6-visual-mathematics-pedagogy.md # M6 terminal lock
  m7-learner-journey-app-shell.md # M7 architecture and completion state
.github/workflows/ci.yml          # Automated quality gate
```

M3 remains semantic and renderer-independent. M6 now consumes those semantics through a tested visual-model boundary, so React renders mathematical content without becoming a second generator.

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

The M4 completion candidate contains **76 test definitions**:

- 56 pre-existing M1–M3 tests;
- 12 session lifecycle/determinism tests;
- 8 persistence/restore/index tests.

M4 implementation quality gate:

```text
Run number : 27
Run ID     : 37453142860
Head SHA   : 568f610bd2dcd155a304b2cd807add121ca060e2
Status     : completed
Conclusion : success
```

The final M4 documentation commit must also pass the full GitHub Actions quality gate before the milestone is terminally locked.

## Curriculum and pedagogy claims

The canonical catalog remains an internal mathematical ontology, not a provider curriculum.

Formal Cambridge, Indonesian, and Thai curriculum mapping remains future work and must be separately verified before any official alignment claim is made. It is outside the frozen M7 learner-journey scope.

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

## M4 completion criteria

M4 is complete because:

- practice-session and question-attempt contracts are typed and versioned;
- session lifecycle supports active, paused, resumed, and completed states;
- the default ten-minute duration is a target, not a forced wall-clock cutoff;
- deterministic per-question seeds derive from session seed + ordinal;
- M3 registry generation and validation remain authoritative;
- incorrect and correct learner answers are retained semantically;
- interrupted sessions can reconstruct the exact issued question;
- paused/background time is excluded from active-practice duration;
- unexpected process interruption does not silently add unknown offline time;
- persisted state is validated before restore;
- completed sessions are retained and locally indexed;
- the concrete Expo adapter is offline/device-local and uses `expo-sqlite/kv-store`;
- the React screen is session-driven rather than generator-driven;
- no accounts, child PII, tracking, remote storage, mastery scoring, or adaptive sequencing were introduced;
- all M1–M3 regression contracts remain green.

## M5 completion criteria

M5 is complete because:

- mastery evidence is derived only from validated completed M4 sessions;
- one completed question contributes one evidence unit;
- first-submission correctness is the independent-success signal, so retries cannot inflate mastery;
- learner state is deterministic at canonical SkillId × difficulty;
- insufficient evidence remains distinct from developing and mastered state;
- the current engineering policy requires at least five evidence units per difficulty and at least four first-try successes among the most recent five for difficulty mastery;
- those thresholds are explicitly engineering policy rather than externally validated pedagogical cutoffs;
- a skill is mastered only when difficulties 1, 2, and 3 are all mastered;
- recency ordering is deterministic;
- the full M2 transitive prerequisite closure constrains eligibility;
- generator availability is handled separately from curriculum eligibility;
- unsupported or blocked practice returns an explicit unavailable result rather than a silent fallback;
- eligible in-progress practice is preferred, with M2 topological order as deterministic tie-breaking;
- the Grade 1 entry path is real rather than assumed:

    number_recognition_10
            ↓
    addition_concept
            ↓
    addition_within_10

- number_recognition_10 and addition_concept received narrowly scoped M3 generators because M5 demonstrated a concrete entry-path blocker;
- zero-history Grade 1 progression through those prerequisites is covered end-to-end;
- startRecommendedPractice(...) converts a recommendation into an M4 PracticeSession and issues its first question through the M3 registry;
- no derived mastery cache or new persistence schema was introduced; M4 schema version 1 remains authoritative;
- no account, child PII, tracking, cloud identity, or remote learner-history requirement was added;
- React UI remains outside the M5 completion boundary because final visual mathematics and pedagogy belong to M6;
- all prior regression contracts remain green.

M5 final implementation checkpoint:

    Commit     : e9dde1483ee2a8bd495b87eef182b08e488b1566
    Run number : 34
    Run ID     : 37473526373
    Status     : completed
    Conclusion : success
    Tests      : 105 passed / 0 failed

Two intermediate CI failures were repaired narrowly: run 31 exposed connector escaping damage in localization/test regular expressions plus a stale registry-count assertion, and run 32 confirmed only the stale 6→8 registry-count expectation remained. Run 33 then passed the 101-test entry-path state before the recommendation-to-session bridge was added.

M5 does not claim that every Grade 1–3 canonical skill is already practiceable. M3 generator coverage remains intentionally incremental, and M5 represents unavailable curriculum/generator states explicitly.

M6 — Visual Mathematics & Pedagogy is **COMPLETE / TERMINAL-LOCKED**. Representative child-facing coverage now includes large numerals, object groups, equal-part fractions, analog clocks, number lines, common 2D shapes, tally/simple tables, simple pictograms, and unit-scale bar charts. All currently defined question types have supported child-facing answer interaction, visual rendering remains semantic-model-driven and PRNG-free, M4 persistence remains schema version 1, and the locked M1 deterministic regression remains unchanged. The terminal implementation checkpoint before the documentation lock is commit `4cf4595705da9bfe96c567cd675f4b44c6939019`, GitHub Actions Run 59, with 151 passed / 0 failed.

M7 — Learner Journey & App Shell is **COMPLETE / TERMINAL-LOCKED**. The terminal implementation checkpoint before the documentation lock is commit `532313468835df4248d4f830a05bd324c8bb1639`, tree `3027f1d6ee8bb67272fa7b26f813597304a66958`, GitHub Actions Run 72, with 165 passed / 0 failed / 0 skipped.

See docs/m2-curriculum-engine.md for M2, docs/m3-question-generation-engine.md for M3, docs/m4-learning-session-offline-storage.md for M4, docs/m5-mastery-adaptive-learning.md for M5, docs/m6-visual-mathematics-pedagogy.md for M6, and docs/m7-learner-journey-app-shell.md for the M7 terminal lock.
