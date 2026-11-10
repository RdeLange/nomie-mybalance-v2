import { t } from './i18n/index.svelte';
// The id of an area: one of the eight built-in categories, or an id made for an area of a custom template
export type CategoryId = string;

// The eight built-in categories. Each keeps its colour from My Balance v1, so the wheel looks the same.

export type Category = { id: CategoryId; label: string; color: string };

export const CATEGORIES: Category[] = [
  { id: 'breathe', get label() { return t('catBreathe'); }, color: '#ED2527' },
  { id: 'hydrate', get label() { return t('catHydrate'); }, color: '#3DB549' },
  { id: 'sleep', get label() { return t('catSleep'); }, color: '#2289B4' },
  { id: 'eat', get label() { return t('catEat'); }, color: '#F79321' },
  { id: 'move', get label() { return t('catMove'); }, color: '#94AFDC' },
  { id: 'connect', get label() { return t('catConnect'); }, color: '#FF5F75' },
  { id: 'learn', get label() { return t('catLearn'); }, color: '#00ADEF' },
  { id: 'reflect', get label() { return t('catReflect'); }, color: '#935FA7' },
];

export const MIN_CATEGORIES = 4;
export const MAX_CATEGORIES = 8;

export const categoryById = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);

// A template is a ready mix of categories, between 4 and 8, in the order the wheel shows them
export type Template = { id: string; name: string; description: string; categories: CategoryId[] };

export const TEMPLATES: Template[] = [
  { id: 'full', get name() { return t('fullName'); }, get description() { return t('fullDesc'); }, categories: ['breathe', 'hydrate', 'sleep', 'eat', 'move', 'connect', 'learn', 'reflect'] },
  { id: 'everyday', get name() { return t('everydayName'); }, get description() { return t('everydayDesc'); }, categories: ['breathe', 'hydrate', 'sleep', 'move', 'connect', 'reflect'] },
  { id: 'body', get name() { return t('bodyName'); }, get description() { return t('bodyDesc'); }, categories: ['hydrate', 'eat', 'move', 'sleep'] },
  { id: 'mind', get name() { return t('mindName'); }, get description() { return t('mindDesc'); }, categories: ['breathe', 'learn', 'reflect', 'connect'] },
  { id: 'start', get name() { return t('startName'); }, get description() { return t('startDesc'); }, categories: ['sleep', 'move', 'eat', 'reflect'] },
];
