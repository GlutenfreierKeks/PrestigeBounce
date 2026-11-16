<script lang="ts">
    import {listen} from "../../../integration/ws";
    import type {PlayerData, Scoreboard, TextComponent as TTextComponent} from "../../../integration/types";
    import TextComponent from "../../menu/common/TextComponent.svelte";
    import type {ClientPlayerDataEvent} from "../../../integration/events";
    import {createGlobalRegex, replaceTextComponent} from "../../../util/regex_replace";
    import type {HudScoreboardSettings} from "../components";

    export let settings: { [name: string]: any };

    let cSettings: HudScoreboardSettings;

    $: cSettings = settings as HudScoreboardSettings;

    let scoreboard: Scoreboard | null = null;
    let replaceRegex: RegExp | null = null;
    let processedScoreboard: Scoreboard | null = null;

    $: replaceRegex = createGlobalRegex(cSettings?.replaceRegex);
    $: processedScoreboard = processScoreboard(scoreboard, replaceRegex, cSettings?.replaceWith ?? "");

    function processScoreboard(scoreboard: Scoreboard | null, regex: RegExp | null, replacement: string): Scoreboard | null {
        if (!scoreboard || !regex) {
            return scoreboard;
        }

        return {
            header: replaceTextComponent(scoreboard.header, regex, replacement) as TTextComponent,
            entries: scoreboard.entries.map(({name, score}) => ({
                name: replaceTextComponent(name, regex, replacement) as TTextComponent,
                score: replaceTextComponent(score, regex, replacement) as TTextComponent
            }))
        };
    }

    listen("clientPlayerData", (e: ClientPlayerDataEvent) => {
        const playerData: PlayerData = e.playerData;
        scoreboard = playerData.scoreboard;
    });
</script>

{#if processedScoreboard}
    <div class="scoreboard">
        {#if processedScoreboard.header && cSettings.show.includes('Header')}
            <div class="header">
                <span class="header-mark"></span>
                <TextComponent fontSize={12} allowPreformatting={true} textComponent={processedScoreboard.header}/>
            </div>
        {/if}
        <div class="entries">
            {#each processedScoreboard.entries as {name, score}}
                <div class="row">
                    {#if cSettings.show.includes('Name')}
                        <span class="name"><TextComponent fontSize={11} allowPreformatting={true} textComponent={name}/></span>
                    {/if}
                    {#if cSettings.show.includes('Score')}
                        <span class="score"><TextComponent fontSize={10} allowPreformatting={true} textComponent={score}/></span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}

<style lang="scss">

  .scoreboard {
    min-width: 154px;
    max-width: 260px;
    width: max-content;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background: var(--hud-surface);
    box-shadow: var(--hud-shadow);
    overflow: hidden;
    font-size: 11px;
  }

  .header {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--hud-text) 6%, transparent);
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--hud-accent) 10%, transparent), transparent 70%);
    color: var(--hud-text);
    font-weight: 650;
    letter-spacing: .2px;
  }

  .header-mark {
    width: 2px;
    height: 11px;
    flex: none;
    border-radius: 2px;
    background: var(--hud-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--hud-accent) 60%, transparent);
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 5px 10px 6px;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 13px;
    padding: 1px 0;
    line-height: 1.2;

    & + .row {
      border-top: 1px solid color-mix(in srgb, var(--hud-text) 3.5%, transparent);
    }
  }

  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--hud-text-soft);
  }

  .score {
    flex: none;
    color: var(--hud-text-muted);
    font-variant-numeric: tabular-nums;
  }
</style>
