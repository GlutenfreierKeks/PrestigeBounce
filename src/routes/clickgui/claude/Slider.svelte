<script lang="ts">
    let {
        value,
        min,
        max,
        step = 1,
        suffix = "",
        integer = false,
        decimals = 1,
        disabled = false,
        oninput,
        onchange
    } = $props<{
        value: number;
        min: number;
        max: number;
        step?: number;
        suffix?: string;
        integer?: boolean;
        decimals?: number;
        disabled?: boolean;
        oninput?: (value: number) => void;
        onchange?: (value: number) => void;
    }>();

    let track: HTMLInputElement | undefined = $state();

    let safeMin = $derived(Math.min(min, value));
    let safeMax = $derived(Math.max(max, value));
    let percent = $derived(safeMax === safeMin ? 0 : ((value - safeMin) / (safeMax - safeMin)) * 100);
    let shown = $derived(integer ? Math.round(value).toString() : value.toFixed(decimals).replace(/\.0+$/, ""));

    function handleInput(event: Event) {
        const next = parseFloat((event.currentTarget as HTMLInputElement).value);
        if (Number.isNaN(next)) return;
        oninput?.(next);
    }

    function handleChange(event: Event) {
        const next = parseFloat((event.currentTarget as HTMLInputElement).value);
        if (Number.isNaN(next)) return;
        onchange?.(next);
    }

    function commitText(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const parsed = parseFloat(input.value);
        if (Number.isNaN(parsed)) {
            input.value = shown;
            return;
        }
        const clamped = Math.min(safeMax, Math.max(safeMin, parsed));
        oninput?.(clamped);
        onchange?.(clamped);
    }
</script>

<div class="slider-control" class:disabled>
    <div class="track-wrapper">
        <div class="fill" style={`width: ${percent}%;`}></div>
        <input
                bind:this={track}
                type="range"
                {min}
                {max}
                {step}
                {value}
                {disabled}
                aria-label="Value"
                oninput={handleInput}
                onchange={handleChange}
        />
    </div>
    <label class="value-chip">
        <input
                type="text"
                value={shown}
                {disabled}
                onchange={commitText}
                onkeydown={(event) => {
                    if (event.key === "Enter") (event.currentTarget as HTMLInputElement).blur();
                }}
                aria-label="Value"
        />
        {#if suffix}<span class="suffix">{suffix}</span>{/if}
    </label>
</div>

<style lang="scss">
  .slider-control {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 230px;

    &.disabled {
      opacity: .5;
      pointer-events: none;
    }
  }

  .track-wrapper {
    position: relative;
    width: 152px;
    height: 18px;
    display: flex;
    align-items: center;
  }

  .fill {
    position: absolute;
    left: 0;
    height: 3px;
    border-radius: 999px;
    background: var(--claude-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--claude-accent) 45%, transparent);
    pointer-events: none;
  }

  input[type="range"] {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 3px;
    margin: 0;
    appearance: none;
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-text) 13%, transparent);
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      border: 2px solid var(--claude-accent);
      background: #ffffff;
      box-shadow: 0 0 9px color-mix(in srgb, var(--claude-accent) 65%, transparent);
      cursor: grab;
    }

    &:active::-webkit-slider-thumb {
      cursor: grabbing;
      transform: scale(1.1);
    }

    &::-moz-range-thumb {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 2px solid var(--claude-accent);
      background: #ffffff;
    }
  }

  .value-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 27px;
    padding: 0 8px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    border: 1px solid var(--claude-border);
    color: var(--claude-text-dim);
    font-family: "Inter", sans-serif;
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;

    input {
      width: 42px;
      border: none;
      background: transparent;
      color: var(--claude-text-soft);
      font: inherit;
      text-align: right;
      padding: 0;
      outline: none;
    }

    .suffix {
      color: var(--claude-text-muted);
    }
  }
</style>
