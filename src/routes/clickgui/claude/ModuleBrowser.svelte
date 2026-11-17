<script lang="ts">
    import {tick} from "svelte";
    import Icon from "./Icon.svelte";
    import SearchField from "./SearchField.svelte";
    import ModuleCard from "./ModuleCard.svelte";
    import {escapeLayer} from "../../../integration/escape";
    import {setItem} from "../../../integration/persistent_storage";
    import {fly, fade} from "svelte/transition";
    import type {Module} from "../../../integration/types";

    let {
        modules,
        category,
        loading = false,
        onToggle,
        onOpen
    } = $props<{
        modules: Module[];
        category: string;
        loading?: boolean;
        onToggle: (name: string, enabled: boolean) => void;
        onOpen: (module: Module) => void;
    }>();

    let search = $state("");
    let view = $state<"list" | "grid">(
        localStorage.getItem("claude.moduleView") === "grid" ? "grid" : "list"
    );
    let tag = $state<string | null>(null);
    let filterOpen = $state(false);
    let filterButton: HTMLButtonElement | undefined = $state();
    let menuStyle = $state("");

    const tags = $derived.by((): string[] =>
        [...new Set((modules as Module[]).map((module: Module) => module.tag).filter((value): value is string => !!value))]
            .sort((left: string, right: string) => left.localeCompare(right))
    );

    const searching = $derived(search.trim().length > 0);

    const visibleModules = $derived.by(() => {
        const needle = search.trim().toLowerCase();
        return (modules as Module[])
            .filter((module: Module) => searching || module.category === category)
            .filter((module: Module) => !tag || module.tag === tag)
            .filter((module: Module) => {
                if (!needle) return true;
                return module.name.toLowerCase().includes(needle)
                    || module.description.toLowerCase().includes(needle)
                    || module.aliases.some((alias: string) => alias.toLowerCase().includes(needle));
            })
            .sort((left: Module, right: Module) => left.name.localeCompare(right.name));
    });

    const enabledCount = $derived(visibleModules.filter((module: Module) => module.enabled).length);
    const categoryModules = $derived((modules as Module[]).filter((module: Module) => module.category === category));
    const categoryEnabled = $derived(categoryModules.filter((module: Module) => module.enabled).length);

    const layer = escapeLayer(() => filterOpen = false);
    $effect(() => layer.setOpen(filterOpen));

    function setView(next: "list" | "grid") {
        view = next;
        localStorage.setItem("claude.moduleView", next);
        void setItem("claude.moduleView", next);
    }

    function chooseTag(next: string | null) {
        tag = next;
        filterOpen = false;
    }

    async function toggleFilter() {
        filterOpen = !filterOpen;
        if (!filterOpen) return;
        await tick();
        if (!filterButton) return;
        const bounds = filterButton.getBoundingClientRect();
        menuStyle = `left: ${bounds.left}px; top: ${bounds.bottom + 7}px; width: ${Math.max(bounds.width, 190)}px;`;
    }

    function onWindowClick(event: MouseEvent) {
        if (!filterOpen) return;
        const target = event.target as HTMLElement;
        if (filterButton?.contains(target) || target.closest?.(".tag-menu")) return;
        filterOpen = false;
    }
</script>

<svelte:window onclick={onWindowClick} onresize={() => filterOpen = false}/>

<div class="module-browser">
    <header class="browser-head">
        <div class="head-copy">
            <h1>
                {#if searching}
                    Search <em>results</em>
                {:else}
                    <em>{category}</em> Modules
                {/if}
            </h1>
            <p>
                {#if loading}
                    Loading modules…
                {:else if searching}
                    {visibleModules.length} module{visibleModules.length === 1 ? "" : "s"} found
                    · {enabledCount} enabled
                {:else}
                    {categoryModules.length} modules · {categoryEnabled} enabled
                {/if}
            </p>
        </div>

        <div class="head-search">
            <SearchField bind:value={search} placeholder="Search modules"/>
        </div>
    </header>

    <div class="browser-toolbar">
        <button
                type="button"
                class="filter-chip"
                class:active={tag !== null || filterOpen}
                class:open={filterOpen}
                bind:this={filterButton}
                onclick={toggleFilter}
                disabled={loading || tags.length === 0}
                title={tags.length === 0 ? "No tags available" : "Filter by tag"}
        >
            <span>{tag ?? "Gamemodes"}</span>
            <Icon name="chevron-down" size={12}/>
        </button>

        <div class="view-switch" role="group" aria-label="Module layout">
            <button
                    type="button"
                    class:active={view === "list"}
                    aria-label="List view"
                    title="List view"
                    onclick={() => setView("list")}
            >
                <Icon name="list" size={17}/>
            </button>
            <button
                    type="button"
                    class:active={view === "grid"}
                    aria-label="Grid view"
                    title="Grid view"
                    onclick={() => setView("grid")}
            >
                <Icon name="grid" size={16}/>
            </button>
        </div>
    </div>

    {#if filterOpen}
        <div
                class="tag-menu"
                style={menuStyle}
                role="menu"
                in:fly={{y: -6, duration: 160}}
                out:fade={{duration: 100}}
        >
            <button type="button" class="tag-option" class:selected={tag === null} onclick={() => chooseTag(null)}>
                <span>All tags</span>
                {#if tag === null}<Icon name="check" size={13}/>{/if}
            </button>
            {#each tags as option (option)}
                <button
                        type="button"
                        class="tag-option"
                        class:selected={tag === option}
                        onclick={() => chooseTag(option)}
                >
                    <span>{option}</span>
                    {#if tag === option}<Icon name="check" size={13}/>{/if}
                </button>
            {/each}
        </div>
    {/if}

    <div class="module-scroll">
        {#if loading}
            <div class="state"><span class="loader"></span> Loading modules…</div>
        {:else if visibleModules.length === 0}
            <div class="state">
                <Icon name="search" size={18}/>
                <span>{searching ? `No modules match “${search.trim()}”` : "No modules in this category"}</span>
                {#if tag}
                    <button type="button" class="reset" onclick={() => tag = null}>Clear tag filter</button>
                {/if}
            </div>
        {:else}
            {#key view}
                <div class="module-list" class:grid={view === "grid"}>
                    {#each visibleModules as module, index (module.name)}
                        <ModuleCard
                                {module}
                                {view}
                                {index}
                                onToggle={onToggle}
                                onOpen={onOpen}
                        />
                    {/each}
                </div>
            {/key}
        {/if}
    </div>
</div>

<style lang="scss">
  .module-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .browser-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 26px;
    flex: none;
  }

  .head-copy {
    min-width: 0;

    h1 {
      margin: 0;
      color: var(--claude-text);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 29px;
      font-weight: 600;
      line-height: 1.12;
      letter-spacing: -.35px;

      em {
        font-style: italic;
        font-weight: 600;
      }
    }

    p {
      margin: 8px 0 0;
      color: var(--claude-text-muted);
      font-size: 11px;
      font-weight: 450;
    }
  }

  .head-search {
    width: min(320px, 38%);
    flex: none;
    padding-top: 2px;
  }

  .browser-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: none;
    margin: 18px 0 14px;
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.4%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 10.5px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color .16s ease, color .16s ease, background-color .16s ease;

    :global(svg) {
      transition: transform .2s ease;
    }

    &:hover:not(:disabled), &.active {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    }

    &.open :global(svg) {
      transform: rotate(180deg);
    }

    &:disabled {
      opacity: .45;
      cursor: default;
    }
  }

  .view-switch {
    display: flex;
    align-items: center;
    gap: 3px;

    button {
      display: grid;
      place-items: center;
      width: 29px;
      height: 29px;
      padding: 0;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: var(--claude-text-muted);
      cursor: pointer;
      transition: color .16s ease, background-color .16s ease, transform .12s ease;

      &:hover {
        color: var(--claude-text-dim);
        background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      }

      &:active {
        transform: scale(.9);
      }

      &.active {
        color: var(--claude-accent);
        background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
      }
    }
  }

  .module-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1px 8px 6px 1px;
    margin-right: -8px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 13%, transparent) transparent;
  }

  .module-list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    &.grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 11px;
    }
  }

  .state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 210px;
    color: var(--claude-text-muted);
    font-size: 11.5px;
    animation: state-in .26s ease backwards;

    .loader {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 2px solid color-mix(in srgb, var(--claude-text) 14%, transparent);
      border-top-color: var(--claude-accent);
      animation: spin .7s linear infinite;
    }
  }

  .reset {
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--claude-border);
    background: transparent;
    color: var(--claude-accent);
    font: inherit;
    font-size: 10px;
    cursor: pointer;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes state-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 1080px) {
    .module-list.grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .tag-menu {
    position: fixed;
    z-index: 2000000000;
    max-height: 248px;
    overflow-y: auto;
    padding: 5px;
    border-radius: 8px;
    border: 1px solid var(--claude-border-strong);
    background: color-mix(in srgb, var(--claude-background) 95%, black);
    box-shadow: 0 16px 40px rgba(0, 0, 0, .55);
    backdrop-filter: blur(18px);

    .tag-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
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
        color: var(--claude-text);
        background: color-mix(in srgb, var(--claude-text) 6%, transparent);
      }

      &.selected {
        color: var(--claude-accent);
        background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      }
    }
  }
</style>
