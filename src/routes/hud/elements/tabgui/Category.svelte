<script lang="ts">
    import {fade} from "svelte/transition";

    export let name: string;
    export let selected: boolean;

    $: iconPath = `img/hud/tabgui/${name.toLowerCase()}.svg`;
</script>

<div class="category" class:selected>
    <div class="icon">
        <span
            class="category-icon"
            aria-hidden="true"
            transition:fade={{ duration: 200 }}
            style={`mask-image: url('${location.origin}${location.pathname}/${iconPath}');`}
        >
            <img class="category-icon-size" src={iconPath} alt="" />
        </span>
    </div>
    <div class="name">
        {name}
    </div>
</div>

<style lang="scss">

    .name {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
        font-weight: 550;
        color: var(--hud-text-dim);
        font-size: 11.5px;
        letter-spacing: .1px;
        padding: 7px 12px 7px 9px;
        background: transparent;
        transition: color .16s ease, background-color .16s ease;

        &::before {
          content: "";
          position: absolute;
          top: 6px;
          bottom: 6px;
          left: 0;
          width: 2px;
          border-radius: 0 2px 2px 0;
          background: transparent;
          transition: background-color .16s ease;
        }
    }

    .category {
        display: flex;
        position: relative;

        & + :global(.category) {
          border-top: 1px solid color-mix(in srgb, var(--hud-text) 3.5%, transparent);
        }

        &.selected {
          .icon {
            color: var(--hud-accent);
            background: color-mix(in srgb, var(--hud-accent) 9%, transparent);
          }

          .name {
            color: var(--hud-text);
            background: linear-gradient(90deg, color-mix(in srgb, var(--hud-accent) 15%, transparent), color-mix(in srgb, var(--hud-accent) 3%, transparent));

            &::before {
              background: var(--hud-accent);
              box-shadow: 0 0 8px color-mix(in srgb, var(--hud-accent) 60%, transparent);
            }
          }
        }
    }

    .icon {
        color: var(--hud-text-muted);
        width: 39px;
        min-height: 30px;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--hud-text) 3%, transparent);
        transition: color 0.2s ease-out, background-color .16s ease;
    }

    .category-icon {
        display: inline-block;
        width: 15px;
        height: 15px;
        background-color: currentColor;
        mask-position: center;
        mask-repeat: no-repeat;
        mask-size: contain;
    }

    .category-icon-size {
        display: block;
        width: 15px;
        height: 15px;
        visibility: hidden;
    }
</style>
