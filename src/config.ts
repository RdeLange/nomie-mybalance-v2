// The balance setup: which categories the wheel shows (4 to 8) and what each one measures.
import { CATEGORIES, MAX_CATEGORIES, MIN_CATEGORIES, TEMPLATES, type CategoryId, type Template } from './categories';
import { DEFAULT_CALCULATION, type Calculation } from './scoring';

// A category is scored by hand (a score you set) or calculated from Nomie, as in My Balance v1
export type Mode = 'manual' | 'calculated';

export type Config = {
  // the categories on the wheel, in order
  categories: CategoryId[];
  // what each category measures
  calculations: Partial<Record<CategoryId, Calculation[]>>;
  // how each category is scored; without a choice, a category with measures is calculated and one without is set by hand
  modes: Partial<Record<CategoryId, Mode>>;
  // the hand-set score of each category, from 0 to 1
  manual: Partial<Record<CategoryId, number>>;
};

export const DEFAULT_CONFIG: Config = {
  categories: TEMPLATES[0].categories,
  calculations: {},
  modes: {},
  manual: {},
};

// The wheel always has between 4 and 8 different categories, in the order they were chosen
export const normalise = (saved: Partial<Config> | undefined): Config => {
  const known = new Set(CATEGORIES.map((c) => c.id));
  const picked = [...new Set((saved?.categories ?? []).filter((id): id is CategoryId => known.has(id as CategoryId)))];
  const categories = picked.length >= MIN_CATEGORIES ? picked.slice(0, MAX_CATEGORIES) : [...DEFAULT_CONFIG.categories];
  return { categories, calculations: saved?.calculations ?? {}, modes: saved?.modes ?? {}, manual: saved?.manual ?? {} };
};

export const applyTemplate = (config: Config, template: Template): Config => ({ ...config, categories: [...template.categories] });

// Adds or removes a category. The count stays between 4 and 8.
export const toggleCategory = (config: Config, id: CategoryId): Config => {
  if (config.categories.includes(id)) {
    if (config.categories.length <= MIN_CATEGORIES) return config;
    return { ...config, categories: config.categories.filter((c) => c !== id) };
  }
  if (config.categories.length >= MAX_CATEGORIES) return config;
  return { ...config, categories: [...config.categories, id] };
};

export const calculationsOf = (config: Config, id: CategoryId): Calculation[] => config.calculations[id] ?? [];

// The mode of a category. Without a saved choice, a category with measures is calculated and one without is set by hand.
export const modeOf = (config: Config, id: CategoryId): Mode => config.modes[id] ?? (calculationsOf(config, id).length ? 'calculated' : 'manual');

export const setMode = (config: Config, id: CategoryId, mode: Mode): Config => ({ ...config, modes: { ...config.modes, [id]: mode } });

// Sets the hand-set score of a category, kept between 0 and 1
export const setManual = (config: Config, id: CategoryId, score: number): Config => ({
  ...config,
  manual: { ...config.manual, [id]: Math.min(1, Math.max(0, Math.round(score * 10) / 10)) },
});

export const addCalculation = (config: Config, id: CategoryId): Config => ({
  ...config,
  calculations: { ...config.calculations, [id]: [...calculationsOf(config, id), { ...DEFAULT_CALCULATION }] },
});

export const updateCalculation = (config: Config, id: CategoryId, index: number, calc: Calculation): Config => ({
  ...config,
  calculations: { ...config.calculations, [id]: calculationsOf(config, id).map((c, i) => (i === index ? calc : c)) },
});

export const removeCalculation = (config: Config, id: CategoryId, index: number): Config => ({
  ...config,
  calculations: { ...config.calculations, [id]: calculationsOf(config, id).filter((_, i) => i !== index) },
});
