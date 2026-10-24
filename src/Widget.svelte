<script lang="ts">
  import { balance, slicesOf } from './balance.svelte';

  const slices = $derived(slicesOf());
</script>

<!-- The widget as My Balance v1 drew it: one tall coloured bar per area, rising from the bottom. The label runs up the bar, and the score sits above it. -->
<div class="widget">
  <header class="head">
    <span class="title">⚖️ Balance</span>
    <strong class="overall">{balance.overall.toFixed(1)}<small>/ 10</small></strong>
  </header>

  <div class="bars" role="img" aria-label="Balance per area, overall {balance.overall.toFixed(1)} out of 10">
    {#each slices as s (s.id)}
      <div class="col">
        <span class="pct">{Math.round(s.score * 100)}%</span>
        <div class="track">
          <div class="bar" style="height: {Math.max(s.score * 100, 3)}%; background: linear-gradient(to top, {s.color}, {s.color}99);"></div>
          <span class="label">{s.label}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* the text scales with the widget's own size, so a large iframe shows large labels */
  .widget {
    container-type: size;
    box-sizing: border-box;
    height: 100vh;
    padding: 8px 10px 8px;
    display: flex;
    flex-direction: column;
    /* the widget card is the card colour of the app, not the page colour */
    background: var(--card);
    color: var(--text);
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .title {
    font-size: calc(clamp(11px, 2.4cqw, 22px) * var(--scale));
    font-weight: 600;
    color: var(--muted);
  }
  .overall {
    font-size: calc(clamp(15px, 3.6cqw, 36px) * var(--scale));
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .overall small {
    margin-left: 2px;
    font-size: calc(11px * var(--scale));
    font-weight: 500;
    color: var(--muted);
  }
  .bars {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 6px;
  }
  .col {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pct {
    margin-bottom: 3px;
    font-size: calc(clamp(9px, 2cqw, 20px) * var(--scale));
    font-weight: 600;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .track {
    position: relative;
    flex: 1;
    width: 100%;
    min-height: 0;
    border-radius: 10px;
    background: var(--fill);
    overflow: hidden;
  }
  .bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px 10px 0 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
    transition: height 0.4s ease-in-out;
  }
  .label {
    position: absolute;
    left: 50%;
    bottom: 6px;
    transform: translateX(-50%) rotate(180deg);
    writing-mode: vertical-rl;
    /* the widest label fits the column, and the longest the height of the bar */
    font-size: calc(clamp(10px, min(3.2cqw, 10cqh), 28px) * var(--scale));
    font-weight: 600;
    color: var(--text);
    text-shadow: 0 0 3px var(--page);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .bar {
      transition: none;
    }
  }
</style>
