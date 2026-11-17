<script lang="ts">
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";
    import SearchField from "./SearchField.svelte";
    import Button from "./Button.svelte";
    import MarketItemCard from "./MarketItemCard.svelte";
    import MarketItemDetail from "./MarketItemDetail.svelte";
    import {getMarketplaceItems, getMarketplaceScreenshots} from "../../../integration/rest";
    import type {MarketItem, MarketItemType, MarketplacePagination} from "../../../integration/types";

    let {notify} = $props<{
        notify: (message: string, icon?: string) => void;
    }>();

    const tabs: { id: MarketItemType; label: string; icon: string }[] = [
        {id: "Config", label: "Configs", icon: "configs"},
        {id: "Script", label: "Scripts", icon: "sparkles"},
        {id: "Theme", label: "Themes", icon: "theme"},
        {id: "Addon", label: "Addons", icon: "box"}
    ];

    const PAGE_SIZE = 20;

    let type = $state<MarketItemType>("Config");
    let search = $state("");
    let page = $state(1);
    let items = $state<MarketItem[]>([]);
    let pagination = $state<MarketplacePagination>({current: 1, pages: 1, items: 0});
    let loading = $state(true);
    let failed = $state<string | null>(null);
    let selected = $state<MarketItem | null>(null);
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;

    const activeTab = $derived(tabs.find(tab => tab.id === type) ?? tabs[0]);
    const hasQuery = $derived(search.trim().length > 0);

    async function load() {
        const request = ++generation;
        loading = true;
        failed = null;
        try {
            const trimmed = search.trim();
            const [result, screenshots] = await Promise.all([
                getMarketplaceItems({
                    type,
                    page,
                    limit: PAGE_SIZE,
                    query: trimmed || undefined
                }),
                getMarketplaceScreenshots({
                    type,
                    query: trimmed || undefined
                })
            ]);
            if (request !== generation) return;
            items = result.items.map(item => {
                const images = screenshots.get(item.id);
                return images && images.length > 0 ? {...item, screenshots: images} : item;
            });
            pagination = result.pagination;
        } catch (error) {
            if (request !== generation) return;
            console.error(`[PrestigeBounce] Could not load ${type.toLowerCase()}s`, error);
            failed = error instanceof Error ? error.message : "The marketplace could not be reached.";
            items = [];
            pagination = {current: 1, pages: 1, items: 0};
        } finally {
            if (request === generation) loading = false;
        }
    }

    function selectTab(next: MarketItemType) {
        if (type === next) return;
        type = next;
        page = 1;
        search = "";
        void load();
    }

    function scheduleSearch() {
        if (searchTimer !== undefined) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            page = 1;
            void load();
        }, 260);
    }

    function goPage(next: number) {
        if (next < 1 || next > pagination.pages || next === page) return;
        page = next;
        void load();
    }

    function refresh() {
        void load();
    }

    onMount(() => {
        void load();

        return () => {
            if (searchTimer !== undefined) clearTimeout(searchTimer);
        };
    });
</script>

<div class="view">
    <header class="view-head">
        <div>
            <h1>Marketplace</h1>
            <p>Community configs, scripts, themes and addons</p>
        </div>
        <div class="head-tools">
            <button type="button" class="icon-button" aria-label="Refresh marketplace" title="Refresh" onclick={refresh}>
                <Icon name="refresh" size={15}/>
            </button>
            <div class="head-search">
                <SearchField bind:value={search} placeholder="Search {activeTab.label.toLowerCase()}" oninput={scheduleSearch}/>
            </div>
        </div>
    </header>

    <div class="browser-toolbar">
        <div class="type-tabs" role="tablist" aria-label="Marketplace category">
            {#each tabs as tab (tab.id)}
                <button
                        type="button"
                        role="tab"
                        aria-selected={type === tab.id}
                        class="type-tab"
                        class:active={type === tab.id}
                        onclick={() => selectTab(tab.id)}
                >
                    <Icon name={tab.icon} size={14}/>
                    {tab.label}
                </button>
            {/each}
        </div>
    </div>

    <div class="result-note">
        {#if loading}
            Loading {activeTab.label.toLowerCase()}…
        {:else}
            {pagination.items} {pagination.items === 1 ? "result" : "results"}
            {#if hasQuery}for “{search.trim()}”{/if}
        {/if}
    </div>

    <div class="view-scroll">
        {#if failed}
            <div class="empty">
                <span class="empty-icon error"><Icon name="x" size={21}/></span>
                <strong>Marketplace unavailable</strong>
                <p>{failed}</p>
                <Button icon="refresh" onclick={refresh}>Try again</Button>
            </div>
        {:else if loading}
            <div class="market-grid" aria-busy="true">
                {#each Array(6) as _, index (index)}
                    <div class="skeleton-card">
                        <span class="skeleton-icon"></span>
                        <div class="skeleton-copy">
                            <span></span>
                            <span></span>
                        </div>
                        <span class="skeleton-line"></span>
                    </div>
                {/each}
            </div>
        {:else if items.length === 0}
            <div class="empty">
                <span class="empty-icon"><Icon name={hasQuery ? "search" : activeTab.icon} size={21}/></span>
                <strong>{hasQuery ? "No matching items" : `No ${activeTab.label.toLowerCase()} yet`}</strong>
                <p>{hasQuery ? "Try a different search term or category." : "Check back later for new releases."}</p>
            </div>
        {:else}
            <div class="market-grid">
                {#each items as item (item.id)}
                    <MarketItemCard {item} onOpen={(selectedItem) => selected = selectedItem}/>
                {/each}
            </div>

            {#if pagination.pages > 1}
                <div class="pagination">
                    <button
                            type="button"
                            class="page-button"
                            aria-label="Previous page"
                            disabled={page <= 1}
                            onclick={() => goPage(page - 1)}
                    >
                        <Icon name="chevron-left" size={14}/>
                    </button>
                    <span>Page {pagination.current} of {pagination.pages}</span>
                    <button
                            type="button"
                            class="page-button"
                            aria-label="Next page"
                            disabled={page >= pagination.pages}
                            onclick={() => goPage(page + 1)}
                    >
                        <Icon name="chevron-right" size={14}/>
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>

{#if selected}
    <MarketItemDetail
            id={selected.id}
            initial={selected}
            {notify}
            onclose={() => selected = null}
            onChanged={load}
    />
{/if}

<style lang="scss">
  .view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .view-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 22px;
    flex: none;

    h1 {
      margin: 0;
      color: var(--claude-text);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -.3px;
    }

    p {
      margin: 7px 0 0;
      color: var(--claude-text-muted);
      font-size: 11px;
    }
  }

  .head-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 2px;
  }

  .head-search {
    width: 252px;
  }

  .icon-button {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: none;
    border-radius: 9px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: color .16s ease, border-color .16s ease, background-color .16s ease;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    }
  }

  .browser-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex: none;
    margin-top: 18px;
  }

  .type-tabs {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px;
    border-radius: 9px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 2.5%, transparent);
  }

  .type-tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 28px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 10px;
    font-weight: 550;
    cursor: pointer;
    transition: color .16s ease, background-color .16s ease, border-color .16s ease;

    &:hover {
      color: var(--claude-text-dim);
    }

    &.active {
      color: var(--claude-text);
      border-color: color-mix(in srgb, var(--claude-accent) 20%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 12%, transparent);

      :global(svg) {
        color: var(--claude-accent);
      }
    }
  }

  .result-note {
    flex: none;
    min-height: 27px;
    padding: 11px 1px 8px;
    color: var(--claude-text-muted);
    font-size: 9.5px;
  }

  .view-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1px 8px 8px 1px;
    margin-right: -8px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 13%, transparent) transparent;
  }

  .market-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .skeleton-card {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    grid-template-rows: auto auto;
    gap: 10px;
    min-height: 146px;
    padding: 15px;
    border-radius: 10px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 2%, transparent);
    overflow: hidden;

    > span {
      border-radius: 5px;
      background: linear-gradient(90deg,
        color-mix(in srgb, var(--claude-text) 4%, transparent),
        color-mix(in srgb, var(--claude-text) 7%, transparent),
        color-mix(in srgb, var(--claude-text) 4%, transparent));
      background-size: 200% 100%;
      animation: shimmer 1.4s ease infinite;
    }
  }

  .skeleton-icon {
    width: 40px;
    height: 40px;
    border-radius: 9px !important;
  }

  .skeleton-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 7px;

    span {
      display: block;
      height: 8px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);

      &:first-child {
        width: 62%;
      }

      &:last-child {
        width: 38%;
      }
    }
  }

  .skeleton-line {
    grid-column: 1 / 3;
    height: 30px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 330px;
    color: var(--claude-text-muted);
    text-align: center;

    .empty-icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      margin-bottom: 3px;
      border-radius: 13px;
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);

      &.error {
        color: #ff9da5;
        background: color-mix(in srgb, #ff5964 9%, transparent);
      }
    }

    strong {
      color: var(--claude-text-soft);
      font-size: 12px;
      font-weight: 600;
    }

    p {
      max-width: 360px;
      margin: 0;
      font-size: 10.5px;
      line-height: 1.5;
    }

    :global(.claude-button) {
      margin-top: 6px;
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    padding: 17px 0 4px;
    color: var(--claude-text-muted);
    font-size: 9.5px;
  }

  .page-button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-dim);
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
    }

    &:disabled {
      opacity: .35;
      cursor: default;
    }
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  @media (max-width: 980px) {
    .market-grid {
      grid-template-columns: 1fr;
    }

    .head-search {
      width: 200px;
    }
  }
</style>
