# M8 — Android Build & Release Readiness

Status: **DEFINED / FROZEN**

Defined: **2026-10-07**

## 1. Objective

M8 turns the terminally locked M1–M7 EduMath Grade 1–3 application into a cloud-built Android application that can be installed and validated on real Android hardware, while preserving all existing mathematical, curriculum, session, mastery, visual, and learner-journey contracts.

The first concrete artifact target is:

**a real installable Android APK produced by a cloud build and suitable for physical-device testing.**

After that baseline is proven, M8 advances through physical-device validation, production Android configuration, signed release artifacts, and a final release-readiness audit.

M8 is a build/release milestone. It is not a curriculum, generation, mastery, visual-pedagogy, or learner-journey redesign milestone.

## 2. Entry checkpoint

M8 is defined from the following verified repository state:

```text
Repository : ricict/EduMath1-3
Branch     : main
HEAD       : 6d4c7ef39dff81f0054935eb009bdd8dd5c553de
Tree       : 4aa6c3bc65e3413207f888eb8dcfa9d40a336813
CI run     : 73
CI status  : completed
Conclusion : success
Tests      : 165 passed / 0 failed / 0 skipped
```

M7 remains terminally locked. Its implementation checkpoint and terminal documentation remain authoritative.

## 3. Repository build audit

The live repository at the M8 definition gate contains:

- Expo SDK `~57.0.10`;
- React Native `0.86.2`;
- Expo Router with `expo-router/entry`;
- `expo-sqlite` for device-local persistence;
- Node engine `>=22.13.0`;
- `app.json` as the Expo app configuration;
- portrait orientation;
- app scheme `edumath`;
- light UI style;
- a GitHub Actions quality workflow running typecheck, lint, and unit tests.

The live repository does **not** currently contain:

- a committed `android/` native project;
- a committed `ios/` native project;
- `eas.json`;
- an EAS project identifier/linkage in Expo configuration;
- an explicit Android application/package identifier;
- explicit Android version-code configuration;
- committed app icon/adaptive-icon/splash assets or their Expo configuration;
- an Android build workflow;
- a package-manager lockfile.

The existing `.gitignore` intentionally ignores generated `/android/` and `/ios/` directories. M8 does not reverse that decision merely to obtain an Android binary.

The current GitHub Actions workflow uses:

```text
npm install --no-audit --no-fund
```

rather than a lockfile-driven install. This is acceptable as inherited pre-M8 behavior but is not sufficient by itself for the final M8 reproducibility claim. Dependency-locking therefore belongs inside M8 release-readiness work.

## 4. Build-path decision

The frozen primary Android build mechanism for M8 is:

```text
GitHub repository
        ↓
Expo / EAS project configuration
        ↓
EAS Build cloud
        ↓
APK for direct installation / device validation
        ↓
AAB for Google Play-oriented release readiness
```

### Why EAS Build is the selected path

This repository is already an Expo application and intentionally does not commit native Android project files. EAS Build can generate the Android native project in the cloud from Expo configuration and produce Android binaries without requiring Android Studio, Android SDK, local Gradle, or a local emulator.

For the first device-test artifact, M8 will use an EAS build profile that explicitly produces an APK. Android AAB is reserved for the later production/store path.

### Paths not selected as the M8 default

The following are not the default M8 delivery path:

- local Gradle builds;
- Android Studio builds;
- a locally installed Android SDK;
- Android Emulator-based validation;
- Expo Go as the primary M8 artifact;
- committing generated `android/` merely to obtain a build.

A narrow exception may be authorized only if a concrete EAS/cloud-build blocker proves that a different path is necessary.

## 5. Frozen M8 authority boundary

M8 may change packaging, build configuration, application metadata, release assets, CI/release checks, and documentation needed for Android delivery.

M8 must not change upstream learning behavior unless a concrete Android build/runtime defect proves that a narrow compatibility patch is necessary.

The following upstream contracts remain frozen:

1. **M1 deterministic regression**
   - Grade 1
   - `addition_within_10`
   - difficulty 3
   - seed `20261006`
   - result remains `4 + 1 = 5`.

2. **M2 curriculum authority**
   - 60 canonical Grade 1–3 skills remain authoritative.

3. **M3 generation authority**
   - generation remains deterministic, typed, seed-driven, algorithm-first, and separate from localization;
   - registered generator count remains 12 unless a separately authorized later milestone changes content coverage.

4. **M4 session/persistence authority**
   - `PRACTICE_SESSION_SCHEMA_VERSION = 1`;
   - Android packaging alone must not bump the schema;
   - M4 persistence remains device-local.

5. **M5 mastery/recommendation authority**
   - no second mastery model, threshold system, recommendation cache, or alternative authority may be introduced by release code.

6. **M6 visual authority**
   - React Native rendering consumes semantic mathematical models;
   - Android/build code must not generate mathematical content or distractors.

7. **M7 learner-journey authority**
   - Home, Practice, Progress, and Settings remain the learner shell;
   - EN / ID / TH locale and Grade 1 / 2 / 3 preference remain app-level;
   - preference key remains `edumath:m7:app-preferences:v1`;
   - M4 and M7 persistence namespaces remain separate;
   - normal child-facing practice must not restore milestone labels, Session ID, or deterministic Seed.

## 6. Product constraints preserved during M8

EduMath remains:

- offline-first;
- account-free;
- without child PII;
- without backend dependency;
- without cloud sync;
- without ads;
- without telemetry or remote analytics.

M8 must not add network services merely to facilitate release engineering.

A cloud build service is a build-time delivery mechanism and does not authorize a runtime backend dependency.

## 7. Cloud-first operational contract

The preferred M8 workflow is frozen as:

```text
ChatGPT
→ GitHub
→ GitHub Actions
→ Expo / EAS Build cloud
→ APK artifact
→ install on real Android device
→ validate on device
```

The user must not be required to install or use:

- VS Code;
- Android Studio;
- Android SDK;
- Gradle locally;
- Android Emulator;
- a local IDE;
- a local Android build toolchain.

If Expo/EAS account authentication, project ownership/linkage, Android signing credentials, or another security-sensitive one-time authorization requires the repository owner, that interaction is allowed as a narrowly scoped user step. All remaining work should continue cloud-first.

## 8. M8 implementation increments

### M8.1 — Android Build Baseline

Goal: produce the first installable Android APK from the cloud.

Planned work:

- introduce the minimum EAS build configuration;
- define an explicit Android application/package identifier;
- establish EAS project linkage when authorization is available;
- introduce a deterministic dependency lock suitable for cloud/CI installation;
- preserve generated native directories as uncommitted build products unless evidence requires otherwise;
- define a preview/internal Android profile that produces an APK;
- keep a production profile oriented toward AAB;
- run existing GitHub quality CI after every repository change;
- initiate the first EAS Android cloud build;
- capture the resulting build identity/artifact evidence.

M8.1 passes only when a real APK has been produced successfully and is available for installation. A configuration-only commit is not sufficient.

### M8.2 — Physical Device Validation

Goal: validate the M8.1 APK on real Android hardware.

Required validation includes:

- application launch;
- Home;
- Practice;
- Progress;
- Settings;
- navigation;
- EN / ID / TH locale switching and restoration;
- selected Grade 1 / 2 / 3 restoration;
- SQLite persistence;
- resumable practice session behavior;
- M6 visual rendering;
- basic accessibility behavior;
- no child-facing return of milestone/session/seed development metadata.

Any defect discovered here must be classified as:

- Android packaging/configuration defect;
- platform/runtime compatibility defect;
- pre-existing product defect.

Only the narrowest justified patch is permitted.

### M8.3 — Production Android Configuration

Goal: finalize Android identity and release presentation.

Audit/finalize:

- application/package identifier;
- app display name;
- semantic app version;
- Android version code strategy;
- app icon;
- adaptive icon;
- splash presentation;
- permissions;
- orientation;
- scheme/deep-link implications;
- production EAS profile;
- build-environment assumptions.

No permission may be added without a concrete runtime requirement.

### M8.4 — Signed Release Build

Goal: produce verifiable signed Android release artifacts.

Required outputs:

- signed APK when direct-install/release testing requires it;
- signed AAB for the Google Play-oriented path;
- documented signing/credential ownership;
- no signing secret or private key committed to Git.

EAS-managed Android credentials are acceptable when explicitly authorized.

### M8.5 — Release Readiness Audit

Goal: terminally determine whether M8 is ready to lock.

Audit:

- GitHub Actions quality status;
- dependency reproducibility;
- Expo/EAS configuration consistency;
- APK build success;
- physical-device smoke results;
- AAB build success when required;
- artifact identity and integrity evidence where obtainable;
- version/package consistency;
- release assets;
- permissions;
- documentation;
- preservation of all M1–M7 locks;
- absence of newly introduced backend, account, PII, ads, telemetry, analytics, or cloud-sync dependencies.

## 9. Frozen build/release contracts

The following M8 contracts are frozen at definition time:

1. Android is the first release platform.
2. The first binary target is an installable **APK**, not an AAB-only milestone.
3. EAS Build cloud is the primary build mechanism.
4. AAB is the later Google Play-oriented artifact.
5. Expo Go does not satisfy the M8 APK completion criterion.
6. No local Android toolchain is required by default.
7. Generated native Android sources remain non-canonical unless a demonstrated blocker requires a prospective contract amendment.
8. Android package identity must be explicit before the first canonical build is accepted.
9. Signing secrets must never be committed to Git.
10. Build configuration must not alter mathematical generation, scoring, curriculum, mastery, or visual semantics.
11. Existing device-local persistence contracts must survive installation/runtime validation.
12. Every repository mutation still requires GitHub Actions SUCCESS before the increment can pass.
13. M8 cannot be declared complete solely from CI; physical-device evidence is required.
14. M8 cannot make a reproducibility claim until dependency resolution is locked and the relevant build configuration is documented.
15. M9 is not authorized by this milestone.

## 10. Completion criteria

M8 is **COMPLETE / TERMINAL-LOCKED** only when all of the following are true:

- M8 definition has been committed and verified by green GitHub Actions;
- a cloud-built installable Android APK exists;
- the APK has been installed on real Android hardware;
- required M8.2 learner journeys and persistence behaviors have been validated;
- Android package identifier and release metadata are explicit;
- required icons/adaptive icon/splash configuration is finalized;
- permissions have been audited and minimized;
- signed Android release artifact handling is documented;
- an AAB suitable for the Google Play-oriented release path has been produced when M8.4 is executed;
- dependency/build reproducibility has been addressed;
- existing typecheck, lint, and unit-test gates remain green;
- the locked M1 deterministic regression remains unchanged;
- M2–M7 authority boundaries remain intact;
- no prohibited runtime service/dependency has been introduced;
- final M8 documentation records the build and validation evidence.

## 11. Definition gate

This document authorizes M8 but does **not** itself claim any Android binary has been produced.

After this definition commit passes GitHub Actions, M8.1 — Android Build Baseline may begin.

No M9 work is authorized.


## 12. M8.1 — Android Build Baseline checkpoint

Status: **PASS_AND_CHECKPOINT**

Verified: **2026-10-07**

M8.1 produced the first real installable Android APK through the frozen cloud-first path.

### Repository/build checkpoint

```text
Source commit : b2249e4b070b945d2e76348850faaf2aac6afe73
Source tree   : ef6acae9e0487fd248b6df28d95d3f71e09e3b1e
Quality run   : GitHub Actions Run 86
Quality       : SUCCESS
Tests         : 165 passed / 0 failed / 0 skipped
```

The EAS project linkage is canonical in `app.json`:

```text
owner      : herisonsurbakti
projectId  : dbadd718-7c7e-46b7-acd4-36eb0a8365e5
slug       : edumath-grade-1-3
```

Android identity remains:

```text
package      : com.ricict.edumath
version      : 0.1.0
versionCode  : 1
```

### EAS preview build evidence

```text
GitHub workflow : EAS Android Preview APK
GitHub run      : 37602523789
Conclusion      : SUCCESS
EAS build ID    : 50356906-1518-4211-a989-df90fefcb271
EAS status      : FINISHED
Platform        : ANDROID
Distribution    : INTERNAL
Profile         : preview
SDK             : 57.0.0
App identifier  : com.ricict.edumath
App version     : 0.1.0
Build version   : 1
Fingerprint ID  : 01a115bf-e40e-7d35-9810-f9f172c74fa0
Fingerprint     : e70b6466480e4e449521257c70968dddbbce3d2e
```

EAS remote Android credentials were used and the first Android keystore was created on the Expo server. No signing secret or private key was committed to Git.

The resulting installable artifact is:

```text
https://expo.dev/artifacts/eas/AjGPH2nOip1RBh7-juV3DVbEoWKV6bYYxQ4KelC2U-c.apk
```

The EAS build record is:

```text
https://expo.dev/accounts/herisonsurbakti/projects/edumath-grade-1-3/builds/50356906-1518-4211-a989-df90fefcb271
```

### M8.1 decision

M8.1 is **PASS_AND_CHECKPOINT** because:

- an actual cloud-built APK exists;
- the build finished successfully;
- the APK uses the explicit canonical Android package identifier;
- remote signing credentials were created and used without committing secrets;
- the build is traceable to the exact Git commit;
- the preview profile is internal-distribution APK;
- the production profile remains app-bundle oriented;
- dependency resolution is lockfile-based;
- GitHub CI remains green with 165/165 tests;
- no M1–M7 authority contract was reopened.

This checkpoint authorizes **M8.2 — Physical Device Validation**.

M8 itself remains **IN PROGRESS**. M8.2 physical-device evidence is still required before advancing to production Android configuration.
