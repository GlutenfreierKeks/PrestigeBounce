<script lang="ts">
    import Icon from "../../../clickgui/claude/Icon.svelte";

    export let title: string;
    export let message: string;
    export let severity: string;

    $: tone = severity === "SUCCESS" || severity === "ENABLED"
        ? "success"
        : severity === "ERROR" || severity === "DISABLED"
            ? "error"
            : "info";

    $: icon = severity === "SUCCESS" || severity === "ENABLED"
        ? "check"
        : severity === "ERROR" || severity === "DISABLED"
            ? "x"
            : "sparkles";
</script>

<div class="notification {tone}">
    <span class="icon"><Icon name={icon} size={13}/></span>
    <div class="copy">
        <div class="title">{title}</div>
        <div class="message">{message}</div>
    </div>
    <span class="life"></span>
</div>

<style lang="scss">
  .notification {
    --tone: var(--hud-accent);

    position: relative;
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    width: 286px;
    padding: 9px 11px 10px 9px;
    border: 1px solid var(--hud-border);
    border-radius: 9px;
    background:
      linear-gradient(100deg, color-mix(in srgb, var(--tone) 8%, transparent), transparent 46%),
      color-mix(in srgb, var(--claude-background) 92%, transparent);
    box-shadow: 0 12px 30px rgba(0, 0, 0, .4), inset 0 1px 0 rgba(255, 255, 255, .04);
    overflow: hidden;
    backdrop-filter: blur(8px);

    &::before {
      content: "";
      position: absolute;
      top: 8px;
      bottom: 8px;
      left: 0;
      width: 2px;
      border-radius: 0 2px 2px 0;
      background: var(--tone);
      box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 65%, transparent);
    }

    &.success { --tone: #62ce91; }
    &.error { --tone: #ef6d78; }
    &.info { --tone: var(--hud-accent); }
  }

  .icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 13%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone) 18%, transparent);
  }

  .copy {
    min-width: 0;
  }

  .title {
    overflow: hidden;
    color: var(--hud-text);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: .1px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message {
    margin-top: 2px;
    overflow: hidden;
    color: var(--hud-text-muted);
    font-size: 9.5px;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .life {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 1.5px;
    width: 100%;
    background: linear-gradient(90deg, var(--tone), color-mix(in srgb, var(--tone) 30%, transparent));
    transform-origin: left center;
    animation: life 3s linear forwards;
    opacity: .8;
  }

  @keyframes life {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
</style>
