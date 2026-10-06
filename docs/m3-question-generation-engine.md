# M3 — Question Generation Engine

Status: **IN PROGRESS**

## Purpose

M3 answers:

**How does EduMath generate a mathematically valid question for a canonical skill?**

It does not redefine which skills exist. The 60-skill M2 canonical catalog remains authoritative.

## Current architecture

The question engine now uses a typed `QuestionGenerator` contract and a small explicit registry.

Each registered generator declares:

- supported canonical skill IDs;
- generator capability;
- supported grades;
- supported difficulty levels;
- supported question types;
- supported representations;
- required canonical constraint fields;
- deterministic generation logic;
- generator-specific validation.

The registry performs compatibility checks before generation and verifies the generated semantic question afterward.

Unsupported skills fail explicitly.

This is intentionally a small typed registry, not a dependency-injection or plugin framework.

## Canonical M2 integration

Before dispatch, the registry checks the generator against the canonical skill definition in `canonicalSkills.ts`.

Current checks include:

- requested skill is registered by the generator;
- generator capability matches the skill's `generatorCapability`;
- requested grade is canonically applicable;
- generator supports the requested grade and difficulty;
- requested question type is supported;
- requested representation is both canonical and implemented by the generator;
- generator-required canonical constraint metadata exists.

After generation, the registry verifies:

- generated skill ID matches the request;
- generated grade and difficulty match the request;
- domain/topic match canonical metadata;
- generated question type is declared;
- generated representation is canonical and declared;
- explicitly requested question type/representation are honored;
- generator-specific mathematical validation passes.

## Semantic question types

M3 has started evolving the M1 single-shape question model into a discriminated semantic union.

Current semantic operations:

- addition;
- subtraction;
- number comparison.

Current question types:

- `numeric-choice`;
- `relation-choice`.

Mathematical semantics remain separate from EN / ID / TH rendering.

## Implemented generators

### `addition_within_10`

This remains the M1 regression generator.

Difficulty caps remain:

- difficulty 1: result <= 5;
- difficulty 2: result <= 7;
- difficulty 3: result <= 10.

The locked reference case is preserved:

```text
seed 20261006 → 4 + 1 = 5
```

### `subtraction_within_10`

This proves a second arithmetic operation while retaining deterministic seeded generation.

Current invariants include:

- Grade 1 only;
- non-negative integer operands;
- subtrahend <= minuend;
- minuend <= 10;
- expected answer equals `a - b`;
- difficulty caps of 5, 7, and 10.

### `compare_order_numbers_20`

This proves a non-arithmetic semantic question family and a second question type.

Current output asks the learner to select one relation:

- less-than;
- equal;
- greater-than.

Current invariants include:

- Grade 1 only;
- integer values in the canonical 0–20 range;
- difficulty caps of 10, 15, and 20;
- expected relation must match the generated values.

## Validation architecture

Validation is generator-specific.

`validateQuestion(...)` is now a dispatcher to the registered generator's validator instead of containing one growing set of unrelated mathematical rules.

This preserves separation between generation and validation: a question is not accepted merely because a generator returned it.

## Determinism and testing

The existing seeded 32-bit LCG remains unchanged.

M3 tests cover:

- same seed -> same question;
- high-volume deterministic seed samples;
- expected-answer correctness;
- grade restrictions;
- difficulty caps;
- registry support and unsupported-skill behavior;
- canonical representation checks;
- multilingual semantic rendering;
- the locked M1 reference seed.

Current verified quality checkpoint:

```text
GitHub Actions run : 12
Head SHA           : 2ae2e8912cc014b2b26e6f0359dced9e9f828b5b
Tests              : 30
Passed             : 30
Failed             : 0
Skipped            : 0
```

Two intermediate CI failures were useful contract checks:

1. run 9 exposed a stale test that still treated the newly implemented subtraction generator as unsupported;
2. run 11 exposed an unsafe property access after `Question` became a discriminated union.

Both were corrected with narrow follow-up commits.

## Boundary

M3 has not introduced:

- mastery scoring;
- adaptive sequencing;
- learner persistence;
- cloud accounts;
- analytics/tracking;
- formal Cambridge / Indonesia / Thailand curriculum mapping;
- official Montessori claims;
- full visual mathematics UI.

Those remain later-milestone concerns.

## Next objective

M3 is not complete.

The next implementation increment should add a representative Grade 2–3 generator family, preferably one that proves a different mathematical constraint pattern, then continue expanding only where the architecture remains clear and testable.
