// The state of the balance: the setup, the scores, and the actions. The screens only show them.
import { normalise, DEFAULT_CONFIG, type Config } from './config';
import { scoresFor, overall, labelOf, type BalanceApi } from './compute';
import { CATEGORIES, type CategoryId } from './categories';

const STORAGE_KEY = 'balance';

class Balance {
  plugin: any = null;
  config = $state<Config>(DEFAULT_CONFIG);
  scores = $state<Array<{ id: CategoryId; score: number }>>([]);
  overall = $state(0);
  measuring = $state<CategoryId | null>(null);
  busy = $state(false);
  message = $state('');
  ready = $state(false);
}

export const balance = new Balance();

const apiFor = (plugin: any): BalanceApi => ({
  trackerValues: async (source, days) => {
    const reply = await plugin.getTrackableUsage({ tag: source, daysBack: days });
    return reply?.usage?.values ?? [];
  },
  noteCount: async (word, days) => {
    const notes = await plugin.searchNotes(word, new Date(), days);
    return notes?.length ?? 0;
  },
});

export const slicesOf = () =>
  balance.scores.map((s) => {
    const cat = CATEGORIES.find((c) => c.id === s.id)!;
    return { id: s.id, label: cat.label, color: cat.color, score: s.score };
  });

export const load = async (plugin: any) => {
  balance.plugin = plugin;
  await plugin.storage.init();
  balance.config = normalise(plugin.storage.getItem(STORAGE_KEY));
  balance.ready = true;
  await refresh();
};

export const save = () => balance.plugin?.storage.setItem(STORAGE_KEY, $state.snapshot(balance.config));

// Reads Nomie again and works out the wheel
export const refresh = async () => {
  if (!balance.plugin || balance.busy) return;
  balance.busy = true;
  try {
    balance.scores = await scoresFor($state.snapshot(balance.config) as Config, apiFor(balance.plugin));
    balance.overall = overall(balance.scores);
    balance.message = '';
  } catch {
    balance.message = 'The balance could not be read from Nomie. Try again in a moment.';
  } finally {
    balance.busy = false;
  }
};

// Writes the balance into the timeline, so it shows with the rest of the day
export const logBalance = () => {
  if (!balance.plugin) return;
  const parts = balance.scores.map((s) => `${labelOf(s.id)} ${Math.round(s.score * 10)}/10`).join(', ');
  balance.plugin.createNote({ note: `Balance ${balance.overall.toFixed(1)}/10 · ${parts} #balance`, score: balance.overall });
  balance.message = 'Logged to your timeline.';
};

export const setConfig = async (config: Config) => {
  balance.config = config;
  save();
  await refresh();
};
