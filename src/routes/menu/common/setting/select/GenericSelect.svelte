<script lang="ts">
    import {quintOut} from "svelte/easing";
    import {fade} from "svelte/transition";
    import {escapeLayer} from "../../../../../integration/escape";

    export let closeOnInternalClick: boolean;

    let expanded = false;
    let selectElement: HTMLElement;
    let headerElement: HTMLElement;

    function handleWindowClick(e: MouseEvent) {
        if (!selectElement.contains(e.target as Node)) {
            expanded = false;
        }
    }

    function handleSelectClick(e:MouseEvent) {
        if (closeOnInternalClick) {
            expanded = !expanded;
        } else {
            if (!expanded) {
                expanded = true;
            } else {
                expanded = !headerElement.contains(e.target as Node);
            }
        }
    }

    const layer = escapeLayer(() => expanded = false);
    $: layer.setOpen(expanded);
</script>

<svelte:window on:click={handleWindowClick}/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="select" class:expanded bind:this={selectElement} on:click={handleSelectClick}>
    <div class="header" bind:this={headerElement}>
        <span class="title">
            <slot name="title"/>
        </span>
        <img src="img/menu/icon-select-arrow.svg" alt="expand">
    </div>
    {#if expanded}
        <div class="options" transition:fade|global={{ duration: 200, easing: quintOut }}>
            <slot name="options"></slot>
        </div>
    {/if}
</div>

<style lang="scss">

  .select {
    cursor: pointer;
    min-width: 220px;
    position: relative;

    &.expanded {
      .header {
        border-radius: 7px 7px 0 0;
      }
    }
  }

  .header {
    background-color: var(--menu-select-header-background-color);
    padding: 10px 12px;
    display: flex;
    column-gap: 12px;
    align-items: center;
    justify-content: space-between;
    border-radius: 7px;
    transition: ease border-radius .2s;

    .title {
      color: var(--menu-text-color);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    img {
      width: 12px;
      height: 12px;
      opacity: .65;
    }
  }

  .options {
    position: absolute;
    z-index: 1000;
    width: 100%;
    border-radius: 0 0 7px 7px;
    max-height: 250px;
    overflow: auto;
    background-color: var(--menu-select-options-background-color);
    box-shadow: 0 20px 40px rgba(0, 0, 0, .35);
  }
</style>