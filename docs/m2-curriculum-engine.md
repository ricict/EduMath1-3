# M2 — Curriculum & Canonical Skill Engine

Status: **COMPLETE**

## Purpose

M2 turns the three-skill M1 proof into the authoritative internal mathematics skill model for EduMath Grade 1–3.

The model answers:

- what mathematical capabilities exist;
- which Grade 1–3 stages they are applicable to;
- which canonical prerequisite relationships connect them;
- what broad generator capability will eventually be required;
- which mathematical representations are valid;
- what simple numeric constraints are important to preserve.

M2 does not answer how a large family of questions is generated. That belongs to M3.

M2 also does not map provider learning objectives onto EduMath skills. That belongs to M7.

## Design decisions

### 1. Stable IDs are separate from display wording

`skillIds.ts` contains the canonical IDs and derives the `SkillId` TypeScript union from that tuple.

This prevents a duplicated hand-maintained ID union from drifting away from the catalog.

### 2. Progression is represented by prerequisites

The graph is a directed acyclic graph (DAG).

No second `sequence` or `progressionIndex` field is stored because it could conflict with prerequisites. A deterministic topological order can be derived whenever a linearized progression is needed.

Multiple root skills are allowed because mathematics has independent entry points (for example early number, measurement comparison, shapes, patterns, and classification).

### 3. Grade applicability is metadata, not curriculum-provider authority

A skill may be applicable to more than one EduMath grade.

The values are an internal Grade 1–3 design envelope. A future curriculum profile can narrow or order these skills for a specific provider without duplicating the mathematics engine.

### 4. Domain/topic combinations are controlled

`taxonomy.ts` defines the valid topics for each internal domain.

Current domains:

- number;
- operations;
- algebra;
- measurement;
- geometry;
- data.

This prevents accidental combinations such as the `addition` topic being assigned to the `geometry` domain.

### 5. Generator capability is metadata only

Each skill declares a `generatorCapability`.

Examples include:

- counting;
- number comparison;
- place value;
- fraction;
- addition/subtraction;
- multiplication/division;
- equality;
- pattern;
- measurement/time/money;
- shape/position;
- table/pictogram/bar-chart/data interpretation.

M2 does not register or implement the corresponding generator modules.

### 6. Constraints are intentionally small

M2 stores only constraint types with an obvious downstream use:

- value range;
- result range;
- allowed denominators.

It does not introduce a generalized rule language.

M3 can extend the constraint model only when real generator requirements justify it.

### 7. Representation capability is explicit

Skills declare one or more supported representations:

- symbolic;
- visual;
- concrete;
- number line;
- clock;
- money;
- table;
- pictogram;
- bar chart.

This lets later generator/pedagogy layers reason about valid presentations without mixing that logic into React screens.

## Canonical catalog

M2 contains 60 canonical skills.

Coverage includes:

- early number recognition and counting;
- comparison and ordering;
- tens/ones and hundreds place value;
- composition/decomposition;
- skip counting;
- numbers to 1,000;
- rounding foundations;
- halves, quarters, unit fractions, comparison, and simple equivalence;
- addition/subtraction from concept level through 1,000;
- multiplication/division conceptual foundations and selected facts;
- equality and missing-number relationships;
- repeating and number patterns;
- length, mass, duration, time, and money;
- 2D/3D shapes, shape composition, properties, and position;
- classification, tallies/tables, pictograms, unit-scale bar charts, and simple data interpretation.

This catalog is deliberately a canonical mathematical ontology rather than a copied syllabus.

## Validation rules

`skillGraph.ts` validates:

1. duplicate IDs;
2. missing canonical definitions;
3. unknown prerequisites;
4. self-prerequisites;
5. duplicate prerequisite edges;
6. cyclic prerequisite paths;
7. grade metadata that is empty, duplicated, or unsorted;
8. prerequisites whose first applicable grade is later than the dependent skill;
9. invalid domain/topic pairs;
10. missing representations;
11. malformed numeric ranges or allowed-denominator constraints.

It also provides:

- deterministic topological ordering;
- transitive prerequisite closure.

## Regression contract

The M1 chain remains unchanged:

```text
number_recognition_10
        ↓
addition_concept
        ↓
addition_within_10
```

The existing `addition_within_10` generator remains the only implemented generator at M2 completion.

## External curriculum basis

The following authoritative sources were reviewed to ensure the internal catalog covers the major primary-mathematics areas relevant to later provider mapping.

### Cambridge International

Cambridge Primary Mathematics (0096) describes primary mathematics using major areas including Number, Geometry and Measure, and Statistics and Probability, with curriculum frameworks providing stage-level learning objectives.

- https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-primary/curriculum/mathematics/
- https://help.cambridgeinternational.org/hc/en-gb/articles/360000048198-What-are-the-Cambridge-Primary-curriculum-frameworks

These sources inform coverage only. No Cambridge learning-objective mapping is encoded in M2.

### Indonesia — Kemendikdasmen

The 2025 mathematics subject guidance describes Fase A (generally Grades 1–2) and Fase B (generally Grades 3–4), including number, algebra, measurement, geometry, and data/probability content.

- https://repositori.kemendikdasmen.go.id/33608/1/5.%20Final%20Panduan%20Mata%20Pelajaran%20Matematika_12_09_2025_Revisi%203.pdf
- https://guru.kemendikdasmen.go.id/kurikulum/referensi-penerapan/capaian-pembelajaran/sd-sma/matematika/

These sources inform coverage only. No Indonesian CP/ATP mapping is encoded in M2.

### Thailand — OBEC

OBEC publishes the 2025 early-primary curriculum for Prathom 1–3 and accompanying curriculum documents.

- https://box.obec.go.th/1055414
- https://www.academic.obec.go.th/web/document/view/315

These sources confirm the relevant Grade 1–3 curriculum context only. No Thai curriculum objective mapping is encoded in M2.

## Explicit non-claims

M2 does not claim:

- official Cambridge alignment;
- official Indonesian curriculum alignment;
- official Thai curriculum alignment;
- official Montessori alignment.

Formal provider mapping belongs to M7.

## Test status at implementation commit

GitHub Actions run 5 for commit `b272c9da7a19dc32defae5879c2ea64f26dd1904` completed successfully.

The suite reported:

- tests: 16;
- pass: 16;
- fail: 0;
- skipped: 0.

That implementation run contained 11 M2 curriculum/graph tests plus 5 M1 regression tests. The final M2 suite adds explicit malformed-constraint coverage, bringing the current total to 17 tests.

## Deferred items

The repository still has no committed `package-lock.json`.

M2 does not add one because dependency locking is an engineering-hardening concern rather than a curriculum-engine requirement. If introduced later, it must be generated from the actual dependency graph and followed by the full quality gate.

No broad Expo, React Native, React, or TypeScript dependency upgrade is part of M2.
