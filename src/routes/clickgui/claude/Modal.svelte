<script lang="ts">
    import type {Snippet} from "svelte";
    import Icon from "./Icon.svelte";
    import {escapeLayer} from "../../../integration/escape";

    let {
        title,
        subtitle,
        children,
        footer,
        onclose,
        width = 560
    } = $props<{
        title: string;
        subtitle?: string;
        children: Snippet;
        footer?: Snippet;
        onclose: () => void;
        width?: number;
    }>();

    const layer = escapeLayer(onclose);
    $effect(() => layer.setOpen(true));
</script>

<div class="modal-backdrop" role="presentation" onclick={(event) => {
    if (event.target === event.currentTarget) onclose();
}}>
    <div class="modal" style={`width: min(${width}px, calc(100% - 40px));`} role="dialog" aria-modal="true" aria-label={title}>
        <header class="modal-head">
            <div>
                <h2>{title}</h2>
                {#if subtitle}
                    <p>{subtitle}</p>
                {/if}
            </div>
            <button type="button" class="close" aria-label="Close" onclick={onclose}>
                <Icon name="x" size={16}/>
            </button>
        </header>
        <div class="modal-body">
            {@render children()}
        </div>
        {#if footer}
            <footer class="modal-footer">
                {@render footer()}
            </footer>
        {/if}
    </div>
</div>

<style lang="scss">
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1900000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(3, 4, 10, .66);
    backdrop-filter: blur(7px);
    animation: fade-in .18s ease both;
  }

  .modal {
    max-height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    border: 1px solid var(--claude-border-strong);
    background:
      radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--claude-accent) 7%, transparent), transparent 58%),
      color-mix(in srgb, var(--claude-background) 96%, black);
    box-shadow: 0 40px 100px rgba(0, 0, 0, .7), inset 0 1px 0 rgba(255, 255, 255, .05);
    animation: modal-in .22s cubic-bezier(.2, .8, .2, 1) both;
  }

  .modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 24px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);

    h2 {
      margin: 0;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -.2px;
      color: var(--claude-text);
    }

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 11.5px;
    }
  }

  .close {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 7px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-dim);
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-text) 8%, transparent);
    }
  }

  .modal-body {
    min-height: 0;
    overflow-y: auto;
    padding: 18px 24px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 24px 20px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modal-in {
    from { opacity: 0; transform: translateY(12px) scale(.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
</style>
