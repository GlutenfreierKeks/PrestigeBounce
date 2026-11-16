<script lang="ts">
    import type {HudComponentCatalogEntry} from "../../../../../integration/types";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../../../theme/theme_config";
    import Icon from "../../../claude/Icon.svelte";

    interface Props {
        component: HudComponentCatalogEntry,
        state?: "available" | "added" | "hidden",
        busy?: boolean,
        onselect: (component: HudComponentCatalogEntry) => void
    }

    const {component, state = component.canAdd ? "available" : "added", busy = false, onselect}: Props = $props();

    const ICONS: Record<string, string> = {
        Watermark: "crown",
        ArrayList: "list",
        FPS: "activity",
        Ping: "wifi",
        Coordinates: "map-pin",
        PlayerInfo: "user",
        TabGui: "grid",
        Notifications: "sparkles",
        Scoreboard: "list",
        Effects: "sparkles",
        Keystrokes: "keybinds",
        Hotbar: "box",
        TargetHud: "combat",
        Inventory: "box",
        CraftingInventory: "box",
        EnderChestInventory: "box",
        ArmorItems: "shield",
        InventoryStatistics: "list",
        KeyBinds: "keybinds",
        ClosedCaptions: "eye-off",
        BlockCounter: "box",
        Image: "monitor",
        Text: "edit",
        Taco: "sparkles"
    };

    let label = $derived($spaceSeperatedNames ? convertToSpacedString(component.name) : component.name);
    let icon = $derived(ICONS[component.name] ?? "hud");
    let actionable = $derived(state !== "added" && !busy);

    function activate() {
        if (!actionable) {
            return;
        }

        onselect(component);
    }
</script>

<button
        type="button"
        class="drawer-hud-component"
        class:added={state === "added"}
        class:hidden={state === "hidden"}
        class:busy={busy}
        disabled={!actionable}
        onclick={activate}
>
    <span class="component-icon"><Icon name={icon} size={16}/></span>

    <span class="copy">
        <span class="name-row">
            <span class="name">{label}</span>
            {#if state === "added"}
                <span class="badge">Added</span>
            {:else if state === "hidden"}
                <span class="badge">Hidden</span>
            {:else if component.singleton}
                <span class="badge subtle">Single</span>
            {/if}
        </span>
        <span class="description">{component.description}</span>
    </span>

    <span class="action">
        {#if busy}
            <span class="spinner"></span>
        {:else if state === "added"}
            <Icon name="check" size={13}/>
        {:else if state === "hidden"}
            <Icon name="eye-off" size={13}/>
        {:else}
            <Icon name="plus" size={13}/>
        {/if}
    </span>
</button>

<style lang="scss">
  .drawer-hud-component {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 9px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6.5%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--claude-text) 2.5%, transparent);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease, transform .12s ease;

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--claude-accent) 30%, transparent);
      background:
        linear-gradient(100deg, color-mix(in srgb, var(--claude-accent) 9%, transparent), transparent 70%),
        color-mix(in srgb, var(--claude-text) 4%, transparent);

      .component-icon {
        color: var(--claude-accent);
        border-color: color-mix(in srgb, var(--claude-accent) 28%, transparent);
        background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
      }

      .action {
        color: var(--claude-accent);
        border-color: color-mix(in srgb, var(--claude-accent) 26%, transparent);
        background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      }
    }

    &:active:not(:disabled) {
      transform: scale(.993);
    }

    &.added,
    &:disabled {
      cursor: default;
    }

    &.added {
      opacity: .62;

      .action {
        color: #74d39a;
        border-color: color-mix(in srgb, #74d39a 22%, transparent);
        background: color-mix(in srgb, #74d39a 8%, transparent);
      }
    }

    &.hidden {
      border-color: color-mix(in srgb, #e0b16a 22%, transparent);
      background: color-mix(in srgb, #e0b16a 3.5%, transparent);

      .badge {
        color: #e0b16a;
        background: color-mix(in srgb, #e0b16a 11%, transparent);
      }

      .action {
        color: #e0b16a;
        border-color: color-mix(in srgb, #e0b16a 24%, transparent);
        background: color-mix(in srgb, #e0b16a 8%, transparent);
      }
    }

    &.busy {
      opacity: .8;
    }
  }

  .component-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex: none;
    border: 1px solid var(--claude-border);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-card) 68%, transparent);
    color: var(--claude-text-dim);
    transition: color .15s ease, border-color .15s ease, background-color .15s ease;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .name {
    overflow: hidden;
    color: var(--claude-text);
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .05px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    flex: none;
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: .45px;
    text-transform: uppercase;

    &.subtle {
      color: var(--claude-text-muted);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    }
  }

  .description {
    overflow: hidden;
    color: var(--claude-text-muted);
    font-size: 9px;
    font-weight: 450;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action {
    display: grid;
    place-items: center;
    width: 23px;
    height: 23px;
    flex: none;
    border: 1px solid var(--claude-border);
    border-radius: 5px;
    color: var(--claude-text-muted);
    transition: color .15s ease, border-color .15s ease, background-color .15s ease;
  }

  .spinner {
    width: 11px;
    height: 11px;
    border: 1.5px solid color-mix(in srgb, var(--claude-accent) 26%, transparent);
    border-top-color: var(--claude-accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
