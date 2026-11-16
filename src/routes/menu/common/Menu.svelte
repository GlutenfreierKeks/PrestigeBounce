<script lang="ts">
    import Header from "./header/Header.svelte";
    import {fly} from "svelte/transition";
    import {onMount} from "svelte";

    const transitionDuration = 700; // TODO: suboptimal

    let ready = false;

    onMount(() => {
        setTimeout(() => {
            ready = true;
        }, transitionDuration);
    });
</script>

<div class="menu">
    <div class="menu-ambient"></div>

    {#if ready}
        <div transition:fly|global={{duration: 700, y: -100}}>
            <Header/>
        </div>
    {/if}

    <div class="menu-wrapper">
        <slot/>
    </div>
</div>

<style lang="scss">
  .menu {
    padding: 44px 50px 36px;
    display: flex;
    flex-direction: column;
    // Not sized in vh, which not every browser scales with zoom
    position: fixed;
    inset: 0;
    isolation: isolate;
  }

  .menu-ambient {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(52% 68% at 0% 0%, color-mix(in srgb, var(--claude-accent) 16%, transparent), transparent 62%),
      radial-gradient(46% 60% at 101% 102%, color-mix(in srgb, var(--claude-accent) 8%, transparent), transparent 68%),
      radial-gradient(80% 80% at 50% 45%, transparent 35%, rgba(1, 2, 7, .52) 100%),
      linear-gradient(180deg, color-mix(in srgb, var(--claude-background) 74%, transparent), color-mix(in srgb, #02030a 86%, transparent));
  }

  .menu-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    will-change: transform;
  }

  @media screen and (max-width: 1366px) {
    .menu {
      zoom: 0.8;
    }
  }

  @media screen and (max-width: 1200px) {
    .menu {
      zoom: 0.7;
    }
  }

  @media screen and (max-height: 1100px) {
    .menu {
      zoom: 0.8;
    }
  }

  @media screen and (max-height: 700px) {
    .menu {
      zoom: 0.7;
    }
  }

  @media screen and (max-height: 540px) {
    .menu {
      zoom: 0.6;
    }
  }
</style>
