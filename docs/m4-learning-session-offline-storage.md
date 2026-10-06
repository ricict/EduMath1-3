# M4 — Learning Session & Offline Storage

Status: **COMPLETE**

Completion date: **2026-10-06**

## 1. Purpose

M4 answers:

**How does EduMath run, interrupt, resume, complete, and persist a short learner practice session locally?**

M4 consumes M2 canonical skill identifiers and the M3 question-generation registry. It does not redefine curriculum, generator mathematics, or validation.

M4 is not the mastery/adaptive-learning milestone. Historical outcomes are recorded so M5 can consume them later, but M4 does not infer proficiency or choose what the learner should study next.

## 2. Final architecture

The M4 domain lives under:

```text
src/core/session/
  types.ts
  session.ts
  persistence.ts
```

The concrete device adapter lives under:

```text
src/infrastructure/storage/
  expoSqlitePracticeSessionStore.ts
```

The practice feature consumes the domain through:

```text
src/features/practice/
  usePracticeSession.ts
  PracticeScreen.tsx
```

The dependency direction is:

```text
Practice UI
    ↓
practice session controller
    ↓
M4 session domain
    ↓
M3 generateQuestion(...) registry
    ↓
validated semantic Question

M4 persistence domain
    ↓
KeyValueStorage interface
    ↓
Expo SQLite key-value adapter
```

React screens do not contain mathematical generation rules or persistence validation rules.

## 3. Session domain model

The principal M4 structures are:

- `PracticeSession`;
- `PracticeSessionPlan`;
- `QuestionAttempt`;
- `SessionQuestionReference`;
- `AnswerRecord`;
- `LearnerAnswer`;
- `LocalSessionStore`.

The current persistence schema version is:

```text
PRACTICE_SESSION_SCHEMA_VERSION = 1
```

A session stores no child name, email, phone number, location, advertising identifier, account identifier, or social identity.

## 4. Session lifecycle

Session status is one of:

```text
active
paused
completed
```

A question attempt is one of:

```text
active
completed
```

The lifecycle supports:

1. start a local practice session;
2. issue a deterministic question;
3. submit one or more learner answers;
4. retain incorrect answers without replacing the question;
5. complete an attempt when the correct answer is submitted;
6. issue the next deterministic question;
7. pause practice;
8. resume the same local state;
9. complete the session when no attempt remains active;
10. start a new session.

A session may complete before or after its ten-minute target. The target is pedagogical guidance rather than a strict timer cutoff.

## 5. Ten-minute timing semantics

The default target is:

```text
10 × 60 × 1000 ms
```

M4 tracks **active practice time**, not total elapsed wall-clock time.

When a session is paused, accumulated active duration is frozen.

When resumed, a new active interval begins.

`checkpointPracticeSession(...)` folds elapsed active time into the persisted duration before a save and resets the active interval start.

If a process was terminated while an active checkpoint was persisted, `recoverInterruptedPracticeSession(...)` converts it conservatively to paused state without adding unknown offline time. The UI then resumes from that verified checkpoint.

This avoids silently counting time away from the application as learner practice.

## 6. Deterministic question sequencing

M4 does not change the M1/M3 PRNG.

A session has one normalized unsigned 32-bit `sessionSeed`.

Question position is represented by zero-based `ordinal`.

The deterministic question seed rule is:

```text
questionSeed = (sessionSeed + ordinal) >>> 0
```

Therefore:

```text
ordinal 0 → sessionSeed
ordinal 1 → sessionSeed + 1 modulo 2^32
ordinal 2 → sessionSeed + 2 modulo 2^32
...
```

For every issued question, M4 persists:

- ordinal;
- grade;
- canonical `SkillId`;
- difficulty;
- deterministic seed;
- generated question ID;
- question type;
- representation.

On restore, M4 calls M3 `generateQuestion(...)` again and rejects persisted state if the reconstructed identity/type/representation does not match.

Already-issued questions therefore cannot silently change during resumption.

## 7. M3 boundary

M4 always generates through:

```text
generateQuestion(...)
```

from the M3 registry.

M4 does not directly call:

- addition generator implementations;
- subtraction generator implementations;
- number-comparison generator implementations;
- multiplication generator implementations;
- fraction generator implementations;
- time generator implementations.

The original M1 regression remains:

```text
grade      : 1
skill      : addition_within_10
difficulty : 3
seed       : 20261006
question   : 4 + 1
answer     : 5
```

The first M4 session question with session seed `20261006` and ordinal `0` reconstructs that same question through the M3 registry.

## 8. Semantic learner answers

M4 answers are language-independent semantic structures.

Supported answer kinds correspond to current M3 question types:

```text
numeric
relation
fraction
time
```

Correctness is evaluated against the semantic `Question`, not translated prompt text.

Incorrect submissions remain in the attempt history.

A completed attempt must terminate with a correct answer, and its completion timestamp must match that terminal correct submission.

## 9. Persistence contract

The core persistence boundary is:

```text
KeyValueStorage
  getItem(key)
  setItem(key, value)
  removeItem(key)
```

`LocalSessionStore` provides:

```text
save(session)
load(sessionId)
loadResumable()
listCompleted()
```

The core domain therefore does not depend on a specific React Native storage library.

## 10. Stored-state validation

Persisted JSON is treated as untrusted local state and parsed back into the typed domain.

Restore checks include:

- valid JSON;
- supported schema version;
- non-empty normalized session ID;
- unsigned 32-bit session seed;
- canonical Grade 1–3 value;
- canonical `SkillId`;
- supported difficulty;
- supported question type;
- supported representation;
- valid lifecycle timestamps;
- ordered attempt ordinals;
- deterministic per-position seed;
- session-plan/question-context consistency;
- deterministic reconstructed question identity;
- answer shape;
- answer correctness;
- active/completed attempt consistency;
- no multiple active attempts;
- no active attempt inside a completed session.

Invalid persisted state fails explicitly rather than being silently accepted.

## 11. Resumable-session pointer

M4 stores one local resumable-session pointer.

Saving an active or paused session makes that session resumable.

Saving a completed session removes the resumable pointer when it points to that session.

This is intentionally small. M4 does not introduce multi-profile account management.

## 12. Completed-session index

Completed sessions remain stored by their local session ID.

M4 also maintains a versioned local index of completed session IDs.

`listCompleted()` resolves that index back to validated completed `PracticeSession` records.

The index is idempotent when the same completed session is saved again.

This gives M5 a clean historical-data boundary without M4 calculating:

- mastery probability;
- mastery score;
- proficiency;
- spaced repetition;
- knowledge tracing;
- next-skill recommendations.

## 13. Concrete local storage technology

M4 uses:

```text
expo-sqlite ~57.0.3
expo-sqlite/kv-store
```

Rationale:

- supported by the current Expo SDK;
- persistent across app restarts;
- device-local and offline;
- matches the small `KeyValueStorage` contract;
- avoids premature relational table design;
- avoids an ORM;
- avoids cloud/network dependencies.

M4 deliberately does not introduce raw SQLite tables because the current persistence requirement is a small set of versioned session documents plus pointers/indexes.

Future milestones may migrate storage if their query requirements justify it.

## 14. Migration/version strategy

Schema version is stored with every session.

M4 schema version 1 is the only supported version at completion.

Unknown versions fail explicitly.

A future schema change must introduce a deliberate migration or a new supported parser. It must not reinterpret version-1 JSON silently.

Storage keys are also versioned with an M4/v1 namespace.

## 15. UI integration

The original practice screen no longer calls the Grade 1 addition generator directly.

`usePracticeSession.ts` now:

- restores a local resumable session on startup;
- recovers an unexpectedly persisted active state conservatively;
- resumes paused state;
- reconstructs the active question;
- issues a new question through the M3 registry when needed;
- checkpoints and saves state;
- pauses/saves when React Native AppState leaves active state;
- resumes/saves when the app becomes active;
- submits semantic numeric answers through M4;
- advances to the next deterministic question;
- completes a session;
- starts a new session;
- exposes active-practice duration.

`PracticeScreen.tsx` remains a thin child-facing view.

The current screen continues to demonstrate the existing Grade 1 `addition_within_10` experience. M4 does not attempt to build final fraction, clock, geometry, pictogram, or chart rendering.

## 16. Localization

M4 retains the M1/M3 separation between mathematics and language.

Session persistence stores no translated question prompt as the canonical mathematical record.

English, Indonesian, and Thai continue to render from semantic question data.

M4 adds localized session UI text for:

- loading/restoration;
- active-practice progress;
- question count;
- finish session;
- start new session;
- completion;
- local-storage failure.

## 17. Testing

M4 adds deterministic tests for:

- versioned session creation;
- default ten-minute target;
- absence of learner PII fields;
- per-ordinal seed derivation;
- unsigned 32-bit wraparound;
- first-question M1 regression through the M3 registry;
- incorrect-answer retention;
- same-question restoration after incorrect submission;
- correct-answer completion;
- deterministic multi-question sequencing;
- semantic answers across all current M3 question types;
- pause/resume;
- active-time accounting;
- completion before the target duration;
- tampered stored question identity rejection;
- active-time checkpointing;
- unexpected-interruption recovery;
- serialization round-trip;
- resumable-session storage;
- completed-session retention;
- completed-session indexing;
- unsupported schema rejection;
- invalid JSON rejection;
- tampered correctness rejection;
- completed-at integrity;
- malformed completed-index rejection.

The repository contains **76 test definitions** at the M4 completion candidate:

```text
M1–M3 baseline : 56
M4 session     : 12
M4 persistence : 8
Total          : 76
```

## 18. M4 implementation quality checkpoint

GitHub Actions run 27 verified the final implementation before the documentation lock:

```text
Run number : 27
Run ID     : 37453142860
Head SHA   : 568f610bd2dcd155a304b2cd807add121ca060e2
Status     : completed
Conclusion : success
```

The final documentation commit must also pass the full GitHub Actions quality gate before M4 is considered terminally locked.

## 19. M4 completion boundary

M4 intentionally does not include:

- mastery scoring;
- adaptive sequencing;
- proficiency estimation;
- knowledge tracing;
- spaced repetition;
- ML recommendations;
- automatic next-skill optimization;
- provider-specific curriculum engines;
- Cambridge/Indonesia/Thailand mapping;
- Montessori pathway claims;
- child accounts;
- cloud identity;
- cloud synchronization;
- remote learner-history storage;
- analytics/tracking;
- parent dashboard;
- billing;
- full visual pedagogy rendering;
- full coverage of all 60 canonical skills.

Those boundaries remain explicit.

## 20. M4 completion criteria

M4 is complete when all of the following are true:

- a minimal typed learner-session contract exists;
- session lifecycle is explicit;
- deterministic question positions and seeds are explicit;
- M3 registry dispatch remains authoritative;
- learner answers and correctness are retained semantically;
- interruption/resumption is supported;
- active time excludes paused/background time;
- deterministic question reconstruction is enforced;
- local persistence is versioned;
- invalid persisted state fails safely;
- resumable state is discoverable;
- completed session history is discoverable;
- a supported Expo local-storage adapter exists;
- the practice UI consumes the session layer rather than individual generators;
- child data remains minimal/local;
- M1, M2, and M3 tests remain green;
- no M5 adaptive/mastery logic is introduced;
- TypeScript, lint, and unit tests pass in GitHub Actions.

All criteria are satisfied by the M4 completion candidate.

## 21. M4 lock

Treat the following as M4-complete contracts unless a later milestone exposes a real defect:

```text
PracticeSession schema v1
active / paused / completed lifecycle
QuestionAttempt history
semantic LearnerAnswer union
sessionSeed + ordinal deterministic seed rule
M3 registry-only generation
deterministic question identity reconstruction
active-practice duration semantics
checkpointed active timing
conservative unexpected-interruption recovery
versioned persistence parsing
LocalSessionStore boundary
one resumable-session pointer
completed-session local index
Expo SQLite key-value adapter
thin session-driven practice UI
anonymous/local learner state
76-test completion-candidate suite
```

Do not treat M4 completion as authorization to begin M5 in the same chat.
