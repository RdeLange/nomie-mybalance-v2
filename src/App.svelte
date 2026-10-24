<script lang="ts">
  import { onMount } from 'svelte';
  import Wheel from './Wheel.svelte';
  import Widget from './Widget.svelte';
  import { balance, load, refresh, logBalance, setConfig, slicesOf, save } from './balance.svelte';
  import { CATEGORIES, MAX_CATEGORIES, MIN_CATEGORIES, TEMPLATES, type CategoryId } from './categories';
  import {
    applyTemplate, applyCustom, toggleCategory, calculationsOf, addCalculation, updateCalculation, removeCalculation, modeOf, setMode, setManual,
    areaOf, saveCustomTemplate, deleteCustomTemplate, blankTemplate, newArea, templateProblem, PRESET_COLOURS, type CustomTemplate, type Mode,
  } from './config';
  import { DEFAULT_CALCULATION, problemsIn, type Calculation, type Statistic, type TimeRange } from './scoring';
  import { paletteFrom, type Palette } from './palette';
  import { onPrefsChange } from './prefs-live';

  const DAYS: TimeRange[] = [7, 30, 60, 90];
  const STATISTICS: Array<[Statistic, string]> = [['average', 'Average'], ['sum', 'Sum']];

  let plugin: any;
  let palette = $state<Palette>(paletteFrom(undefined));
  let scale = $state(1);
  let view = $state<'modal' | 'widget'>('modal');

  const selected = $derived(balance.config.categories);
  // the areas the grid offers: the built-in categories, and the areas of any custom template that is on the wheel
  const pickable = $derived([...CATEGORIES, ...balance.config.custom.filter((t) => t.areas.some((a) => selected.includes(a.id))).flatMap((t) => t.areas)]);
  const activeCustom = $derived(balance.config.custom.find((t) => t.areas.map((a) => a.id).join() === selected.join()));
  const activeTemplate = $derived(TEMPLATES.find((t) => t.categories.join() === selected.join())?.id ?? activeCustom?.id ?? null);
  // the areas that have a score to show: a hand-set score, or at least one measure
  const filled = $derived(selected.filter((id) => modeOf(balance.config, id) === 'manual' || calculationsOf(balance.config, id).length > 0).length);
  const slices = $derived(slicesOf());

  const applyNomieValues = () => {
    if (!plugin?.prefs) return;
    palette = paletteFrom(plugin.prefs);
    scale = plugin.prefs.fontScale || 1;
  };

  const pickTemplate = (id: string) => {
    const template = TEMPLATES.find((t) => t.id === id);
    if (template) setConfig(applyTemplate(balance.config, template));
  };

  // The template editor: a copy of the template being made or changed, saved only when it is valid
  let draft = $state<CustomTemplate | null>(null);
  let picking = $state<number | null>(null);
  const draftProblem = $derived(draft ? templateProblem(draft) : null);
  const draftIsSaved = $derived(!!draft && balance.config.custom.some((t) => t.id === draft!.id));
  const pickCustom = (template: CustomTemplate) => {
    draft = null;
    setConfig(applyCustom(balance.config, $state.snapshot(template) as CustomTemplate));
  };
  const newTemplate = () => {
    draft = blankTemplate();
    picking = null;
  };
  const editTemplate = (template: CustomTemplate) => {
    draft = structuredClone($state.snapshot(template)) as CustomTemplate;
    picking = null;
  };
  const addDraftArea = () => {
    if (!draft || draft.areas.length >= MAX_CATEGORIES) return;
    draft.areas.push(newArea(draft.areas.length));
  };
  const removeDraftArea = (index: number) => {
    if (!draft || draft.areas.length <= MIN_CATEGORIES) return;
    draft.areas.splice(index, 1);
    picking = null;
  };
  const saveDraft = () => {
    if (!draft || draftProblem) return;
    const next = saveCustomTemplate(balance.config, $state.snapshot(draft) as CustomTemplate);
    draft = null;
    setConfig(next);
  };
  const deleteDraft = () => {
    if (!draft) return;
    const next = deleteCustomTemplate(balance.config, draft.id);
    draft = null;
    setConfig(next);
  };
  const toggle = (id: CategoryId) => setConfig(toggleCategory(balance.config, id));
  const step = (delta: number) => {
    const target = selected.length + delta;
    if (target < MIN_CATEGORIES || target > MAX_CATEGORIES) return;
    // add the first category not on the wheel, or remove the last one
    if (delta > 0) {
      const next = CATEGORIES.find((c) => !selected.includes(c.id));
      if (next) toggle(next.id);
    } else {
      toggle(selected[selected.length - 1]);
    }
  };

  // The measuring editor: one calculation per tracker or word, with its range and weight
  const calcs = $derived(balance.measuring ? calculationsOf(balance.config, balance.measuring) : []);
  const editCalc = (index: number, patch: Partial<Calculation>) => {
    if (!balance.measuring) return;
    const next = { ...calcs[index], ...patch };
    balance.config = updateCalculation(balance.config, balance.measuring, index, next);
    save();
  };
  const addCalc = () => {
    if (!balance.measuring) return;
    balance.config = addCalculation(balance.config, balance.measuring);
    save();
  };
  const removeCalc = (index: number) => {
    if (!balance.measuring) return;
    balance.config = removeCalculation(balance.config, balance.measuring, index);
    save();
  };
  const MODES: Array<[Mode, string]> = [['manual', 'Set by hand'], ['calculated', 'Calculated']];
  const chooseMode = (id: CategoryId, mode: Mode) => setConfig(setMode(balance.config, id, mode));
  const manualOf = (id: CategoryId) => balance.config.manual[id] ?? 0;
  // one step is a tenth of the scale, so the score reads 0 to 10
  const stepManual = (id: CategoryId, delta: number) => setConfig(setManual(balance.config, id, manualOf(id) + delta / 10));
  const pickTracker = async (index: number) => {
    const picked = await plugin.selectTrackables('tracker', false);
    const tag = picked?.[0]?.tracker?.tag;
    if (tag) editCalc(index, { source: `#${tag}` });
  };
  // The source must be a tracker, a person or a note word, or "none"
  const sourceProblem = (source: string): string | null => {
    if (source === 'none' || source.startsWith('#') || source.startsWith('@') || source.startsWith('|')) return null;
    return 'Start with # for a tracker, @ for a person, or | for a word in your notes.';
  };

  onMount(() => {
    plugin = new NomiePlugin({
      name: 'Nomie My Balance',
      emoji: '⚖️',
      description: 'A wheel of balance with 4 to 8 areas of your life. Choose a template or your own areas, and log the balance into your timeline.',
      uses: ['createNote', 'getTrackableUsage', 'searchNotes', 'selectTrackables', 'getStorageItem', 'setStorageItem'],
      version: '2.0',
      addToCaptureMenu: true,
      addToMoreMenu: true,
      addToWidgets: true,
    });
    onPrefsChange(plugin, () => applyNomieValues());
    plugin.onRegistered(async () => {
      applyNomieValues();
      await load(plugin);
    });
    plugin.onUIOpened(async () => {
      view = 'modal';
      applyNomieValues();
      if (balance.ready) await refresh();
    });
    plugin.onWidget(async () => {
      view = 'widget';
      applyNomieValues();
      if (!balance.ready) await load(plugin);
    });
  });
</script>

<div class="root" style="--page: {palette.page}; --card: {palette.card}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --scale: {scale};">
{#if view === 'widget'}
  <Widget />
{:else}
<div class="page">
  <header class="top">
    <h1>Balance</h1>
    <button class="round" aria-label="Refresh" onclick={refresh} disabled={balance.busy}>↻</button>
  </header>

  <section class="hero">
    <Wheel slices={slices} overall={balance.overall} />
    {#if balance.busy}<p class="muted reading">Reading your Nomie data…</p>{/if}
    <ul class="legend">
      {#each slices as s (s.id)}
        <li><span class="dot" style="background: {s.color}"></span>{s.label} <strong>{Math.round(s.score * 10)}</strong></li>
      {/each}
    </ul>
    <button class="primary" onclick={logBalance} disabled={!balance.scores.length || filled === 0}>Log to timeline</button>
    {#if filled === 0}<p class="muted">Set a score or add a measure to an area below to see your balance.</p>{/if}
    {#if balance.message}<p class="notice">{balance.message}</p>{/if}
  </section>

  <h2>Template</h2>
  <div class="chips">
    {#each TEMPLATES as t (t.id)}
      <button class="chip" class:on={activeTemplate === t.id} aria-pressed={activeTemplate === t.id} onclick={() => pickTemplate(t.id)} aria-label="{t.name}: {t.description}">
        <span class="chip-title">{t.name}</span>
        <span class="chip-sub">{t.categories.length} areas</span>
      </button>
    {/each}
    {#each balance.config.custom as t (t.id)}
      <button class="chip" class:on={activeTemplate === t.id} aria-pressed={activeTemplate === t.id} onclick={() => pickCustom(t)} aria-label="{t.name}: your own template">
        <span class="chip-title">{t.name}</span>
        <span class="chip-sub">{t.areas.length} areas · yours</span>
      </button>
    {/each}
    <button class="chip new" onclick={newTemplate} aria-label="Make a new template">
      <span class="chip-title">+ New</span>
      <span class="chip-sub">Your own</span>
    </button>
  </div>
  {#if activeCustom}<button class="link" onclick={() => editTemplate(activeCustom)}>Edit "{activeCustom.name}"</button>{/if}

  {#if draft}
    <section class="panel draft">
      <label class="field">
        <span class="muted">Name</span>
        <input class="input" bind:value={draft.name} placeholder="My template" />
      </label>
      <p class="muted field-label">Areas</p>
      {#each draft.areas as area, i (area.id)}
        <div class="draft-row">
          <button class="swatch-btn" style="background: {area.color}" aria-label="Colour of {area.label}" aria-expanded={picking === i} onclick={() => (picking = picking === i ? null : i)}></button>
          <input class="input" bind:value={area.label} aria-label="Area name" placeholder="Area name" />
          <button class="small danger" onclick={() => removeDraftArea(i)} disabled={draft.areas.length <= MIN_CATEGORIES}>Remove</button>
        </div>
        {#if picking === i}
          <div class="colours">
            {#each PRESET_COLOURS as c (c)}
              <button class="dot-btn" class:picked={area.color === c} style="background: {c}" aria-label="Use this colour" onclick={() => { area.color = c; picking = null; }}></button>
            {/each}
          </div>
        {/if}
      {/each}
      <button class="ghost" onclick={addDraftArea} disabled={draft.areas.length >= MAX_CATEGORIES}>Add an area ({draft.areas.length} of {MAX_CATEGORIES})</button>
      {#if draftProblem}<p class="problem">{draftProblem}</p>{/if}
      <div class="actions">
        <button class="ghost" onclick={() => (draft = null)}>Cancel</button>
        <button class="primary" onclick={saveDraft} disabled={!!draftProblem}>Save and use</button>
      </div>
      {#if draftIsSaved}<button class="link danger" onclick={deleteDraft}>Delete template</button>{/if}
    </section>
  {/if}

  <h2>Areas on the wheel</h2>
  <section class="panel">
    <div class="counter">
      <button class="round" onclick={() => step(-1)} disabled={selected.length <= MIN_CATEGORIES} aria-label="Fewer areas">−</button>
      <span class="count">{selected.length} <span class="muted">of {MAX_CATEGORIES}</span></span>
      <button class="round" onclick={() => step(1)} disabled={selected.length >= MAX_CATEGORIES} aria-label="More areas">+</button>
    </div>
    <div class="grid">
      {#each pickable as c (c.id)}
        <button class="area" class:on={selected.includes(c.id)} onclick={() => toggle(c.id)} aria-pressed={selected.includes(c.id)}>
          <span class="swatch" style="background: {c.color}"></span>{c.label}
        </button>
      {/each}
    </div>
  </section>

  <h2>Measure</h2>
  <section class="panel list">
    {#each selected as id (id)}
      {@const area = areaOf(balance.config, id)!}
      <button class="row" onclick={() => (balance.measuring = balance.measuring === id ? null : id)}>
        <span class="swatch" style="background: {area.color}"></span>
        <span class="row-title">{area.label}</span>
        <span class="muted">{#if modeOf(balance.config, id) === 'manual'}{Math.round(manualOf(id) * 10)}/10 by hand{:else}{calculationsOf(balance.config, id).length === 0 ? 'Add a measure' : `${calculationsOf(balance.config, id).length} ${calculationsOf(balance.config, id).length === 1 ? 'measure' : 'measures'}`}{/if}</span>
      </button>
      {#if balance.measuring === id}
        <div class="editor">
          <div class="chips small-chips">
            {#each MODES as [mode, label] (mode)}
              <button class="chip-s" class:on={modeOf(balance.config, id) === mode} aria-pressed={modeOf(balance.config, id) === mode} onclick={() => chooseMode(id, mode)}>{label}</button>
            {/each}
          </div>
          {#if modeOf(balance.config, id) === 'manual'}
            <div class="counter">
              <button class="round" onclick={() => stepManual(id, -1)} disabled={manualOf(id) <= 0} aria-label="Lower score">−</button>
              <span class="count">{Math.round(manualOf(id) * 10)} <span class="muted">of 10</span></span>
              <button class="round" onclick={() => stepManual(id, 1)} disabled={manualOf(id) >= 1} aria-label="Higher score">+</button>
            </div>
          {:else}
          {#if calcs.length === 0}
            <p class="muted">No measure yet. A measure reads a tracker or a word from your notes, and turns it into a score.</p>
          {/if}
          {#each calcs as calc, i (i)}
            {@const problem = sourceProblem(calc.source) ?? problemsIn(calc)[0] ?? null}
            <div class="calc">
              <div class="calc-head">
                <input class="input" value={calc.source} placeholder="#tracker, @person, or |word" onchange={(e) => editCalc(i, { source: e.currentTarget.value.trim() || 'none' })} />
                <button class="small" onclick={() => pickTracker(i)}>Pick</button>
              </div>
              {#if problem}<p class="problem">{problem}</p>{/if}
              <div class="chips small-chips">
                {#each STATISTICS as [id2, label] (id2)}
                  <button class="chip-s" class:on={calc.statistic === id2} onclick={() => editCalc(i, { statistic: id2 })}>{label}</button>
                {/each}
                {#each DAYS as d (d)}
                  <button class="chip-s" class:on={calc.days === d} onclick={() => editCalc(i, { days: d })}>{d} d</button>
                {/each}
              </div>
              <div class="range">
                <label>Min <input class="num" inputmode="decimal" value={calc.min} onchange={(e) => editCalc(i, { min: Number(e.currentTarget.value) })} /></label>
                <label>Max <input class="num" inputmode="decimal" value={calc.max} onchange={(e) => editCalc(i, { max: Number(e.currentTarget.value) })} /></label>
                <label>Weight <input class="num" inputmode="decimal" value={calc.weight} onchange={(e) => editCalc(i, { weight: Number(e.currentTarget.value) })} /></label>
                <label class="rev"><input type="checkbox" checked={calc.reverse} onchange={(e) => editCalc(i, { reverse: e.currentTarget.checked })} /> Reverse</label>
              </div>
              <button class="link danger" onclick={() => removeCalc(i)}>Remove</button>
            </div>
          {/each}
          <button class="ghost" onclick={addCalc}>Add a measure</button>
          {/if}
        </div>
      {/if}
    {/each}
  </section>
</div>
{/if}
</div>

<style>
  .root { min-height: 100vh; background: var(--page); }
  .page { box-sizing: border-box; min-height: 100vh; padding: 16px; background: var(--page); color: var(--text); font-size: calc(16px * var(--scale)); line-height: 1.4; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  h1 { margin: 0; font-size: calc(28px * var(--scale)); font-weight: 700; }
  h2 { margin: 20px 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .muted { color: var(--muted); }
  .hero { padding: 16px; border-radius: 22px; background: var(--card); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); text-align: center; }
  .legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; margin: 12px 0; padding: 0; list-style: none; font-size: calc(13px * var(--scale)); color: var(--muted); }
  .legend li { display: inline-flex; align-items: center; gap: 4px; }
  .legend strong { color: var(--text); }
  .dot, .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  .swatch { width: 14px; height: 14px; border-radius: 4px; margin-right: 0; }
  /* the padding keeps the outline of the selected chip inside the scrolling row */
  .chips { display: flex; gap: 8px; overflow-x: auto; padding: 4px; margin: -4px -4px 0; }
  .chip { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-start; padding: 10px 14px; border: 0; border-radius: 14px; background: var(--card); color: var(--text); text-align: left; cursor: pointer; }
  .chip-title { font-weight: 600; }
  .chip-sub { font-size: calc(12px * var(--scale)); color: var(--muted); }
  .panel { padding: 14px; border-radius: 16px; background: var(--card); }
  .list { padding: 4px 14px; }
  .counter { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; }
  .count { font-size: calc(22px * var(--scale)); font-weight: 700; }
  .round { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--fill); color: var(--text); font-size: calc(20px * var(--scale)); cursor: pointer; }
  .round:disabled { opacity: 0.35; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .area { display: flex; align-items: center; gap: 8px; padding: 10px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; cursor: pointer; }
  .area.on { background: var(--tint-soft); color: var(--tint); font-weight: 600; }
  .row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 0; border: 0; border-top: 1px solid var(--line); background: transparent; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .row:first-child { border-top: 0; }
  .row-title { flex: 1; font-weight: 600; }
  .editor { padding: 0 0 12px; }
  .calc { padding: 10px; margin-bottom: 10px; border-radius: 12px; background: var(--fill); }
  .calc-head { display: flex; gap: 8px; }
  .input, .num { padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); color: var(--text); font: inherit; }
  .input { flex: 1; min-width: 0; }
  .num { width: 64px; }
  .small-chips { margin: 8px 0; }
  .chip-s { padding: 6px 10px; border: 0; border-radius: 9px; background: var(--card); color: var(--text); font-size: calc(13px * var(--scale)); cursor: pointer; }
  .chip-s.on { background: var(--tint); color: var(--on-tint); }
  .range { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: calc(13px * var(--scale)); }
  .range label { display: flex; align-items: center; gap: 4px; }
  .rev { gap: 6px; }
  .small { padding: 8px 12px; border: 0; border-radius: 10px; background: var(--card); color: var(--tint); font: inherit; cursor: pointer; }
  .primary, .ghost { width: 100%; margin-top: 12px; padding: 12px; border: 0; border-radius: 12px; font: inherit; font-weight: 600; cursor: pointer; }
  .primary { background: var(--tint); color: var(--on-tint); }
  .primary:disabled { opacity: 0.4; }
  .ghost { background: var(--fill); color: var(--text); }
  .link { border: 0; background: transparent; font: inherit; padding: 6px 0; cursor: pointer; color: var(--tint); }
  .danger { color: #D70015; }
  .problem { margin: 6px 0 0; font-size: calc(13px * var(--scale)); color: #D70015; }
  .reading { margin: 6px 0 0; }
  .chip.on { background: var(--tint-soft); outline: 2px solid var(--tint); }
  .chip.new { background: var(--fill); }
  .draft { margin-top: 10px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
  .field-label { margin: 6px 0; font-size: calc(13px * var(--scale)); }
  .draft-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .draft-row .input { flex: 1; min-width: 0; }
  .swatch-btn { flex-shrink: 0; width: 32px; height: 32px; border: 2px solid var(--card); border-radius: 50%; box-shadow: 0 0 0 1px var(--line); cursor: pointer; }
  .colours { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 10px; padding: 10px; border-radius: 12px; background: var(--fill); }
  .dot-btn { width: 28px; height: 28px; border: 0; border-radius: 50%; cursor: pointer; }
  .dot-btn.picked { outline: 2px solid var(--text); outline-offset: 2px; }
  .actions { display: flex; gap: 8px; }
  .actions .ghost, .actions .primary { margin-top: 8px; }
  .notice { margin: 10px 0 0; padding: 10px 12px; border-radius: 12px; background: var(--tint-soft); color: var(--tint); font-size: calc(14px * var(--scale)); }
</style>
