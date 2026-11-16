<script lang="ts">
    import {fly} from "svelte/transition";
</script>

<div class="option-bar" transition:fly|global={{duration: 700, x: 1000}}>
    <slot />
</div>

<style lang="scss">

    .option-bar {
      background-color: var(--menu-option-bar-background-color);
      border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
      padding: 8px 10px;
      display: flex;
      border-radius: 11px;
      align-items: center;
      column-gap: 10px;
      margin-bottom: 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .025);
      backdrop-filter: blur(12px);
    }
</style>
