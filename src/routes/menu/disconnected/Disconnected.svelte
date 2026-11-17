<script lang="ts">
    import Account from "../common/header/account/Account.svelte";
    import PageButton from "../common/buttons/PageButton.svelte";
    import PrestigeMark from "../../../components/PrestigeMark.svelte";
    import {AutoReconnect} from "./autoReconnect.svelte";
    import {listen} from "../../../integration/ws";
    import {isLoggingIn} from "../altmanager/altmanager_store";
    import {getConnectionDetails, openScreen} from "../../../integration/rest";
    import type {ConnectionDetails} from "../../../integration/types";
    import {onMount} from "svelte";

    const auto = new AutoReconnect();
    let accountHovered = $state(false);
    let details = $state<ConnectionDetails | null>(null);

    $effect(() => auto.run($isLoggingIn || accountHovered));

    listen("accountManagerLogin", () => auto.reconnect());

    onMount(async () => {
        details = await getConnectionDetails().catch(() => null);
    });

    const reconnectTitle = $derived(
        auto.reconnecting ? "Reconnecting…" : "Reconnect now"
    );

    const serverCopy = $derived(details?.serverAddress
        ? `The connection to ${details.serverAddress} has ended.`
        : "The connection to the server has ended.");
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="account" onmouseenter={() => accountHovered = true} onmouseleave={() => accountHovered = false}>
    <Account/>
</div>

<div class="disconnect-screen">
    <div class="ambient"></div>

    <main class="disconnect-card">
        <span class="card-mark"><PrestigeMark size={40}/></span>

        <div class="eyebrow">
            <span class="eyebrow-line"></span>
            Session
        </div>

        <h1>Disconnected</h1>

        <p class="subtitle">{serverCopy}</p>

        {#if details}
            <div class="server-chip">
                <span class="server-dot"></span>
                <span class="server-address">{details.serverAddress}</span>
                {#if details.proxy}
                    <span class="server-tag">via proxy</span>
                {/if}
            </div>
        {/if}

        <div class="action-row">
            <PageButton variant="primary" icon="refresh" disabled={$isLoggingIn} on:click={() => auto.reconnect()}>
                {reconnectTitle}
            </PageButton>
            <PageButton icon="server" on:click={() => openScreen("multiplayer")}>Server list</PageButton>
            <PageButton icon="arrow-left" on:click={() => openScreen("title")}>Title screen</PageButton>
        </div>

        <div class="auto-row">
            <div class="auto-copy">
                <span class="auto-title">Auto reconnect</span>
                <span class="auto-sub">
                    {auto.enabled ? `Retrying in ${auto.secondsLeft}s` : "Reconnect automatically after a disconnect"}
                </span>
            </div>

            <button
                    type="button"
                    class="toggle"
                    class:on={auto.enabled}
                    role="switch"
                    aria-checked={auto.enabled}
                    aria-label="Toggle auto reconnect"
                    onclick={() => auto.toggle()}
            >
                <span></span>
            </button>
        </div>

        <div class="card-foot">
            <span>Prestige<span>Bounce</span></span>
            <span>LiquidBounce theme</span>
        </div>
    </main>
</div>

<style lang="scss">
  .account {
    position: fixed;
    top: 42px;
    right: 46px;
    z-index: 2;
  }

  .disconnect-screen {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    color: var(--claude-text, #f1f0fa);
    background:
      radial-gradient(60% 72% at 50% 42%, color-mix(in srgb, var(--claude-accent, #8b7cf6) 10%, transparent), transparent 72%),
      radial-gradient(82% 82% at 50% 50%, transparent 22%, rgba(1, 2, 8, .8) 100%),
      linear-gradient(180deg, #070915 0%, #04050c 100%);
  }

  .ambient {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(680px, 70vw);
    height: min(680px, 70vw);
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 11%, transparent);
    transform: translate(-50%, -50%) rotate(45deg);
    opacity: .5;

    &::before {
      content: "";
      position: absolute;
      inset: 13%;
      border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 4.5%, transparent);
    }
  }

  .disconnect-card {
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: column;
    width: min(500px, calc(100vw - 44px));
    padding: 34px 38px 26px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent);
    border-radius: 16px;
    background:
      radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--claude-accent, #8b7cf6) 8%, transparent), transparent 58%),
      color-mix(in srgb, var(--claude-card, #12162b) 62%, transparent);
    box-shadow:
      0 32px 90px rgba(0, 0, 0, .46),
      inset 0 1px 0 rgba(255, 255, 255, .045);
    text-align: center;
    backdrop-filter: blur(16px);
  }

  .card-mark {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    margin-bottom: 19px;
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 25%, transparent);
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--claude-accent, #8b7cf6) 16%, transparent), transparent 68%),
      color-mix(in srgb, var(--claude-accent, #8b7cf6) 5%, transparent);
    color: var(--claude-accent, #8b7cf6);
    box-shadow: 0 0 32px color-mix(in srgb, var(--claude-accent, #8b7cf6) 12%, transparent);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--claude-text-muted, #777594);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .eyebrow-line {
    width: 26px;
    height: 1px;
    background: linear-gradient(90deg, var(--claude-accent, #8b7cf6), transparent);
  }

  h1 {
    margin: 11px 0 0;
    color: var(--claude-text, #f1f0fa);
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(42px, 4vw, 56px);
    font-style: italic;
    font-weight: 600;
    letter-spacing: -.04em;
    line-height: 1;
    text-shadow: 0 20px 60px rgba(0, 0, 0, .45);
  }

  .subtitle {
    max-width: 360px;
    margin-top: 12px;
    color: var(--claude-text-dim, #aeacc8);
    font-size: 13px;
    line-height: 1.6;
  }

  .server-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    margin-top: 17px;
    padding: 7px 11px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 3%, transparent);
    color: var(--claude-text-dim, #aeacc8);
    font-size: 10.5px;
    font-weight: 500;
  }

  .server-dot {
    width: 5px;
    height: 5px;
    flex: none;
    border-radius: 50%;
    background: #ef6469;
    box-shadow: 0 0 0 3px color-mix(in srgb, #ef6469 13%, transparent);
  }

  .server-address {
    overflow: hidden;
    max-width: 250px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .server-tag {
    padding: 2px 6px;
    border: 1px solid color-mix(in srgb, var(--claude-accent, #8b7cf6) 22%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 7%, transparent);
    color: var(--claude-glint, #b2a6ff);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .6px;
    text-transform: uppercase;
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 24px;
  }

  .auto-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    width: 100%;
    margin-top: 22px;
    padding: 14px 15px;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5.5%, transparent);
    border-radius: 9px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 2.5%, transparent);
    text-align: left;
  }

  .auto-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .auto-title {
    color: var(--claude-text-soft, #d9d7ea);
    font-size: 11.5px;
    font-weight: 600;
  }

  .auto-sub {
    overflow: hidden;
    color: var(--claude-text-muted, #777594);
    font-size: 9.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .toggle {
    position: relative;
    width: 36px;
    height: 20px;
    flex: none;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 12%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-text, #f1f0fa) 7%, transparent);
    cursor: pointer;
    transition: background-color .2s ease, border-color .2s ease, box-shadow .2s ease;

    span {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--claude-text, #f1f0fa) 70%, transparent);
      transition: transform .2s ease, background-color .2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, .35);
    }

    &.on {
      border-color: color-mix(in srgb, var(--claude-accent, #8b7cf6) 48%, transparent);
      background: color-mix(in srgb, var(--claude-accent, #8b7cf6) 32%, transparent);
      box-shadow: 0 0 14px color-mix(in srgb, var(--claude-accent, #8b7cf6) 20%, transparent);

      span {
        transform: translateX(16px);
        background: var(--claude-glint, #b2a6ff);
      }
    }
  }

  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 22px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text, #f1f0fa) 5%, transparent);
    color: color-mix(in srgb, var(--claude-text-muted, #777594) 78%, transparent);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;

    span:first-child {
      color: var(--claude-text-dim, #aeacc8);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 12px;
      font-style: italic;
      letter-spacing: .2px;
      text-transform: none;

      span {
        color: var(--claude-glint, #b2a6ff);
      }
    }
  }

  @media (max-height: 700px) {
    .account {
      top: 20px;
      right: 22px;
      zoom: .8;
    }

    .disconnect-card {
      padding: 24px 28px 20px;
    }

    .card-mark {
      width: 50px;
      height: 50px;
      margin-bottom: 13px;
    }

    h1 {
      font-size: 38px;
    }

    .subtitle {
      margin-top: 8px;
    }

    .action-row {
      margin-top: 17px;
    }

    .auto-row {
      margin-top: 16px;
      padding: 11px 13px;
    }

    .card-foot {
      margin-top: 16px;
    }
  }
</style>
