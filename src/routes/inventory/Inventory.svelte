<script lang="ts">
    import {onMount} from "svelte";
    import {getGameWindow, getPlayerData, getPlayerInventory, itemTextureUrl} from "../../integration/rest";
    import {listen} from "../../integration/ws";
    import type {GameWindow, ItemStack, PlayerData} from "../../integration/types";
    import type {
        ClientPlayerDataEvent,
        ClientPlayerInventoryEvent,
        PlayerInventory
    } from "../../integration/events";
    import Icon from "../clickgui/claude/Icon.svelte";
    import PrestigeMark from "../../components/PrestigeMark.svelte";

    let gameWindow = $state<GameWindow | null>(null);
    let innerHeight = $state(0);
    let inventory = $state<PlayerInventory | null>(null);
    let player = $state<PlayerData | null>(null);

    // One CSS pixel of Minecraft's GUI scale, using the same conversion as the client overlay
    const guiPixel = $derived(gameWindow ? innerHeight / gameWindow.height * gameWindow.scaleFactor : 0);
    const panelWidth = $derived(176 * guiPixel);
    const panelHeight = $derived(166 * guiPixel);
    const panelLeft = $derived(gameWindow ? Math.floor((gameWindow.scaledWidth - 176) / 2) * guiPixel : 0);
    const panelTop = $derived(gameWindow ? Math.floor((gameWindow.scaledHeight - 166) / 2) * guiPixel : 0);
    const slot = $derived(18 * guiPixel);

    const selected = $derived(player?.selectedSlot ?? 0);
    const selectedStack = $derived(inventory && player ? inventory.main[player.selectedSlot] : undefined);
    const enderStacks = $derived(inventory?.enderChest ?? []);
    const enderUsed = $derived(enderStacks.filter(isFilled).length);

    const healthPercent = $derived(player && player.maxHealth > 0
        ? Math.min(100, Math.max(0, player.health / player.maxHealth * 100))
        : 0);
    const foodPercent = $derived(player ? Math.min(100, Math.max(0, player.food / 20 * 100)) : 0);
    const xpPercent = $derived(player ? Math.min(100, Math.max(0, player.experienceProgress * 100)) : 0);
    const monogram = $derived((player?.username?.[0] ?? "P").toUpperCase());

    async function updateGameWindow() {
        gameWindow = await getGameWindow();
    }

    function isFilled(stack: ItemStack | undefined | null) {
        return stack !== undefined && stack !== null && stack.identifier !== "minecraft:air" && stack.count > 0;
    }

    function stackLabel(stack: ItemStack | undefined | null) {
        if (!isFilled(stack) || !stack) {
            return "Empty";
        }

        if (typeof stack.displayName === "string") {
            return stack.displayName;
        }

        return stack.displayName?.text ?? readableIdentifier(stack.identifier);
    }

    function readableIdentifier(identifier: string) {
        return identifier
            .replace("minecraft:", "")
            .split("_")
            .map(part => part[0]?.toUpperCase() + part.slice(1))
            .join(" ");
    }

    function dimensionName() {
        if (!player?.dimension) {
            return "Unknown dimension";
        }

        return player.dimension.replace("minecraft:", "").replaceAll("_", " ");
    }

    function gameModeName() {
        if (!player?.gameMode) {
            return "Survival";
        }

        return player.gameMode.toLowerCase().replaceAll("_", " ");
    }

    function coordinates() {
        if (!player) {
            return "—";
        }

        return `${Math.round(player.position.x)}, ${Math.round(player.position.y)}, ${Math.round(player.position.z)}`;
    }

    function stackCount(stack: ItemStack | undefined | null) {
        return stack && stack.count > 1 ? stack.count : null;
    }

    listen("scaleFactorChange", updateGameWindow);
    listen("clientPlayerInventory", (event: ClientPlayerInventoryEvent) => {
        inventory = event.inventory;
    });
    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        player = event.playerData;
    });

    onMount(async () => {
        await updateGameWindow();

        const [currentInventory, currentPlayer] = await Promise.all([
            getPlayerInventory().catch(() => null),
            getPlayerData().catch(() => null)
        ]);

        // Events received while fetching are newer
        inventory ??= currentInventory;
        player ??= currentPlayer;
    });
</script>

<svelte:window bind:innerHeight onresize={updateGameWindow}/>

<div
        class="inventory-overlay"
        style={`--panel-half: ${panelWidth / 2}px; --slot: ${slot}px;`}
>
    <div class="brand-strip">
        <span class="brand-mark"><PrestigeMark size={24}/></span>
        <span class="brand-copy">
            <span class="brand-name">Prestige<span>Bounce</span></span>
            <span class="brand-sub">Inventory</span>
        </span>
    </div>

    <div class="live-chip">
        <span class="live-dot"></span>
        Live inventory
    </div>

    {#if gameWindow && panelWidth > 0}
        <div class="frame-head" style={`left: ${panelLeft}px; top: ${panelTop - 34}px; width: ${panelWidth}px;`}>
            <div class="frame-title">
                <span class="frame-eyebrow">Container</span>
                <span class="frame-player">{player?.username ?? "Player"}</span>
            </div>
            <span class="frame-meta">{dimensionName()} · {gameModeName()}</span>
        </div>

        <div
                class="inventory-frame"
                style={`left: ${panelLeft}px; top: ${panelTop}px; width: ${panelWidth}px; height: ${panelHeight}px;`}
        >
            <span class="corner top-left"></span>
            <span class="corner top-right"></span>
            <span class="corner bottom-left"></span>
            <span class="corner bottom-right"></span>

            <span
                    class="selected-slot"
                    style={`left: ${(8 + selected * 18) * guiPixel}px; top: ${142 * guiPixel}px; width: ${slot}px; height: ${slot}px;`}
            ></span>
        </div>
    {/if}

    <aside class="rail rail-left">
        <div class="rail-card player-card">
            <div class="card-label">Player</div>

            <div class="identity">
                <span class="monogram">{monogram}</span>
                <div class="identity-copy">
                    <div class="player-name">{player?.username ?? "Loading…"}</div>
                    <div class="player-sub">{dimensionName()} · {gameModeName()}</div>
                </div>
            </div>

            <div class="vitals">
                <div class="vital">
                    <div class="vital-head">
                        <span><Icon name="heart" size={12}/> Health</span>
                        <b>{player ? `${Math.ceil(player.health)} / ${Math.ceil(player.maxHealth)}` : "—"}</b>
                    </div>
                    <div class="bar health"><span style={`width: ${healthPercent}%`}></span></div>
                </div>

                <div class="vital">
                    <div class="vital-head">
                        <span><Icon name="food" size={12}/> Food</span>
                        <b>{player ? player.food : "—"}</b>
                    </div>
                    <div class="bar food"><span style={`width: ${foodPercent}%`}></span></div>
                </div>

                <div class="vital">
                    <div class="vital-head">
                        <span><Icon name="sparkles" size={12}/> Experience</span>
                        <b>{player ? `Lv ${player.experienceLevel}` : "—"}</b>
                    </div>
                    <div class="bar xp"><span style={`width: ${xpPercent}%`}></span></div>
                </div>
            </div>

            <div class="stat-grid">
                <div class="stat">
                    <Icon name="shield" size={13}/>
                    <span>Armor</span>
                    <b>{player?.armor ?? "—"}</b>
                </div>
                <div class="stat">
                    <Icon name="activity" size={13}/>
                    <span>Effects</span>
                    <b>{player?.effects?.length ?? 0}</b>
                </div>
                <div class="stat wide">
                    <Icon name="map-pin" size={13}/>
                    <span>Position</span>
                    <b>{coordinates()}</b>
                </div>
            </div>
        </div>
    </aside>

    <aside class="rail rail-right">
        <div class="rail-card ender-card">
            <div class="card-head">
                <div>
                    <div class="card-label">Ender Chest</div>
                    <div class="card-title">Stored items</div>
                </div>
                <span class="count-pill">{enderUsed}/27</span>
            </div>

            <div class="mini-grid">
                {#each Array(27) as _, index}
                    {@const stack = enderStacks[index]}
                    <div class="mini-slot" class:filled={isFilled(stack)}>
                        {#if isFilled(stack) && stack}
                            <img src={itemTextureUrl(stack.identifier)} alt="" loading="lazy">
                            {#if stackCount(stack)}
                                <span class="mini-count">{stackCount(stack)}</span>
                            {/if}
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="selected-item">
                <span class="selected-icon" class:filled={isFilled(selectedStack)}>
                    {#if isFilled(selectedStack) && selectedStack}
                        <img src={itemTextureUrl(selectedStack.identifier)} alt="">
                        {#if stackCount(selectedStack)}
                            <span class="mini-count">{stackCount(selectedStack)}</span>
                        {/if}
                    {/if}
                </span>
                <span class="selected-copy">
                    <span class="card-label">Selected slot</span>
                    <span class="selected-name">{stackLabel(selectedStack)}</span>
                </span>
            </div>
        </div>
    </aside>

    <div class="hint-bar">
        <span class="hint"><kbd>E</kbd> Close</span>
        <span class="hint-divider"></span>
        <span class="hint">Click to move items</span>
    </div>
</div>

<style lang="scss">
  .inventory-overlay {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    color: var(--claude-text, #f1f0fa);
    font-family: "Inter", sans-serif;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(58% 70% at 50% 50%, transparent 42%, rgba(2, 3, 9, .28) 100%),
        linear-gradient(180deg, rgba(4, 6, 14, .26), transparent 20%, transparent 80%, rgba(4, 6, 14, .28));
    }
  }

  .brand-strip {
    position: fixed;
    top: 30px;
    left: 34px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mark {
    color: var(--claude-accent, #8b7cf6);
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--claude-accent, #8b7cf6) 25%, transparent));
  }

  .brand-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .brand-name {
    color: var(--claude-text-soft, #d9d7ea);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 15px;
    font-style: italic;
    font-weight: 600;
    letter-spacing: -.01em;
    line-height: 1;

    span {
      color: var(--claude-glint, #b2a6ff);
      font-weight: 500;
    }
  }

  .brand-sub {
    color: var(--claude-text-muted, #777594);
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 1.7px;
    text-transform: uppercase;
  }

  .live-chip {
    position: fixed;
    top: 32px;
    right: 34px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 10px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-card, #12162b) 52%, transparent);
    color: var(--claude-text-muted, #777594);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
  }

  .live-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #6fdc9a;
    box-shadow: 0 0 0 3px color-mix(in srgb, #6fdc9a 14%, transparent), 0 0 10px color-mix(in srgb, #6fdc9a 55%, transparent);
  }

  .frame-head {
    position: fixed;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 18%, transparent);
  }

  .frame-title {
    display: flex;
    align-items: baseline;
    gap: 9px;
    min-width: 0;
  }

  .frame-eyebrow {
    color: var(--claude-text-muted, #777594);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
  }

  .frame-player {
    overflow: hidden;
    color: var(--claude-text-soft, #d9d7ea);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -.01em;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .frame-meta {
    flex: none;
    color: var(--claude-text-muted, #777594);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: .5px;
    text-transform: capitalize;
  }

  .inventory-frame {
    position: fixed;
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 42%, transparent);
    border-radius: 2px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-card, #12162b) 30%, transparent), color-mix(in srgb, #070a17 18%, transparent)),
      radial-gradient(110% 80% at 50% 0%, color-mix(in srgb, var(--claude-accent, #8b7cf6) 12%, transparent), transparent 62%);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, .45),
      0 24px 70px rgba(0, 0, 0, .42),
      0 0 34px color-mix(in srgb, var(--claude-accent, #8b7cf6) 10%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, .06);
  }

  .corner {
    position: absolute;
    width: 13px;
    height: 13px;
    border: 1px solid var(--claude-accent, #8b7cf6);
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--claude-accent, #8b7cf6) 45%, transparent));

    &.top-left {
      top: -5px;
      left: -5px;
      border-right: none;
      border-bottom: none;
    }

    &.top-right {
      top: -5px;
      right: -5px;
      border-left: none;
      border-bottom: none;
    }

    &.bottom-left {
      bottom: -5px;
      left: -5px;
      border-right: none;
      border-top: none;
    }

    &.bottom-right {
      right: -5px;
      bottom: -5px;
      border-left: none;
      border-top: none;
    }
  }

  .selected-slot {
    position: absolute;
    border: 1px solid var(--claude-glint, #b2a6ff);
    border-radius: 2px;
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--claude-accent, #8b7cf6) 55%, transparent),
      0 0 12px color-mix(in srgb, var(--claude-accent, #8b7cf6) 55%, transparent),
      inset 0 0 8px color-mix(in srgb, var(--claude-accent, #8b7cf6) 20%, transparent);
    animation: slot-glow 2.8s ease-in-out infinite;
  }

  .rail {
    position: fixed;
    top: 50%;
    width: 256px;
    transform: translateY(-50%);
  }

  .rail-left {
    right: calc(50% + var(--panel-half) + 34px);
  }

  .rail-right {
    left: calc(50% + var(--panel-half) + 34px);
  }

  .rail-card {
    padding: 18px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 6.5%, transparent);
    border-radius: 13px;
    background:
      radial-gradient(110% 130% at 0% 0%, color-mix(in srgb, var(--claude-accent, #8b7cf6) 7%, transparent), transparent 58%),
      color-mix(in srgb, var(--claude-card, #12162b) 60%, transparent);
    box-shadow: 0 18px 44px rgba(0, 0, 0, .3), inset 0 1px 0 rgba(255, 255, 255, .035);
    backdrop-filter: blur(14px);
  }

  .card-label {
    color: var(--claude-text-muted, #777594);
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: 12px;
  }

  .monogram {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    flex: none;
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 30%, transparent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 11%, transparent);
    color: var(--claude-glint, #b2a6ff);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 20px;
    font-style: italic;
    font-weight: 600;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
  }

  .identity-copy {
    min-width: 0;
  }

  .player-name {
    overflow: hidden;
    color: var(--claude-text, #f1f0fa);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 21px;
    font-weight: 600;
    letter-spacing: -.02em;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .player-sub {
    margin-top: 2px;
    overflow: hidden;
    color: var(--claude-text-muted, #777594);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: .35px;
    text-transform: capitalize;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vitals {
    display: flex;
    flex-direction: column;
    gap: 11px;
    margin-top: 17px;
    padding-top: 15px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5.5%, transparent);
  }

  .vital-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: var(--claude-text-muted, #777594);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: .25px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    b {
      color: var(--claude-text-dim, #aeacc8);
      font-size: 9.5px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .bar {
    height: 3px;
    margin-top: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent);

    span {
      display: block;
      height: 100%;
      border-radius: inherit;
      transition: width .25s ease;
    }

    &.health span {
      background: linear-gradient(90deg, #d95364, #f28a95);
      box-shadow: 0 0 8px color-mix(in srgb, #f28a95 35%, transparent);
    }

    &.food span {
      background: linear-gradient(90deg, #c98a3a, #e5b96c);
    }

    &.xp span {
      background: linear-gradient(90deg, var(--claude-accent, #8b7cf6), var(--claude-glint, #b2a6ff));
      box-shadow: 0 0 8px color-mix(in srgb, var(--claude-accent, #8b7cf6) 32%, transparent);
    }
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
    margin-top: 16px;
    padding-top: 15px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5.5%, transparent);
  }

  .stat {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 7px 8px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5.5%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 2.5%, transparent);
    color: var(--claude-text-muted, #777594);

    &.wide {
      grid-column: 1 / -1;
    }

    span {
      overflow: hidden;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: .25px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    b {
      color: var(--claude-text-soft, #d9d7ea);
      font-size: 9.5px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .card-title {
    margin-top: 5px;
    color: var(--claude-text-soft, #d9d7ea);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -.02em;
    line-height: 1.05;
  }

  .count-pill {
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 25%, transparent);
    border-radius: 5px;
    background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 8%, transparent);
    color: var(--claude-glint, #b2a6ff);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .4px;
    font-variant-numeric: tabular-nums;
  }

  .mini-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 3px;
    margin-top: 14px;
    padding: 8px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5.5%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, #04060e 38%, transparent);
  }

  .mini-slot {
    position: relative;
    aspect-ratio: 1;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5%, transparent);
    border-radius: 2px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 2%, transparent);

    &.filled {
      border-color: color-mix(in srgb, var(--claude-accent, #8b7cf6) 18%, transparent);
      background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 5%, transparent);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }

    &.filled img {
      padding: 1px;
    }
  }

  .mini-count {
    position: absolute;
    right: 1px;
    bottom: 0;
    color: #f4f2ff;
    font-family: "Inter", monospace;
    font-size: 7px;
    font-weight: 700;
    line-height: 1;
    text-shadow: 1px 1px 2px #000, 0 0 4px #000;
    font-variant-numeric: tabular-nums;
  }

  .selected-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 13px;
    padding-top: 13px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5.5%, transparent);
  }

  .selected-icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 6.5%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 2.5%, transparent);

    &.filled {
      border-color: color-mix(in srgb, var(--claude-accent, #8b7cf6) 24%, transparent);
      background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 6%, transparent);
    }

    img {
      width: 100%;
      height: 100%;
      padding: 2px;
      object-fit: contain;
      image-rendering: pixelated;
    }
  }

  .selected-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .selected-name {
    overflow: hidden;
    color: var(--claude-text-soft, #d9d7ea);
    font-size: 11px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint-bar {
    position: fixed;
    bottom: 28px;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 7px 13px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 6%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-card, #12162b) 48%, transparent);
    color: var(--claude-text-muted, #777594);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: .25px;
    transform: translateX(-50%);
    backdrop-filter: blur(10px);
  }

  kbd {
    display: inline-grid;
    place-items: center;
    min-width: 17px;
    height: 17px;
    margin-right: 5px;
    padding: 0 4px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 14%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 5%, transparent);
    color: var(--claude-text-dim, #aeacc8);
    font-family: "Inter", sans-serif;
    font-size: 8.5px;
    font-weight: 700;
    line-height: 1;
  }

  .hint-divider {
    width: 1px;
    height: 10px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 10%, transparent);
  }

  @keyframes slot-glow {
    0%, 100% { box-shadow: 0 0 0 1px color-mix(in srgb, var(--claude-accent, #8b7cf6) 45%, transparent), 0 0 10px color-mix(in srgb, var(--claude-accent, #8b7cf6) 45%, transparent), inset 0 0 6px color-mix(in srgb, var(--claude-accent, #8b7cf6) 16%, transparent); }
    50% { box-shadow: 0 0 0 1px color-mix(in srgb, var(--claude-accent, #8b7cf6) 70%, transparent), 0 0 16px color-mix(in srgb, var(--claude-accent, #8b7cf6) 60%, transparent), inset 0 0 9px color-mix(in srgb, var(--claude-accent, #8b7cf6) 24%, transparent); }
  }

  @media (max-width: 1380px) {
    .rail {
      display: none;
    }
  }

  @media (max-height: 720px) {
    .frame-head {
      display: none;
    }

    .brand-strip {
      top: 20px;
      left: 22px;
    }

    .live-chip {
      top: 20px;
      right: 22px;
    }

    .hint-bar {
      bottom: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .selected-slot {
      animation: none;
    }
  }
</style>
