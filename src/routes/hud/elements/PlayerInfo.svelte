<script lang="ts">
    import {onMount} from "svelte";
    import {listen} from "../../../integration/ws";
    import {getPlayerData} from "../../../integration/rest";
    import {REST_BASE} from "../../../integration/host";
    import type {ClientPlayerDataEvent} from "../../../integration/events";
    import type {PlayerData} from "../../../integration/types";
    import Icon from "../../clickgui/claude/Icon.svelte";
    import type {HudPlayerInfoSettings} from "../components";

    export let settings: { [name: string]: any } = {};

    let cSettings: HudPlayerInfoSettings;
    let player: PlayerData | null = null;

    $: cSettings = settings as HudPlayerInfoSettings;
    $: healthPercent = player ? Math.max(0, Math.min(1, player.actualHealth / Math.max(player.maxHealth, 1))) : 0;
    $: tone = healthPercent > .6 ? "good" : healthPercent > .3 ? "okay" : "bad";

    onMount(async () => {
        try {
            player = await getPlayerData();
        } catch {
            // Not in a world yet.
        }
    });

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        player = event.playerData;
    });
</script>

{#if player}
    <div class="player-info">
        {#if cSettings.showSkin !== false}
            <div class="avatar">
                <img src="{REST_BASE}/api/v1/client/resource/skin?uuid={player.uuid}" alt="avatar"/>
            </div>
        {/if}

        <div class="identity">
            <div class="name-row">
                <span class="name">{player.username}</span>
                {#if cSettings.showGameMode && player.gameMode}
                    <span class="mode">{player.gameMode}</span>
                {/if}
            </div>

            {#if cSettings.showHealth !== false}
                <div class="health {tone}">
                    <Icon name="heart" size={9}/>
                    <span class="health-value">{Math.ceil(player.actualHealth)}</span>
                    <span class="health-max">/ {Math.ceil(player.maxHealth)}</span>
                    <span class="health-bar"><span class="fill" style="width: {healthPercent * 100}%"></span></span>
                </div>
            {/if}
        </div>

        {#if cSettings.showArmor !== false}
            <div class="armor" title="Armor points">
                <Icon name="shield" size={10}/>
                <span>{Math.floor(player.armor)}</span>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
  .player-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 172px;
    max-width: 238px;
    padding: 7px 9px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background:
      linear-gradient(120deg, color-mix(in srgb, var(--hud-accent) 6%, transparent), transparent 56%),
      var(--hud-surface);
    box-shadow: var(--hud-shadow);
  }

  .avatar {
    position: relative;
    width: 32px;
    height: 32px;
    flex: none;
    border: 1px solid color-mix(in srgb, var(--hud-text) 9%, transparent);
    border-radius: 6px;
    background-image: url("/img/steve.png");
    background-size: cover;
    image-rendering: pixelated;
    overflow: hidden;

    img {
      position: absolute;
      width: 800%;
      left: -100%;
      top: -100%;
    }
  }

  .identity {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }

  .name {
    overflow: hidden;
    color: var(--hud-text);
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: .1px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mode {
    flex: none;
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--hud-text-muted);
    background: color-mix(in srgb, var(--hud-text) 5%, transparent);
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: .45px;
    text-transform: uppercase;
  }

  .health {
    --tone: #74d39a;

    display: flex;
    align-items: center;
    gap: 3px;
    min-width: 0;
    color: var(--hud-text-muted);
    font-size: 8px;
    font-variant-numeric: tabular-nums;

    :global(svg) {
      color: #ff7785;
    }

    &.good { --tone: #74d39a; }
    &.okay { --tone: #e8c96a; }
    &.bad { --tone: #ef6d78; }
  }

  .health-value {
    color: var(--hud-text-soft);
    font-size: 9.5px;
    font-weight: 650;
  }

  .health-max {
    font-size: 8px;
  }

  .health-bar {
    flex: 1;
    height: 3px;
    margin-left: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--hud-text) 8%, transparent);
    overflow: hidden;
  }

  .fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--tone);
    box-shadow: 0 0 6px color-mix(in srgb, var(--tone) 45%, transparent);
    transition: width .3s ease;
  }

  .armor {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex: none;
    padding: 3px 5px;
    border-radius: 4px;
    background: color-mix(in srgb, #93bdff 8%, transparent);
    color: #b9d4ff;
    font-size: 9px;
    font-weight: 650;
    font-variant-numeric: tabular-nums;

    :global(svg) {
      color: #93bdff;
    }
  }
</style>
