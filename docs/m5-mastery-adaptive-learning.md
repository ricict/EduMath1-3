# M5 — Mastery & Adaptive Learning Engine

Status: **COMPLETE**

Completion date: **2026-10-06**

## 1. Purpose

M5 answers:

**Given validated historical learner outcomes and the canonical curriculum DAG, what is the learner's current skill state and what eligible practice should be recommended next?**

M5 consumes M2 curriculum structure, M3 generator capability, and M4 validated completed-session history.

It does not redefine the canonical mathematics catalog, generator mathematics, session timing, or storage semantics.

## 2. Final architecture

The M5 domain lives under:

    src/core/adaptive/
      types.ts
      mastery.ts
      history.ts
      recommendation.ts
      startRecommendedPractice.ts

The final dependency direction is:

    M4 completed history
        ↓
    M5 evidence extraction
        ↓
    M5 mastery state
        ↓
    M2 prerequisite eligibility
        ↓
    M3 generator availability
        ↓
    M5 deterministic recommendation
        ↓
    M4 session creation
        ↓
    M3 first question generation

The React screen is not part of this M5 completion boundary.

## 3. Historical evidence boundary

Historical evidence comes only from:

    LocalSessionStore.listCompleted()

Active or paused sessions are rejected as historical mastery evidence.

M5 consumes semantic question attempts rather than translated prompts.

Completed M4 records are not mutated.

## 4. Unit of learner state

The primary evidence unit is:

    canonical SkillId × difficulty

Each completed question contributes exactly one evidence unit.

Evidence retains:

- SkillId;
- grade;
- difficulty;
- local session ID;
- question ordinal;
- completion timestamp;
- first-submission correctness;
- incorrect submission count before the terminal correct answer.

Evidence aggregates across completed sessions.

Grade remains evidence metadata. The stable SkillId is the learning identity.

## 5. Retry semantics

M4 completed attempts always terminate with a correct answer, so terminal correctness alone is not a useful mastery signal.

M5 therefore uses first-submission correctness:

- first answer correct → first-try success;
- first answer incorrect → retry-required evidence.

A question still contributes only one evidence unit regardless of the number of retries.

Retries therefore cannot inflate mastery by creating extra positive observations.

## 6. Engineering mastery policy

The frozen M5 policy is:

    recentEvidenceWindow = 5
    minimumEvidencePerDifficulty = 5
    requiredFirstTryCorrectInWindow = 4

For each SkillId and difficulty:

- fewer than five evidence units → insufficient-evidence;
- at least five evidence units and fewer than four first-try successes in the most recent five → developing;
- at least five evidence units and at least four first-try successes in the most recent five → mastered.

This is an engineering policy.

It is not presented as a scientifically validated pedagogical cutoff.

Any future threshold change must be deliberate, documented, and regression-tested.

## 7. Recency semantics

Evidence is ordered deterministically by:

1. completion timestamp;
2. session ID when timestamps tie;
3. question ordinal when both previous values tie.

The most recent five evidence units at a difficulty determine current status once minimum evidence exists.

Older evidence remains part of the historical count but does not dominate current classification.

## 8. Skill-level mastery

A canonical skill is mastered only when all three current difficulty levels are mastered:

    difficulty 1
    difficulty 2
    difficulty 3

The next recommended difficulty is the lowest difficulty not yet mastered.

A skill with some established progress but incomplete difficulty mastery remains developing.

A skill without sufficient evidence remains insufficient-evidence.

## 9. Curriculum eligibility

M5 never decides what mathematics exists.

M2 remains authoritative.

For a candidate skill:

- the skill must be applicable to the requested grade;
- M5 obtains the complete transitive prerequisite closure from the M2 DAG;
- every prerequisite must be mastered.

Insufficient evidence is not silently treated as prerequisite mastery.

M5 includes no prerequisite override.

## 10. Generator availability

Curriculum eligibility and practiceability are separate.

A curriculum-eligible skill is practiceable only when M3 has a generator that supports the required skill, grade, and difficulty.

If that requirement is not satisfied, M5 returns an explicit unavailable state or continues with another legitimately eligible/practiceable skill according to policy.

It never silently substitutes an unrelated skill.

## 11. Recommendation policy

For curriculum-eligible, generator-supported, unmastered candidates:

1. eligible in-progress skills are preferred over unseen skills;
2. remaining ties follow M2 deterministic topological order.

A practice recommendation contains:

- grade;
- SkillId;
- difficulty;
- structured reason;
- prerequisite SkillIds;
- evidence count.

Practice reason codes are:

    START_ELIGIBLE_SKILL
    CONTINUE_SKILL
    ADVANCE_DIFFICULTY

Unavailable conditions remain structured and explicit.

## 12. Grade 1 entry-path resolution

The first M5 implementation exposed a real blocker: the original six M3 generators all sat behind prerequisites, while no Grade 1 root skill was generator-supported.

M5 did not solve this by assuming mastery or bypassing the DAG.

Instead, the concrete blocker justified two M3 extensions:

    number_recognition_10
    addition_concept

The resulting tested Grade 1 entry path is:

    number_recognition_10
            ↓
    addition_concept
            ↓
    addition_within_10

number_recognition_10 uses visual semantic number-recognition data.

addition_concept models combining two non-negative groups and remains semantically distinct from symbolic addition_within_10.

Both use the existing M3 registry, validation, deterministic PRNG, canonical constraint metadata, and semantic/localization separation.

## 13. Recommendation-to-session bridge

M5 adds:

    startRecommendedPractice(...)

The function:

1. loads validated completed history;
2. builds the learner model;
3. obtains the deterministic M5 recommendation;
4. returns the unavailable recommendation unchanged when no safe practice exists;
5. otherwise creates the matching M4 PracticeSession;
6. issues the first question through M4, which delegates generation to the M3 registry.

The bridge does not bypass M4 persistence or M3 validation.

It does not automatically save the new session; persistence remains owned by the session/application boundary.

## 14. Persistence decision

M5 introduces no new persisted mastery schema.

The learner model is derived from validated completed M4 history.

Reasons:

- M4 already stores sufficient semantic evidence;
- derived state is deterministic;
- a second mastery cache could drift from authoritative history;
- current history volume does not justify a separate optimization layer;
- PRACTICE_SESSION_SCHEMA_VERSION remains 1.

A future cache or migration requires an actual performance/query requirement.

## 15. Privacy

M5 adds no requirement for:

- child full name;
- email;
- phone;
- location;
- advertising ID;
- social login;
- cloud identity;
- tracking ID.

Learner state remains derived from local semantic practice history.

## 16. Testing and CI

M5 tests cover:

- same history → same mastery state;
- same history → same recommendation;
- retry attempts cannot inflate mastery;
- insufficient evidence remains distinct from developing/mastered state;
- mastery thresholds operate per difficulty;
- recency uses the deterministic recent-five window;
- all three difficulties are required for skill mastery;
- completed-history order does not change the derived model;
- non-completed sessions are rejected as history;
- LocalSessionStore.listCompleted is the evidence boundary;
- transitive prerequisites block dependent skills;
- generator availability remains separate from curriculum eligibility;
- recommendation ties are deterministic;
- Grade 1 zero-history begins at number_recognition_10;
- difficulty progression remains on the same in-progress skill;
- mastered number recognition unlocks addition_concept;
- mastered addition_concept unlocks addition_within_10;
- the recommendation-to-session bridge creates the exact M4 plan selected by M5;
- the first issued question matches the recommendation;
- fixed history and fixed session inputs reproduce the same adaptive start;
- unavailable Grade 3 state remains explicit rather than manufacturing practice;
- M1 locked deterministic addition remains unchanged;
- all prior M1–M4 tests remain green.

Final implementation checkpoint before documentation lock:

    Commit     : e9dde1483ee2a8bd495b87eef182b08e488b1566
    Run number : 34
    Run ID     : 37473526373
    Status     : completed
    Conclusion : success
    Tests      : 105 passed / 0 failed

Intermediate implementation history:

- run 31 failed because connector escaping damaged localization/test regular expressions and because a legacy registry test still expected six generators;
- commit 94ce85a5cbe1c86006d9a175716d52e2efc9fbae repaired the escaping;
- run 32 then failed only on the stale 6→8 generator-count expectation;
- commit 927f019ef481998f031a9ee652ddc5761910145c updated that regression expectation;
- run 33 passed 101/101 tests for the completed entry path;
- run 34 passed 105/105 tests after adding the recommendation-to-session bridge.

## 17. Known limitations

M5 completion does not mean all 60 canonical skills have generators.

Some Grade 2–3 or later progression states may correctly return unavailable until M3 coverage expands.

The new number-recognition and addition-concept questions carry visual semantic data, but M5 intentionally does not implement their final visual components.

No official Cambridge, Indonesian, Thai, or Montessori curriculum alignment is claimed.

The mastery thresholds are engineering policy rather than externally validated pedagogical thresholds.

## 18. M5 completion boundary

M5 is complete because it now provides a deterministic, explainable, offline-first learner model and adaptive policy constrained by the M2 curriculum, backed by M4 historical evidence, aware of M3 generator availability, and able to create the selected M4 session without bypassing prerequisites.

M5 does not include:

- full visual mathematics rendering;
- concrete/visual manipulatives;
- final fraction, clock, geometry, chart, or object-group components;
- formal provider curriculum mapping;
- parent dashboards;
- cloud accounts or sync;
- ML knowledge tracing;
- reinforcement learning;
- LLM-based recommendations.

Those exclusions are deliberate rather than missing M5 requirements.

## 19. Next milestone

The next milestone is:

**M6 — Visual Mathematics & Pedagogy**

M6 should consume the semantic question and adaptive/session foundations now locked through M5 and implement child-facing mathematical representations, including concrete → visual → abstract progression where appropriate.

M6 must not casually change M5 mastery thresholds, prerequisite semantics, M4 timing/persistence, or M3 deterministic generation contracts.
