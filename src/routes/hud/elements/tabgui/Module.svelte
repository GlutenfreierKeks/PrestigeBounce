<script lang="ts">
    import {afterUpdate} from "svelte";
    import {setModuleEnabled} from "../../../../integration/rest";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../../theme/theme_config";

    export let name: string;
    export let enabled: boolean;
    export let selected: boolean;

    let moduleElement: HTMLElement;

    afterUpdate(() => {
        if (moduleElement && selected) {
            moduleElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    });

    async function handleKeyDown(e: KeyboardEvent) {
        if (selected && e.key === "Enter") {
            await setModuleEnabled(name, !enabled);
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="module" class:enabled class:selected bind:this={moduleElement}>
    <span class="dot"></span>
    <div class="name">{$spaceSeperatedNames ? convertToSpacedString(name) : name}</div>
</div>

<style lang="scss">

    .module {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        color: var(--hud-text-muted);
        font-size: 10.5px;
        padding: 5px 12px 5px 10px;
        transition: ease color .18s, ease background-color .18s;

        .dot {
          width: 4px;
          height: 4px;
          flex: none;
          border-radius: 50%;
          background: color-mix(in srgb, var(--hud-text) 16%, transparent);
          transition: background-color .18s, box-shadow .18s;
        }

        .name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            transition: ease transform .18s;
        }

        &.selected {
            background: color-mix(in srgb, var(--hud-accent) 11%, transparent);

            .name {
                transform: translateX(2px);
                color: var(--hud-text-soft);
            }
        }

        &.enabled {
            color: var(--hud-text-soft);

            .dot {
              background: var(--hud-accent);
              box-shadow: 0 0 7px color-mix(in srgb, var(--hud-accent) 65%, transparent);
              animation: tab-dot-pulse 2.8s ease-in-out infinite;
            }
        }
    }

    @keyframes tab-dot-pulse {
        0%, 100% { opacity: .7; box-shadow: 0 0 5px color-mix(in srgb, var(--hud-accent) 45%, transparent); }
        50% { opacity: 1; box-shadow: 0 0 9px color-mix(in srgb, var(--hud-accent) 72%, transparent); }
    }
</style>
