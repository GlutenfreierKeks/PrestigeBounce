<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import RippleLoader from "../RippleLoader.svelte";

    export let image: string;
    export let imageText: string | null = null;
    export let imageTextBackgroundColor: string | null = null;
    export let title: string;
    export let favorite = false;

    const dispatch = createEventDispatcher();

    let previewImageLoaded = false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="menu-list-item" on:dblclick={() => dispatch("dblclick")}>
    <div class="image">
        {#if !previewImageLoaded}
            <div class="loader">
                <RippleLoader />
            </div>
        {/if}
        <img class="preview" on:load={() => previewImageLoaded = true} src={image} alt="preview">
        <span class="text" class:visible={imageText !== null && imageTextBackgroundColor !== null}
              style="background-color: {imageTextBackgroundColor};">{imageText}</span>
        {#if favorite}
            <img class="favorite-mark" src="img/menu/icon-favorite-mark.svg" alt="fav">
        {/if}
    </div>
    <div class="title">
        <span class="text">{title}</span>
        <slot name="tag"/>
    </div>
    <div class="subtitle">
        <slot name="subtitle"/>
    </div>
    <div class="buttons">
        <div class="active">
            <slot name="active-visible"/>
        </div>

        <slot name="always-visible"/>
    </div>
</div>

<style lang="scss">

  .menu-list-item {
    display: grid;
    grid-template-areas:
        "a b c"
        "a d c";
    grid-template-columns: max-content 1fr max-content;
    border: 1px solid transparent;
    background-color: var(--menu-list-item-background-color);
    padding: 10px 14px;
    column-gap: 14px;
    border-radius: 9px;
    transition: ease background-color .2s, border-color .16s ease;
    align-items: center;
    cursor: grab;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-accent) 22%, transparent);
      background-color: var(--menu-list-item-hover-background-color);

      .subtitle {
        color: var(--menu-list-item-hover-subtitle-color);
      }

      .buttons .active {
        opacity: 1;
      }
    }
  }

  .image {
    grid-area: a;
    position: relative;

    .loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .preview {
      height: 52px;
      width: 52px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--claude-text) 7%, transparent);
      image-rendering: pixelated;
    }

    .favorite-mark {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
    }

    .text {
      position: absolute;
      bottom: -3px;
      right: -3px;
      display: none;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 5px;
      border: 1px solid rgba(0, 0, 0, .25);

      &.visible {
        display: block;
      }
    }
  }

  .title {
    grid-area: b;
    align-self: flex-end;
    display: flex;
    align-items: center;
    min-width: 0;

    .text {
      overflow: hidden;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 20px;
      color: var(--menu-text-color);
      font-weight: 600;
      letter-spacing: -.01em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .subtitle {
    grid-area: d;
    font-size: 13px;
    color: var(--menu-text-dimmed-color);
    transition: ease color .2s;
    align-self: flex-start;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .buttons {
    grid-area: c;
    display: flex;

    .active {
      margin-right: 6px;
      opacity: 0;
      transition: ease opacity .2s;
    }
  }
</style>
