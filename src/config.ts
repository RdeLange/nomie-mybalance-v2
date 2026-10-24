// The balance setup: which areas the wheel shows (4 to 8), what each one measures, and the templates the user made.
import { CATEGORIES, MAX_CATEGORIES, MIN_CATEGORIES, TEMPLATES, type CategoryId, type Template } from './categories';
import { DEFAULT_CALCULATION, type Calculation } from './scoring';

// A category is scored by hand (a score you set) or calculated from Nomie, as in My Balance v1
export type Mode = 'manual' | 'calculated';

// An area on the wheel: a built-in category, or an area the user named and coloured in a custom template
export type Area = { id: CategoryId; label: string; color: string };

// A template the user made: a name and its own areas, between 4 and 8
export type CustomTemplate = { id: string; name: string; areas: Area[] };

export type Config = {
  // the areas on the wheel, in order
  categories: CategoryId[];
  // what each category measures
  calculations: Partial<Record<CategoryId, Calculation[]>>;
  // how each category is scored; without a choice, a category with measures is calculated and one without is set by hand
  modes: Partial<Record<CategoryId, Mode>>;
  // the hand-set score of each category, from 0 to 1
  manual: Partial<Record<CategoryId, number>>;
  // the templates the user made
  custom: CustomTemplate[];
};

export const DEFAULT_CONFIG: Config = {
  categories: TEMPLATES[0].categories,
  calculations: {},
  modes: {},
  manual: {},
  custom: [],
};

// The colours an area can take: the iOS system colours
export const PRESET_COLOURS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93'];

const isArea = (area: any): area is Area => typeof area?.id === 'string' && typeof area?.label === 'string' && area.label.trim() !== '' && typeof area?.color === 'string';

// Keeps the templates that are well formed: a name, and between 4 and 8 areas that each have a name and a colour
const readCustom = (saved: unknown): CustomTemplate[] => {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((t) => {
    if (typeof t?.id !== 'string' || typeof t?.name !== 'string' || !Array.isArray(t.areas)) return [];
    const areas = t.areas.filter(isArea).map((a: Area) => ({ id: a.id, label: a.label.trim(), color: a.color }));
    if (areas.length < MIN_CATEGORIES) return [];
    return [{ id: t.id, name: t.name.trim() || 'Template', areas: areas.slice(0, MAX_CATEGORIES) }];
  });
};

// The wheel always has between 4 and 8 different areas, in the order they were chosen
export const normalise = (saved: Partial<Config> | undefined): Config => {
  const custom = readCustom(saved?.custom);
  const known = new Set<string>([...CATEGORIES.map((c) => c.id), ...custom.flatMap((t) => t.areas.map((a) => a.id))]);
  const picked = [...new Set((saved?.categories ?? []).filter((id) => known.has(id)))];
  const categories = picked.length >= MIN_CATEGORIES ? picked.slice(0, MAX_CATEGORIES) : [...DEFAULT_CONFIG.categories];
  return { categories, calculations: saved?.calculations ?? {}, modes: saved?.modes ?? {}, manual: saved?.manual ?? {}, custom };
};

// Every area the user can put on the wheel: the built-in categories and the areas of the custom templates
export const areasOf = (config: Config): Area[] => [...CATEGORIES, ...config.custom.flatMap((t) => t.areas)];

export const areaOf = (config: Config, id: CategoryId): Area | undefined => areasOf(config).find((a) => a.id === id);

export const applyTemplate = (config: Config, template: Template): Config => ({ ...config, categories: [...template.categories] });

export const applyCustom = (config: Config, template: CustomTemplate): Config => ({ ...config, categories: template.areas.map((a) => a.id) });

// Adds or removes an area. The count stays between 4 and 8.
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

let made = 0;
// A new id. Ids are kept as they are saved, so they only have to be unique in one setup.
export const newId = (prefix: string): string => `${prefix}${Date.now().toString(36)}${(made++).toString(36)}`;

export const newArea = (index: number): Area => ({ id: newId('a'), label: `Area ${index + 1}`, color: PRESET_COLOURS[index % PRESET_COLOURS.length] });

// A new template, with four areas to name and colour
export const blankTemplate = (): CustomTemplate => ({ id: newId('t'), name: '', areas: [0, 1, 2, 3].map((i) => newArea(i)) });

// The first thing wrong with a custom template, or null when it can be saved
export const templateProblem = (template: CustomTemplate): string | null => {
  if (!template.name.trim()) return 'Give the template a name.';
  if (template.areas.length < MIN_CATEGORIES || template.areas.length > MAX_CATEGORIES) return `A template has between ${MIN_CATEGORIES} and ${MAX_CATEGORIES} areas.`;
  if (template.areas.some((a) => !a.label.trim())) return 'Every area needs a name.';
  return null;
};

// Drops what was measured or set for areas that are no longer on a template
const forget = (config: Config, ids: CategoryId[]): Config => {
  const calculations = { ...config.calculations };
  const modes = { ...config.modes };
  const manual = { ...config.manual };
  for (const id of ids) {
    delete calculations[id];
    delete modes[id];
    delete manual[id];
  }
  return { ...config, calculations, modes, manual };
};

// Saves a template: a new one is added, an existing one is changed. The wheel then shows it.
export const saveCustomTemplate = (config: Config, template: CustomTemplate): Config => {
  const before = config.custom.find((t) => t.id === template.id);
  const custom = before ? config.custom.map((t) => (t.id === template.id ? template : t)) : [...config.custom, template];
  const gone = before ? before.areas.map((a) => a.id).filter((id) => !template.areas.some((a) => a.id === id)) : [];
  return forget({ ...config, custom, categories: template.areas.map((a) => a.id) }, gone);
};

// Deletes a template. When it was on the wheel, the wheel goes back to the full wheel.
export const deleteCustomTemplate = (config: Config, id: string): Config => {
  const template = config.custom.find((t) => t.id === id);
  if (!template) return config;
  const ids = template.areas.map((a) => a.id);
  const rest = config.categories.filter((c) => !ids.includes(c));
  return forget({ ...config, custom: config.custom.filter((t) => t.id !== id), categories: rest.length >= MIN_CATEGORIES ? rest : [...TEMPLATES[0].categories] }, ids);
};
