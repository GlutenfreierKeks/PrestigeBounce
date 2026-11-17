<script lang="ts">
    import Icon from "../../../clickgui/claude/Icon.svelte";
    import {createEventDispatcher} from "svelte";

    export let icon: string | undefined = undefined;
    export let variant: "primary" | "secondary" | "ghost" = "secondary";
    export let disabled = false;

    const dispatch = createEventDispatcher();
</script>

<button
        type="button"
        class="page-button"
        class:primary={variant === "primary"}
        class:ghost={variant === "ghost"}
        {disabled}
        on:click={() => dispatch("click")}
>
    {#if icon}
        <Icon name={icon} size={14}/>
    {/if}
    <slot/>
</button>

<style lang="scss">
  .page-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 14px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-card) 62%, transparent);
    color: var(--claude-text-soft);
    font: inherit;
    font-size: 13px;
    font-weight: 550;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease;

    &:hover:not([disabled]) {
      border-color: color-mix(in srgb, var(--claude-text) 15%, transparent);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
      color: var(--claude-text);
    }

    &.primary {
      border-color: transparent;
      background: var(--claude-accent);
      color: #fff;
      box-shadow: 0 7px 20px color-mix(in srgb, var(--claude-accent) 22%, transparent);

      &:hover:not([disabled]) {
        background: color-mix(in srgb, var(--claude-accent) 88%, white);
        color: #fff;
      }
    }

    &.ghost {
      border-color: transparent;
      background: transparent;
      color: var(--claude-text-dim);

      &:hover:not([disabled]) {
        border-color: color-mix(in srgb, var(--claude-accent) 30%, transparent);
        background: color-mix(in srgb, var(--claude-accent) 8%, transparent);
        color: var(--claude-glint);
      }
    }

    &[disabled] {
      opacity: .45;
      cursor: default;
    }
  }
</style>
