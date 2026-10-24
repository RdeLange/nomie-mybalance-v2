<script lang="ts">
  import { CENTRE, HUB, RADIUS, SIZE, labelPosition, scoreRadius, sectorAngles, sectorPath } from './geometry';

  type Slice = { id: string; label: string; color: string; score: number };
  let { slices, overall, compact = false }: { slices: Slice[]; overall: number; compact?: boolean } = $props();

  const n = $derived(slices.length);
  // a label sits to the left or right of the wheel depending on its side, so it reads well
  const anchorFor = (i: number) => {
    const { middle } = sectorAngles(i, n);
    if (middle > 170 && middle < 190) return 'middle';
    return middle > 180 ? 'end' : 'start';
  };
</script>

<svg viewBox="0 0 {SIZE} {SIZE}" class="wheel" class:compact role="img" aria-label="Wheel of balance, overall {overall} out of 10">
  <defs>
    {#each slices as s (s.id)}
      <radialGradient id="grad-{s.id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color={s.color} stop-opacity="0.55" />
        <stop offset="100%" stop-color={s.color} stop-opacity="1" />
      </radialGradient>
    {/each}
  </defs>

  <!-- the track: the rim, and rings at a quarter, a half and three quarters -->
  <circle cx={CENTRE} cy={CENTRE} r={RADIUS} class="track" />
  {#each [0.25, 0.5, 0.75] as ring (ring)}
    <circle cx={CENTRE} cy={CENTRE} r={scoreRadius(ring)} class="ring" />
  {/each}

  {#each slices as s, i (s.id)}
    <g class="sector" style="transform: scale({scoreRadius(s.score) / RADIUS}); transform-origin: {CENTRE}px {CENTRE}px;">
      <path d={sectorPath(i, n)} fill="url(#grad-{s.id})" class="sector-shape" />
    </g>
  {/each}

  <circle cx={CENTRE} cy={CENTRE} r={HUB} class="hub" />
  <text x={CENTRE} y={CENTRE + 2} text-anchor="middle" class="overall">{overall.toFixed(1)}</text>
  <text x={CENTRE} y={CENTRE + 18} text-anchor="middle" class="overall-sub">of 10</text>

  {#if !compact}
    {#each slices as s, i (s.id)}
      {@const at = labelPosition(i, n)}
      <text x={at.x} y={at.y} text-anchor={anchorFor(i)} dominant-baseline="middle" class="label">{s.label}</text>
    {/each}
  {/if}
</svg>

<style>
  .wheel {
    display: block;
    width: 100%;
    max-width: 360px;
    height: auto;
    margin: 0 auto;
    overflow: visible;
  }
  .track {
    fill: var(--line);
    opacity: 0.35;
  }
  .ring {
    fill: none;
    stroke: var(--card);
    stroke-width: 1.5;
    opacity: 0.8;
  }
  .sector {
    transform-box: view-box;
    transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .sector-shape {
    stroke: var(--card);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .hub {
    fill: var(--card);
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
  }
  .overall {
    font-family: ui-rounded, system-ui, sans-serif;
    font-size: 24px;
    font-weight: 700;
    fill: var(--text);
  }
  .overall-sub {
    font-size: 11px;
    fill: var(--muted);
  }
  .label {
    font-family: system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    fill: var(--text);
  }
  .compact .label {
    display: none;
  }
</style>
