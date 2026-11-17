<script lang="ts">
    import {onDestroy, onMount} from "svelte";
    import PrestigeWordmark from "../../../components/PrestigeWordmark.svelte";
    import Icon from "../../clickgui/claude/Icon.svelte";
    import {getClientInfo, getConnectionDetails, getPlayerData} from "../../../integration/rest";
    import {listen} from "../../../integration/ws";
    import type {ClientPlayerDataEvent, FpsChangeEvent} from "../../../integration/events";
    import type {HudWatermarkSettings} from "../components";

    export let settings: { [name: string]: any } = {};

    let cSettings: HudWatermarkSettings;
    let fps = 0;
    let ping: number | null = null;
    let server: string | null = null;
    let time = "";
    let timer: ReturnType<typeof setInterval> | undefined;

    $: cSettings = settings as HudWatermarkSettings;

    function formatTime(date: Date): string {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");

        if (cSettings.timeFormat === "12h") {
            const suffix = hours >= 12 ? "PM" : "AM";
            return `${((hours + 11) % 12) + 1}:${minutes} ${suffix}`;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    }

    function tickClock() {
        time = formatTime(new Date());
    }

    onMount(async () => {
        tickClock();
        timer = setInterval(tickClock, 1000);

        try {
            const info = await getClientInfo();
            if (!fps) fps = info.fps ?? 0;
        } catch (error) {
            console.warn("[PrestigeBounce] Could not load client info for watermark", error);
        }

        try {
            const player = await getPlayerData();
            if (player && player.ping !== undefined) ping = player.ping;
        } catch {
            // Not in a world yet. The websocket will fill this in later.
        }

        try {
            const connection = await getConnectionDetails();
            server = connection?.serverAddress ?? null;
        } catch {
            server = null;
        }
    });

    onDestroy(() => {
        if (timer !== undefined) clearInterval(timer);
    });

    listen("fps", (event: FpsChangeEvent) => {
        fps = event.fps;
    });

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        if (event.playerData.ping !== undefined) {
            ping = event.playerData.ping;
        }
    });

    function pingTone(value: number | null): string {
        if (value === null) return "muted";
        if (value <= 60) return "good";
        if (value <= 130) return "okay";
        return "bad";
    }
</script>

<div class="watermark">
    <span class="brand-mark"><Icon name="crown" size={11}/></span>
    <div class="brand">
        <PrestigeWordmark size={17} tag={false}/>
        <span class="client-tag">Theme</span>
    </div>

    <span class="divider"></span>

    <div class="stats">
        {#if cSettings.showFps !== false}
            <span class="stat" title="Frames per second">
                <Icon name="activity" size={11}/>
                <b>{fps}</b>
                <em>fps</em>
            </span>
        {/if}

        {#if cSettings.showPing !== false && ping !== null}
            <span class="stat ping {pingTone(ping)}" title="Connection latency">
                <span class="ping-dot"></span>
                <b>{ping}</b>
                <em>ms</em>
            </span>
        {/if}

        {#if cSettings.showTime !== false}
            <span class="stat" title="Local time">
                <Icon name="clock" size={11}/>
                <b class="time">{time}</b>
            </span>
        {/if}

        {#if cSettings.showServer !== false && server}
            <span class="stat server" title={server}>
                <Icon name="server" size={11}/>
                <b>{server}</b>
            </span>
        {/if}
    </div>
</div>

<style lang="scss">
  .watermark {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    height: 32px;
    padding: 0 11px 0 8px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background:
      linear-gradient(120deg, color-mix(in srgb, var(--hud-accent) 7%, transparent), transparent 42%),
      var(--hud-surface);
    box-shadow: var(--hud-shadow);
    color: var(--hud-text-soft);
    white-space: nowrap;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 10px;
      width: 46px;
      height: 1px;
      background: linear-gradient(90deg, var(--hud-accent), transparent);
      opacity: .85;
    }

    &::after {
      content: "";
      position: absolute;
      top: -45%;
      bottom: -45%;
      left: -50%;
      width: 46%;
      pointer-events: none;
      background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--hud-text) 7%, transparent), transparent);
      transform: translateX(-160%) skewX(-18deg);
      animation: watermark-sheen 7.2s ease-in-out infinite;
    }
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    flex: none;
    border-radius: 50%;
    color: #f5eeff;
    background: linear-gradient(160deg, color-mix(in srgb, var(--hud-accent) 92%, white), color-mix(in srgb, var(--hud-accent) 58%, #251e5c));
    box-shadow: 0 0 12px color-mix(in srgb, var(--hud-accent) 36%, transparent);
    animation: mark-breathe 5s ease-in-out infinite;
  }

  .brand {
    display: flex;
    align-items: baseline;
    gap: 5px;
    min-width: 0;

    :global(.claude-wordmark) {
      color: var(--hud-text);
    }
  }

  .client-tag {
    color: var(--hud-text-muted);
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: 1.15px;
    text-transform: uppercase;
  }

  .divider {
    width: 1px;
    height: 14px;
    flex: none;
    background: color-mix(in srgb, var(--hud-text) 9%, transparent);
  }

  .stats {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--hud-text-dim);
    font-size: 9px;
    font-variant-numeric: tabular-nums;
    transition: color .3s ease;

    :global(svg) {
      color: color-mix(in srgb, var(--hud-text-muted) 88%, transparent);
    }

    b {
      color: var(--hud-text-soft);
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: .1px;
    }

    em {
      color: var(--hud-text-muted);
      font-size: 8px;
      font-style: normal;
      font-weight: 500;
      letter-spacing: .3px;
      text-transform: uppercase;
    }

    .time {
      letter-spacing: .3px;
      font-variant-numeric: tabular-nums;
    }
  }

  .ping {
    .ping-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 7px currentColor;
      animation: ping-dot-pulse 2.6s ease-in-out infinite;
    }

    &.good { color: #74d39a; }
    &.okay { color: #e8c96a; }
    &.bad { color: #ef7f8a; }
    &.muted { color: var(--hud-text-muted); }

    &.good b, &.okay b, &.bad b, &.muted b {
      color: inherit;
    }
  }

  .server {
    max-width: 158px;

    b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      color: var(--hud-text-dim);
    }
  }

  @keyframes watermark-sheen {
    0%, 62% { transform: translateX(-160%) skewX(-18deg); opacity: 0; }
    70% { opacity: .85; }
    92%, 100% { transform: translateX(340%) skewX(-18deg); opacity: 0; }
  }

  @keyframes mark-breathe {
    0%, 100% { box-shadow: 0 0 10px color-mix(in srgb, var(--hud-accent) 26%, transparent); }
    50% { box-shadow: 0 0 18px color-mix(in srgb, var(--hud-accent) 48%, transparent); }
  }

  @keyframes ping-dot-pulse {
    0%, 100% { transform: scale(1); opacity: .82; }
    50% { transform: scale(1.35); opacity: 1; }
  }
</style>
