# M5 — Mastery & Adaptive Learning Engine

Status: **IN PROGRESS**

Started: **2026-10-06**

## 1. Purpose

M5 answers:

**Given validated historical learner outcomes and the canonical curriculum DAG, what is the learner's current skill state and what eligible practice should be recommended next?**

M5 consumes:

- M2 canonical skills, grades, prerequisites, and deterministic topological progression;
- M3 generator availability and generator context metadata;
- M4 validated completed-session history.

M5 does not redefine curriculum, question mathematics, validation, session timing, or persistence semantics.

## 2. First implementation increment

The first implementation increment adds:

    src/core/adaptive/
      types.ts
      mastery.ts
      recommendation.ts
      history.ts

and deterministic tests under:

    tests/adaptive/

The React practice UI is not connected to M5 yet.

## 3. Evidence boundary

Historical evidence comes from:

    LocalSessionStore.listCompleted()

Only completed M4 sessions are accepted by the mastery builder.

Active or paused sessions are not treated as historical mastery evidence.

M5 does not read translated prompts. It uses semantic question-attempt records.

## 4. Unit of mastery state

The primary evidence unit is:

    canonical SkillId × difficulty

Each completed question contributes exactly one evidence unit.

The evidence record retains:

- canonical SkillId;
- grade;
- difficulty;
- local session ID;
- question ordinal;
- question completion timestamp;
- whether the first submission was correct;
- number of incorrect submissions before the terminal correct answer.

Evidence is aggregated across completed sessions.

The stable canonical SkillId is the learning identity. Grade is retained as evidence metadata rather than splitting the same canonical skill into unrelated grade-specific mastery records.

## 5. Retry semantics

A completed M4 question always ends with a correct answer.

Therefore terminal correctness alone cannot distinguish independent success from success after retry.

M5 uses the first submission as the independent-success signal:

- first submission correct = first-try success;
- first submission incorrect = retry-required evidence.

Additional retries do not create additional positive evidence units.

This prevents repeated attempts on one question from inflating mastery.

## 6. Current engineering mastery policy

The current policy constants are:

    recentEvidenceWindow = 5
    minimumEvidencePerDifficulty = 5
    requiredFirstTryCorrectInWindow = 4

For each SkillId and difficulty:

- fewer than five completed questions = insufficient-evidence;
- five or more questions, with fewer than four first-try successes among the most recent five = developing;
- five or more questions, with at least four first-try successes among the most recent five = mastered.

This corresponds to an 80 percent first-try threshold over the current five-question recency window.

These values are **engineering policy**, not externally validated pedagogical thresholds.

They must not be described as scientifically established mastery cutoffs.

## 7. Recency semantics

Recency is explicit rather than implicit.

Evidence is deterministically ordered by:

1. question completion timestamp;
2. local session ID when timestamps tie;
3. question ordinal when session IDs also tie.

Only the most recent five evidence units at a difficulty determine the current mastery classification once minimum evidence is available.

Older evidence remains counted in total evidence but does not dominate current status.

## 8. Skill-level mastery

A canonical skill is mastered only when all three current M3 difficulty levels are mastered:

    difficulty 1
    difficulty 2
    difficulty 3

If at least one difficulty has an established developing/mastered state but all three are not mastered, the skill is developing.

If no difficulty has enough evidence to establish developing/mastered status, the skill remains insufficient-evidence.

The recommended difficulty is the lowest difficulty not yet mastered.

This is conservative and deterministic.

## 9. Curriculum eligibility

M5 does not invent mathematics or bypass M2 progression.

For a candidate skill:

- the skill must be applicable to the requested grade;
- the full transitive prerequisite closure is obtained from the M2 DAG;
- every prerequisite in that closure must currently be mastered.

A prerequisite with insufficient evidence is not treated as mastered.

A prerequisite override or grade-entry assumption would require a separate explicit design decision and tests.

## 10. Generator availability

Curriculum eligibility and actual practiceability are different states.

After a skill is curriculum-eligible, M5 checks whether M3 has a generator for the skill and whether that generator supports the requested grade and selected difficulty.

If not, the skill remains curriculum-eligible but is not currently practiceable.

M5 does not silently fall back to an unrelated generated skill.

## 11. Recommendation policy

Among curriculum-eligible, generator-supported, unmastered skills:

1. an eligible skill that already has learner evidence is preferred over an unseen eligible skill;
2. remaining ties are resolved by the deterministic M2 topological order.

The recommendation includes:

- grade;
- canonical SkillId;
- selected difficulty;
- a structured reason code;
- prerequisite SkillIds;
- current evidence count for the selected skill.

Current practice reason codes are:

    START_ELIGIBLE_SKILL
    CONTINUE_SKILL
    ADVANCE_DIFFICULTY

When no practice can safely be recommended, M5 returns a structured unavailable result rather than choosing a fallback.

## 12. Current generator-entry blocker

The current M3 registry contains six representative generators:

- addition_within_10;
- subtraction_within_10;
- compare_order_numbers_20;
- multiplication_facts_2_5_10;
- unit_fractions;
- tell_time_hour_half_hour.

Every one of these skills has one or more canonical prerequisites.

At the same time, the currently curriculum-eligible root skills for a new Grade 1 learner do not have M3 generators.

Therefore, with strict prerequisite enforcement, a new learner currently has curriculum-eligible skills but no curriculum-eligible practiceable skill.

M5 now returns:

    NO_PRACTICABLE_CURRICULUM_ELIGIBLE_SKILL

for that situation.

This is an explicit architecture result, not an error to hide.

It establishes a concrete blocking requirement for a later decision about entry-path generator coverage or an explicitly designed placement/bootstrap policy.

M5 does not make that policy decision in this increment.

## 13. Persistence decision

No new mastery persistence schema is introduced in the first increment.

The learner model is derived deterministically from validated completed M4 sessions.

Reasons:

- M4 already stores the necessary semantic history;
- derived state can be reproduced exactly;
- avoiding a second persisted mastery cache prevents drift;
- no migration of PRACTICE_SESSION_SCHEMA_VERSION = 1 is required.

A persisted derived summary may be introduced later only if actual performance or query requirements justify it.

## 14. Privacy

M5 adds no:

- child name;
- email;
- phone;
- location;
- advertising identifier;
- social login;
- cloud identity;
- tracking identifier.

The current learner model remains derived from local semantic practice history.

## 15. Testing

The first M5 increment verifies:

- one completed question produces one evidence unit;
- retries do not inflate positive mastery evidence;
- insufficient evidence is distinct from developing/mastered state;
- four first-try successes in the recent five master one difficulty;
- three first-try successes in five do not;
- all three difficulty levels are required for skill mastery;
- the most recent evidence window controls current status;
- identical history produces identical learner state regardless of input session order;
- non-completed sessions are rejected as historical evidence;
- LocalSessionStore.listCompleted is the historical source boundary;
- historical sessions are not mutated;
- transitive prerequisites are enforced;
- generator availability remains separate from curriculum eligibility;
- a new learner receives an explicit unavailable result rather than a prerequisite bypass;
- deterministic topological tie-breaking is preserved;
- eligible in-progress practice is preferred over unseen practice.

Implementation checkpoint:

    Commit     : 972e81db4ce7e8660be1eb9c4911691927841314
    Run number : 29
    Run ID     : 37470514354
    Status     : completed
    Conclusion : success
    Tests      : 92 passed / 0 failed

## 16. Current boundary

M5 is not complete yet.

Still unresolved:

- the entry-path blocker created by strict prerequisites plus limited M3 generator coverage;
- whether generator coverage should be expanded for root/prerequisite skills or a separate placement/bootstrap contract should be designed;
- connection of the stable M5 recommendation API to session creation;
- persistence/performance review after realistic history volume exists;
- final M5 completion audit and documentation lock.

Do not connect React UI to M5 until the entry-path policy is explicitly resolved.
