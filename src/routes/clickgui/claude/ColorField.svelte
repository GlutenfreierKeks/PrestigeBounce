<script lang="ts">
    import {tick} from "svelte";
    import Icon from "./Icon.svelte";
    import {escapeLayer} from "../../../integration/escape";
    import {portal} from "../../../integration/util";
    import {intToRgba, rgbaToHex, rgbaToInt} from "../../../integration/util";

    let {
        value,
        oninput,
        onchange
    } = $props<{
        value: number;
        oninput?: (value: number) => void;
        onchange?: (value: number) => void;
    }>();

    let expanded = $state(false);
    let swatch: HTMLButtonElement | undefined = $state();
    let popoverStyle = $state("");

    let rgba = $derived(intToRgba(value));
    let alpha = $derived(rgba[3]);
    let hex = $derived(rgbaToHex(rgba));
    let baseHex = $derived(`#${rgba[0].toString(16).padStart(2, "0")}${rgba[1].toString(16).padStart(2, "0")}${rgba[2].toString(16).padStart(2, "0")}`);

    const layer = escapeLayer(() => expanded = false);
    $effect(() => layer.setOpen(expanded));

    async function toggle() {
        expanded = !expanded;
        if (!expanded) return;
        await tick();
        position();
    }

    function position() {
        if (!swatch) return;
        const bounds = swatch.getBoundingClientRect();
        popoverStyle = `left: ${Math.max(10, bounds.right - 224)}px; top: ${bounds.bottom + 8}px;`;
    }

    function setRgb(hexColor: string) {
        const clean = hexColor.replace("#", "");
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        const next = rgbaToInt([r, g, b, alpha]);
        oninput?.(next);
        onchange?.(next);
    }

    function setAlpha(nextAlpha: number) {
        const next = rgbaToInt([rgba[0], rgba[1], rgba[2], nextAlpha]);
        oninput?.(next);
        onchange?.(next);
    }

    function setHex(text: string) {
        const match = text.trim().match(/^#?([0-9a-f]{6})([0-9a-f]{2})?$/i);
        if (!match) return;
        const [r, g, b] = [match[1].substring(0, 2), match[1].substring(2, 4), match[1].substring(4, 6)]
            .map(part => parseInt(part, 16));
        const nextAlpha = match[2] ? parseInt(match[2], 16) : alpha;
        const next = rgbaToInt([r, g, b, nextAlpha]);
        oninput?.(next);
        onchange?.(next);
    }

    function onWindowClick(event: MouseEvent) {
        if (!expanded) return;
        const target = event.target as HTMLElement;
        if (swatch?.contains(target) || target.closest?.(".claude-color-popover")) return;
        expanded = false;
    }
</script>

<svelte:window onclick={onWindowClick} onresize={() => expanded && position()}/>

<div class="color-field">
    <button
            type="button"
            class="swatch"
            bind:this={swatch}
            onclick={toggle}
            title="Pick a colour"
            aria-label="Pick a colour"
    >
        <span class="checker">
            <span class="fill" style={`background-color: ${hex};`}></span>
        </span>
        <Icon name="chevron-down" size={11}/>
    </button>

    {#if expanded}
        <div class="claude-color-popover" style={popoverStyle} use:portal>
            <div class="preview-row">
                <span class="preview" style={`background-color: ${hex};`}></span>
                <span class="hex">{hex.toUpperCase()}</span>
            </div>

            <label class="native-color">
                <input type="color" value={baseHex} oninput={(event) => setRgb((event.currentTarget as HTMLInputElement).value)}/>
                <span>Change colour</span>
            </label>

            <label class="alpha-row">
                <span>Opacity</span>
                <input
                        type="range"
                        min="0"
                        max="255"
                        value={alpha}
                        oninput={(event) => setAlpha(parseInt((event.currentTarget as HTMLInputElement).value))}
                />
                <span class="alpha-value">{Math.round((alpha / 255) * 100)}%</span>
            </label>

            <label class="hex-input">
                <span>Hex</span>
                <input type="text" value={hex} onchange={(event) => setHex((event.currentTarget as HTMLInputElement).value)}/>
            </label>
        </div>
    {/if}
</div>

<style lang="scss">
  .color-field {
    display: flex;
    align-items: center;
  }

  .swatch {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 29px;
    padding: 0 7px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-muted);
    cursor: pointer;

    &:hover {
      border-color: var(--claude-accent-line);
    }
  }

  .checker {
    position: relative;
    display: block;
    width: 21px;
    height: 19px;
    border-radius: 3px;
    overflow: hidden;
    background-image: linear-gradient(45deg, #37394b 25%, transparent 25%),
    linear-gradient(-45deg, #37394b 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #37394b 75%),
    linear-gradient(-45deg, transparent 75%, #37394b 75%);
    background-size: 6px 6px;
    background-position: 0 0, 0 3px, 3px -3px, -3px 0;

    .fill {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
  .claude-color-popover {
    position: fixed;
    z-index: 2000000000;
    width: 224px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--claude-border-strong);
    background: color-mix(in srgb, var(--claude-background) 96%, black);
    box-shadow: 0 18px 44px rgba(0, 0, 0, .6);
    display: grid;
    gap: 11px;

    .preview-row {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .preview {
      width: 28px;
      height: 24px;
      border-radius: 5px;
      border: 1px solid var(--claude-border);
    }

    .hex {
      color: var(--claude-text-soft);
      font-family: monospace;
      font-size: 11px;
      letter-spacing: .4px;
    }

    .native-color {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 8px;
      border-radius: 6px;
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      border: 1px solid var(--claude-border);
      color: var(--claude-text-dim);
      font-size: 10.5px;
      cursor: pointer;

      input[type="color"] {
        width: 22px;
        height: 20px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
      }

      &:hover {
        color: var(--claude-text);
      }
    }

    .alpha-row {
      display: grid;
      grid-template-columns: 48px 1fr 32px;
      align-items: center;
      gap: 7px;
      color: var(--claude-text-muted);
      font-size: 10px;

      input[type="range"] {
        width: 100%;
        height: 3px;
        appearance: none;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, var(--claude-accent));
        cursor: pointer;

        &::-webkit-slider-thumb {
          appearance: none;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid var(--claude-accent);
        }
      }

      .alpha-value {
        text-align: right;
        color: var(--claude-text-dim);
        font-variant-numeric: tabular-nums;
      }
    }

    .hex-input {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--claude-text-muted);
      font-size: 10px;

      input {
        flex: 1;
        height: 25px;
        padding: 0 7px;
        border-radius: 5px;
        border: 1px solid var(--claude-border);
        background: color-mix(in srgb, var(--claude-text) 3%, transparent);
        color: var(--claude-text-soft);
        font-family: monospace;
        font-size: 10.5px;
      }
    }
  }
</style>
