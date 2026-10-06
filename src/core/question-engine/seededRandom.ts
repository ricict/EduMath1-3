export interface SeededRandom {
  next(): number;
  integer(minInclusive: number, maxInclusive: number): number;
}

export function createSeededRandom(seed: number): SeededRandom {
  if (!Number.isSafeInteger(seed)) {
    throw new Error('Seed must be a safe integer.');
  }

  let state = seed >>> 0;

  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  return {
    next,
    integer(minInclusive, maxInclusive) {
      if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
        throw new Error('Random integer bounds must be integers.');
      }
      if (maxInclusive < minInclusive) {
        throw new Error('Random integer maximum must be >= minimum.');
      }

      return Math.floor(next() * (maxInclusive - minInclusive + 1)) + minInclusive;
    },
  };
}
