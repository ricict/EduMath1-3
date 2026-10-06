# M3 — Question Generation Engine

Status: **COMPLETE**

Completion date: **2026-10-06**

## 1. Purpose

M3 answers:

**How does EduMath generate a mathematically valid question for a canonical skill?**

M3 does not redefine what skills exist. The 60-skill M2 canonical catalog remains authoritative.

M3 is an architecture-and-representative-families milestone. Completion does **not** mean that all 60 canonical skills already have generator implementations.

## 2. Final architecture

The question engine uses a typed `QuestionGenerator` contract and a small explicit registry.

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

M3 deliberately does not introduce a dependency-injection framework or generalized plugin system.

## 3. Canonical M2 integration

Before dispatch, the registry verifies:

- the requested canonical skill has a registered generator;
- the generator declares that skill;
- generator capability matches the skill's `generatorCapability`;
- requested grade is canonical for the skill;
- the generator supports the requested grade;
- the generator supports the requested difficulty;
- any requested question type is supported;
- any requested representation is canonical and implemented by the generator;
- all generator-required canonical constraint metadata exists.

After generation, the registry verifies:

- generated skill ID matches the request;
- generated grade matches the request;
- generated difficulty matches the request;
- generated domain/topic match canonical skill metadata;
- generated question type is declared by the generator;
- generated representation is canonical for the skill;
- generated representation is declared by the generator;
- explicitly requested question type/representation are honored;
- generator-specific mathematical validation passes.

## 4. Registry integrity validation

M3 adds independent registry validation that detects:

- duplicate generator IDs;
- duplicate canonical skill ownership;
- empty supported-skill metadata;
- empty supported-grade metadata;
- empty difficulty metadata;
- empty question-type metadata;
- empty representation metadata;
- duplicate descriptor values;
- generator capability drift from M2;
- non-canonical grade declarations;
- non-canonical representation declarations;
- missing required canonical constraints.

The registered production registry is validated when loaded and is also covered by malformed-registry tests.

## 5. Semantic question model

The original M1 single arithmetic shape was evolved into a discriminated semantic union.

Final M3 question types:

- `numeric-choice`;
- `relation-choice`;
- `fraction-choice`;
- `time-choice`.

Final M3 semantic operations exercised by representative generators:

- addition;
- subtraction;
- multiplication;
- number comparison;
- unit fraction;
- read clock.

Representations exercised:

- symbolic;
- visual;
- clock.

The mathematical object remains independent of English, Indonesian, and Thai rendering.

## 6. Implemented representative generators

### 6.1 `addition_within_10`

Grade:

- 1.

Capability:

- addition.

Representation:

- symbolic.

Difficulty result caps remain:

- difficulty 1: result <= 5;
- difficulty 2: result <= 7;
- difficulty 3: result <= 10.

Locked M1 deterministic reference:

```text
seed 20261006 → 4 + 1 = 5
```

This behavior remains unchanged.

### 6.2 `subtraction_within_10`

Grade:

- 1.

Capability:

- subtraction.

Core invariants:

- non-negative integer operands;
- subtrahend <= minuend;
- minuend <= 10;
- expected answer equals `a - b`;
- difficulty caps of 5, 7, and 10.

### 6.3 `compare_order_numbers_20`

Grade:

- 1.

Capability:

- number comparison.

Question type:

- `relation-choice`.

Possible semantic answers:

- less-than;
- equal;
- greater-than.

Core invariants:

- values remain within canonical 0–20;
- difficulty caps are 10, 15, and 20;
- expected relation must match the generated values.

This family exercises the M2 `valueRange` pattern.

### 6.4 `multiplication_facts_2_5_10`

Grades:

- 2 and 3.

Capability:

- multiplication.

Fact families:

- difficulty 1: 2;
- difficulty 2: 2 and 5;
- difficulty 3: 2, 5, and 10.

Other factor:

- 0–10.

Core invariants:

- one factor matches the declared fact family;
- expected answer equals `a × b`;
- result remains within canonical 0–100.

This family proves multi-grade generation and the M2 `resultRange` pattern beyond the M1 addition case.

A deterministic sampling issue was found during implementation: the first LCG draw for small consecutive seeds was too correlated for fact-family diversity. The new multiplication generator therefore draws the multiplier before the fact family. The shared PRNG implementation and M1 deterministic behavior were not changed.

### 6.5 `unit_fractions`

Grades:

- 2 and 3.

Capability:

- fraction.

Question type:

- `fraction-choice`.

Representation:

- visual semantic data.

Canonical denominators are read from M2:

```text
[2, 3, 4, 5, 6, 8, 10]
```

Difficulty subsets:

- difficulty 1: 2, 4;
- difficulty 2: 2, 3, 4, 5;
- difficulty 3: all canonical allowed denominators.

The semantic question stores one shaded part, total parts, numerator, denominator, and a structured fraction answer.

This family proves direct runtime consumption of the M2 `allowedDenominators` constraint.

### 6.6 `tell_time_hour_half_hour`

Grades:

- 1 and 2.

Capability:

- time.

Question type:

- `time-choice`.

Representation:

- clock.

Difficulty rules:

- difficulty 1: whole hours 1–6;
- difficulty 2: whole hours 1–12;
- difficulty 3: hours 1–12 with whole-hour or half-hour values.

The semantic question stores hour/minute data and a structured time answer. M3 does not implement the final clock drawing component.

### 6.7 Post-M3 extension required by M5

M3 originally completed with the six representative generators documented above.

During M5, strict prerequisite enforcement exposed a concrete Grade 1 entry-path blocker: every original registered generator depended on prerequisite skills, while the curriculum-eligible root skills had no generator.

M5 therefore justified two narrowly scoped additions using the existing M3 contracts:

- number_recognition_10 — Grade 1, number-identification capability, visual semantic representation, canonical valueRange;
- addition_concept — Grade 1, addition capability, visual combine-group semantics, canonical resultRange.

The current registry therefore contains eight generators.

This extension did not replace the shared PRNG, registry architecture, validation boundary, deterministic dispatch, semantic question model, or the locked M1 reference. It is an example of later milestones extending generator coverage only after a concrete downstream requirement is demonstrated.

## 7. Generator-specific validation

Generation and validation remain separate.

`validateQuestion(...)` dispatches to the registered generator's validator rather than embedding all mathematical rules in one monolithic function.

A generated question is therefore not accepted merely because a generator returned it.

## 8. Determinism

The existing deterministic 32-bit LCG in `seededRandom.ts` remains unchanged.

No PRNG replacement was needed.

For every representative family, automated tests verify that identical context and seed reproduce identical semantic questions.

The locked M1 reference remains exactly:

```text
grade      : 1
skill      : addition_within_10
difficulty : 3
seed       : 20261006
question   : 4 + 1
answer     : 5
```

## 9. Testing strategy

M3 tests include:

- same seed -> same question;
- high-volume deterministic seed samples;
- expected-answer correctness;
- mathematical invariant checks;
- grade restrictions;
- skill restrictions;
- difficulty constraints;
- canonical constraint consumption;
- unsupported-context behavior;
- representation compatibility;
- multilingual semantic rendering;
- malformed generator-registry tests;
- M1 deterministic regression;
- a generic registry matrix over every registered generator, skill, supported grade, difficulty, and 128 deterministic seeds.

The generic registry matrix verifies that every generated question:

- is reproducible;
- passes validation;
- retains the requested skill;
- retains the requested grade;
- retains the requested difficulty;
- uses a declared question type;
- uses a declared representation.

## 10. Final implementation quality checkpoint

GitHub Actions run 20 verified the final implementation before the documentation lock:

```text
Run ID     : 37440758684
Head SHA   : fbe3ab566635d66b820ed69a53f27dfcba992752
Tests      : 56
Passed     : 56
Failed     : 0
Skipped    : 0
```

The final documentation commit must also pass the full GitHub Actions quality gate before M3 is considered locked.

## 11. Useful intermediate failures

Intermediate CI failures were retained in history rather than rewritten.

They exposed useful contract problems:

1. run 9: a stale unsupported-skill test still named the newly implemented subtraction generator;
2. run 11: a test accessed arithmetic fields without narrowing the new discriminated question union;
3. run 14: TypeScript correctly rejected an insufficiently narrowed multiplication expected-answer type;
4. run 15: high-volume tests exposed poor first-draw LCG diversity for consecutive low seeds in the new multiplication fact-family selection.

Each was fixed with a narrow follow-up commit.

## 12. M3 completion boundary

M3 intentionally does not include:

- all 60 canonical skill generators;
- mastery scoring;
- adaptive sequencing;
- learner session persistence;
- offline learner-history storage;
- machine learning;
- parent dashboard;
- billing;
- cloud accounts;
- analytics/tracking;
- formal Cambridge curriculum mapping;
- formal Indonesian curriculum mapping;
- formal Thai curriculum mapping;
- official Montessori claims;
- full visual pedagogy components;
- app-store deployment.

Future generator coverage must extend the same typed registry and validation contracts rather than bypassing them.

## 13. M3 completion criteria

M3 is complete when all of the following are true:

- typed generator interfaces/contracts exist;
- dispatch/registration is explicit;
- canonical-skill compatibility is enforced;
- difficulty handling is explicit;
- seeded generation is deterministic;
- semantic mathematical outputs are typed;
- required canonical constraints are checked;
- generator-specific validation remains separate;
- representative families cover Grades 1–3;
- materially different question types/representations are proven;
- high-volume invariant tests pass;
- unsupported skills fail explicitly;
- malformed registry metadata is detected;
- the M1 regression seed remains unchanged;
- the full quality gate is green.

All criteria are satisfied by the M3 completion candidate.

## 14. M3 lock

Treat the following as M3-complete contracts unless a later milestone exposes a real defect:

```text
typed QuestionGenerator contract
explicit generator registry
registry integrity validation
canonical capability checks
canonical grade checks
canonical representation checks
required constraint checks
question-type compatibility
difficulty compatibility
seeded deterministic generation
generator-specific validators
semantic discriminated Question union
EN / ID / TH rendering separation
explicit unsupported-skill behavior
6 representative generators
Grade 1–3 coverage
numeric / relation / fraction / time question types
symbolic / visual / clock semantic representations
high-volume per-family invariant tests
generic registry matrix tests
M1 seed 20261006 -> 4 + 1 = 5
```

Do not broaden this lock into a claim that every canonical skill has a generator.
