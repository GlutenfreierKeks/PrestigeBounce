<script lang="ts">
    export let eyebrow: string;
    export let title: string;
    export let subtitle = "";
</script>

<header class="page-head">
    <div class="head-copy">
        <div class="eyebrow">
            <span class="eyebrow-line"></span>
            {eyebrow}
        </div>
        <h1>{title}</h1>
        {#if subtitle}
            <p>{subtitle}</p>
        {/if}
    </div>

    <div class="head-actions">
        <slot name="actions"/>
    </div>
</header>

<style lang="scss">
  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 15px;
  }

  .head-copy {
    min-width: 0;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: color-mix(in srgb, var(--claude-text-dim) 86%, transparent);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.9px;
    text-transform: uppercase;
  }

  .eyebrow-line {
    width: 28px;
    height: 1px;
    background: linear-gradient(90deg, var(--claude-accent), transparent);
  }

  h1 {
    margin-top: 5px;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(34px, 3vw, 46px);
    font-weight: 600;
    letter-spacing: -.03em;
    line-height: 1;
  }

  p {
    margin-top: 6px;
    color: var(--claude-text-muted);
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: .2px;
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 2px;
  }

  @media (max-height: 800px) {
    .page-head {
      align-items: center;
      margin-bottom: 10px;
    }

    h1 {
      font-size: 28px;
    }

    p {
      display: none;
    }
  }
</style>
