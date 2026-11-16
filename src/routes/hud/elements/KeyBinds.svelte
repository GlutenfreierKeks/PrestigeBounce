<script lang="ts">
    import {onMount} from "svelte";
    import {getModules} from "../../../integration/rest";
    import {listen} from "../../../integration/ws";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../theme/theme_config";
    import type {Module} from "../../../integration/types";
    import {UNKNOWN_KEY} from "../../../util/utils";
    import BindDisplay from "../../clickgui/setting/bind/BindDisplay.svelte";
    import Icon from "../../clickgui/claude/Icon.svelte";

    let modules: Module[] = $state([]);

    async function updateModulesWithBinds() {
        modules = (await getModules()).filter(m => m.keyBind.boundKey !== UNKNOWN_KEY);
    }

    listen("moduleToggle", updateModulesWithBinds);
    listen("valueChanged", async (e) => {
        if (e.value.name === "Bind") {
            await updateModulesWithBinds();
        }
    })

    onMount(async () => {
        await updateModulesWithBinds();
    });
</script>

<div class="keybinds">
    <div class="header">
        <span class="title"><Icon name="keybinds" size={10}/> Key Binds</span>
        <span class="count">{modules.length}</span>
    </div>
    <div class="entries">
        {#each modules as m (m.name)}
            <div class="row" class:enabled={m.enabled}>
                <span class="status-dot"></span>
                <span class="module-name">{$spaceSeperatedNames ? convertToSpacedString(m.name) : m.name}</span>
                <span class="key-bind" class:muted={!m.enabled}>
                    <BindDisplay boundKey={m.keyBind.boundKey} modifiers={m.keyBind.modifiers ?? []}/>
                </span>
            </div>
        {:else}
            <div class="no-binds">No key bindings</div>
        {/each}
    </div>
</div>

<style lang="scss">

  .keybinds {
    width: max-content;
    min-width: 166px;
    max-width: 230px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background: var(--hud-surface);
    box-shadow: var(--hud-shadow);
    overflow: hidden;
    font-size: 11px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 9px 6px;
    border-bottom: 1px solid color-mix(in srgb, var(--hud-text) 6%, transparent);
    background: linear-gradient(90deg, color-mix(in srgb, var(--hud-accent) 8%, transparent), transparent 72%);

    .title {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--hud-text-dim);
      font-size: 7.5px;
      font-weight: 650;
      letter-spacing: 1.05px;
      text-transform: uppercase;

      :global(svg) {
        color: var(--hud-accent);
      }
    }

    .count {
      color: var(--hud-text-muted);
      font-size: 8px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px 6px 5px;
    color: var(--hud-text-soft);

    .no-binds {
      padding: 4px 3px;
      color: var(--hud-text-muted);
      font-size: 9.5px;
      font-style: italic;
    }
  }

  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 21px;
    padding: 1px 3px;
    border-radius: 4px;
    min-width: 0;
    transition: background-color .14s ease;

    &:hover {
      background: color-mix(in srgb, var(--hud-text) 4%, transparent);
    }

    &.enabled {
      .status-dot {
        background: var(--hud-accent);
        box-shadow: 0 0 7px color-mix(in srgb, var(--hud-accent) 70%, transparent);
      }

      .module-name {
        color: var(--hud-text);
      }
    }

    .status-dot {
      width: 4px;
      height: 4px;
      flex: none;
      border-radius: 50%;
      background: color-mix(in srgb, var(--hud-text) 17%, transparent);
    }

    .module-name {
      color: var(--hud-text-dim);
      font-size: 10.5px;
      font-weight: 550;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .key-bind {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      flex: none;
      min-width: max-content;
      min-height: 16px;
      padding: 1px 5px;
      border: 1px solid var(--hud-border);
      border-radius: 4px;
      background: color-mix(in srgb, var(--hud-text) 4.5%, transparent);
      color: var(--hud-text-soft);
      font-family: "Inter", monospace;
      font-size: 8.5px;
      font-weight: 650;
      letter-spacing: .2px;

      &.muted {
        color: var(--hud-text-muted);
        font-weight: 550;
      }
    }
  }
</style>
