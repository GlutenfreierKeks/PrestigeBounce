<script lang="ts">
    export let vertical = false;
</script>

<div class="button-container" class:vertical>
    <slot />
</div>

<style lang="scss">

    .button-container {
      background-color: var(--menu-button-container-background-color);
      border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
      padding: 7px 8px;
      width: max-content;
      border-radius: 10px;
      display: flex;
      column-gap: 6px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .025);
      backdrop-filter: blur(12px);

      &.vertical {
        flex-direction: column;
        row-gap: 6px;
        padding: 9px 8px;
      }
    }
</style>
