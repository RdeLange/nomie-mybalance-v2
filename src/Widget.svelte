<script lang="ts">
  import Wheel from './Wheel.svelte';
  import { balance, slicesOf } from './balance.svelte';
</script>

<div class="widget">
  <Wheel slices={slicesOf()} overall={balance.overall} compact />
  <p class="caption">⚖️ Balance {balance.overall.toFixed(1)} / 10</p>
</div>

<style>
  .widget {
    box-sizing: border-box;
    height: 100vh;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--page);
    color: var(--text);
  }
  .widget :global(.wheel) {
    max-height: 70%;
  }
  .caption {
    margin: 4px 0 0;
    font-size: calc(13px * var(--scale));
    font-weight: 600;
    color: var(--muted);
  }
</style>
