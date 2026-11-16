<script lang="ts">
    import type {BooleanSetting, HudComponent, HudComponentCatalogEntry, Metadata} from "../../../../../integration/types";
    import {onMount, tick} from "svelte";
    import {
        addComponent,
        getComponentCatalog,
        getComponents,
        getComponentSettings,
        getMetadata,
        setComponentSettings
    } from "../../../../../integration/rest";
    import DrawerHudComponent from "./DrawerHudComponent.svelte";
    import {fly} from "svelte/transition";
    import {escapeLayer} from "../../../../../integration/escape";
    import Icon from "../../../claude/Icon.svelte";
    import SearchField from "../../../claude/SearchField.svelte";

    let metadata: Metadata;

    let drawerShown = $state(false);
    let components: HudComponentCatalogEntry[] = $state([]);
    let filteredComponents: HudComponentCatalogEntry[] = $state([]);
    let existing: HudComponent[] = $state([]);
    let drawerElement: HTMLElement | null = $state(null);
    let query = $state("");
    let adding = $state<string | null>(null);
    let error = $state<string | null>(null);

    onMount(async () => {
        try {
            metadata = await getMetadata();
            await refreshComponents();
        } catch (cause) {
            console.error("[Claude] Could not load HUD component catalog", cause);
            error = "Could not load the component catalog.";
        }
    });

    async function refreshComponents() {
        if (!metadata) {
            return;
        }

        const [catalog, current] = await Promise.all([
            getComponentCatalog(metadata.id),
            getComponents(metadata.id)
        ]);

        components = catalog.sort((a, b) => a.name.localeCompare(b.name));
        existing = current;
        filterComponents();
    }

    function stateOf(component: HudComponentCatalogEntry): "available" | "added" | "hidden" {
        const instances = existing.filter(instance => instance.name === component.name);
        const hasEnabled = instances.some(instance => instance.settings.enabled);

        if (component.singleton) {
            if (hasEnabled) {
                return "added";
            }
            if (instances.length > 0) {
                return "hidden";
            }
            return component.canAdd ? "available" : "added";
        }

        if (instances.length > 0 && !hasEnabled) {
            return "hidden";
        }

        return component.canAdd ? "available" : "added";
    }

    function filterComponents() {
        const needle = query.trim().toLowerCase();
        filteredComponents = needle.length === 0
            ? components
            : components.filter(component =>
                component.name.toLowerCase().includes(needle) ||
                component.description.toLowerCase().includes(needle));
    }

    function handleWindowClick(e: MouseEvent) {
        if (!e.target || !drawerElement) return;

        if (!drawerElement.contains(e.target as Node)) {
            drawerShown = false;
        }
    }

    function handleSearch(value: string) {
        query = value;
        filterComponents();
    }

    async function toggleDrawer() {
        drawerShown = !drawerShown;
        query = "";
        error = null;

        if (drawerShown) {
            try {
                await refreshComponents();
            } catch (cause) {
                console.error("[Claude] Could not refresh HUD component catalog", cause);
                error = "Could not refresh the component catalog.";
            }
            await tick();
        }
    }

    async function handleAddComponent(component: HudComponentCatalogEntry) {
        if (adding !== null) {
            return;
        }

        adding = component.id;
        error = null;

        try {
            const instances = existing.filter(instance => instance.name === component.name);
            const hidden = instances.some(instance => instance.settings.enabled)
                ? undefined
                : instances[0];

            if (hidden) {
                const settings = await getComponentSettings(hidden.id);
                const enabled = settings.value.find(setting => setting.name === "Enabled") as BooleanSetting | undefined;

                if (enabled) {
                    enabled.value = true;
                    await setComponentSettings(hidden.id, settings);
                    hidden.settings.enabled = true;
                }
            } else {
                await addComponent(component.id);
                if (component.singleton) {
                    component.canAdd = false;
                }
            }

            drawerShown = false;
            query = "";
            filterComponents();
        } catch (cause) {
            console.error(`[Claude] Could not add HUD component ${component.name}`, cause);
            error = `Could not add ${component.name}.`;
        } finally {
            adding = null;
        }
    }

    const layer = escapeLayer(() => {
        drawerShown = false;
        query = "";
    });
    $effect(() => layer.setOpen(drawerShown));
</script>

<svelte:window onclick={handleWindowClick}/>

<div class="component-drawer" bind:this={drawerElement}>
    <button
            type="button"
            class="drawer-trigger"
            class:open={drawerShown}
            aria-expanded={drawerShown}
            onclick={toggleDrawer}
    >
        <Icon name="plus" size={14}/>
        <span>Add Component</span>
        <span class="chevron"><Icon name="chevron-down" size={12}/></span>
    </button>

    {#if drawerShown}
        <div class="drawer" transition:fly={{y: -8, duration: 180}}>
            <header class="drawer-head">
                <div class="head-copy">
                    <span class="head-title">Add component</span>
                    <span class="head-sub">{components.length} components · click to add or restore</span>
                </div>
                <button type="button" class="close-button" aria-label="Close component list" onclick={() => drawerShown = false}>
                    <Icon name="x" size={12}/>
                </button>
            </header>

            <div class="drawer-search">
                <SearchField value={query} placeholder="Search components…" oninput={handleSearch}/>
            </div>

            {#if error}
                <div class="drawer-error">
                    <Icon name="x" size={11}/>
                    {error}
                </div>
            {/if}

            <div class="component-list">
                {#if filteredComponents.length !== 0}
                    {#each filteredComponents as component (component.id)}
                        <DrawerHudComponent
                                {component}
                                state={stateOf(component)}
                                busy={adding === component.id}
                                onselect={handleAddComponent}
                        />
                    {/each}
                {:else}
                    <div class="no-results">
                        <Icon name="search" size={16}/>
                        <span>No components match “{query}”</span>
                    </div>
                {/if}
            </div>

            <footer class="drawer-foot">
                <span class="foot-dot"></span>
                Components are added to your live HUD instantly
            </footer>
        </div>
    {/if}
</div>

<style lang="scss">
  .component-drawer {
    position: relative;
    z-index: 10001;
    display: inline-flex;
  }

  .drawer-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 31px;
    padding: 0 10px;
    border: 1px solid var(--claude-border);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .15px;
    cursor: pointer;
    transition: color .16s ease, background-color .16s ease, border-color .16s ease;

    .chevron {
      display: grid;
      place-items: center;
      transition: transform .18s ease;
    }

    &:hover,
    &.open {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
    }

    &.open {
      border-color: color-mix(in srgb, var(--claude-accent) 34%, transparent);
      color: var(--claude-accent);

      .chevron {
        transform: rotate(180deg);
      }
    }
  }

  .drawer {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    display: flex;
    flex-direction: column;
    width: 372px;
    max-width: calc(100vw - 28px);
    max-height: min(480px, calc(100vh - 150px));
    border: 1px solid var(--claude-border);
    border-radius: 11px;
    background:
      radial-gradient(120% 100% at 100% 0%, color-mix(in srgb, var(--claude-accent) 8%, transparent), transparent 46%),
      color-mix(in srgb, var(--claude-background) 96%, black);
    box-shadow: 0 24px 50px rgba(0, 0, 0, .5), 0 0 28px color-mix(in srgb, var(--claude-accent) 8%, transparent), inset 0 1px 0 rgba(255, 255, 255, .045);
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 18px;
      right: 18px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--claude-accent-line), transparent);
    }
  }

  .drawer-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 12px 10px 14px;
  }

  .head-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .head-title {
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -.2px;
  }

  .head-sub {
    color: var(--claude-text-muted);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: .55px;
    text-transform: uppercase;
  }

  .close-button {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-left: auto;
    padding: 0;
    flex: none;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: color .15s ease, background-color .15s ease, border-color .15s ease;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    }
  }

  .drawer-search {
    padding: 0 12px 10px;

    :global(.search-field) {
      width: 100%;
      height: 32px;
    }
  }

  .drawer-error {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 12px 10px;
    padding: 7px 9px;
    border: 1px solid color-mix(in srgb, #ef6d78 28%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, #ef6d78 8%, transparent);
    color: #ff9aa2;
    font-size: 9.5px;
    font-weight: 550;
  }

  .component-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-height: 0;
    padding: 0 10px 10px;
    overflow-y: auto;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
      width: 3px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: color-mix(in srgb, var(--claude-text) 14%, transparent);
    }
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px 16px;
    color: var(--claude-text-muted);
    font-size: 10px;
    text-align: center;

    :global(svg) {
      color: color-mix(in srgb, var(--claude-accent) 55%, transparent);
    }
  }

  .drawer-foot {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    background: color-mix(in srgb, var(--claude-background) 55%, transparent);
    color: var(--claude-text-muted);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: .15px;
  }

  .foot-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--claude-accent);
    box-shadow: 0 0 7px color-mix(in srgb, var(--claude-accent) 65%, transparent);
  }
</style>
