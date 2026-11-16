<script lang="ts">
    import Icon from "./Icon.svelte";

    let {
        children,
        small = false,
        muted = false
    } = $props<{
        children: any;
        small?: boolean;
        muted?: boolean;
    }>();
</script>

<span class="keycap" class:small class:muted>
    <Icon name="keybinds" size={small ? 11 : 13}/>
    <span>{@render children()}</span>
</span>

<style lang="scss">
  .keycap {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 9px;
    border-radius: 5px;
    color: var(--claude-text-soft);
    background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    border: 1px solid var(--claude-border);
    font-size: 10.5px;
    font-weight: 550;
    letter-spacing: .3px;

    &.small {
      height: 22px;
      padding: 0 7px;
      font-size: 9.5px;
    }

    &.muted {
      color: var(--claude-text-muted);
    }
  }
</style>
