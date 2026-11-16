<script lang="ts">
    import type {ItemStack} from "../../../../integration/types";
    import {listen} from "../../../../integration/ws";
    import type {ClientPlayerInventoryEvent, PlayerInventory} from "../../../../integration/events";
    import ItemStackView from "./ItemStackView.svelte";
    import {onMount} from "svelte";
    import {getPlayerInventory} from "../../../../integration/rest";

    export let rowLength: number;
    export let backgroundColor: string = "var(--hud-surface)";
    export let gap: string = "3px";
    export let getRenderedStacks: (inventory: PlayerInventory) => ItemStack[];

    let inventory: PlayerInventory | undefined;
    let stacks: ItemStack[] = [];

    $: plain = backgroundColor === "transparent";

    listen("clientPlayerInventory", (data: ClientPlayerInventoryEvent) => {
        inventory = data.inventory;
    });

    onMount(async () => {
        inventory = await getPlayerInventory();
    });

    $: stacks = inventory ? getRenderedStacks(inventory) : [];
</script>

<div class="inventory" class:plain style="
    background-color: {backgroundColor};
    gap: {gap};
    --row-length: {rowLength};
">
    {#each stacks as stack (stack)}
        <ItemStackView {stack}/>
    {/each}
</div>

<style lang="scss">
  .inventory {
    padding: 5px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background: var(--hud-surface);
    box-shadow: var(--hud-shadow);
    display: grid;
    grid-template-columns: repeat(var(--row-length), 1fr);

    &.plain {
      padding: 0;
      border: none;
      background: transparent;
      box-shadow: none;
    }
  }
</style>
