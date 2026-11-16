<script lang="ts">
    import {createEventDispatcher} from "svelte";

    export let title: string;
    export let icon: string;
    export let disabled = false;

    const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<button class="icon-text-button" on:click={() => dispatch("click")} {disabled}>
    <div class="icon">
        <img src="img/menu/{icon}" alt={title}>
    </div>
    <div class="title">{title}</div>
</button>

<style lang="scss">

    .icon-text-button {
      display: flex;
      border: 1px solid transparent;
      border-radius: 7px;
      align-items: center;
      overflow: hidden;
      background: linear-gradient(var(--menu-icon-text-button-accent-color), var(--menu-icon-text-button-accent-color)) left / 0 100% no-repeat var(--menu-icon-text-button-background-color);
      transition: ease opacity .2s, background-size .2s ease-out, border-color .16s ease;

      &:not([disabled]):hover {
        border-color: color-mix(in srgb, var(--claude-accent) 24%, transparent);
        background-size: 100% 100%;
        cursor: pointer;
      }

      &[disabled] {
        opacity: .6;
      }
    }

    .icon {
      height: 36px;
      width: 36px;
      background-color: var(--menu-icon-text-button-icon-background-color);
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 16px;
        height: 16px;
        opacity: .8;
      }
    }

    .title {
      font-size: 14px;
      font-weight: 550;
      color: var(--menu-text-color);
      padding: 0 12px;
      white-space: nowrap;
    }
</style>
