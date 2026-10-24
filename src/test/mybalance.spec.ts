import { describe, expect, it } from 'vitest';
import { CATEGORIES, MAX_CATEGORIES, MIN_CATEGORIES, TEMPLATES } from '../categories';
import { categoryScore, scoreOf, statisticOf, problemsIn, type Calculation } from '../scoring';
import {
  normalise, toggleCategory, addCalculation, updateCalculation, removeCalculation, applyTemplate, DEFAULT_CONFIG, modeOf, setMode, setManual,
  areaOf, saveCustomTemplate, deleteCustomTemplate, templateProblem, blankTemplate, newArea, type CustomTemplate,
} from '../config';
import { sectorAngles, sectorPath, scoreRadius, RADIUS, HUB, CENTRE } from '../geometry';
import { valueOf, scoresFor, overall, type BalanceApi } from '../compute';

const calc = (over: Partial<Calculation> = {}): Calculation => ({ source: '#mood', statistic: 'average', days: 30, min: 1, max: 10, weight: 1, reverse: false, ...over });

describe('the categories', () => {
  it('keeps the eight colours of My Balance v1', () => {
    expect(CATEGORIES.map((c) => c.color)).toEqual(['#ED2527', '#3DB549', '#2289B4', '#F79321', '#94AFDC', '#FF5F75', '#00ADEF', '#935FA7']);
  });

  it('every template has between 4 and 8 different categories', () => {
    for (const t of TEMPLATES) {
      expect(t.categories.length).toBeGreaterThanOrEqual(MIN_CATEGORIES);
      expect(t.categories.length).toBeLessThanOrEqual(MAX_CATEGORIES);
      expect(new Set(t.categories).size).toBe(t.categories.length);
    }
  });
});

describe('scores', () => {
  it('turns a value into 0 to 1 inside the min and max, and clamps outside them', () => {
    expect(scoreOf(5.5, calc({ min: 1, max: 10 }))).toBeCloseTo(0.5);
    expect(scoreOf(99, calc({ min: 1, max: 10 }))).toBe(1);
    expect(scoreOf(-5, calc({ min: 1, max: 10 }))).toBe(0);
  });

  it('turns a reversed calculation around', () => {
    expect(scoreOf(10, calc({ min: 1, max: 10, reverse: true }))).toBe(0);
  });

  it('averages the calculations of a category by their weight', () => {
    const score = categoryScore([calc({ weight: 1 }), calc({ weight: 3 })], [10, 1]);
    expect(score).toBeCloseTo((1 * 1 + 0 * 3) / 4);
  });

  it('a category without calculations scores 0', () => {
    expect(categoryScore([], [])).toBe(0);
    expect(categoryScore([calc({ source: 'none' })], [5])).toBe(0);
  });

  it('a note search averages per day, as v1 did', async () => {
    const api: BalanceApi = { trackerValues: async () => [], noteCount: async () => 14 };
    expect(await valueOf(calc({ source: '|walk', statistic: 'average', days: 7 }), api)).toBe(2);
    expect(await valueOf(calc({ source: '|walk', statistic: 'sum', days: 7 }), api)).toBe(14);
  });

  it('an average of no values is 0, not NaN', () => {
    expect(statisticOf([], 'average', 7)).toBe(0);
  });

  it('the overall balance is the average of the categories, out of 10', () => {
    expect(overall([{ score: 1 }, { score: 0.5 }])).toBe(7.5);
  });

  it('flags a maximum that is not above the minimum, and a negative weight', () => {
    expect(problemsIn(calc({ min: 5, max: 5 }))).toHaveLength(1);
    expect(problemsIn(calc({ weight: -1 }))).toHaveLength(1);
    expect(problemsIn(calc())).toHaveLength(0);
  });
});

describe('the configuration', () => {
  it('keeps the wheel between 4 and 8 categories', () => {
    let config = { ...DEFAULT_CONFIG, categories: ['sleep', 'move', 'eat', 'reflect'] as any };
    config = toggleCategory(config, 'sleep');
    expect(config.categories).toHaveLength(4);
    config = toggleCategory(config, 'breathe');
    config = toggleCategory(config, 'hydrate');
    config = toggleCategory(config, 'learn');
    config = toggleCategory(config, 'connect');
    expect(config.categories).toHaveLength(8);
    expect(toggleCategory(config, 'learn').categories).toHaveLength(7);
  });

  it('reads a saved configuration with too few categories as the default', () => {
    expect(normalise({ categories: ['sleep'] as any }).categories).toEqual(DEFAULT_CONFIG.categories);
  });

  it('applies a template in its order', () => {
    expect(applyTemplate(DEFAULT_CONFIG, TEMPLATES[2]).categories).toEqual(TEMPLATES[2].categories);
  });

  it('adds, changes and removes a calculation of one category', () => {
    let config = addCalculation(DEFAULT_CONFIG, 'sleep');
    config = updateCalculation(config, 'sleep', 0, calc({ source: '#sleep' }));
    expect(config.calculations.sleep![0].source).toBe('#sleep');
    expect(removeCalculation(config, 'sleep', 0).calculations.sleep).toEqual([]);
  });
});

describe('the wheel geometry', () => {
  it('splits the wheel into equal sectors', () => {
    expect(sectorAngles(0, 8)).toEqual({ start: 0, end: 45, middle: 22.5 });
    expect(sectorAngles(3, 4).start).toBe(270);
  });

  it('draws a sector from the centre, so it can grow from there', () => {
    expect(sectorPath(0, 4).startsWith(`M ${CENTRE} ${CENTRE} L`)).toBe(true);
  });

  it('puts a score between the hub and the rim', () => {
    expect(scoreRadius(0)).toBe(HUB);
    expect(scoreRadius(1)).toBe(RADIUS);
  });
});

describe('set by hand or calculated', () => {
  it('a category without a choice is calculated when it has measures, and set by hand when it has none', () => {
    const config = addCalculation(DEFAULT_CONFIG, 'sleep');
    expect(modeOf(config, 'sleep')).toBe('calculated');
    expect(modeOf(config, 'move')).toBe('manual');
  });

  it('keeps a hand-set score between 0 and 1, in steps of a tenth', () => {
    expect(setManual(DEFAULT_CONFIG, 'move', 0.66).manual.move).toBe(0.7);
    expect(setManual(DEFAULT_CONFIG, 'move', 3).manual.move).toBe(1);
    expect(setManual(DEFAULT_CONFIG, 'move', -1).manual.move).toBe(0);
  });

  it('scores a hand-set category with its score, whatever its measures say', async () => {
    const config = setMode(setManual(DEFAULT_CONFIG, 'move', 0.4), 'move', 'manual');
    const withMeasures = addCalculation(config, 'move');
    const api: BalanceApi = { trackerValues: async () => [10], noteCount: async () => 0 };
    const scores = await scoresFor({ ...withMeasures, categories: ['move'] as any }, api);
    expect(scores[0].score).toBe(0.4);
  });
});

describe('your own templates', () => {
  const work: CustomTemplate = {
    id: 't-work',
    name: 'Work',
    areas: [
      { id: 'w1', label: 'Focus', color: '#007AFF' },
      { id: 'w2', label: 'Rest', color: '#34C759' },
      { id: 'w3', label: 'Team', color: '#FF9500' },
      { id: 'w4', label: 'Health', color: '#FF2D55' },
    ],
  };

  it('saving a template puts its own named and coloured areas on the wheel', () => {
    const config = saveCustomTemplate(DEFAULT_CONFIG, work);
    expect(config.categories).toEqual(['w1', 'w2', 'w3', 'w4']);
    expect(areaOf(config, 'w1')).toEqual({ id: 'w1', label: 'Focus', color: '#007AFF' });
    expect(config.custom).toHaveLength(1);
  });

  it('changing a saved template keeps one copy of it', () => {
    const once = saveCustomTemplate(DEFAULT_CONFIG, work);
    const renamed = saveCustomTemplate(once, { ...work, name: 'Office' });
    expect(renamed.custom).toHaveLength(1);
    expect(renamed.custom[0].name).toBe('Office');
  });

  it('a template needs a name, and between 4 and 8 areas that each have a name', () => {
    expect(templateProblem({ ...work, name: '  ' })).toBeTruthy();
    expect(templateProblem({ ...work, areas: work.areas.slice(0, 3) })).toBeTruthy();
    expect(templateProblem({ ...work, areas: [...work.areas, ...[1, 2, 3, 4, 5].map((i) => newArea(i))] })).toBeTruthy();
    expect(templateProblem({ ...work, areas: [...work.areas, ...[1, 2, 3, 4].map((i) => newArea(i))] })).toBeNull();
    expect(templateProblem({ ...work, areas: [{ ...work.areas[0], label: ' ' }, ...work.areas.slice(1)] })).toBeTruthy();
    expect(templateProblem(work)).toBeNull();
    expect(templateProblem(blankTemplate())).toBe('Give the template a name.');
  });

  it('deleting the template on the wheel goes back to the full wheel and forgets its measures', () => {
    let config = saveCustomTemplate(DEFAULT_CONFIG, work);
    config = setManual(config, 'w2', 0.5);
    const removed = deleteCustomTemplate(config, work.id);
    expect(removed.custom).toEqual([]);
    expect(removed.categories).toEqual(TEMPLATES[0].categories);
    expect(removed.manual.w2).toBeUndefined();
  });

  it('reads a saved setup with a well formed template, and drops one that is not', () => {
    const saved = {
      categories: ['w1', 'w2', 'w3', 'w4', 'sleep'],
      custom: [work, { id: 'bad', name: 'Too small', areas: [{ id: 'x', label: 'One', color: '#000' }] }],
    };
    const config = normalise(saved as any);
    expect(config.custom.map((t) => t.id)).toEqual(['t-work']);
    expect(config.categories).toEqual(['w1', 'w2', 'w3', 'w4', 'sleep']);
  });
});

describe('the scores of a configuration', () => {
  it('scores each category of the configuration in order', async () => {
    const config = { categories: ['sleep', 'move'] as any, calculations: { sleep: [calc({ source: '#sleep', min: 0, max: 8 })] }, modes: {}, manual: {} };
    const api: BalanceApi = { trackerValues: async () => [4, 4], noteCount: async () => 0 };
    const scores = await scoresFor(config as any, api);
    expect(scores.map((s) => s.id)).toEqual(['sleep', 'move']);
    expect(scores[0].score).toBeCloseTo(0.5);
    expect(scores[1].score).toBe(0);
  });
});
