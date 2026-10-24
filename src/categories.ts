// The id of an area: one of the eight built-in categories, or an id made for an area of a custom template
export type CategoryId = string;

// The eight built-in categories. Each keeps its colour from My Balance v1, so the wheel looks the same.

export type Category = { id: CategoryId; label: string; color: string };

export const CATEGORIES: Category[] = [
  { id: 'breathe', label: 'Breathe', color: '#ED2527' },
  { id: 'hydrate', label: 'Hydrate', color: '#3DB549' },
  { id: 'sleep', label: 'Sleep', color: '#2289B4' },
  { id: 'eat', label: 'Eat', color: '#F79321' },
  { id: 'move', label: 'Move', color: '#94AFDC' },
  { id: 'connect', label: 'Connect', color: '#FF5F75' },
  { id: 'learn', label: 'Learn', color: '#00ADEF' },
  { id: 'reflect', label: 'Reflect', color: '#935FA7' },
];

export const MIN_CATEGORIES = 4;
export const MAX_CATEGORIES = 8;

export const categoryById = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);

// A template is a ready mix of categories, between 4 and 8, in the order the wheel shows them
export type Template = { id: string; name: string; description: string; categories: CategoryId[] };

export const TEMPLATES: Template[] = [
  { id: 'full', name: 'Full wheel', description: 'All eight areas of balance', categories: ['breathe', 'hydrate', 'sleep', 'eat', 'move', 'connect', 'learn', 'reflect'] },
  { id: 'everyday', name: 'Everyday', description: 'Six areas for a busy week', categories: ['breathe', 'hydrate', 'sleep', 'move', 'connect', 'reflect'] },
  { id: 'body', name: 'Body first', description: 'Health and energy', categories: ['hydrate', 'eat', 'move', 'sleep'] },
  { id: 'mind', name: 'Mind first', description: 'Calm, learning and connection', categories: ['breathe', 'learn', 'reflect', 'connect'] },
  { id: 'start', name: 'Start small', description: 'Four areas to begin with', categories: ['sleep', 'move', 'eat', 'reflect'] },
];
