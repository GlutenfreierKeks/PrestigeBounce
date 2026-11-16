<script lang="ts">
    import ToolTip from "../ToolTip.svelte";
    import {createEventDispatcher} from "svelte";

    export let title: string;
    export let icon: string;

    const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="icon-button" on:click={() => dispatch("click")}>
    <ToolTip text={title}/>

    <div class="icon">
        <img src="img/menu/icon-{icon}.svg" alt={icon}>
    </div>
</div>

<style lang="scss">
  .icon-button {
    position: relative;
  }

  .icon {
    height: 34px;
    width: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    cursor: pointer;
    transition: background-color .15s ease;

    img {
      width: 17px;
      height: 17px;
      opacity: .65;
      transition: opacity .15s ease;
    }

    &:hover {
      background-color: color-mix(in srgb, var(--claude-text) 5%, transparent);

      img {
        opacity: 1;
      }
    }
  }
</style>
