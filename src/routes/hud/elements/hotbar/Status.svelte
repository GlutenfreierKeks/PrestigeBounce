<script lang="ts">
    export let max: number;
    export let value: number;
    export let color: string;
    export let alignRight: boolean;
    export let label: string | null = null;
    export let icon: string | null = null;
</script>

<div class="progress" class:align-right={alignRight}>
    {#if label}
        <div class="label">{label}</div>
    {/if}
    {#if icon}
        <img class="icon" src="img/hud/hotbar/icon-{icon}.svg" alt={icon}>
    {/if}
    <div
            class:align-right={alignRight}
            class="progress-bar"
            style="width: {Math.floor(
            (value / max) * 100,
        )}%; background-color: {color};"
    ></div>
</div>

<style lang="scss">

  .label {
    z-index: 2;
    color: var(--hud-text);
    position: absolute;
    font-size: 9px;
    font-weight: 700;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    text-shadow: 0 1px 3px rgba(0, 0, 0, .6);
    font-variant-numeric: tabular-nums;
  }

  .icon {
    z-index: 2;
    position: absolute;
    left: 5px;
    top: 50%;
    width: 10px;
    height: 10px;
    transform: translateY(-50%);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .5));
  }

  .progress {
    position: relative;
    height: 13px;
    border-radius: 4px;
    border: 1px solid color-mix(in srgb, var(--hud-text) 7%, transparent);
    background: color-mix(in srgb, var(--claude-background) 78%, transparent);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, .28);
    overflow: hidden;

    &.align-right {
      .label {
        left: 6px;
        right: unset;
      }

      .icon {
        right: 5px;
        left: unset;
      }
    }
  }

  .progress-bar {
    height: 100%;
    border-radius: 3px;
    will-change: width;
    transition: ease width 0.2s;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16), 0 0 9px color-mix(in srgb, currentColor 20%, transparent);
    background-image: linear-gradient(180deg, rgba(255, 255, 255, .14), transparent 60%);

    &.align-right {
      margin-left: auto;
    }
  }
</style>
