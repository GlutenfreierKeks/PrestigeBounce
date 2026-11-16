<script lang="ts">
    import type {ItemStack} from "../../../../integration/types";
    import {mapToColor} from "../../../../util/color_utils";
    import {itemTextureUrl} from "../../../../integration/rest";

    export let stack: ItemStack;

    const {count, damage, identifier, maxDamage, enchantments} = stack;

    const countColor = count <= 0 ? "#ef6d78" : "#f4f2ff";

    const valueColor = mapToColor(120 * (maxDamage - damage) / maxDamage);
</script>

<div class="item-stack">
    {#if enchantments}
        <div class="mask" style="mask-image: url({itemTextureUrl(identifier)})"></div>
    {/if}
    <img class="item-icon" src={itemTextureUrl(identifier)} alt={identifier}/>

    <div class="durability-bar" class:hidden={damage === 0}>
        <div class="durability"
             style="width: {100 * (maxDamage - damage) / maxDamage}%; background-color: {valueColor}">
        </div>
    </div>

    <div class="count" class:hidden={count === 1 || identifier === "minecraft:air"} style="color: {countColor}">
        {count}
    </div>
</div>

<style lang="scss">

  .hidden {
    display: none;
  }

  .item-stack {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--hud-text) 2.5%, transparent);
    overflow: hidden;
  }

  .mask {
    position: absolute;
    background: radial-gradient(circle, var(--item-enchant-glow-start-color), var(--item-enchant-glow-end-color) 100%);
    mix-blend-mode: screen;
    scale: 105%;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    mask-size: cover;
  }

  .item-icon {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }

  .durability-bar {
    position: absolute;
    bottom: 2px;
    left: 10%;
    width: 80%;
    height: 2px;
    border-radius: 2px;
    background-color: rgba(0, 0, 0, .45);
    overflow: hidden;
  }

  .durability {
    height: 100%;
    border-radius: inherit;
    transition: width 150ms;
  }

  .count {
    position: absolute;
    right: 2px;
    bottom: 1px;
    font-size: 10px;
    font-weight: 750;
    font-family: "Inter", monospace;
    line-height: 1;
    text-shadow: 1px 1px 2px var(--item-count-shadow-color), 0 0 4px rgba(0, 0, 0, .9);
    font-variant-numeric: tabular-nums;
  }
</style>
