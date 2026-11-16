<script lang="ts">
    let {
        size = 56,
        tag = true,
        tagText = "Client",
        italic = true
    } = $props<{
        size?: number;
        tag?: boolean;
        tagText?: string;
        italic?: boolean;
    }>();
</script>

<div class="claude-wordmark" style={`--wordmark-size: ${size}px;`}>
    <span class="wordmark-name" class:italic>Claude</span>
    {#if tag}
        <span class="wordmark-tag">{tagText}</span>
    {/if}
</div>

<style lang="scss">
  .claude-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: calc(var(--wordmark-size) * .14);
    line-height: .9;
    color: #f4f1ff;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, .35));
  }

  .wordmark-name {
    font-family: "Playfair Display", Georgia, serif;
    font-size: var(--wordmark-size);
    font-weight: 600;
    letter-spacing: calc(var(--wordmark-size) * -.035);

    &.italic {
      font-style: italic;
    }
  }

  .wordmark-tag {
    padding: calc(var(--wordmark-size) * .06) calc(var(--wordmark-size) * .1);
    border-radius: calc(var(--wordmark-size) * .07);
    color: #0c0f1f;
    background: var(--accent-color, #8b7cf6);
    font-family: "Inter", sans-serif;
    font-size: calc(var(--wordmark-size) * .16);
    font-weight: 700;
    letter-spacing: calc(var(--wordmark-size) * .018);
    text-transform: uppercase;
  }
</style>
