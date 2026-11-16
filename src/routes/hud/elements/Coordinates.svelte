<script lang="ts">
    import {onMount} from "svelte";
    import {listen} from "../../../integration/ws";
    import {getPlayerData} from "../../../integration/rest";
    import type {ClientPlayerDataEvent} from "../../../integration/events";
    import type {PlayerData} from "../../../integration/types";
    import Icon from "../../clickgui/claude/Icon.svelte";
    import type {HudCoordinatesSettings} from "../components";

    export let settings: { [name: string]: any } = {};

    let cSettings: HudCoordinatesSettings;
    let player: PlayerData | null = null;

    $: cSettings = settings as HudCoordinatesSettings;
    $: decimals = Math.max(0, Math.min(3, cSettings.decimals ?? 0));
    $: dimension = dimensionName(player?.dimension);
    $: facing = facingName(player?.yaw ?? 0);
    $: inNether = (player?.dimension ?? "").includes("nether");
    $: converted = player?.netherPosition;

    function format(value: number): string {
        return decimals === 0 ? `${Math.round(value)}` : value.toFixed(decimals);
    }

    function dimensionName(id: string | undefined): string {
        if (!id) return "World";
        const key = id.includes(":") ? id.split(":").pop()! : id;

        switch (key) {
            case "overworld":
                return "Overworld";
            case "the_nether":
                return "Nether";
            case "the_end":
                return "The End";
            default:
                return key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, character => character.toUpperCase());
        }
    }

    function facingName(yaw: number): string {
        const directions = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"];
        const normalized = ((yaw % 360) + 360) % 360;
        return directions[Math.round(normalized / 45) % 8];
    }

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
    <div class="coordinates">
        <div class="header">
            {#if cSettings.showDimension !== false}
                <span class="dimension"><Icon name="map-pin" size={10}/> {dimension}</span>
            {/if}
            <span class="facing">{facing}</span>
        </div>

        <div class="axes">
            <span class="axis x"><em>X</em><b>{format(player.position.x)}</b></span>
            <span class="axis y"><em>Y</em><b>{format(player.position.y)}</b></span>
            <span class="axis z"><em>Z</em><b>{format(player.position.z)}</b></span>
        </div>

        {#if cSettings.showNetherCoords && converted}
            <div class="converted">
                <span class="converted-label">{inNether ? "Overworld" : "Nether"}</span>
                <span class="converted-value">{format(converted.x)} / {format(converted.y)} / {format(converted.z)}</span>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
  .coordinates {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 154px;
    padding: 7px 9px 8px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background:
      linear-gradient(120deg, color-mix(in srgb, var(--hud-accent) 6%, transparent), transparent 56%),
      var(--hud-surface);
    box-shadow: var(--hud-shadow);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .dimension {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--hud-text-muted);
    font-size: 7.5px;
    font-weight: 650;
    letter-spacing: .75px;
    text-transform: uppercase;

    :global(svg) {
      color: var(--hud-accent);
    }
  }

  .facing {
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--hud-text-dim);
    background: color-mix(in srgb, var(--hud-text) 5%, transparent);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: .45px;
  }

  .axes {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .axis {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    min-width: 0;

    em {
      font-size: 7.5px;
      font-style: normal;
      font-weight: 700;
      letter-spacing: .3px;
    }

    b {
      color: var(--hud-text);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: -.1px;
      font-variant-numeric: tabular-nums;
    }

    &.x em { color: #ff8a95; }
    &.y em { color: #74d39a; }
    &.z em { color: #93bdff; }
  }

  .converted {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 5px;
    border-top: 1px solid color-mix(in srgb, var(--hud-text) 5%, transparent);
    color: var(--hud-text-muted);
    font-size: 8px;
    font-variant-numeric: tabular-nums;
  }

  .converted-label {
    font-size: 7px;
    font-weight: 650;
    letter-spacing: .7px;
    text-transform: uppercase;
  }

  .converted-value {
    color: var(--hud-text-dim);
  }
</style>
