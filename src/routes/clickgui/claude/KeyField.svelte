<script lang="ts">
    import {onDestroy} from "svelte";
    import Icon from "./Icon.svelte";
    import {escapeLayer} from "../../../integration/escape";
    import {waitMatches} from "../../../integration/ws";
    import {isClickGuiScreen, UNKNOWN_KEY} from "../../../util/utils";
    import type {KeyboardKeyEvent, MouseButtonEvent} from "../../../integration/events";
    import {formatKey} from "./format";

    let {
        value = $bindable(),
        onchange
    } = $props<{
        value: string;
        onchange?: () => void;
    }>();

    let binding = $state(false);
    let hovered = $state(false);

    const layer = escapeLayer(cancel);
    $effect(() => layer.setOpen(binding));

    function cancel() {
        binding = false;
    }

    function commit(key: string) {
        value = key;
        binding = false;
        onchange?.();
    }

    const nextEvent = () => Promise.any([
        waitMatches("mouseButton", (event: MouseButtonEvent) =>
            isClickGuiScreen(event.screen) && !(event.button === 1 && hovered)
        ),
        waitMatches("keyboardKey", (event: KeyboardKeyEvent) =>
            isClickGuiScreen(event.screen)
        )
    ]);

    async function startBinding() {
        if (binding) {
            cancel();
            return;
        }
        binding = true;
        const event = await nextEvent();
        if (!binding) return;
        if ("keyCode" in event && event.keyCode === 27) {
            cancel();
            return;
        }
        commit(event.key);
    }

    onDestroy(() => binding = false);
</script>

<button
        type="button"
        class="key-field"
        class:recording={binding}
        onmouseenter={() => hovered = true}
        onmouseleave={() => hovered = false}
        onclick={startBinding}
        title="Click to change the key"
>
    <Icon name="keybinds" size={13}/>
    <span>{binding ? "Press a key…" : formatKey(value)}</span>
    {#if value !== UNKNOWN_KEY}
        <span
                class="clear"
                role="button"
                tabindex="0"
                title="Clear key"
                onclick={(event) => {
                    event.stopPropagation();
                    commit(UNKNOWN_KEY);
                }}
                onkeydown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                        commit(UNKNOWN_KEY);
                    }
                }}
        >
            <Icon name="x" size={10}/>
        </span>
    {/if}
</button>

<style lang="scss">
  .key-field {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 96px;
    height: 29px;
    padding: 0 9px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-soft);
    font: inherit;
    font-size: 10.5px;
    font-weight: 550;
    letter-spacing: .3px;
    cursor: pointer;

    &:hover {
      border-color: var(--claude-accent-line);
      color: var(--claude-text);
    }

    &.recording {
      border-color: var(--claude-accent);
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
    }

    .clear {
      display: grid;
      place-items: center;
      margin-left: auto;
      color: var(--claude-text-muted);
      cursor: pointer;

      &:hover {
        color: #ff8d96;
      }
    }
  }
</style>
