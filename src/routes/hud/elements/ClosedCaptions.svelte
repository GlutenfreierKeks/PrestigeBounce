<script lang="ts">
    import {listen} from "../../../integration/ws";
    import type {ClosedCaptionEntry, ClosedCaptionsEvent} from "../../../integration/events";
    import TextComponent from "../../menu/common/TextComponent.svelte";
    import {intToHex} from "../../../integration/util";

    let entries: ClosedCaptionEntry[] = [];

    listen("closedCaptions", (event: ClosedCaptionsEvent) => {
        entries = event.entries;
    });
</script>

{#if entries.length > 0}
    <div class="closed-captions">
        {#each entries as entry}
            <div
                    class="closed-caption-entry"
                    style:color={intToHex(entry.textColor)}
                    style:background-color={intToHex(entry.backgroundColor)}
            >
                <span class="arrow" class:visible={entry.direction === "LEFT"}>&lt;</span>
                <span class="text">
                    {#if typeof entry.text === "string"}
                        {entry.text}
                    {:else}
                        <TextComponent
                                fontSize={11.5}
                                textComponent={entry.text}
                                inheritedColor={intToHex(entry.textColor)}
                        />
                    {/if}
                </span>

                <span class="arrow" class:visible={entry.direction === "RIGHT"}>&gt;</span>
            </div>
        {/each}
    </div>
{/if}

<style lang="scss">
  .closed-captions {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 3px;
    filter: drop-shadow(0 6px 16px rgba(0, 0, 0, .32));
  }

  .closed-caption-entry {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border: 1px solid var(--hud-border);
    border-radius: 5px;
    font-weight: 600;
    font-size: 11.5px;
    letter-spacing: .1px;
    line-height: 1.25;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .035);
    backdrop-filter: blur(6px);
  }

  .arrow {
    font-weight: 700;
    color: var(--hud-accent);
    visibility: hidden;

    &.visible {
      visibility: visible;
    }
  }
</style>
