<script lang="ts">
    import {onMount} from "svelte";
    import type {GroupedModules, Module as TModule,} from "../../../../integration/types";
    import {getModules, setModuleEnabled} from "../../../../integration/rest";
    import {groupByCategory} from "../../../../integration/util";
    import Category from "./Category.svelte";
    import {getTextWidth} from "../../../../integration/text_measurement";
    import {listen} from "../../../../integration/ws";
    import {fly} from "svelte/transition";
    import Module from "./Module.svelte";
    import type {KeyEvent, ModuleToggleEvent} from "../../../../integration/events";

    let modules: TModule[] = [];
    let groupedModules: GroupedModules = {};
    let categories: string[] = [];
    let selectedCategoryIndex = 0;
    let selectedModuleIndex = 0;
    let renderedModules: TModule[] = [];
    let categoriesElement: HTMLElement;

    onMount(async () => {
        modules = (await getModules()).filter((m) => m.category !== "Client");
        groupedModules = groupByCategory(modules);
        categories = Object.keys(groupedModules).sort(
            (a, b) =>
                getTextWidth(b, "Inter 14px") - getTextWidth(a, "Inter 14px"),
        );
    });

    async function handleKeyDown(e: KeyEvent) {
        if (e.action !== 1) {
            return;
        }

        switch (e.key) {
            case "key.keyboard.down":
                if (renderedModules.length === 0) {
                    selectedCategoryIndex =
                        (selectedCategoryIndex + 1) %
                        Object.keys(categories).length;
                } else {
                    selectedModuleIndex =
                        (selectedModuleIndex + 1) % renderedModules.length;
                }
                break;
            case "key.keyboard.up":
                if (renderedModules.length === 0) {
                    selectedCategoryIndex =
                        (selectedCategoryIndex -
                            1 +
                            Object.keys(categories).length) %
                        Object.keys(categories).length;
                } else {
                    selectedModuleIndex =
                        (selectedModuleIndex - 1 + renderedModules.length) % renderedModules.length;
                }
                break;
            case "key.keyboard.left":
                renderedModules = [];
                selectedModuleIndex = 0;
                break;
            case "key.keyboard.right":
                if (renderedModules.length > 0) {
                    return;
                }
                renderedModules =
                    groupedModules[categories[selectedCategoryIndex]];
                break;
            case "key.keyboard.enter":
                if (renderedModules.length === 0) {
                    return;
                }
                const mod = renderedModules[selectedModuleIndex];
                await setModuleEnabled(mod.name, !mod.enabled);
                break;
        }
    }

    listen("key", handleKeyDown);

    listen("moduleToggle", (e: ModuleToggleEvent) => {
        const moduleName = e.moduleName;
        const moduleEnabled = e.enabled;

        const mod = modules.find((m) => m.name === moduleName);
        if (!mod) return;

        mod.enabled = moduleEnabled;
        groupedModules = groupByCategory(modules);
        if (renderedModules.length > 0) {
            renderedModules = groupedModules[categories[selectedCategoryIndex]];
        }
    });
</script>

<div class="tabgui">
    <div class="categories" bind:this={categoriesElement}>
        {#each categories as name, index}
            <Category {name} selected={index === selectedCategoryIndex} />
        {/each}
    </div>

    {#if renderedModules.length > 0}
        <div class="modules" transition:fly={{ x: -10, duration: 200 }} style="height: {categoriesElement.offsetHeight}px">
            {#each renderedModules as { name, enabled }, index}
                <Module {name} {enabled} selected={selectedModuleIndex === index} />
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">

    .tabgui {
        display: flex;
        filter: drop-shadow(0 10px 24px rgba(0, 0, 0, .32));
    }

    .categories {
        display: flex;
        flex-direction: column;
        min-width: 148px;
        border: 1px solid var(--hud-border);
        border-radius: var(--hud-radius);
        background: var(--hud-surface);
        box-shadow: var(--hud-shadow);
        overflow: hidden;
    }

    .modules {
      margin-left: 6px;
      min-width: 106px;
      max-height: 260px;
      border: 1px solid var(--hud-border);
      border-radius: var(--hud-radius);
      background: var(--hud-surface);
      box-shadow: var(--hud-shadow);
      display: flex;
      flex-direction: column;
      padding: 4px 0;
      overflow: auto;

      &::-webkit-scrollbar {
        width: 0;
      }
    }
</style>
