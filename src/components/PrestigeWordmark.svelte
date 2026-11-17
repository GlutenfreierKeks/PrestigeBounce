<script lang="ts">
    let {
        size = 56,
        tag = true,
        tagText = "Theme",
        italic = true
    } = $props<{
        size?: number;
        tag?: boolean;
        tagText?: string;
        italic?: boolean;
    }>();
</script>

<div class="prestige-wordmark" style={`--wordmark-size: ${size}px;`}>
    <span class="wordmark-name" class:italic><span>Prestige</span><span class="wordmark-glint">Bounce</span></span>
    {#if tag}
        <span class="wordmark-tag">{tagText}</span>
    {/if}
</div>

<style lang="scss">
  .prestige-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: calc(var(--wordmark-size) * .16);
    line-height: .9;
    color: #f4f1ff;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, .35));
    white-space: nowrap;
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

  .wordmark-glint {
    color: var(--claude-glint, #b2a6ff);
    font-weight: 500;
  }

  .wordmark-tag {
    padding: calc(var(--wordmark-size) * .06) calc(var(--wordmark-size) * .1);
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 45%, transparent);
    border-radius: calc(var(--wordmark-size) * .07);
    color: var(--claude-glint, #d8d1ff);
    background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 12%, transparent);
    font-family: "Inter", sans-serif;
    font-size: max(8px, calc(var(--wordmark-size) * .14));
    font-weight: 700;
    letter-spacing: max(.6px, calc(var(--wordmark-size) * .018));
    text-transform: uppercase;
  }
</style>
