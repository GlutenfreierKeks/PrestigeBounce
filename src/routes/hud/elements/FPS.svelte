<script lang="ts">
    import {onMount} from "svelte";
    import {listen} from "../../../integration/ws";
    import {getClientInfo} from "../../../integration/rest";
    import type {FpsChangeEvent} from "../../../integration/events";
    import type {HudFpsSettings} from "../components";

    export let settings: { [name: string]: any } = {};

    let cSettings: HudFpsSettings;
    let fps = 0;
    let history: number[] = [];

    $: cSettings = settings as HudFpsSettings;

    $: maxValue = Math.max(60, ...history);
    $: points = history.length > 1
        ? history.map((value, index) =>
            `${(index / (history.length - 1)) * 100},${22 - (value / maxValue) * 20}`).join(" ")
        : "";
    $: areaPoints = points ? `0,22 ${points} 100,22` : "";
    $: tone = fps <= 0 ? "muted" : fps >= 90 ? "good" : fps >= 45 ? "okay" : "bad";

    function push(value: number) {
        history = [...history.slice(-47), value];
    }

    onMount(async () => {
        try {
            const info = await getClientInfo();
            if (info.fps) {
                fps = info.fps;
                push(info.fps);
            }
        } catch {
            // The FPS event will populate this once the game is running.
        }
    });

    listen("fps", (event: FpsChangeEvent) => {
        fps = event.fps;
        push(event.fps);
    });
</script>

<div class="fps {tone}">
    <div class="topline">
        {#if cSettings.showLabel !== false}
            <span class="label">FPS</span>
        {/if}
        <span class="value">{fps}</span>
    </div>

    {#if cSettings.showGraph !== false}
        <svg class="graph" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="fps-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="currentColor" stop-opacity=".28"/>
                    <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
                </linearGradient>
            </defs>
            {#if areaPoints}
                <polygon points={areaPoints} fill="url(#fps-area-gradient)"/>
                <polyline points={points} fill="none" stroke="currentColor" stroke-width="1.3"
                          stroke-linecap="round" stroke-linejoin="round"/>
            {/if}
        </svg>
    {/if}
</div>

<style lang="scss">
  .fps {
    --tone: var(--hud-text-soft);

    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 92px;
    padding: 7px 9px 7px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background:
      linear-gradient(120deg, color-mix(in srgb, var(--tone) 7%, transparent), transparent 58%),
      var(--hud-surface);
    box-shadow: var(--hud-shadow);
    color: var(--tone);

    &.good { --tone: #74d39a; }
    &.okay { --tone: #e8c96a; }
    &.bad { --tone: #ef7f8a; }
    &.muted { --tone: var(--hud-text-muted); }
  }

  .topline {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .label {
    color: var(--hud-text-muted);
    font-size: 7px;
    font-weight: 650;
    letter-spacing: 1.05px;
    text-transform: uppercase;
  }

  .value {
    margin-left: auto;
    color: var(--hud-text);
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -.35px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .graph {
    display: block;
    width: 100%;
    height: 16px;
    color: var(--tone);
    overflow: visible;
  }
</style>
