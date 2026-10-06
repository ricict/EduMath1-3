import type { SeededRandom } from './seededRandom';

function shuffleNumbers(
  values: readonly number[],
  random: SeededRandom,
): number[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.integer(0, index);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function integerRangeInclusive(
  minInclusive: number,
  maxInclusive: number,
): readonly number[] {
  if (
    !Number.isInteger(minInclusive) ||
    !Number.isInteger(maxInclusive) ||
    maxInclusive < minInclusive
  ) {
    throw new Error('Numeric answer range must use valid integer bounds.');
  }

  return Array.from(
    { length: maxInclusive - minInclusive + 1 },
    (_, index) => minInclusive + index,
  );
}

export function createNumericAnswerOptions(
  correctAnswer: number,
  candidates: readonly number[],
  random: SeededRandom,
): readonly number[] {
  const uniqueCandidates = [...new Set(candidates)];

  if (!uniqueCandidates.includes(correctAnswer)) {
    throw new Error('Numeric answer candidates must include the correct answer.');
  }

  const alternatives = shuffleNumbers(
    uniqueCandidates.filter((value) => value !== correctAnswer),
    random,
  );

  if (alternatives.length < 3) {
    throw new Error('Numeric answer generation requires at least three distractors.');
  }

  return shuffleNumbers(
    [correctAnswer, ...alternatives.slice(0, 3)],
    random,
  );
}
