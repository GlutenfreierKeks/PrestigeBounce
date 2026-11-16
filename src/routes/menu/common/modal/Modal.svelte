<script lang="ts">
    import {fade, fly} from "svelte/transition";
    import {createEventDispatcher} from "svelte";
    import {portal} from "../../../../integration/util";
    import {escapeLayer} from "../../../../integration/escape";

    export let title: string;
    export let visible: boolean;

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch("close");
        visible = false;
    }

    const layer = escapeLayer(handleClick);
    $: layer.setOpen(visible);
</script>

{#if visible}
    <div class="modal-wrapper" transition:fade|global={{duration: 200}} use:portal>
        <div class="modal" in:fly|global={{duration: 300, y: -100}} out:fly|global={{duration: 300, y: -100}}>
            <button class="button-modal-close" on:click={handleClick}>
                <img src="img/menu/icon-close.svg" alt="close">
            </button>

            <div class="title">{title}</div>

            <div class="content">
                <slot />
            </div>
        </div>
    </div>
{/if}

<style lang="scss">

  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--menu-modal-backdrop-color);
    backdrop-filter: blur(3px);
    z-index: 999;
  }

  .modal {
    background:
      radial-gradient(110% 130% at 0% 0%, color-mix(in srgb, var(--claude-accent) 7%, transparent), transparent 52%),
      var(--menu-modal-background-color);
    border: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
    min-width: 470px;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 30px;
    display: flex;
    flex-direction: column;
    border-radius: 14px;
    box-shadow: 0 30px 80px var(--menu-modal-shadow-color), inset 0 1px 0 rgba(255, 255, 255, .04);
  }

  .title {
    color: var(--menu-text-color);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 30px;
    font-weight: 600;
    letter-spacing: -.02em;
    position: relative;
    width: max-content;
    align-self: center;
    margin-bottom: 34px;

    &::after {
      content: "";
      position: absolute;
      display: block;
      height: 2px;
      width: 34px;
      background-color: var(--menu-modal-title-accent-color);
      bottom: -11px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 10px;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    row-gap: 16px;
    font-size: 14px;
  }

  .button-modal-close {
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: 1px solid var(--menu-modal-close-border-color);
    border-radius: 7px;
    cursor: pointer;
    top: 14px;
    right: 14px;
    position: absolute;
    transition: ease background-color .2s;

    img {
      width: 12px;
      height: 12px;
      opacity: .7;
    }

    &:hover {
      background-color: var(--menu-modal-close-hover-background-color);
    }
  }

  @media screen and (max-width: 1366px) {
    .modal {
      zoom: 0.8;
    }
  }

  @media screen and (max-width: 1200px) {
    .modal {
      zoom: 0.5;
    }
  }

  @media screen and (max-height: 1100px) {
    .modal {
      zoom: 0.8;
    }
  }

  @media screen and (max-height: 700px) {
    .modal {
      zoom: 0.5;
    }
  }

  @media screen and (max-height: 540px) {
    .modal {
      zoom: 0.4;
    }
  }
</style>
