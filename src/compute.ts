// Reads the value of each calculation from Nomie, and works out the score of each category.
import { categoryScore, statisticOf, type Calculation } from './scoring';
import { calculationsOf, type Config } from './config';
import { CATEGORIES, type CategoryId } from './categories';

export type BalanceApi = {
  // the daily values of a tracker over the days (a tracker, "#tag" or "@person")
  trackerValues: (source: string, days: number) => Promise<number[]>;
  // how many notes mention the word over the days
  noteCount: (word: string, days: number) => Promise<number>;
};

// The value of one calculation: a tracker's sum or average, or a note search (its count, per day for the average)
export const valueOf = async (calc: Calculation, api: BalanceApi): Promise<number> => {
  if (calc.source === 'none') return 0;
  if (calc.source.startsWith('|')) {
    const count = await api.noteCount(calc.source.slice(1), calc.days);
    return calc.statistic === 'sum' ? count : count / calc.days;
  }
  return statisticOf(await api.trackerValues(calc.source, calc.days), calc.statistic, calc.days);
};

// The score of every category on the wheel, from 0 to 1, in the order of the config
export const scoresFor = async (config: Config, api: BalanceApi): Promise<Array<{ id: CategoryId; score: number }>> => {
  const out: Array<{ id: CategoryId; score: number }> = [];
  for (const id of config.categories) {
    const calcs = calculationsOf(config, id);
    const values: number[] = [];
    for (const calc of calcs) values.push(await valueOf(calc, api));
    out.push({ id, score: categoryScore(calcs, values) });
  }
  return out;
};

// The balance as one number from 0 to 10, the average of the categories
export const overall = (scores: Array<{ score: number }>): number =>
  scores.length ? Math.round((scores.reduce((a, s) => a + s.score, 0) / scores.length) * 100) / 10 : 0;

export const labelOf = (id: CategoryId): string => CATEGORIES.find((c) => c.id === id)?.label ?? id;
