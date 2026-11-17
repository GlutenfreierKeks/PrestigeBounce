<script lang="ts">
    import Icon from "./Icon.svelte";
    import {fly} from "svelte/transition";
    let {
        message,
        icon = "sparkles"
    } = $props<{
        message: string;
        icon?: string;
    }>();
</script>

<div
        class="toast"
        in:fly={{y: 14, duration: 220}}
        out:fly={{y: -6, duration: 170}}
        role="status"
>
    <span class="icon"><Icon name={icon} size={14}/></span>
    <span>{message}</span>
</div>

<style lang="scss">
  .toast {
    position: absolute;
    right: 26px;
    bottom: 24px;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 14px 10px 10px;
    border-radius: 9px;
    border: 1px solid var(--claude-accent-line);
    background: color-mix(in srgb, var(--claude-background) 92%, black);
    color: var(--claude-text-soft);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .45), 0 0 20px color-mix(in srgb, var(--claude-accent) 8%, transparent);
    font-size: 11.5px;
    font-weight: 500;
    pointer-events: none;
  }

  .icon {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 13%, transparent);
    animation: toast-icon-in .34s cubic-bezier(.2, .8, .25, 1) backwards;
  }

  @keyframes toast-icon-in {
    from { opacity: 0; transform: scale(.72) rotate(-8deg); }
    to { opacity: 1; transform: scale(1) rotate(0); }
  }
</style>
