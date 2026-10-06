import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  checkpointPracticeSession,
  completePracticeSession,
  getActivePracticeDurationMs,
  issueNextQuestion,
  pausePracticeSession,
  recoverInterruptedPracticeSession,
  restoreActiveQuestion,
  resumePracticeSession,
  startPracticeSession,
  submitAnswer,
} from '@/core/session/session';
import type { PracticeSession } from '@/core/session/types';
import type { Question } from '@/core/types';
import { localPracticeSessionStore } from '@/infrastructure/storage/expoSqlitePracticeSessionStore';

const DEMO_GRADE = 1 as const;
const DEMO_SKILL = 'addition_within_10' as const;
const DEMO_DIFFICULTY = 3 as const;

function createFreshSession(nowMs: number): {
  session: PracticeSession;
  question: Question;
} {
  const session = startPracticeSession({
    id: `local-${nowMs.toString(36)}`,
    grade: DEMO_GRADE,
    skillId: DEMO_SKILL,
    difficulty: DEMO_DIFFICULTY,
    sessionSeed: nowMs >>> 0,
    startedAtMs: nowMs,
  });
  const issued = issueNextQuestion(session);

  return {
    session: issued.session,
    question: issued.question,
  };
}

export interface PracticeSessionController {
  loading: boolean;
  error: string | null;
  session: PracticeSession | null;
  question: Question | null;
  activeDurationMs: number;
  submitNumericAnswer(value: number): Promise<boolean>;
  nextQuestion(): Promise<void>;
  finishSession(): Promise<void>;
  startNewSession(): Promise<void>;
}

export function usePracticeSession(): PracticeSessionController {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());

  const sessionRef = useRef<PracticeSession | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const applySession = useCallback((nextSession: PracticeSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
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
    const fresh = createFreshSession(nowMs);
    setQuestion(fresh.question);
    setClockNowMs(nowMs);
    await persistCheckpoint(fresh.session, nowMs);
  }, [persistCheckpoint]);

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
          const fresh = createFreshSession(nowMs);
          restored = fresh.session;

          if (!cancelled) {
            setQuestion(fresh.question);
          }
        } else {
          const activeQuestion = restoreActiveQuestion(restored);

          if (activeQuestion) {
            if (!cancelled) {
              setQuestion(activeQuestion);
            }
          } else {
            const issued = issueNextQuestion(restored);
            restored = issued.session;

            if (!cancelled) {
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
  }, [applySession, queueSave, reportError]);

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

  const nextQuestion = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) {
      throw new Error('Practice session is not ready.');
    }

    try {
      const nowMs = Date.now();
      const issued = issueNextQuestion(current);
      setQuestion(issued.question);
      await persistCheckpoint(issued.session, nowMs);
      setError(null);
    } catch (cause) {
      reportError(cause);
      throw cause;
    }
  }, [persistCheckpoint, reportError]);

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
    submitNumericAnswer,
    nextQuestion,
    finishSession,
    startNewSession,
  };
}
