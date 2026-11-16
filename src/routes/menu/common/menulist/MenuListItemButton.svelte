<script lang="ts">
    import ToolTip from "../ToolTip.svelte";
    import {createEventDispatcher} from "svelte";

    export let title: string;
    export let icon: string;

    const dispatch = createEventDispatcher();
</script>

<button class="button" type="button" on:click={() => dispatch("click")}>
    <ToolTip text={title} color="black"/>
    <img class="icon" src="img/menu/icon-{icon}.svg" alt={icon}>
</button>

<style lang="scss">
  .button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-left: 5px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background-color: transparent;
    cursor: pointer;
    position: relative;
    transition: background-color .15s ease, border-color .15s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 8%, transparent);
      background-color: color-mix(in srgb, var(--claude-text) 6%, transparent);
    }
  }

  .icon {
    height: 17px;
    width: 17px;
    opacity: .7;
  }
</style>
