<script lang="ts">
    let {
        checked,
        onchange,
        disabled = false,
        small = false,
        label = "Toggle"
    } = $props<{
        checked: boolean;
        onchange?: (value: boolean) => void;
        disabled?: boolean;
        small?: boolean;
        label?: string;
    }>();

    function toggle(event: MouseEvent) {
        event.stopPropagation();
        if (disabled) return;
        onchange?.(!checked);
    }
</script>

<button
        type="button"
        class="toggle"
        class:checked
        class:small
        class:disabled
        role="switch"
        aria-checked={checked}
        aria-label={label}
        {disabled}
        onclick={toggle}
>
    <span class="thumb"></span>
</button>

<style lang="scss">
  .toggle {
    --toggle-width: 34px;
    --toggle-height: 19px;
    --thumb-size: 13px;

    position: relative;
    width: var(--toggle-width);
    height: var(--toggle-height);
    flex: none;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    background: color-mix(in srgb, var(--claude-text) 20%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, white 8%, transparent);
    transition: background-color .2s ease, box-shadow .2s ease;

    &.small {
      --toggle-width: 31px;
      --toggle-height: 18px;
      --thumb-size: 12px;
    }

    &.checked {
      background: var(--claude-accent);
      box-shadow: 0 0 14px color-mix(in srgb, var(--claude-accent) 42%, transparent);

      .thumb {
        transform: translateX(calc(var(--toggle-width) - var(--thumb-size) - 6px));
      }
    }

    &.disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  }

  .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .5);
    transition: transform .2s cubic-bezier(.4, 0, .2, 1);
  }
</style>
