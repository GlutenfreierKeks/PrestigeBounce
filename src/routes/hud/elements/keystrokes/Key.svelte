<script lang="ts">
    import {listen} from "../../../../integration/ws";
    import type {KeyEvent} from "../../../../integration/events";
    import type {MinecraftKeybind} from "../../../../integration/types";

    export let gridArea: string;
    export let key: MinecraftKeybind | undefined;
    export let compact = false;

    let active = false;

    listen("key", (e: KeyEvent) => {
        if (e.key !== key?.key.translationKey) {
            return;
        }

        active = e.action === 1 || e.action === -1;
    });
</script>

<div class="key" class:active class:compact style="grid-area: {gridArea};">
    <span class="cap">{key?.key.localized ?? "?"}</span>
</div>

<style lang="scss">
  .key {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    border: 1px solid var(--hud-border);
    border-radius: 8px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--hud-text) 5%, transparent), transparent 44%),
      var(--hud-surface);
    color: var(--hud-text-dim);
    box-shadow:
      inset 0 -2px 0 rgba(0, 0, 0, .26),
      0 1px 0 rgba(255, 255, 255, .035);
    overflow: hidden;
    transition:
      background-color .12s ease,
      border-color .12s ease,
      color .12s ease,
      box-shadow .16s ease,
      transform .1s ease;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 8px;
      right: 8px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .09), transparent);
    }

    &.compact {
      height: 30px;
      border-radius: 6px;

      .cap {
        font-size: 8px;
        letter-spacing: .75px;
      }
    }

    &.active {
      color: #fff;
      border-color: var(--hud-accent-line);
      background:
        linear-gradient(165deg, color-mix(in srgb, var(--hud-accent) 74%, white 6%), color-mix(in srgb, var(--hud-accent) 42%, #1a1438));
      box-shadow:
        inset 0 -2px 0 rgba(0, 0, 0, .2),
        0 0 16px color-mix(in srgb, var(--hud-accent) 38%, transparent);
      transform: translateY(1px);

      .cap {
        text-shadow: 0 1px 4px rgba(0, 0, 0, .35);
      }
    }
  }

  .cap {
    position: relative;
    z-index: 1;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: .2px;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 86%;
  }
</style>
