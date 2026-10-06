import type { Grade } from '@/core/types';

export type GradeRouteParam = string | readonly string[] | undefined;

export function parsePracticeGradeParam(value: GradeRouteParam): Grade | null {
  const candidate = Array.isArray(value)
    ? value.length === 1
      ? value[0]
      : undefined
    : value;

  switch (candidate) {
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    default:
      return null;
  }
}
