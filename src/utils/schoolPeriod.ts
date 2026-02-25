import type { SchoolPeriodType } from '../types';

export function periodCount(type: SchoolPeriodType): number {
  return type === 'quarter' ? 4 : type === 'trimester' ? 3 : 2;
}
