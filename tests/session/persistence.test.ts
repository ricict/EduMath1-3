import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLocalSessionStore,
  deserializePracticeSession,
  serializePracticeSession,
  type KeyValueStorage,
} from '../../src/core/session/persistence';
import {
  completePracticeSession,
  issueNextQuestion,
  pausePracticeSession,
  startPracticeSession,
  submitAnswer,
} from '../../src/core/session/session';
import type { LearnerAnswer } from '../../src/core/session/types';
import { generateQuestion } from '../../src/core/question-engine/registry';
import type { Question } from '../../src/core/types';

class MemoryKeyValueStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

function correctAnswerFor(question: Question): LearnerAnswer {
  switch (question.questionType) {
    case 'numeric-choice':
      return { kind: 'numeric', value: question.expectedAnswer };
    case 'relation-choice':
      return { kind: 'relation', value: question.expectedAnswer };
    case 'fraction-choice':
      return { kind: 'fraction', value: question.expectedAnswer };
    case 'time-choice':
      return { kind: 'time', value: question.expectedAnswer };
    case 'shape-choice':
      return { kind: 'shape', value: question.expectedAnswer };
  }
}

function createSession() {
  return startPracticeSession({
    id: 'offline-session-1',
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    sessionSeed: 20261006,
    startedAtMs: 1_000,
  });
}

test('versioned serialization round-trip preserves resumable semantic session state', () => {
  const issued = issueNextQuestion(createSession());
  const wrong = submitAnswer(
    issued.session,
    { kind: 'numeric', value: 999 },
    2_000,
  );
  const paused = pausePracticeSession(wrong.session, 3_000);

  const restored = deserializePracticeSession(
    serializePracticeSession(paused),
  );

  assert.deepEqual(restored, paused);
  assert.equal(restored.status, 'paused');
  assert.equal(restored.attempts[0].answers[0].correct, false);
  assert.equal(
    restored.attempts[0].question.questionId,
    issued.question.id,
  );
});

test('schema-v1 restore accepts pre-M8.2 sequential question seeds', () => {
  const first = issueNextQuestion(createSession());
  const answered = submitAnswer(
    first.session,
    correctAnswerFor(first.question),
    2_000,
  );
  const second = issueNextQuestion(answered.session);

  const parsed = JSON.parse(
    serializePracticeSession(second.session),
  ) as {
    attempts: Array<{
      question: {
        generationContext: {
          grade: 1;
          skillId: 'addition_within_10';
          difficulty: 3;
          seed: number;
        };
        questionId: string;
        questionType: Question['questionType'];
        representation: Question['representation'];
      };
    }>;
  };

  const legacySeed = (20261006 + 1) >>> 0;
  const legacyQuestion = generateQuestion({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: legacySeed,
  });

  parsed.attempts[1].question.generationContext.seed = legacySeed;
  parsed.attempts[1].question.questionId = legacyQuestion.id;
  parsed.attempts[1].question.questionType = legacyQuestion.questionType;
  parsed.attempts[1].question.representation = legacyQuestion.representation;

  const restored = deserializePracticeSession(JSON.stringify(parsed));
  assert.equal(
    restored.attempts[1].question.generationContext.seed,
    legacySeed,
  );
});

test('schema-v1 persistence round-trip supports typed shape answers without a schema bump', () => {
  const session = startPracticeSession({
    id: 'shape-session-v1',
    grade: 1,
    skillId: 'identify_2d_shapes',
    difficulty: 3,
    sessionSeed: 20261006,
    startedAtMs: 1_000,
  });
  const issued = issueNextQuestion(session);
  const answered = submitAnswer(
    issued.session,
    correctAnswerFor(issued.question),
    2_000,
  );

  const restored = deserializePracticeSession(
    serializePracticeSession(answered.session),
  );

  assert.deepEqual(restored, answered.session);
  assert.equal(restored.schemaVersion, 1);
  assert.equal(restored.attempts[0].answers[0].answer.kind, 'shape');
});

test('local session store saves and discovers one resumable session', async () => {
  const storage = new MemoryKeyValueStorage();
  const store = createLocalSessionStore(storage);
  const issued = issueNextQuestion(createSession());
  const paused = pausePracticeSession(issued.session, 3_000);

  await store.save(paused);

  assert.deepEqual(await store.load(paused.id), paused);
  assert.deepEqual(await store.loadResumable(), paused);
});

test('completed session remains loadable by ID but is no longer resumable', async () => {
  const storage = new MemoryKeyValueStorage();
  const store = createLocalSessionStore(storage);
  const issued = issueNextQuestion(createSession());
  const answered = submitAnswer(
    issued.session,
    correctAnswerFor(issued.question),
    2_000,
  );
  const completed = completePracticeSession(answered.session, 3_000);

  await store.save(answered.session);
  assert.equal((await store.loadResumable())?.id, completed.id);

  await store.save(completed);

  assert.deepEqual(await store.load(completed.id), completed);
  assert.equal(await store.loadResumable(), null);
  assert.deepEqual(await store.listCompleted(), [completed]);

  await store.save(completed);
  assert.deepEqual(await store.listCompleted(), [completed]);
});

test('invalid JSON and unsupported schema versions fail explicitly', () => {
  assert.throws(
    () => deserializePracticeSession('{not-json'),
    /not valid JSON/,
  );

  const serialized = serializePracticeSession(createSession());
  const unsupported = JSON.stringify({
    ...JSON.parse(serialized),
    schemaVersion: 999,
  });

  assert.throws(
    () => deserializePracticeSession(unsupported),
    /Unsupported practice session schema version/,
  );
});

test('tampered deterministic question identity is rejected during restore', () => {
  const issued = issueNextQuestion(createSession());
  const parsed = JSON.parse(
    serializePracticeSession(issued.session),
  ) as {
    attempts: Array<{
      question: {
        questionId: string;
      };
    }>;
  };

  parsed.attempts[0].question.questionId = 'tampered-question';

  assert.throws(
    () => deserializePracticeSession(JSON.stringify(parsed)),
    /does not reconstruct deterministically/,
  );
});

test('tampered answer correctness is rejected during restore', () => {
  const issued = issueNextQuestion(createSession());
  const wrong = submitAnswer(
    issued.session,
    { kind: 'numeric', value: 999 },
    2_000,
  );
  const parsed = JSON.parse(
    serializePracticeSession(wrong.session),
  ) as {
    attempts: Array<{
      answers: Array<{
        correct: boolean;
      }>;
    }>;
  };

  parsed.attempts[0].answers[0].correct = true;

  assert.throws(
    () => deserializePracticeSession(JSON.stringify(parsed)),
    /correctness does not match question semantics/,
  );
});

test('completed attempt integrity requires the correct terminal answer timestamp', () => {
  const issued = issueNextQuestion(createSession());
  const answered = submitAnswer(
    issued.session,
    correctAnswerFor(issued.question),
    2_000,
  );
  const parsed = JSON.parse(
    serializePracticeSession(answered.session),
  ) as {
    attempts: Array<{
      completedAtMs: number;
    }>;
  };

  parsed.attempts[0].completedAtMs = 2_001;

  assert.throws(
    () => deserializePracticeSession(JSON.stringify(parsed)),
    /correct terminal answer/,
  );
});


test('completed session index rejects malformed persisted data', async () => {
  const storage = new MemoryKeyValueStorage();
  const store = createLocalSessionStore(storage);

  storage.values.set('edumath:m4:completed-session-ids:v1', '{broken');

  await assert.rejects(
    () => store.listCompleted(),
    /Completed session index is not valid JSON/,
  );
});
