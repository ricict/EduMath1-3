import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  shouldRefreshPracticeRecommendation,
  startRecommendedPractice,
} from '@/core/adaptive/startRecommendedPractice';
import type { RecommendationUnavailableCode } from '@/core/adaptive/types';
import {
  checkpointPracticeSession,
  completePracticeSession,
  getActivePracticeDurationMs,
  issueNextQuestion,
  pausePracticeSession,
  recoverInterruptedPracticeSession,
  restoreActiveQuestion,
  resumePracticeSession,
  submitAnswer,
} from '@/core/session/session';
import type { PracticeSession } from '@/core/session/types';
import type {
  ComparisonRelation,
  FractionAnswer,
  Grade,
  Question,
  Shape2D,
  TimeAnswer,
} from '@/core/types';
import { localPracticeSessionStore } from '@/infrastructure/storage/expoSqlitePracticeSessionStore';

import { supportsPracticeScreenQuestion } from './practiceCompatibility';


export type PracticeUnavailableReason =
  | {
      kind: 'adaptive';
      code: RecommendationUnavailableCode;
    }
  | {
      kind: 'question-type';
      questionType: Question['questionType'];
    };

async function createFreshSession(nowMs: number, grade: Grade) {
  return startRecommendedPractice(localPracticeSessionStore, {
    id: `local-${nowMs.toString(36)}`,
    grade,
    sessionSeed: nowMs >>> 0,
    startedAtMs: nowMs,
  });
}

export interface PracticeSessionController {
  loading: boolean;
  error: string | null;
  session: PracticeSession | null;
  question: Question | null;
  activeDurationMs: number;
  unavailable: PracticeUnavailableReason | null;
  submitNumericAnswer(value: number): Promise<boolean>;
  submitRelationAnswer(value: ComparisonRelation): Promise<boolean>;
  submitFractionAnswer(value: FractionAnswer): Promise<boolean>;
  submitTimeAnswer(value: TimeAnswer): Promise<boolean>;
  submitShapeAnswer(value: Shape2D): Promise<boolean>;
  nextQuestion(): Promise<void>;
  finishSession(): Promise<void>;
  startNewSession(): Promise<void>;
}

export function usePracticeSession(grade: Grade): PracticeSessionController {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [unavailable, setUnavailable] = useState<PracticeUnavailableReason | null>(
    null,
  );

  const sessionRef = useRef<PracticeSession | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const applySession = useCallback((nextSession: PracticeSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const applyUnavailable = useCallback((reason: PracticeUnavailableReason) => {
    sessionRef.current = null;
    setSession(null);
    setQuestion(null);
    setUnavailable(reason);
  }, []);

  const queueSave = useCallback((nextSession: PracticeSession) => {
    const save = saveChainRef.current.then(() =>
      localPracticeSessionStore.save(nextSession),
    );

    saveChainRef.current = save.catch(() => undefined);
    return save;
  }, []);

  const reportError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : 'Practice session failed.');
  }, []);

  const persistCheckpoint = useCallback(
    async (nextSession: PracticeSession, nowMs: number) => {
      const checkpointed = checkpointPracticeSession(nextSession, nowMs);
      applySession(checkpointed);
      await queueSave(checkpointed);
      return checkpointed;
    },
    [applySession, queueSave],
  );

  const startFresh = useCallback(async () => {
    const nowMs = Date.now();
    const fresh = await createFreshSession(nowMs, grade);

    if (fresh.kind === 'unavailable') {
      applyUnavailable({
        kind: 'adaptive',
        code: fresh.recommendation.reason.code,
      });
      setClockNowMs(nowMs);
      return;
    }

    if (!supportsPracticeScreenQuestion(fresh.question)) {
      applyUnavailable({
        kind: 'question-type',
        questionType: fresh.question.questionType,
      });
      setClockNowMs(nowMs);
      return;
    }

    setUnavailable(null);
    setQuestion(fresh.question);
    setClockNowMs(nowMs);
    await persistCheckpoint(fresh.session, nowMs);
  }, [applyUnavailable, grade, persistCheckpoint]);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const nowMs = Date.now();
        let restored = await localPracticeSessionStore.loadResumable();

        if (restored?.status === 'active') {
          restored = recoverInterruptedPracticeSession(restored);
        }

        if (restored?.status === 'paused') {
          restored = resumePracticeSession(restored, nowMs);
        }

        if (!restored || restored.status === 'completed') {
          const fresh = await createFreshSession(nowMs, grade);

          if (fresh.kind === 'unavailable') {
            if (!cancelled) {
              applyUnavailable({
                kind: 'adaptive',
                code: fresh.recommendation.reason.code,
              });
              setClockNowMs(nowMs);
              setError(null);
            }
            return;
          }

          if (!supportsPracticeScreenQuestion(fresh.question)) {
            if (!cancelled) {
              applyUnavailable({
                kind: 'question-type',
                questionType: fresh.question.questionType,
              });
              setClockNowMs(nowMs);
              setError(null);
            }
            return;
          }

          restored = fresh.session;

          if (!cancelled) {
            setUnavailable(null);
            setQuestion(fresh.question);
          }
        } else {
          const activeQuestion = restoreActiveQuestion(restored);

          if (activeQuestion) {
            if (!supportsPracticeScreenQuestion(activeQuestion)) {
              if (!cancelled) {
                applyUnavailable({
                  kind: 'question-type',
                  questionType: activeQuestion.questionType,
                });
                setClockNowMs(nowMs);
                setError(null);
              }
              return;
            }

            if (!cancelled) {
              setUnavailable(null);
              setQuestion(activeQuestion);
            }
          } else {
            const issued = issueNextQuestion(restored);

            if (!supportsPracticeScreenQuestion(issued.question)) {
              if (!cancelled) {
                applyUnavailable({
                  kind: 'question-type',
                  questionType: issued.question.questionType,
                });
                setClockNowMs(nowMs);
                setError(null);
              }
              return;
            }

            restored = issued.session;

            if (!cancelled) {
              setUnavailable(null);
              setQuestion(issued.question);
            }
          }
        }

        const checkpointed = checkpointPracticeSession(restored, nowMs);
        await queueSave(checkpointed);

        if (!cancelled) {
          applySession(checkpointed);
          setClockNowMs(nowMs);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          reportError(cause);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [applySession, applyUnavailable, grade, queueSave, reportError]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const current = sessionRef.current;
      if (!current || current.status === 'completed') {
        return;
      }

      try {
        if (nextState !== 'active' && current.status === 'active') {
          const paused = pausePracticeSession(current, Date.now());
          applySession(paused);
          void queueSave(paused).catch(reportError);
          return;
        }

        if (nextState === 'active' && current.status === 'paused') {
          const nowMs = Date.now();
          const resumed = resumePracticeSession(current, nowMs);
          const checkpointed = checkpointPracticeSession(resumed, nowMs);
          applySession(checkpointed);
          setClockNowMs(nowMs);
          void queueSave(checkpointed).catch(reportError);
        }
      } catch (cause) {
        reportError(cause);
      }
    });

    return () => subscription.remove();
  }, [applySession, queueSave, reportError]);

  useEffect(() => {
    if (session?.status !== 'active') {
      return undefined;
    }

    const interval = setInterval(() => {
      setClockNowMs(Date.now());
    }, 1_000);

    return () => clearInterval(interval);
  }, [session?.status]);

  const submitNumericAnswer = useCallback(
    async (value: number) => {
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Practice session is not ready.');
      }

      try {
        const nowMs = Date.now();
        const submitted = submitAnswer(
          current,
          { kind: 'numeric', value },
          nowMs,
        );
        setQuestion(submitted.question);
        await persistCheckpoint(submitted.session, nowMs);
        setError(null);
        return submitted.correct;
      } catch (cause) {
        reportError(cause);
        throw cause;
      }
    },
    [persistCheckpoint, reportError],
  );

  const submitRelationAnswer = useCallback(
    async (value: ComparisonRelation) => {
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Practice session is not ready.');
      }

      try {
        const nowMs = Date.now();
        const submitted = submitAnswer(
          current,
          { kind: 'relation', value },
          nowMs,
        );
        setQuestion(submitted.question);
        await persistCheckpoint(submitted.session, nowMs);
        setError(null);
        return submitted.correct;
      } catch (cause) {
        reportError(cause);
        throw cause;
      }
    },
    [persistCheckpoint, reportError],
  );

  const submitFractionAnswer = useCallback(
    async (value: FractionAnswer) => {
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Practice session is not ready.');
      }

      try {
        const nowMs = Date.now();
        const submitted = submitAnswer(
          current,
          { kind: 'fraction', value },
          nowMs,
        );
        setQuestion(submitted.question);
        await persistCheckpoint(submitted.session, nowMs);
        setError(null);
        return submitted.correct;
      } catch (cause) {
        reportError(cause);
        throw cause;
      }
    },
    [persistCheckpoint, reportError],
  );

  const submitTimeAnswer = useCallback(
    async (value: TimeAnswer) => {
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Practice session is not ready.');
      }

      try {
        const nowMs = Date.now();
        const submitted = submitAnswer(
          current,
          { kind: 'time', value },
          nowMs,
        );
        setQuestion(submitted.question);
        await persistCheckpoint(submitted.session, nowMs);
        setError(null);
        return submitted.correct;
      } catch (cause) {
        reportError(cause);
        throw cause;
      }
    },
    [persistCheckpoint, reportError],
  );

  const submitShapeAnswer = useCallback(
    async (value: Shape2D) => {
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Practice session is not ready.');
      }

      try {
        const nowMs = Date.now();
        const submitted = submitAnswer(
          current,
          { kind: 'shape', value },
          nowMs,
        );
        setQuestion(submitted.question);
        await persistCheckpoint(submitted.session, nowMs);
        setError(null);
        return submitted.correct;
      } catch (cause) {
        reportError(cause);
        throw cause;
      }
    },
    [persistCheckpoint, reportError],
  );

  const nextQuestion = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) {
      throw new Error('Practice session is not ready.');
    }

    try {
      const nowMs = Date.now();

      if (shouldRefreshPracticeRecommendation(current)) {
        const completed = completePracticeSession(current, nowMs);
        applySession(completed);
        await queueSave(completed);
        await startFresh();
        setError(null);
        return;
      }

      const issued = issueNextQuestion(current);
      setQuestion(issued.question);
      await persistCheckpoint(issued.session, nowMs);
      setError(null);
    } catch (cause) {
      reportError(cause);
      throw cause;
    }
  }, [
    applySession,
    persistCheckpoint,
    queueSave,
    reportError,
    startFresh,
  ]);

  const finishSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) {
      throw new Error('Practice session is not ready.');
    }

    try {
      const completed = completePracticeSession(current, Date.now());
      applySession(completed);
      setQuestion(null);
      await queueSave(completed);
      setError(null);
    } catch (cause) {
      reportError(cause);
      throw cause;
    }
  }, [applySession, queueSave, reportError]);

  const startNewSession = useCallback(async () => {
    try {
      setLoading(true);
      await startFresh();
      setError(null);
    } catch (cause) {
      reportError(cause);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [reportError, startFresh]);

  let activeDurationMs = 0;
  if (session) {
    try {
      activeDurationMs = getActivePracticeDurationMs(session, clockNowMs);
    } catch {
      activeDurationMs = session.accumulatedActiveDurationMs;
    }
  }

  return {
    loading,
    error,
    session,
    question,
    activeDurationMs,
    unavailable,
    submitNumericAnswer,
    submitRelationAnswer,
    submitFractionAnswer,
    submitTimeAnswer,
    submitShapeAnswer,
    nextQuestion,
    finishSession,
    startNewSession,
  };
}
