<script lang="ts">
    import Icon from "./Icon.svelte";
    import {marketImageUrl, marketSummary} from "./format";
    import {compactNumber, timeAgo} from "./storage";
    import type {MarketItem} from "../../../integration/types";

    let {
        item,
        onOpen
    } = $props<{
        item: MarketItem;
        onOpen: (item: MarketItem) => void;
    }>();

    let imageFailed = $state(false);

    const screenshot = $derived(item.screenshots.length > 0 ? item.screenshots[0].url : undefined);
    const image = $derived(marketImageUrl(screenshot));
    const summary = $derived(marketSummary(item.description));
    const tags = $derived(item.tags.slice(0, 3));
    const hasScore = $derived(item.score > 0);

    function typeIcon(type: MarketItem["type"]) {
        switch (type) {
            case "Config":
                return "configs";
            case "Theme":
                return "theme";
            case "Script":
                return "sparkles";
            default:
                return "box";
        }
    }
</script>

<div
        class="market-card"
        role="button"
        tabindex="0"
        onclick={() => onOpen(item)}
        onkeydown={(event) => {
            if (event.key === "Enter" || event.key === " ") onOpen(item);
        }}
>
    <div class="card-media type-{item.type.toLowerCase()}">
        {#if image && !imageFailed}
            <img src={image} alt="" loading="lazy" onerror={() => imageFailed = true}/>
        {:else}
            <span class="media-fallback">
                <Icon name={typeIcon(item.type)} size={24}/>
            </span>
        {/if}

        <div class="media-badges">
            {#if item.featured}
                <span class="badge featured" title="Featured"><Icon name="sparkles" size={10}/> Featured</span>
            {/if}
            {#if item.subscribed}
                <span class="badge subscribed" title="Subscribed to this item"><Icon name="check" size={10}/> Subscribed</span>
            {/if}
            {#if item.status !== "Active"}
                <span class="badge status">{item.status}</span>
            {:else if item.visibility !== "public"}
                <span class="badge status">Unlisted</span>
            {/if}
        </div>

        <span class="type-chip">
            <Icon name={typeIcon(item.type)} size={11}/>
            {item.type}
        </span>
    </div>

    <div class="card-body">
        <div class="name-line">
            <h3>{item.name}</h3>
        </div>
        <p class="meta">
            <span>{item.author}</span>
            <span class="dot"></span>
            <span>Updated {timeAgo(item.updatedAt ?? item.createdAt)}</span>
        </p>

        <p class="summary">{summary || "No description provided."}</p>

        {#if tags.length > 0}
            <div class="tag-row">
                {#each tags as tag (tag.id)}
                    <span class="tag">{tag.name}</span>
                {/each}
                {#if item.tags.length > tags.length}
                    <span class="tag more">+{item.tags.length - tags.length}</span>
                {/if}
            </div>
        {/if}
    </div>

    <footer class="card-foot">
        <span class="stat"><Icon name="download" size={12}/>{compactNumber(item.downloads)}</span>
        {#if hasScore}
            <span class="stat rating" title="Community score"><Icon name="sparkles" size={12}/>{item.score.toFixed(1)}</span>
        {/if}
        {#if item.liveRevision}
            <span class="stat version"><Icon name="tag" size={12}/>{item.liveRevision.version}</span>
        {/if}
        <span class="open-note">View <Icon name="chevron-right" size={11}/></span>
    </footer>
</div>

<style lang="scss">
  .market-card {
    display: flex;
    flex-direction: column;
    min-height: 214px;
    border: 1px solid var(--claude-border);
    border-radius: 10px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-text) 2.5%, transparent), transparent 58%),
      color-mix(in srgb, var(--claude-text) 1.6%, var(--claude-card));
    cursor: pointer;
    outline: none;
    overflow: hidden;
    transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease, transform .18s ease;

    &:hover {
      border-color: var(--claude-border-strong);
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--claude-accent) 4%, transparent), transparent 62%),
        color-mix(in srgb, var(--claude-text) 2.6%, var(--claude-card));
      box-shadow: 0 12px 30px rgba(0, 0, 0, .2);
      transform: translateY(-1px);
    }

    &:focus-visible {
      border-color: var(--claude-accent-line);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-accent) 10%, transparent);
    }
  }

  .card-media {
    position: relative;
    height: 84px;
    flex: none;
    background:
      radial-gradient(120% 130% at 18% 0%, color-mix(in srgb, var(--claude-accent) 18%, transparent), transparent 62%),
      color-mix(in srgb, var(--claude-text) 4%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 5%, transparent);

    &.type-script {
      background:
        radial-gradient(120% 130% at 18% 0%, color-mix(in srgb, #45bdf5 18%, transparent), transparent 62%),
        color-mix(in srgb, var(--claude-text) 4%, transparent);
    }

    &.type-theme {
      background:
        radial-gradient(120% 130% at 18% 0%, color-mix(in srgb, #45d49a 18%, transparent), transparent 62%),
        color-mix(in srgb, var(--claude-text) 4%, transparent);
    }

    > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .media-fallback {
    display: grid;
    place-items: center;
    height: 100%;
    color: var(--claude-accent);
    opacity: .8;
  }

  .media-badges {
    position: absolute;
    top: 7px;
    left: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 6px;
    border-radius: 4px;
    color: var(--claude-text-dim);
    background: rgba(12, 12, 13, .72);
    backdrop-filter: blur(6px);
    border: 1px solid color-mix(in srgb, var(--claude-text) 10%, transparent);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: .45px;
    text-transform: uppercase;

    &.featured {
      color: #ffd479;
      border-color: color-mix(in srgb, #ffc247 26%, transparent);
    }

    &.subscribed {
      color: #8ee3bb;
      border-color: color-mix(in srgb, #45d49a 26%, transparent);
    }

    &.status {
      color: #ffb18a;
      border-color: color-mix(in srgb, #ff8c52 26%, transparent);
    }
  }

  .type-chip {
    position: absolute;
    right: 8px;
    bottom: 7px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    border-radius: 4px;
    color: var(--claude-text-soft);
    background: rgba(12, 12, 13, .72);
    backdrop-filter: blur(6px);
    border: 1px solid color-mix(in srgb, var(--claude-text) 9%, transparent);
    font-size: 7.5px;
    font-weight: 650;
    letter-spacing: .5px;
    text-transform: uppercase;
  }

  .card-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 11px 14px 0;
  }

  .name-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;

    h3 {
      margin: 0;
      overflow: hidden;
      color: var(--claude-text);
      font-size: 12.5px;
      font-weight: 650;
      letter-spacing: .05px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--claude-text-muted);
    font-size: 9px;
    white-space: nowrap;

    .dot {
      width: 2px;
      height: 2px;
      flex: none;
      border-radius: 50%;
      background: currentColor;
      opacity: .7;
    }
  }

  .summary {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 9px 0 0;
    color: var(--claude-text-muted);
    font-size: 10px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 9px;
  }

  .tag {
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--claude-text-muted);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    font-size: 8px;
    line-height: 1.3;

    &.more {
      color: var(--claude-text-dim);
    }
  }

  .card-foot {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px 12px;
    margin-top: auto;
    color: var(--claude-text-muted);
    font-size: 9px;
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-variant-numeric: tabular-nums;
  }

  .rating {
    color: #ffd479;
  }

  .version {
    color: var(--claude-text-dim);
  }

  .open-note {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    color: color-mix(in srgb, var(--claude-text-muted) 80%, transparent);
    font-size: 8.5px;
    font-weight: 550;
    letter-spacing: .2px;
    text-transform: uppercase;
  }
</style>
