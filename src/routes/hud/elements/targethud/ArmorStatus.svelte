<script lang="ts">
    import type {ItemStack} from "../../../../integration/types";
    import {itemTextureUrl} from "../../../../integration/rest";

    export let itemStack: ItemStack;

    $: durability = itemStack.maxDamage > 0
        ? Math.max(0, Math.min(100, 100 * (itemStack.maxDamage - itemStack.damage) / itemStack.maxDamage))
        : 100;
    $: tone = durability > 60 ? "#69d18f" : durability > 30 ? "#e6c45e" : "#ef6f78";
</script>

<div class="armor-status" title={`${typeof itemStack.displayName === "string" ? itemStack.displayName : itemStack.identifier} · ${Math.ceil(durability)}%`}>
    <img class="icon" src={itemTextureUrl(itemStack.identifier)} alt={itemStack.identifier} />
    <div class="durability">
        <div class="fill" style="width: {durability}%; background-color: {tone};"></div>
    </div>
</div>

<style lang="scss">
    .armor-status {
        display: flex;
        flex-direction: column;
        gap: 1px;
        width: 22px;
    }

    .icon {
        width: 20px;
        height: 20px;
        margin: 0 auto;
        image-rendering: pixelated;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .4));
    }

    .durability {
        height: 1.5px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--hud-text) 12%, transparent);
        overflow: hidden;
    }

    .fill {
        height: 100%;
        border-radius: inherit;
        transition: width .25s ease, background-color .25s ease;
    }
</style>
