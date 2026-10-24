// How a calculation becomes a score, as plain rules. The rules are the ones My Balance v1 used.
export type Statistic = 'average' | 'sum';
export type TimeRange = 7 | 30 | 60 | 90;

export type Calculation = {
  // "#tag" or "@person" for a tracker, "|word" for a note search, or "none"
  source: string;
  statistic: Statistic;
  days: TimeRange;
  min: number;
  max: number;
  weight: number;
  // a high value is bad (for example stress): the score is turned around
  reverse: boolean;
};

export const DEFAULT_CALCULATION: Calculation = { source: 'none', statistic: 'average', days: 30, min: 1, max: 10, weight: 1, reverse: false };

// The value of a source over the period: the sum, or the average per day that has a value (0 when there is none)
export const statisticOf = (values: number[], statistic: Statistic, days: number): number => {
  const total = values.reduce((a, b) => a + b, 0);
  if (statistic === 'sum') return total;
  if (statistic === 'average') return values.length ? total / values.length : 0;
  return days ? total / days : 0;
};

// The value kept inside the min and max, then turned into 0 to 1 (reversed when the calculation says so)
export const scoreOf = (value: number, calc: Calculation): number => {
  const span = calc.max - calc.min;
  if (span <= 0) return 0;
  const clamped = Math.min(calc.max, Math.max(calc.min, value));
  const share = (clamped - calc.min) / span;
  return calc.reverse ? 1 - share : share;
};

// The score of a category: the weighted average of its calculations, from 0 to 1. A category without calculations is 0.
export const categoryScore = (calcs: Calculation[], values: number[]): number => {
  let weightSum = 0;
  let scoreSum = 0;
  calcs.forEach((calc, i) => {
    if (calc.source === 'none' || calc.weight <= 0) return;
    weightSum += calc.weight;
    scoreSum += scoreOf(values[i] ?? 0, calc) * calc.weight;
  });
  return weightSum > 0 ? scoreSum / weightSum : 0;
};

// Checks a calculation as the editor saves it. Returns the problems, or none.
export const problemsIn = (calc: Calculation): string[] => {
  const problems: string[] = [];
  if (!(calc.max > calc.min)) problems.push('The maximum must be more than the minimum.');
  if (!(calc.weight >= 0)) problems.push('The weight cannot be negative.');
  return problems;
};
