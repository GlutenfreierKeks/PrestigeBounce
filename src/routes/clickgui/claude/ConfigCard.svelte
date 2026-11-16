<script lang="ts">
    import Icon from "./Icon.svelte";

    let {
        name,
        description = "",
        author = "Community",
        date = "",
        tags = [],
        badge = "",
        badgeTitle,
        featured = false,
        warning,
        primaryLabel = "Download",
        secondaryLabel = "Details",
        loading = false,
        onOpen,
        onPrimary,
        onSecondary
    } = $props<{
        name: string;
        description?: string;
        author?: string;
        date?: string;
        tags?: string[];
        badge?: string;
        badgeTitle?: string;
        featured?: boolean;
        warning?: string;
        primaryLabel?: string;
        secondaryLabel?: string;
        loading?: boolean;
        onOpen: () => void;
        onPrimary?: () => void;
        onSecondary?: () => void;
    }>();
</script>

<div
        class="config-card"
        role="button"
        tabindex="0"
        onclick={onOpen}
        onkeydown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
            }
        }}
>
    <header class="card-top">
        <div class="name-line">
            <h3>{name}</h3>
            {#if featured}
                <span class="featured" title="Featured"><Icon name="sparkles" size={10}/></span>
            {/if}
            {#if warning}
                <span class="warning">{warning}</span>
            {/if}
        </div>
        {#if badge}
            <span class="badge" title={badgeTitle}>{badge}</span>
        {/if}
    </header>

    <p class="description">{description}</p>

    <div class="meta">
        <span class="author">by <strong>{author}</strong></span>
        {#if date}<span class="date">{date}</span>{/if}
    </div>

    <div class="tags">
        {#each tags.slice(0, 3) as tag (tag)}
            <span>{tag}</span>
        {:else}
            <span class="muted">No tags</span>
        {/each}
    </div>

    <footer class="actions">
        <button
                type="button"
                class="download"
                disabled={loading}
                onclick={(event) => {
                    event.stopPropagation();
                    onPrimary?.();
                }}
        >
            {loading ? "Loading…" : primaryLabel}
        </button>
        <button
                type="button"
                class="details"
                onclick={(event) => {
                    event.stopPropagation();
                    onSecondary?.();
                }}
        >
            {secondaryLabel}
        </button>
    </footer>
</div>

<style lang="scss">
  .config-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 193px;
    padding: 15px 16px 14px;
    border: 1px solid var(--claude-border);
    border-radius: 9px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-text) 2.4%, transparent), transparent);
    cursor: pointer;
    outline: none;
    transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease;

    &:hover {
      border-color: var(--claude-border-strong);
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 4%, transparent), transparent 44%),
        color-mix(in srgb, var(--claude-text) 2.8%, var(--claude-card));
      box-shadow: 0 9px 24px rgba(0, 0, 0, .16);
    }

    &:focus-visible {
      border-color: var(--claude-accent-line);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-accent) 10%, transparent);
    }
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
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
      font-size: 13.5px;
      font-weight: 650;
      letter-spacing: .05px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .featured {
    display: grid;
    place-items: center;
    width: 15px;
    height: 15px;
    flex: none;
    border-radius: 50%;
    color: #ffd479;
    background: color-mix(in srgb, #ffc247 13%, transparent);
  }

  .warning {
    flex: none;
    padding: 2px 5px;
    border-radius: 3px;
    color: #ffb18a;
    background: color-mix(in srgb, #ff8c52 10%, transparent);
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: .4px;
    text-transform: uppercase;
  }

  .badge {
    flex: none;
    min-width: 38px;
    padding: 4px 7px;
    border-radius: 4px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 12%, transparent);
    font-size: 9px;
    font-weight: 550;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .description {
    display: -webkit-box;
    margin: 9px 0 0;
    overflow: hidden;
    color: var(--claude-text-muted);
    font-size: 10.5px;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    min-height: 31px;
  }

  .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
    color: var(--claude-text-muted);
    font-size: 9.5px;
    font-variant-numeric: tabular-nums;

    .author {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      strong {
        color: #8ee3bb;
        font-weight: 550;
      }
    }

    .date {
      flex: none;
      white-space: nowrap;
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;

    span {
      padding: 2px 5px;
      border-radius: 3px;
      border: 1px solid var(--claude-border);
      color: var(--claude-text-muted);
      font-size: 8.5px;
      letter-spacing: .15px;
    }

    .muted {
      color: color-mix(in srgb, var(--claude-text-muted) 75%, transparent);
    }
  }

  .actions {
    display: flex;
    gap: 6px;
    margin-top: auto;
    padding-top: 12px;

    button {
      height: 32px;
      border-radius: 5px;
      font: inherit;
      font-size: 11.5px;
      font-weight: 550;
      cursor: pointer;
      transition: filter .15s ease, border-color .15s ease, color .15s ease;
    }
  }

  .download {
    flex: 1;
    border: 1px solid transparent;
    background: var(--claude-accent);
    color: #fff;

    &:hover:not(:disabled) {
      filter: brightness(1.08);
    }

    &:disabled {
      opacity: .6;
      cursor: default;
    }
  }

  .details {
    flex: 1;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-dim);

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
    }
  }
</style>
