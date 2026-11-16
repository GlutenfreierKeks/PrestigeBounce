<script lang="ts">
    import {listen} from "../../../integration/ws";
    import {fly} from "svelte/transition";
    import {mapToColor} from "../../../util/color_utils";
    import {itemTextureUrl} from "../../../integration/rest";
    import type {HudBlockCounterSettings} from "../components";

    export let settings: { [name: string]: any };

    let cSettings: HudBlockCounterSettings;

    $: cSettings = settings as HudBlockCounterSettings;

    let nextBlock: string | undefined = undefined;
    let count: number | undefined = undefined;

    listen("blockCountChange", (data) => {
        nextBlock = data.nextBlock;
        count = data.count;
    });

    const FLEX_DIRECTION = {
        None: "row",
        Left: "row",
        Right: "row-reverse",
        Top: "column",
        Bottom: "column-reverse",
    };
</script>

{#if count !== undefined}
    <div
            class="counter"
            style="--tone: {mapToColor(count)}; flex-direction: {FLEX_DIRECTION[cSettings.iconPosition] ?? 'row'}"
            in:fly={{ y: -5, duration: 200 }}
            out:fly={{ y: -5, duration: 200 }}
    >
        {#if nextBlock && cSettings.iconPosition !== "None"}
            <span class="icon"><img src={itemTextureUrl(nextBlock)} alt={nextBlock}/></span>
        {/if}
        <span class="value">{count}</span>
    </div>
{/if}

<style lang="scss">

  .counter {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    width: fit-content;
    padding: 5px 9px;
    border: 1px solid var(--hud-border);
    border-radius: 7px;
    background:
      linear-gradient(120deg, color-mix(in srgb, var(--tone) 9%, transparent), transparent 62%),
      var(--hud-surface);
    box-shadow: 0 8px 20px rgba(0, 0, 0, .26);
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: .1px;
    color: var(--tone);
    text-shadow: 0 1px 8px color-mix(in srgb, var(--tone) 30%, transparent);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    flex: none;

    img {
      width: 20px;
      height: 20px;
      image-rendering: pixelated;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .4));
    }
  }

  .value {
    line-height: 1;
  }
</style>
