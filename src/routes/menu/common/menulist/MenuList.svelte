<script lang="ts">
    import {fly} from "svelte/transition";
    import {SortableList} from "@jhubbardsf/svelte-sortablejs";
    import "./menulist.scss";
    import {createEventDispatcher} from "svelte";

    export let sortable = false;
    export let elementCount = -1;
    export let empty = false;

    let sortableElement: HTMLElement | undefined;
    let remountKey = 0;

    interface MenuListSortEvent {
        newOrder: number[];
        complete: () => void;
    }

    const dispatch = createEventDispatcher<{
        sort: MenuListSortEvent
    }>();

    function handleChange(e: any) {
        let completed = false;

        dispatch("sort", {
            newOrder: calculateNewOrder(e.oldIndex, e.newIndex, elementCount),
            complete: () => {
                if (!completed) {
                    completed = true;
                    remountKey++;
                }
            }
        });
    }

    function calculateNewOrder(oldIndex: number, newIndex: number, length: number): number[] {
        const a = Array.from({length}, (x, i) => i);
        a.splice(oldIndex, 1);
        a.splice(newIndex, 0, oldIndex);
        return a;
    }
</script>

<div class="menu-list" transition:fly|global={{duration: 700, x: 1000}}>
    {#if empty}
        <div class="menu-list-empty">
            <slot name="empty"/>
        </div>
    {:else}
        {#key remountKey}
            {#if sortable && elementCount > -1}
                <SortableList class="menu-list-items" onSort={handleChange} forceFallback={true} animation={150}>
                    <slot/>
                </SortableList>
            {:else}
                <div class="menu-list-items">
                    <slot/>
                </div>
            {/if}
        {/key}
    {/if}
</div>

<style lang="scss">

  .menu-list {
    background-color: var(--menu-list-background-color);
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    flex: 1;
    border-radius: 12px;
    margin-bottom: 14px;
    position: relative;
    box-shadow: 0 20px 50px rgba(0, 0, 0, .2), inset 0 1px 0 rgba(255, 255, 255, .025);
    backdrop-filter: blur(12px);
  }

  .menu-list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 280px;
    padding: 36px;
    text-align: center;

    :global(.empty-icon) {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border: 1px solid color-mix(in srgb, var(--claude-accent) 20%, transparent);
      border-radius: 50%;
      background: color-mix(in srgb, var(--claude-accent) 7%, transparent);
      color: var(--claude-accent);
    }

    :global(.empty-title) {
      margin-top: 14px;
      color: var(--claude-text);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 23px;
      font-weight: 600;
      letter-spacing: -.01em;
    }

    :global(p) {
      max-width: 340px;
      margin-top: 7px;
      color: var(--claude-text-muted);
      font-size: 13px;
      line-height: 1.55;
    }
  }
</style>
