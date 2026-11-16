<script lang="ts">
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";
    import Button from "./Button.svelte";
    import Modal from "./Modal.svelte";
    import {
        getMarketplaceItem,
        getMarketplaceItemRevisions,
        getMarketplaceItemReviews,
        subscribeMarketplaceItem,
        unsubscribeMarketplaceItem
    } from "../../../integration/rest";
    import type {
        MarketItem,
        MarketItemDetail as MarketItemDetailData,
        MarketItemRevision,
        MarketReview
    } from "../../../integration/types";
    import {marketDescriptionText, marketImageUrl} from "./format";
    import {compactNumber, formatDate, timeAgo} from "./storage";

    let {
        id,
        initial,
        notify,
        onclose,
        onChanged
    } = $props<{
        id: number;
        initial?: MarketItem;
        notify: (message: string, icon?: string) => void;
        onclose: () => void;
        onChanged: () => void | Promise<void>;
    }>();

    let detail = $state<MarketItemDetailData | null>(null);
    let item = $state<MarketItem | null>(initial ?? null);
    let loading = $state(true);
    let failed = $state<string | null>(null);
    let subscriptionAction = $state<"subscribe" | "unsubscribe" | null>(null);

    let revisions = $state<MarketItemRevision[]>([]);
    let revisionsLoading = $state(true);
    let revisionsError = $state<string | null>(null);

    let reviews = $state<MarketReview[]>([]);
    let reviewsLoading = $state(true);
    let reviewsError = $state<string | null>(null);

    let selectedScreenshot = $state(0);
    let failedImages = $state<Record<string, boolean>>({});

    const screenshots = $derived(item?.screenshots ?? []);
    const description = $derived(marketDescriptionText(item?.description));
    const activeScreenshot = $derived(screenshots[selectedScreenshot] ?? screenshots[0]);
    const hasUpdate = $derived(detail?.hasUpdate ?? false);

    function typeIcon(type: MarketItem["type"] | undefined) {
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

    function pictureFailed(url: string): boolean {
        return failedImages[url] === true;
    }

    function markImageFailed(url: string) {
        failedImages = {...failedImages, [url]: true};
    }

    function shortUid(uid: string): string {
        return uid.length > 10 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid;
    }

    function formatBytes(size: number): string {
        if (!size) return "";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    function stars(rating: number): string {
        const clamped = Math.max(0, Math.min(5, Math.round(rating)));
        return "★".repeat(clamped) + "☆".repeat(5 - clamped);
    }

    async function loadRevisions() {
        revisionsLoading = true;
        revisionsError = null;
        try {
            revisions = (await getMarketplaceItemRevisions(id, 1, 6)).items;
        } catch (error) {
            console.error(`[Claude] Could not load revisions for ${id}`, error);
            revisionsError = error instanceof Error ? error.message : "Revisions could not be loaded.";
        } finally {
            revisionsLoading = false;
        }
    }

    async function loadReviews() {
        reviewsLoading = true;
        reviewsError = null;
        try {
            reviews = (await getMarketplaceItemReviews(id, 1, 5)).items;
        } catch (error) {
            console.error(`[Claude] Could not load reviews for ${id}`, error);
            reviewsError = error instanceof Error ? error.message : "Reviews could not be loaded.";
        } finally {
            reviewsLoading = false;
        }
    }

    async function load() {
        loading = true;
        failed = null;
        selectedScreenshot = 0;
        try {
            detail = await getMarketplaceItem(id);
            item = detail.item;
            void loadRevisions();
            void loadReviews();
        } catch (error) {
            console.error(`[Claude] Could not load marketplace item ${id}`, error);
            failed = error instanceof Error ? error.message : "This item could not be loaded.";
        } finally {
            loading = false;
        }
    }

    async function toggleSubscription() {
        if (!item || subscriptionAction !== null) return;

        const subscribing = !item.subscribed;
        subscriptionAction = subscribing ? "subscribe" : "unsubscribe";
        try {
            if (subscribing) {
                await subscribeMarketplaceItem(item.id);
            } else {
                await unsubscribeMarketplaceItem(item.id);
            }

            const next = {...item, subscribed: subscribing};
            item = next;
            if (detail) {
                detail = {...detail, item: next, isSubscribed: subscribing};
            }
            notify(
                subscribing ? `Subscribed to ${next.name}` : `Unsubscribed from ${next.name}`,
                "marketplace"
            );
            await onChanged();
        } catch (error) {
            console.error(`[Claude] Could not update marketplace subscription for ${id}`, error);
            notify(error instanceof Error ? error.message : "Could not update the subscription", "x");
        } finally {
            subscriptionAction = null;
        }
    }

    onMount(() => {
        void load();
    });
</script>

<Modal
        title={item?.name ?? "Marketplace item"}
        subtitle={item ? `${item.type} by ${item.author}` : "Loading item…"}
        width={700}
        {onclose}
>
    {#if !item && loading}
        <div class="state loading"><span class="loader"></span> Loading marketplace item…</div>
    {:else if !item && failed}
        <div class="state failed">
            <Icon name="x" size={16}/>
            <div>
                <strong>Could not load this item</strong>
                <p>{failed}</p>
            </div>
            <Button variant="ghost" onclick={load}>Retry</Button>
        </div>
    {:else if item}
        {#if failed}
            <div class="inline-error">
                <Icon name="x" size={13}/>
                <span>{failed}</span>
                <button type="button" onclick={load}>Retry</button>
            </div>
        {/if}

        {#if activeScreenshot && !pictureFailed(activeScreenshot.url)}
            <div class="gallery">
                <div class="gallery-main">
                    <img
                            src={marketImageUrl(activeScreenshot.url) ?? ""}
                            alt={`${item.name} screenshot`}
                            onerror={() => markImageFailed(activeScreenshot.url)}
                    />
                </div>
                {#if screenshots.length > 1}
                    <div class="gallery-strip">
                        {#each screenshots as screenshot, index (screenshot.id)}
                            <button
                                    type="button"
                                    class="thumb"
                                    class:active={screenshots[selectedScreenshot]?.id === screenshot.id}
                                    aria-label={`Screenshot ${index + 1}`}
                                    onclick={() => selectedScreenshot = index}
                            >
                                {#if pictureFailed(screenshot.url)}
                                    <Icon name="eye-off" size={12}/>
                                {:else}
                                    <img
                                            src={marketImageUrl(screenshot.url) ?? ""}
                                            alt=""
                                            loading="lazy"
                                            onerror={() => markImageFailed(screenshot.url)}
                                    />
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}

        <div class="hero" class:with-gallery={!!activeScreenshot && !pictureFailed(activeScreenshot.url)}>
            <span class="hero-icon type-{item.type.toLowerCase()}">
                <Icon name={typeIcon(item.type)} size={26}/>
            </span>
            <div class="hero-copy">
                <div class="hero-badges">
                    <span class="badge type">{item.type}</span>
                    {#if item.featured}<span class="badge featured">Featured</span>{/if}
                    {#if item.subscribed}<span class="badge subscribed">Subscribed</span>{/if}
                    {#if hasUpdate}<span class="badge update">Update available</span>{/if}
                    {#if item.status !== "Active"}<span class="badge warn">{item.status}</span>{/if}
                    {#if item.visibility !== "public"}<span class="badge warn">Unlisted</span>{/if}
                </div>
                <div class="hero-stats">
                    <span><Icon name="user" size={12}/>{item.author}</span>
                    <span><Icon name="download" size={12}/>{compactNumber(item.downloads)} downloads</span>
                    {#if item.score > 0}
                        <span class="rating"><Icon name="sparkles" size={12}/>{item.score.toFixed(1)} / 5</span>
                    {/if}
                    {#if item.liveRevision}
                        <span><Icon name="tag" size={12}/>v{item.liveRevision.version}</span>
                    {/if}
                    <span><Icon name="clock" size={12}/>Updated {timeAgo(item.updatedAt ?? item.createdAt)}</span>
                </div>
            </div>
        </div>

        <section class="detail-section">
            <h3>About</h3>
            <p class="description">{description || "No description was provided for this item."}</p>
        </section>

        {#if item.tags.length > 0}
            <div class="tag-row">
                {#each item.tags as tag (tag.id)}
                    <span class="tag"><Icon name="tag" size={10}/>{tag.name}</span>
                {/each}
            </div>
        {/if}

        <section class="detail-section">
            <h3>Details</h3>
            <dl class="fact-grid">
                <div>
                    <dt>Author</dt>
                    <dd>{item.author}</dd>
                </div>
                <div>
                    <dt>Created</dt>
                    <dd>{formatDate(item.createdAt)}</dd>
                </div>
                <div>
                    <dt>Updated</dt>
                    <dd>{formatDate(item.updatedAt ?? item.createdAt)}</dd>
                </div>
                <div>
                    <dt>Live version</dt>
                    <dd>{item.liveRevision ? item.liveRevision.version : "None"}</dd>
                </div>
                <div>
                    <dt>Visibility</dt>
                    <dd>{item.visibility === "public" ? "Public" : "Unlisted"}</dd>
                </div>
                <div>
                    <dt>Status</dt>
                    <dd>{item.status}</dd>
                </div>
                {#if item.protocolName}
                    <div>
                        <dt>Protocol</dt>
                        <dd>{item.protocolName}{item.protocolVersion ? ` · ${item.protocolVersion}` : ""}</dd>
                    </div>
                {/if}
                {#if item.includesBinds !== null && item.includesBinds !== undefined}
                    <div>
                        <dt>Includes binds</dt>
                        <dd>{item.includesBinds ? "Yes" : "No"}</dd>
                    </div>
                {/if}
                {#if item.targetServers.length > 0}
                    <div class="wide">
                        <dt>Target servers</dt>
                        <dd>{item.targetServers.join(", ")}</dd>
                    </div>
                {/if}
                {#if item.contributors.length > 0}
                    <div class="wide">
                        <dt>Contributors</dt>
                        <dd>{item.contributors.map(contributor => contributor.name).join(", ")}</dd>
                    </div>
                {/if}
            </dl>
        </section>

        <section class="detail-section">
            <h3>Revisions</h3>
            {#if revisionsLoading}
                <div class="section-state"><span class="loader small"></span> Loading revisions…</div>
            {:else if revisionsError}
                <div class="section-state error">
                    <span>{revisionsError}</span>
                    <button type="button" onclick={loadRevisions}>Retry</button>
                </div>
            {:else if revisions.length === 0}
                <div class="section-state">No revisions have been published yet.</div>
            {:else}
                <div class="revision-list">
                    {#each revisions as revision (revision.id)}
                        <div class="revision-row">
                            <div class="revision-head">
                                <span class="version-name">v{revision.version}</span>
                                {#if revision.id === item.liveRevisionId}
                                    <span class="pill live">Live</span>
                                {/if}
                                {#if revision.status !== "Active"}
                                    <span class="pill warn">{revision.status}</span>
                                {/if}
                                {#if revision.file?.size}
                                    <span class="revision-file">{formatBytes(revision.file.size)}</span>
                                {/if}
                                <span class="revision-date">{formatDate(revision.createdAt)}</span>
                            </div>
                            {#if revision.changelog}
                                <p>{revision.changelog}</p>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>

        <section class="detail-section">
            <h3>Reviews</h3>
            {#if reviewsLoading}
                <div class="section-state"><span class="loader small"></span> Loading reviews…</div>
            {:else if reviewsError}
                <div class="section-state error">
                    <span>{reviewsError}</span>
                    <button type="button" onclick={loadReviews}>Retry</button>
                </div>
            {:else if reviews.length === 0}
                <div class="section-state">No reviews yet.</div>
            {:else}
                <div class="review-list">
                    {#each reviews as review (review.id)}
                        <article class="review">
                            <div class="review-head">
                                <span class="stars" title={`${review.rating} out of 5`}>{stars(review.rating)}</span>
                                <span class="review-author">{shortUid(review.uid)}</span>
                                <span class="review-date">{timeAgo(review.createdAt)}</span>
                            </div>
                            {#if review.review}
                                <p>{review.review}</p>
                            {/if}
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}

    {#snippet footer()}
        {#if item}
            {#if item.sourceUrl}
                <a class="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer noopener">
                    <Icon name="globe" size={14}/> Source
                </a>
            {/if}
            <Button
                    variant={item.subscribed ? "secondary" : "primary"}
                    icon={item.subscribed ? "check" : "plus"}
                    disabled={subscriptionAction !== null}
                    onclick={toggleSubscription}
            >
                {subscriptionAction === "subscribe"
                        ? "Subscribing…"
                        : subscriptionAction === "unsubscribe"
                                ? "Unsubscribing…"
                                : item.subscribed
                                        ? "Unsubscribe"
                                        : "Subscribe"}
            </Button>
        {/if}
    {/snippet}
</Modal>

<style lang="scss">
  .state {
    display: flex;
    align-items: center;
    gap: 11px;
    min-height: 150px;
    color: var(--claude-text-muted);
    font-size: 11.5px;

    &.failed {
      align-items: flex-start;
      color: #ff9da5;

      strong {
        display: block;
        color: #ffc8cd;
        font-size: 12px;
      }

      p {
        margin: 5px 0 0;
        color: #d99098;
        font-size: 10.5px;
      }

      :global(.claude-button) {
        margin-left: auto;
      }
    }
  }

  .loader {
    width: 14px;
    height: 14px;
    flex: none;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--claude-text) 15%, transparent);
    border-top-color: var(--claude-accent);
    animation: spin .7s linear infinite;

    &.small {
      width: 11px;
      height: 11px;
      border-width: 1.5px;
    }
  }

  .inline-error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 11px;
    border-radius: 7px;
    border: 1px solid color-mix(in srgb, #ff5964 22%, transparent);
    background: color-mix(in srgb, #ff5964 7%, transparent);
    color: #ffb3ba;
    font-size: 10px;

    span {
      flex: 1;
      min-width: 0;
    }

    button {
      border: none;
      background: none;
      color: #ffd0d5;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .gallery {
    margin-bottom: 15px;
  }

  .gallery-main {
    height: 220px;
    border-radius: 9px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    overflow: hidden;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .gallery-strip {
    display: flex;
    gap: 6px;
    margin-top: 7px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .thumb {
    display: grid;
    place-items: center;
    width: 64px;
    height: 40px;
    flex: none;
    padding: 0;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-muted);
    cursor: pointer;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &.active {
      border-color: var(--claude-accent-line);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--claude-accent) 14%, transparent);
    }
  }

  .hero {
    display: flex;
    gap: 13px;
    align-items: center;

    &.with-gallery {
      padding-top: 2px;
    }
  }

  .hero-icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    flex: none;
    border-radius: 12px;
    color: var(--claude-accent);
    background: linear-gradient(150deg, color-mix(in srgb, var(--claude-accent) 18%, transparent), color-mix(in srgb, var(--claude-accent) 6%, transparent));
    border: 1px solid color-mix(in srgb, var(--claude-accent) 22%, transparent);

    &.type-script {
      color: #7fd6ff;
      background: linear-gradient(150deg, color-mix(in srgb, #45bdf5 18%, transparent), color-mix(in srgb, #45bdf5 5%, transparent));
      border-color: color-mix(in srgb, #45bdf5 24%, transparent);
    }

    &.type-theme {
      color: #7ee0b5;
      background: linear-gradient(150deg, color-mix(in srgb, #45d49a 18%, transparent), color-mix(in srgb, #45d49a 5%, transparent));
      border-color: color-mix(in srgb, #45d49a 24%, transparent);
    }
  }

  .hero-copy {
    min-width: 0;
    flex: 1;
  }

  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .badge {
    padding: 3px 7px;
    border-radius: 4px;
    color: var(--claude-text-dim);
    background: color-mix(in srgb, var(--claude-text) 6%, transparent);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: .45px;
    text-transform: uppercase;

    &.type {
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
    }

    &.featured {
      color: #ffd479;
      background: color-mix(in srgb, #ffc247 10%, transparent);
    }

    &.subscribed,
    &.live {
      color: #8ee3bb;
      background: color-mix(in srgb, #45d49a 10%, transparent);
    }

    &.update {
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 11%, transparent);
    }

    &.warn {
      color: #ffb18a;
      background: color-mix(in srgb, #ff8c52 10%, transparent);
    }
  }

  .hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
    color: var(--claude-text-muted);
    font-size: 9.5px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .rating {
      color: #ffd479;
    }
  }

  .detail-section {
    margin-top: 17px;

    h3 {
      margin: 0 0 7px;
      color: var(--claude-text-dim);
      font-size: 8.5px;
      font-weight: 650;
      letter-spacing: .75px;
      text-transform: uppercase;
    }
  }

  .description {
    margin: 0;
    color: var(--claude-text-muted);
    font-size: 10.5px;
    line-height: 1.65;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 12px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 7px;
    border-radius: 5px;
    color: var(--claude-text-dim);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    border: 1px solid color-mix(in srgb, var(--claude-text) 7%, transparent);
    font-size: 8.5px;
  }

  .fact-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin: 0;

    div {
      padding: 9px 11px;
      border-radius: 7px;
      border: 1px solid var(--claude-border);
      background: color-mix(in srgb, var(--claude-text) 2.5%, transparent);

      &.wide {
        grid-column: 1 / -1;
      }
    }

    dt {
      color: var(--claude-text-muted);
      font-size: 8.5px;
    }

    dd {
      margin: 3px 0 0;
      color: var(--claude-text-soft);
      font-size: 10.5px;
      font-weight: 550;
      overflow-wrap: anywhere;
    }
  }

  .section-state {
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    color: var(--claude-text-muted);
    font-size: 10px;

    &.error {
      justify-content: space-between;
      gap: 10px;
      color: #d99098;

      button {
        flex: none;
        border: none;
        background: none;
        color: #ffc8cd;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
        text-decoration: underline;
      }
    }
  }

  .revision-list,
  .review-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .revision-row {
    padding: 9px 11px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 2.2%, transparent);

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 9.5px;
      line-height: 1.5;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
  }

  .revision-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    font-size: 10px;
  }

  .version-name {
    color: var(--claude-text-soft);
    font-weight: 600;
  }

  .pill {
    padding: 1px 5px;
    border-radius: 3px;
    color: #8ee3bb;
    background: color-mix(in srgb, #45d49a 10%, transparent);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: .4px;
    text-transform: uppercase;

    &.warn {
      color: #ffb18a;
      background: color-mix(in srgb, #ff8c52 10%, transparent);
    }
  }

  .revision-file,
  .revision-date {
    color: var(--claude-text-muted);
    font-size: 8.5px;
  }

  .revision-date {
    margin-left: auto;
  }

  .review {
    padding: 9px 11px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 2.2%, transparent);

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 9.5px;
      line-height: 1.5;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
  }

  .review-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 9px;
  }

  .stars {
    color: #ffd479;
    letter-spacing: 1px;
  }

  .review-author {
    color: var(--claude-text-dim);
    font-weight: 550;
  }

  .review-date {
    margin-left: auto;
    color: var(--claude-text-muted);
    font-size: 8.5px;
  }

  .source-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: auto;
    color: var(--claude-text-muted);
    font-size: 10px;
    text-decoration: none;

    &:hover {
      color: var(--claude-text);
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
