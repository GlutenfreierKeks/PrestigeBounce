<script lang="ts">
    import type {Snippet} from "svelte";
    import Icon from "./Icon.svelte";

    let {
        children,
        variant = "secondary",
        icon,
        disabled = false,
        onclick,
        title,
        type = "button",
        full = false
    } = $props<{
        children?: Snippet;
        variant?: "primary" | "secondary" | "ghost" | "danger";
        icon?: string;
        disabled?: boolean;
        onclick?: (event: MouseEvent) => void;
        title?: string;
        type?: "button" | "submit";
        full?: boolean;
    }>();
</script>

<button
        class="claude-button {variant}"
        class:full
        {type}
        {disabled}
        {title}
        onclick={onclick}
>
    {#if icon}
        <Icon name={icon} size={14}/>
    {/if}
    {#if children}
        {@render children()}
    {/if}
</button>

<style lang="scss">
  .claude-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 32px;
    padding: 0 15px;
    border-radius: 7px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 9%, transparent);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-soft);
    font: inherit;
    font-size: 12px;
    font-weight: 550;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease;

    &:hover:not(:disabled) {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-text) 7%, transparent);
      border-color: color-mix(in srgb, var(--claude-text) 15%, transparent);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }

    &.primary {
      color: #ffffff;
      background: var(--claude-accent);
      border-color: transparent;
      box-shadow: 0 6px 18px color-mix(in srgb, var(--claude-accent) 20%, transparent);

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--claude-accent) 88%, white);
        border-color: transparent;
      }
    }

    &.ghost {
      border-color: transparent;
      background: transparent;
      color: var(--claude-text-dim);

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--claude-text) 6%, transparent);
        border-color: transparent;
      }
    }

    &.danger {
      color: #ff8d96;
      border-color: color-mix(in srgb, #ff5964 24%, transparent);
      background: color-mix(in srgb, #ff5964 8%, transparent);

      &:hover:not(:disabled) {
        color: #ffdadd;
        background: color-mix(in srgb, #ff5964 15%, transparent);
      }
    }

    &.full {
      width: 100%;
    }

    &:disabled {
      opacity: .45;
      cursor: default;
    }
  }
</style>
