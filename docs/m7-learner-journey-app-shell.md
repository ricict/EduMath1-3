# M7 — Learner Journey & App Shell

Status: **DEFINED / FROZEN / IN PROGRESS**

Defined: **2026-10-07**

## 1. Objective

M7 turns the already-locked M1–M6 learning engines into a coherent learner-facing application journey without moving mathematical, curriculum, session, mastery, or visual-authority rules into the UI.

The milestone answers:

**How should a Grade 1–3 learner enter EduMath, understand where they are, start or resume appropriate practice, view meaningful progress, and control basic presentation preferences while all learning authority remains in M2–M6?**

M7 is therefore **Learner Journey & App Shell**, not a new curriculum engine and not a content-expansion milestone.

## 2. Evidence from the post-M6 repository

At the M6 terminal lock:

- `app/index.tsx` directly renders `PracticeScreen`;
- `usePracticeSession` hard-codes Grade 1;
- EN / ID / TH localization exists, but locale selection is screen-local and resets with the screen;
- M4 already retains completed history locally;
- M5 already derives mastery and recommendations from that history;
- no learner-facing home, progress, or settings surface exists;
- no app-level navigation contract exposes the learning journey;
- only 12 of the 60 M2 canonical skills currently have registered M3 generators.

The generator gap is real and must be addressed prospectively, but it is not solved by putting more curriculum logic into React. Full 60-skill generation/rendering coverage is explicitly outside M7.

## 3. Gap classification

### Missing curriculum / generator coverage

M2 contains 60 canonical skills. M6 finishes representative rendering architecture, not full content coverage. M7 must surface unavailable practice honestly and must not fabricate coverage. Broad generator expansion is future work.

### Product / navigation UX

This is the primary M7 gap. The app needs a learner-facing entry point and clear movement between home, practice, progress, and settings.

### Learner progression and practice experience

M5 already owns recommendation and mastery policy. M7 may present that state and pass an explicit grade context into practice. M7 must not duplicate or alter M5 recommendation rules.

### Settings / localization

Localization already exists. M7 may persist presentation preferences such as locale and selected grade in a separate app-preference namespace. This must not change M4 practice-session schema version 1.

### Analytics / progress presentation

M7 may calculate **read-only presentation summaries** from M4 completed history and the M5 learner model. It must not introduce a second mastery model, remote tracking, behavioral analytics, or telemetry.

### Content management

No CMS or remote content service is required for M7. M2/M3 remain the content authority.

### Testing / release readiness

CI is strong for domain invariants. M7 adds tests for pure journey/progress models and app-preference contracts. Device E2E, store submission, signing, crash reporting, and production telemetry remain future release-readiness work.

## 4. Frozen architectural contract

M7 uses this authority chain:

```text
M2 curriculum + M3 generation + M4 history/session + M5 mastery/recommendation + M6 visual model
                                      ↓
                           pure M7 journey/progress model
                                      ↓
                         thin Expo Router / React Native UI
```

The following rules are frozen for M7:

1. M7 UI is a consumer of M2–M6, never a parallel source of learning truth.
2. Progress shown to the learner is derived from validated M4 completed sessions through M5 mastery semantics.
3. A progress screen may summarize or group state, but it may not cache or independently mutate mastery.
4. Practice recommendations continue to come from `recommendPractice(...)` / `startRecommendedPractice(...)`.
5. Grade context may become explicit at the app boundary, but M7 does not bypass M2 prerequisite closure or M5 eligibility.
6. Unsupported curriculum/generator contexts are shown as explicit unavailable states; the UI does not invent fallback mathematics.
7. App preferences are separate from practice sessions. M4 schema version 1 remains unchanged.
8. Locale affects presentation only. It never changes question identity, mathematical data, seeds, scoring, or mastery evidence.
9. M6 remains the only semantic-to-visual boundary. M7 navigation or dashboards do not regenerate question content.
10. The app remains offline-first and account-free during M7.
11. No child PII, cloud sync, ads, telemetry, remote analytics, or backend dependency is introduced.
12. The locked M1 seed regression must remain unchanged.

## 5. M7 scope

M7 includes:

- a learner-facing home/dashboard entry point;
- explicit Grade 1–3 app context without altering canonical grade applicability;
- grade-aware start/resume practice;
- a progress presentation derived from M4 history + M5 learner state;
- navigation between home, practice, progress, and settings;
- app-level EN / ID / TH locale preference;
- device-local presentation preference persistence in a namespace separate from M4 sessions;
- clear supported/unavailable practice messaging;
- child-facing removal of development-only session/seed metadata from normal product surfaces;
- accessibility-preserving controls and semantic labels;
- deterministic, pure selectors/models wherever state can be tested without rendering.

## 6. Explicit exclusions

M7 does **not** include:

- changing the 60-skill M2 canonical curriculum;
- changing prerequisite topology unless a concrete downstream defect is proven;
- broad generator expansion to all 60 skills;
- new mathematical distractor logic in React;
- a second mastery algorithm or mastery cache;
- changes to M5 thresholds;
- changes to M4 schema version 1;
- formal Cambridge, Indonesian, Thai, or Montessori alignment claims;
- user accounts, profiles containing child PII, cloud sync, backend services, CMS, remote analytics, ads, or telemetry;
- app-store release signing/submission;
- generalized production E2E infrastructure.

## 7. Planned implementation increments

### M7.1 — Pure learner-journey projection — COMPLETE / VERIFIED

The pure `learnerJourneyModel` now projects the locked M2 catalog plus the existing M5 learner/recommendation state into learner-facing Grade 1–3 summaries.

It exposes:

- canonical skill counts by grade;
- mastered / in-progress / unseen counts by grade;
- the current M5 recommendation or explicit unavailable reason;
- whether practice is currently generator-practicable.

It does not cache, mutate, or independently calculate mastery.

Verification:

```text
Run number : 63
Head SHA   : b216b15b845d0b4a341a400f5fb1939f35adf3ba
Tests      : 155 passed / 0 failed
Conclusion : success
```

### M7.2 — App shell and grade-aware practice entry — COMPLETE / VERIFIED

The app root now renders a learner-facing home route rather than opening practice directly.

The home route offers explicit Grade 1–3 entry. The practice route validates the grade parameter and passes a typed `Grade` into `PracticeScreen` and `usePracticeSession`. The previous hard-coded Grade 1 constant has been removed.

M4 still owns the single resumable-session pointer. If an unfinished local session exists, that session is restored before a newly requested grade session is created. This prevents the M7 shell from silently replacing or orphaning resumable M4 state and requires no M4 schema change.

Invalid or non-canonical route grades fail explicitly rather than silently falling back to Grade 1.

Verification:

```text
Run number : 64
Head SHA   : b41a6caf44744de729085443125398afefa1076c
Tests      : 157 passed / 0 failed / 0 skipped
Conclusion : success
```

### M7.3 — Progress surface — COMPLETE / VERIFIED

The app now exposes an explicit `/progress` route from the learner-facing home screen.

Progress loading follows the frozen authority chain:

```text
M4 completed local sessions
        ↓
M5 loadLearnerModel(...)
        ↓
M7 buildLearnerJourney(...)
        ↓
thin ProgressScreen presentation
```

The progress surface shows:

- completed local practice-session count;
- completed-question evidence count;
- Grade 1–3 canonical skill totals;
- mastered / in-progress / not-started skill counts;
- the existing M5 practice availability state for each grade.

The UI does not independently calculate mastery, change thresholds, cache mastery, mutate historical evidence, or create fallback recommendations. Grade 3 and other blocked contexts remain explicitly unavailable according to M5 rather than being fabricated by the presentation layer.

The new `loadLearnerJourneySnapshot(...)` boundary consumes only `LocalSessionStore.listCompleted`, delegates history interpretation to M5 `loadLearnerModel(...)`, and then applies the already-verified M7.1 projection.

Two intermediate CI failures were limited to React hook lint on the initial asynchronous progress load. Run 66 exposed the first synchronous-state pattern, and run 67 confirmed the analyzer followed the extracted callback. The final narrow patch moves initial state updates into Promise callbacks within the effect while keeping retry state changes event-driven.

Verification:

```text
Run number : 68
Head SHA   : 3ff763a7697fb94e6325d780b3e602b2a08977e0
Tests      : 159 passed / 0 failed / 0 skipped
Conclusion : success
```

### M7.4 — App preferences and settings

Persist locale and selected grade separately from M4 sessions. Restore those preferences on launch.

### M7.5 — Learner-facing polish and completion audit

Remove development-only metadata from child-facing surfaces, verify accessibility/navigation states, document unsupported-content boundaries, and run the full regression suite.

The exact number of commits may differ, but each increment must remain coherent and independently verified.

## 8. Completion criteria

M7 is complete only when:

- the app no longer launches directly into a hard-coded Grade 1 practice screen;
- home, practice, progress, and settings journeys are explicit;
- practice receives grade context from the app shell;
- M5 remains the sole recommendation/mastery authority;
- learner progress shown in UI is reproducibly derived from M4/M5 state;
- locale and selected grade are restored from device-local app preferences;
- M4 persistence schema version remains 1;
- unsupported generator/curriculum contexts remain explicit rather than silently substituted;
- no mathematical content or distractors are generated in navigation/UI code;
- no child PII, account, backend, telemetry, or cloud dependency is introduced;
- the M1 deterministic regression remains unchanged;
- TypeScript, lint, and all tests pass in GitHub Actions;
- README and this document accurately describe the final M7 state.

## 9. Current checkpoint and next authorized increment

M7.1, M7.2, and M7.3 are complete and verified.

The next authorized increment is:

**M7.4 — App preferences and settings**

M7.4 may add a device-local app-preference namespace for presentation preferences, including selected Grade 1–3 context and EN / ID / TH locale. Preferences must remain separate from M4 practice-session persistence and must not change question identity, seeds, scoring, mastery evidence, curriculum eligibility, or recommendation semantics.

M7.5 product polish remains out of scope until M7.4 is independently verified.
