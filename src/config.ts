// The balance setup: which categories the wheel shows (4 to 8) and what each one measures.
import { CATEGORIES, MAX_CATEGORIES, MIN_CATEGORIES, TEMPLATES, type CategoryId, type Template } from './categories';
import { DEFAULT_CALCULATION, type Calculation } from './scoring';

export type Config = {
  // the categories on the wheel, in order
  categories: CategoryId[];
  // what each category measures
  calculations: Partial<Record<CategoryId, Calculation[]>>;
};

export const DEFAULT_CONFIG: Config = {
  categories: TEMPLATES[0].categories,
  calculations: {},
};

// The wheel always has between 4 and 8 different categories, in the order they were chosen
export const normalise = (saved: Partial<Config> | undefined): Config => {
  const known = new Set(CATEGORIES.map((c) => c.id));
  const picked = [...new Set((saved?.categories ?? []).filter((id): id is CategoryId => known.has(id as CategoryId)))];
  const categories = picked.length >= MIN_CATEGORIES ? picked.slice(0, MAX_CATEGORIES) : [...DEFAULT_CONFIG.categories];
  return { categories, calculations: saved?.calculations ?? {} };
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
