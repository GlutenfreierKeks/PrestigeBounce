<script lang="ts">
    import {onMount, tick} from "svelte";
    import type {Module} from "../../../integration/types";
    import {getModules} from "../../../integration/rest";
    import {listen} from "../../../integration/ws";
    import {getTextWidth} from "../../../integration/text_measurement";
    import {flip} from "svelte/animate";
    import {fly} from "svelte/transition";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../theme/theme_config";
    import type {HudArrayListSettings} from "../components";

    export let settings: { [name: string]: any };

    let cSettings = settings as HudArrayListSettings;
    let enabledModules: Module[] = [];

    $: leftAligned = cSettings?.itemAlignment === "Left";

    async function updateEnabledModules() {
        const modules = await getModules();
        const visibleModules = modules.filter(m => m.enabled && !m.hidden);

        const modulesWithWidths = visibleModules.map(module => {
            const formattedName = $spaceSeperatedNames ? convertToSpacedString(module.name) : module.name;
            const fullName = module.tag == null || !cSettings.showTags
                ? formattedName
                : formattedName + " " + module.tag;

            return {
                ...module,
                width: getTextWidth(fullName, "600 12.5px Inter")
            };
        });

        modulesWithWidths.sort((a, b) => cSettings.order === "Ascending" ? a.width - b.width : b.width - a.width);

        enabledModules = modulesWithWidths;
        await tick();
    }

    $: if (cSettings !== settings) {
        cSettings = settings as HudArrayListSettings;
        updateEnabledModules();
    }

    spaceSeperatedNames.subscribe(async () => {
        await updateEnabledModules();
    });

    onMount(async () => {
        await updateEnabledModules();
    });

    listen("moduleToggle", async () => {
        await updateEnabledModules();
    });

    listen("refreshArrayList", async () => {
        await updateEnabledModules();
    });
</script>

<div class="arraylist" class:left={leftAligned}>
    {#each enabledModules as {name, tag} (name)}
        <div
                class="module"
                animate:flip={{ duration: 200 }}
                transition:fly={{ x: leftAligned ? -24 : 24, duration: 180 }}
        >
            <span class="module-name">{$spaceSeperatedNames ? convertToSpacedString(name) : name}</span>
            {#if tag && cSettings.showTags}
                <span class="tag">{tag}</span>
            {/if}
        </div>
    {/each}
</div>

<style lang="scss">
  .arraylist {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    width: max-content;

    &.left {
      align-items: flex-start;
    }
  }

  .module {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
    width: max-content;
    min-height: 22px;
    padding: 3px 10px 3px 9px;
    border: 1px solid var(--hud-border);
    border-radius: 6px;
    background:
      linear-gradient(90deg, var(--hud-surface) 22%, color-mix(in srgb, var(--hud-accent) 8%, var(--hud-surface)));
    color: var(--hud-text-soft);
    box-shadow: 0 6px 18px rgba(0, 0, 0, .22);
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: .05px;
    line-height: 1.1;
    overflow: hidden;
    transition: border-color .16s ease, color .16s ease;
  }

  .left .module {
    padding-right: 9px;
    padding-left: 10px;
    background:
      linear-gradient(270deg, var(--hud-surface) 22%, color-mix(in srgb, var(--hud-accent) 8%, var(--hud-surface)));
  }

  .module-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag {
    flex: none;
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--hud-text-muted);
    background: color-mix(in srgb, var(--hud-text) 6%, transparent);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: .35px;
    text-transform: uppercase;
  }
</style>
