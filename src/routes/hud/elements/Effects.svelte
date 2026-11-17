<script lang="ts">
    import {listen} from "../../../integration/ws";
    import type {ClientPlayerDataEvent, ClientPlayerEffectEvent} from "../../../integration/events";
    import type {StatusEffect} from "../../../integration/types";
    import {effectTextureUrl} from "../../../integration/rest";
    import Icon from "../../clickgui/claude/Icon.svelte";
    import {flip} from "svelte/animate";
    import {fly} from "svelte/transition";

    let effects: StatusEffect[] = [];

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        effects = event.playerData.effects;
    });

    listen("clientPlayerEffect", (event: ClientPlayerEffectEvent) => {
        effects = event.effects;
    });

    function formatTime(duration: number): string {
        if (duration === -1) {
            return "∞";
        }

        const totalSeconds = Math.floor(duration / 20);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function formatAmplifier(n: number): string {
        return n < 1 ? "" : (n + 1).toString();
    }
</script>

{#if effects.length > 0}
    <div class="effects">
        <div class="header">
            <span class="header-title"><Icon name="sparkles" size={10}/> Effects</span>
            <span class="header-count">{effects.length}</span>
        </div>
        <div class="list">
            {#each effects as e (e.effect + ":" + e.amplifier)}
                <div
                        class="effect"
                        animate:flip={{duration: 200}}
                        transition:fly={{x: 14, duration: 180}}
                >
                    <span class="effect-icon">
                        <img src={effectTextureUrl(e.effect)} alt={e.localizedName}/>
                    </span>
                    <span class="name">{e.localizedName}</span>
                    {#if e.amplifier > 0}
                        <span class="amplifier">{formatAmplifier(e.amplifier)}</span>
                    {/if}
                    <span class="duration">{formatTime(e.duration)}</span>
                </div>
            {/each}
        </div>
    </div>
{/if}

<style lang="scss">

  .effects {
    min-width: 176px;
    max-width: 248px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background: var(--hud-surface);
    box-shadow: var(--hud-shadow);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 9px 6px;
    border-bottom: 1px solid color-mix(in srgb, var(--hud-text) 6%, transparent);
    background: linear-gradient(90deg, color-mix(in srgb, var(--hud-accent) 8%, transparent), transparent 72%);
  }

  .header-title {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--hud-text-dim);
    font-size: 7.5px;
    font-weight: 650;
    letter-spacing: 1.05px;
    text-transform: uppercase;

    :global(svg) {
      color: var(--hud-accent);
    }
  }

  .header-count {
    color: var(--hud-text-muted);
    font-size: 8px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .list {
    display: flex;
    flex-direction: column;
    padding: 4px;
    gap: 2px;
  }

  .effect {
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 23px;
    padding: 2px 5px;
    border-radius: 5px;
    font-size: 10.5px;
    font-weight: 550;
    transition: background-color .15s ease;

    &:hover {
      background: color-mix(in srgb, var(--hud-text) 4%, transparent);
    }
  }

  .effect-icon {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    flex: none;
    border-radius: 4px;
    background: color-mix(in srgb, var(--hud-text) 5%, transparent);

    img {
      width: 14px;
      height: 14px;
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    }
  }

  .name {
    min-width: 0;
    overflow: hidden;
    color: var(--hud-text-soft);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .amplifier {
    flex: none;
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--hud-accent);
    background: color-mix(in srgb, var(--hud-accent) 11%, transparent);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: .2px;
  }

  .duration {
    margin-left: auto;
    flex: none;
    color: var(--hud-text-muted);
    font-family: "Inter", monospace;
    font-size: 8.5px;
    font-weight: 550;
    font-variant-numeric: tabular-nums;
  }
</style>
