<script lang="ts">
    import {tick} from "svelte";
    import Icon from "./Icon.svelte";
    import {escapeLayer} from "../../../integration/escape";
    import {portal} from "../../../integration/util";
    import {convertToSpacedString} from "../../../theme/theme_config";

    let {
        value,
        options,
        onchange,
        placeholder = "Select",
        spaced = true,
        disabled = false,
        align = "right"
    } = $props<{
        value: string;
        options: string[];
        onchange?: (value: string) => void;
        placeholder?: string;
        spaced?: boolean;
        disabled?: boolean;
        align?: "left" | "right";
    }>();

    let expanded = $state(false);
    let button: HTMLButtonElement | undefined = $state();
    let menuStyle = $state("");

    const layer = escapeLayer(() => expanded = false);
    $effect(() => layer.setOpen(expanded));

    function label(option: string) {
        return spaced ? convertToSpacedString(option) : option;
    }

    async function toggle() {
        if (disabled) return;
        expanded = !expanded;
        if (expanded) {
            await tick();
            positionMenu();
        }
    }

    function positionMenu() {
        if (!button) return;
        const bounds = button.getBoundingClientRect();
        const width = Math.max(bounds.width, 150);
        const left = align === "right" ? bounds.right - width : bounds.left;
        const spaceBelow = window.innerHeight - bounds.bottom;
        const top = spaceBelow < 220 ? Math.max(8, bounds.top - Math.min(240, options.length * 32 + 12)) : bounds.bottom + 5;
        menuStyle = `left: ${Math.max(8, left)}px; top: ${top}px; width: ${width}px;`;
    }

    function select(option: string) {
        expanded = false;
        if (option === value) return;
        onchange?.(option);
    }

    function onWindowClick(event: MouseEvent) {
        if (!expanded) return;
        const target = event.target as Node;
        if (button?.contains(target)) return;
        if ((target as HTMLElement).closest?.(".claude-select-menu")) return;
        expanded = false;
    }
</script>

<svelte:window onclick={onWindowClick} onresize={() => expanded && positionMenu()} onscroll={() => expanded = false}/>

<button
        type="button"
        class="claude-select"
        class:open={expanded}
        bind:this={button}
        onclick={toggle}
        {disabled}
>
    <span class="value" class:placeholder={!value}>{value ? label(value) : placeholder}</span>
    <Icon name="chevron-down" size={13}/>
</button>

{#if expanded}
    <div class="claude-select-menu" style={menuStyle} use:portal>
        {#each options as option (option)}
            <button
                    type="button"
                    class="option"
                    class:selected={option === value}
                    onclick={() => select(option)}
            >
                <span>{label(option)}</span>
                {#if option === value}
                    <Icon name="check" size={13}/>
                {/if}
            </button>
        {/each}
    </div>
{/if}

<style lang="scss">
  .claude-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 120px;
    max-width: 230px;
    height: 33px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-soft);
    font: inherit;
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color .16s ease, background-color .16s ease;

    &:hover:not(:disabled), &.open {
      border-color: var(--claude-accent-line);
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
      color: var(--claude-text);
    }

    &:disabled {
      opacity: .5;
      cursor: default;
    }

    .value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .placeholder {
      color: var(--claude-text-muted);
    }
  }
  .claude-select-menu {
    position: fixed;
    z-index: 2000000000;
    max-height: 240px;
    overflow-y: auto;
    padding: 5px;
    border-radius: 8px;
    border: 1px solid var(--claude-border-strong);
    background: color-mix(in srgb, var(--claude-background) 94%, black);
    box-shadow: 0 16px 40px rgba(0, 0, 0, .55);
    backdrop-filter: blur(18px);

    .option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      min-height: 31px;
      padding: 0 10px;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: var(--claude-text-dim);
      font: inherit;
      font-size: 11.5px;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: color-mix(in srgb, var(--claude-text) 6%, transparent);
        color: var(--claude-text);
      }

      &.selected {
        color: var(--claude-accent);
        background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      }
    }
  }
</style>
