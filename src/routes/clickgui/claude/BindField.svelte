<script lang="ts">
    import {onDestroy} from "svelte";
    import Icon from "./Icon.svelte";
    import {escapeLayer} from "../../../integration/escape";
    import {waitMatches} from "../../../integration/ws";
    import {isClickGuiScreen, UNKNOWN_KEY} from "../../../util/utils";
    import type {BindAction, BindModifier, InputBind} from "../../../integration/types";
    import type {KeyboardKeyEvent, MouseButtonEvent} from "../../../integration/events";
    import {formatKey} from "./format";

    let {
        value = $bindable(),
        onchange,
        compact = false
    } = $props<{
        value: InputBind;
        onchange?: () => void;
        compact?: boolean;
    }>();

    let binding = $state(false);
    let hovered = $state(false);
    let addedModifiers = $state<BindModifier[]>([]);
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const KEY_TOKEN_TO_MODIFIERS: Record<number, BindModifier> = {
        1073742049: "Shift", 1073742053: "Shift",
        1073742048: "Control", 1073742052: "Control",
        1073742050: "Alt", 1073742054: "Alt",
        1073742051: "Super", 1073742055: "Super"
    };

    const layer = escapeLayer(cancel);
    $effect(() => layer.setOpen(binding));

    onDestroy(() => {
        if (timeout !== undefined) clearTimeout(timeout);
    });

    function cancel() {
        binding = false;
        addedModifiers = [];
        if (timeout !== undefined) clearTimeout(timeout);
    }

    function commit(key: string, action = value.action) {
        value = {
            boundKey: key,
            action,
            modifiers: key === UNKNOWN_KEY ? [] : [...addedModifiers]
        };
        binding = false;
        addedModifiers = [];
        if (timeout !== undefined) clearTimeout(timeout);
        onchange?.();
    }

    function setAction(action: BindAction) {
        if (value.action === action) return;
        value = {...value, action};
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
        addedModifiers = [];

        let event = await nextEvent();
        if (!binding) return;

        while (true) {
            if ("keyCode" in event) {
                if (event.keyCode === 27) {
                    cancel();
                    return;
                }

                const modifier = KEY_TOKEN_TO_MODIFIERS[event.keyCode];
                if (modifier) {
                    if (!addedModifiers.includes(modifier)) {
                        addedModifiers = [...addedModifiers, modifier];
                    }
                    if (timeout !== undefined) clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        if (binding) commit(event.key);
                    }, 1000);
                    event = await nextEvent();
                    if (!binding) return;
                    continue;
                }

                commit(event.key);
                return;
            }

            commit(event.key);
            return;
        }
    }

    const keyLabel = $derived(binding
        ? (addedModifiers.length ? `${addedModifiers.join("+")}+…` : "Press a key…")
        : formatKey(value?.boundKey));

    function clearBind(event: MouseEvent) {
        event.stopPropagation();
        commit(UNKNOWN_KEY);
    }
</script>

<div class="bind-field" class:compact>
    <button
            type="button"
            class="bind-button"
            class:recording={binding}
            onclick={startBinding}
            onmouseenter={() => hovered = true}
            onmouseleave={() => hovered = false}
            title="Click to change the bind"
    >
        <Icon name="keybinds" size={compact ? 11 : 13}/>
        <span>{keyLabel}</span>
        {#if value?.modifiers?.length && !binding}
            <span class="modifiers">{value.modifiers.join("+")}</span>
        {/if}
    </button>

    {#if !compact}
        <div class="actions">
            {#each ["Toggle", "Hold", "Smart"] as action (action)}
                <button
                        type="button"
                        class="action"
                        class:active={value.action === action}
                        onclick={() => setAction(action as BindAction)}
                >
                    {action}
                </button>
            {/each}
        </div>
    {/if}

    {#if value?.boundKey !== UNKNOWN_KEY}
        <button type="button" class="clear" title="Clear bind" aria-label="Clear bind" onclick={clearBind}>
            <Icon name="x" size={11}/>
        </button>
    {/if}
</div>

<style lang="scss">
  .bind-field {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .bind-button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 105px;
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
    transition: border-color .16s ease, color .16s ease, background-color .16s ease;

    &:hover {
      border-color: var(--claude-accent-line);
      color: var(--claude-text);
    }

    &.recording {
      border-color: var(--claude-accent);
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      animation: pulse 1.4s ease infinite;
    }

    .modifiers {
      color: var(--claude-accent);
      font-size: 9px;
    }
  }

  .actions {
    display: flex;
    padding: 2px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    border: 1px solid var(--claude-border);
  }

  .action {
    height: 23px;
    padding: 0 7px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 9px;
    font-weight: 550;
    cursor: pointer;

    &:hover {
      color: var(--claude-text-soft);
    }

    &.active {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-accent) 24%, transparent);
    }
  }

  .clear {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--claude-text-muted);
    cursor: pointer;

    &:hover {
      color: #ff8d96;
      background: color-mix(in srgb, #ff5964 10%, transparent);
    }
  }

  .compact {
    .bind-button {
      min-width: 92px;
    }
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--claude-accent) 25%, transparent); }
    50% { box-shadow: 0 0 0 4px transparent; }
  }
</style>
