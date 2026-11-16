<script lang="ts">
    export let text: string;
</script>

<div class="tag">
    {text}
</div>

<style lang="scss">

  .tag {
    background-color: var(--menu-list-tag-background-color);
    border: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    color: var(--menu-text-dimmed-color);
    font-size: 10px;
    font-weight: 600;
    padding: 3px 7px;
    border-radius: 5px;
    margin-left: 6px;
    transition: ease color .2s, ease background-color .2s;
    transform: translateY(-2px);
    white-space: nowrap;
  }
</style>
