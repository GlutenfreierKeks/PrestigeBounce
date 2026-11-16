<script lang="ts">
    import {onMount} from "svelte";
    import {listen} from "../../../integration/ws";
    import {getPlayerData} from "../../../integration/rest";
    import type {ClientPlayerDataEvent} from "../../../integration/events";
    import type {HudPingSettings} from "../components";

    export let settings: { [name: string]: any } = {};

    let cSettings: HudPingSettings;
    let ping: number | null = null;

    $: cSettings = settings as HudPingSettings;
    $: tone = ping === null ? "muted" : ping <= 50 ? "good" : ping <= 110 ? "okay" : "bad";
    $: bars = ping === null ? 0 : ping <= 40 ? 4 : ping <= 80 ? 3 : ping <= 140 ? 2 : 1;

    onMount(async () => {
        try {
            const player = await getPlayerData();
            if (player && player.ping !== undefined) ping = player.ping;
        } catch {
            // Not in a world yet.
        }
    });

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        if (event.playerData.ping !== undefined) {
            ping = event.playerData.ping;
        }
    });
</script>

<div class="ping {tone}">
    {#if cSettings.showLabel !== false}
        <span class="label">Ping</span>
    {/if}
    <div class="reading">
        <span class="value">{ping ?? "—"}</span>
        {#if ping !== null}<span class="unit">ms</span>{/if}
    </div>
    {#if cSettings.showBars !== false}
        <div class="bars" aria-hidden="true">
            {#each [1, 2, 3, 4] as bar}
                <span class:active={bar <= bars} style="height: {bar * 3 + 3}px"></span>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
  .ping {
    --tone: var(--hud-text-muted);

    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-width: 88px;
    padding: 7px 9px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background:
      linear-gradient(120deg, color-mix(in srgb, var(--tone) 7%, transparent), transparent 58%),
      var(--hud-surface);
    box-shadow: var(--hud-shadow);

    &.good { --tone: #74d39a; }
    &.okay { --tone: #e8c96a; }
    &.bad { --tone: #ef7f8a; }
    &.muted { --tone: var(--hud-text-muted); }
  }

  .label {
    color: var(--hud-text-muted);
    font-size: 7px;
    font-weight: 650;
    letter-spacing: 1.05px;
    text-transform: uppercase;
  }

  .reading {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-left: auto;
  }

  .value {
    color: var(--hud-text);
    font-size: 13px;
    font-weight: 650;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    color: var(--hud-text-muted);
    font-size: 7.5px;
    font-weight: 550;
    text-transform: uppercase;
  }

  .bars {
    display: flex;
    align-items: flex-end;
    gap: 1.5px;
    height: 15px;

    span {
      width: 2.5px;
      border-radius: 1px;
      background: color-mix(in srgb, var(--hud-text) 14%, transparent);
      transition: background-color .18s ease, box-shadow .18s ease;

      &.active {
        background: var(--tone);
        box-shadow: 0 0 5px color-mix(in srgb, var(--tone) 45%, transparent);
      }
    }
  }
</style>
