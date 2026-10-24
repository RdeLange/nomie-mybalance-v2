<script lang="ts">
  import { balance, slicesOf } from './balance.svelte';

  const slices = $derived(slicesOf());
</script>

<!-- The widget as My Balance v1 drew it: one coloured bar per area, rising from the bottom. The bars have a soft gradient, rounded tops, and the score on top. -->
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
        </div>
        <span class="label">{s.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .widget {
    box-sizing: border-box;
    height: 100vh;
    padding: 12px 12px 10px;
    display: flex;
    flex-direction: column;
    background: var(--page);
    color: var(--text);
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .title {
    font-size: calc(13px * var(--scale));
    font-weight: 600;
    color: var(--muted);
  }
  .overall {
    font-size: calc(20px * var(--scale));
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .overall small {
    margin-left: 2px;
    font-size: calc(12px * var(--scale));
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
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pct {
    margin-bottom: 4px;
    font-size: calc(11px * var(--scale));
    font-weight: 600;
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
    margin-top: 6px;
    height: 58px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: calc(11px * var(--scale));
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .bar {
      transition: none;
    }
  }
</style>
