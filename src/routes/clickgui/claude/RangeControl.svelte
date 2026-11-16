<script lang="ts">
    import "nouislider/dist/nouislider.css";
    import {onMount} from "svelte";
    import noUiSlider, {type API} from "nouislider";

    let {
        from,
        to,
        min,
        max,
        step = 0.01,
        suffix = "",
        decimals = 1,
        oninput,
        onchange,
        disabled = false
    } = $props<{
        from: number;
        to: number;
        min: number;
        max: number;
        step?: number;
        suffix?: string;
        decimals?: number;
        oninput?: (from: number, to: number) => void;
        onchange?: (from: number, to: number) => void;
        disabled?: boolean;
    }>();

    let slider: HTMLElement;
    let api: API;

    let safeMin = Math.min(min, from, to);
    let safeMax = Math.max(max, from, to);

    const shown = (value: number) => value.toFixed(decimals).replace(/\.0+$/, "");

    onMount(() => {
        api = noUiSlider.create(slider, {
            start: [from, to],
            connect: true,
            range: {min: safeMin, max: safeMax},
            step,
            format: {
                to: (value) => parseFloat(value.toFixed(4)),
                from: (value) => parseFloat(value)
            }
        });

        if (disabled) {
            api.disable();
        }

        api.on("update", (values) => {
            oninput?.(parseFloat(values[0].toString()), parseFloat(values[1].toString()));
        });

        api.on("set", (values) => {
            onchange?.(parseFloat(values[0].toString()), parseFloat(values[1].toString()));
        });
    });
</script>

<div class="range-control">
    <div class="slider" bind:this={slider}></div>
    <div class="value-chip">
        <span>{shown(from)}</span>
        <span class="dash">–</span>
        <span>{shown(to)}</span>
        {#if suffix}<span class="suffix">{suffix}</span>{/if}
    </div>
</div>

<style lang="scss">
  .range-control {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 255px;
  }

  .slider {
    width: 155px;
  }

  .value-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 27px;
    padding: 0 9px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    border: 1px solid var(--claude-border);
    color: var(--claude-text-soft);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .dash {
    color: var(--claude-text-muted);
  }

  .suffix {
    color: var(--claude-text-muted);
    margin-left: 2px;
  }

  :global(.range-control .noUi-target) {
    margin: 0;
    height: 3px;
    border: none;
    box-shadow: none;
    background: color-mix(in srgb, var(--claude-text) 13%, transparent);
  }

  :global(.range-control .noUi-connect) {
    background: var(--claude-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--claude-accent) 45%, transparent);
  }

  :global(.range-control .noUi-handle) {
    width: 11px !important;
    height: 11px !important;
    top: -4px !important;
    right: -5.5px !important;
    border: 2px solid var(--claude-accent);
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 9px color-mix(in srgb, var(--claude-accent) 65%, transparent);
    cursor: grab;
  }

  :global(.range-control .noUi-handle::before),
  :global(.range-control .noUi-handle::after) {
    display: none;
  }
</style>
