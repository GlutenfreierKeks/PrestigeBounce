<script lang="ts">
    import {onMount} from "svelte";
    import {getConnectionDetails} from "../../../integration/rest";
    import {listen} from "../../../integration/ws";
    import type {ConnectionDetails} from "../../../integration/types";
    import type {ConnectionDetailsEvent} from "../../../integration/events";
    import PrestigeMark from "../../../components/PrestigeMark.svelte";

    interface Part {
        text: string;
        value?: boolean;
    }

    let details = $state<ConnectionDetails | null>(null);

    const parts = $derived(details ? sentence(details) : []);
    const serverAddress = $derived(details?.serverAddress ?? "");

    function sentence({remoteAddress, serverAddress, proxy}: ConnectionDetails): Part[] {
        if (proxy) {
            return [
                {text: "Through proxy "},
                {text: remoteAddress, value: true},
                {text: " to "},
                {text: serverAddress, value: true}
            ];
        }

        return [
            {text: "Direct to "},
            {text: serverAddress, value: true},
            {text: ` (${remoteAddress})`}
        ];
    }

    listen("connectionDetails", (event: ConnectionDetailsEvent) => {
        details = event.details;
    });

    onMount(async () => {
        const current = await getConnectionDetails();
        // A websocket event received while fetching is newer
        details ??= current;
    });
</script>

<div class="connecting-screen">
    <div class="ambient"></div>
    <div class="grid"></div>
    <span class="frame-corner top-left"></span>
    <span class="frame-corner top-right"></span>
    <span class="frame-corner bottom-left"></span>
    <span class="frame-corner bottom-right"></span>

    <main class="loader">
        <div class="mark-orbit">
            <span class="orbit orbit-outer"></span>
            <span class="orbit orbit-inner"></span>
            <span class="mark"><PrestigeMark size={38}/></span>
        </div>

        <div class="eyebrow">
            <span class="eyebrow-line"></span>
            LiquidBounce <span class="eyebrow-cross">×</span> PrestigeBounce
        </div>

        <h1>Connecting<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span></h1>

        <p class="destination">
            {#if serverAddress}
                Reaching <strong>{serverAddress}</strong>
            {:else}
                Reaching the server
            {/if}
        </p>

        <div class="progress" role="progressbar" aria-label="Connecting">
            <span></span>
        </div>

        {#if parts.length > 0}
            <p class="connection-detail">
                {#each parts as part}<span class:value={part.value}>{part.text}</span>{/each}
            </p>
        {:else}
            <p class="connection-detail muted">Resolving connection details</p>
        {/if}
    </main>

    <footer class="connect-footer">
        <span class="footer-brand">Prestige<span>Bounce</span></span>
        <span class="footer-hint">Press Escape to cancel</span>
    </footer>
</div>

<style lang="scss">
  .connecting-screen {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
    color: var(--claude-text, #f1f0fa);
    background:
      radial-gradient(58% 70% at 50% 44%, color-mix(in srgb, var(--claude-accent, #8b7cf6) 14%, transparent), transparent 72%),
      radial-gradient(80% 80% at 50% 50%, transparent 28%, rgba(1, 2, 8, .76) 100%),
      linear-gradient(180deg, #070915 0%, #04050c 100%);
  }

  .ambient {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(760px, 72vw);
    height: min(760px, 72vw);
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 13%, transparent);
    transform: translate(-50%, -50%) rotate(45deg);
    opacity: .55;
    animation: ambient-drift 9s ease-in-out infinite;

    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: 9%;
      border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5%, transparent);
    }

    &::after {
      inset: 23%;
      border-color: color-mix(in srgb, var(--claude-accent, #8b7cf6) 9%, transparent);
    }
  }

  .grid {
    position: absolute;
    inset: 0;
    opacity: .16;
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(56% 56% at 50% 50%, black, transparent 78%);
  }

  .frame-corner {
    position: fixed;
    width: 28px;
    height: 28px;
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 44%, transparent);
    opacity: .8;

    &.top-left {
      top: 28px;
      left: 28px;
      border-right: none;
      border-bottom: none;
    }

    &.top-right {
      top: 28px;
      right: 28px;
      border-left: none;
      border-bottom: none;
    }

    &.bottom-left {
      bottom: 28px;
      left: 28px;
      border-right: none;
      border-top: none;
    }

    &.bottom-right {
      bottom: 28px;
      right: 28px;
      border-left: none;
      border-top: none;
    }
  }

  .loader {
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: column;
    width: min(560px, calc(100vw - 64px));
    padding: 12px 24px 0;
    text-align: center;
  }

  .mark-orbit {
    position: relative;
    display: grid;
    place-items: center;
    width: 92px;
    height: 92px;
    margin-bottom: 30px;
  }

  .orbit {
    position: absolute;
    border-radius: 50%;

    &.orbit-outer {
      inset: 0;
      border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 20%, transparent);
      border-top-color: var(--claude-accent, #8b7cf6);
      border-right-color: color-mix(in srgb, var(--claude-accent, #8b7cf6) 55%, transparent);
      animation: spin 2.6s linear infinite;
      box-shadow: 0 0 24px color-mix(in srgb, var(--claude-accent, #8b7cf6) 12%, transparent);
    }

    &.orbit-inner {
      inset: 11px;
      border: 1px dashed color-mix(in srgb, var(--claude-accent, #8b7cf6) 26%, transparent);
      animation: spin 5.4s linear infinite reverse;
    }
  }

  .mark {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    color: var(--claude-accent, #8b7cf6);
    filter: drop-shadow(0 0 20px color-mix(in srgb, var(--claude-accent, #8b7cf6) 48%, transparent));
    animation: mark-pulse 2.4s ease-in-out infinite;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--claude-text-dim, #aeacc8);
    font-family: "Inter", sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2.1px;
    text-transform: uppercase;
  }

  .eyebrow-line {
    width: 30px;
    height: 1px;
    background: linear-gradient(90deg, var(--claude-accent, #8b7cf6), transparent);
  }

  .eyebrow-cross {
    color: var(--claude-accent, #8b7cf6);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 14px;
    font-style: italic;
    letter-spacing: 0;
  }

  h1 {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin: 15px 0 0;
    color: var(--claude-text, #f1f0fa);
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(46px, 5vw, 68px);
    font-weight: 600;
    font-style: italic;
    letter-spacing: -.04em;
    line-height: 1;
    text-shadow: 0 24px 70px rgba(0, 0, 0, .55);
  }

  .dots {
    display: inline-flex;
    gap: 3px;
    margin-left: 8px;
    transform: translateY(-14px);

    i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--claude-glint, #b2a6ff);
      opacity: .25;
      animation: dot-pulse 1.3s ease-in-out infinite;

      &:nth-child(2) {
        animation-delay: .18s;
      }

      &:nth-child(3) {
        animation-delay: .36s;
      }
    }
  }

  .destination {
    margin-top: 13px;
    color: var(--claude-text-dim, #aeacc8);
    font-size: 13.5px;
    font-weight: 450;

    strong {
      color: var(--claude-text-soft, #d9d7ea);
      font-weight: 550;
    }
  }

  .progress {
    position: relative;
    width: min(296px, 62vw);
    height: 2px;
    margin-top: 27px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 8%, transparent);

    span {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 42%;
      border-radius: inherit;
      background: linear-gradient(90deg, transparent, var(--claude-accent, #8b7cf6) 42%, var(--claude-glint, #b2a6ff) 64%, transparent);
      animation: progress-slide 1.55s cubic-bezier(.5, .05, .5, .95) infinite;
    }
  }

  .connection-detail {
    min-height: 18px;
    margin-top: 14px;
    color: var(--claude-text-muted, #777594);
    font-size: 11.5px;
    font-weight: 450;
    letter-spacing: .15px;
    white-space: pre-wrap;

    &.muted {
      opacity: .65;
    }
  }

  .value {
    color: var(--claude-text-soft, #d9d7ea);
    font-weight: 550;
  }

  .connect-footer {
    position: fixed;
    right: 44px;
    bottom: 34px;
    left: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: color-mix(in srgb, var(--claude-text-muted, #777594) 78%, transparent);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .7px;
  }

  .footer-brand {
    color: var(--claude-text-dim, #aeacc8);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 13px;
    font-style: italic;
    letter-spacing: .2px;

    span {
      color: var(--claude-glint, #b2a6ff);
    }
  }

  .footer-hint {
    text-transform: uppercase;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes ambient-drift {
    0%, 100% { transform: translate(-50%, -50%) rotate(44deg) scale(1); opacity: .45; }
    50% { transform: translate(-50%, -50%) rotate(46deg) scale(1.03); opacity: .7; }
  }

  @keyframes mark-pulse {
    0%, 100% { opacity: .8; transform: scale(.97); }
    50% { opacity: 1; transform: scale(1.02); }
  }

  @keyframes dot-pulse {
    0%, 80%, 100% { opacity: .22; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-3px); }
  }

  @keyframes progress-slide {
    0% { transform: translateX(-110%); }
    100% { transform: translateX(340%); }
  }

  @media (max-width: 720px) {
    .frame-corner {
      display: none;
    }

    .connect-footer {
      right: 24px;
      bottom: 22px;
      left: 24px;
    }

    .footer-hint {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orbit,
    .ambient,
    .mark,
    .dots i,
    .progress span {
      animation: none;
    }

    .progress span {
      width: 100%;
      opacity: .7;
    }
  }
</style>
