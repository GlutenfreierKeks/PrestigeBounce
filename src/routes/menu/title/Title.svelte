<script lang="ts">
    import Icon from "../../clickgui/claude/Icon.svelte";
    import {
        openLink,
        exitClient,
        getClientInfo,
        getClientUpdate,
        openScreen,
        toggleBackgroundShaderEnabled,
        toggleBasicMode
    } from "../../../integration/rest";
    import {fly} from "svelte/transition";
    import {onMount} from "svelte";
    import {notification} from "../common/header/notification_store";
    import {escapeLayer} from "../../../integration/escape";
    import type {ClientInfo} from "../../../integration/types";

    let clientButtonsShown = false;
    let clientInfo: ClientInfo | null = null;

    onMount(async () => {
        try {
            clientInfo = await getClientInfo();
        } catch (error) {
            console.error("[Claude] Could not read client info", error);
        }

        setTimeout(async () => {
            try {
                const clientUpdate = await getClientUpdate();

                if (clientUpdate.update) {
                    notification.set({
                        title: `LiquidBounce ${clientUpdate.update.clientVersion} has been released!`,
                        message: `Download it from liquidbounce.net!`,
                        error: false,
                        delay: 99999999
                    });
                }
            } catch (error) {
                console.error("[Claude] Could not check for client updates", error);
            }
        }, 2000);
    });

    function toggleClientButtons() {
        clientButtonsShown = !clientButtonsShown;
    }

    const layer = escapeLayer(() => clientButtonsShown = false);
    $: layer.setOpen(clientButtonsShown);
</script>

<div class="title-screen">
    <div class="content">
        <section class="hero">
            <div class="eyebrow">
                <span class="eyebrow-line"></span>
                LiquidBounce <span class="eyebrow-cross">×</span> Claude
            </div>

            <h1>Choose your<br><em>next world.</em></h1>

            <p class="lede">
                A calmer way to start Minecraft. Pick a local world, join a server,
                or tune the client before you drop in.
            </p>

            <div class="primary-nav">
                <button type="button" class="action" on:click={() => openScreen("singleplayer")}>
                    <span class="action-icon"><Icon name="box" size={20}/></span>
                    <span class="action-copy">
                        <span class="action-title">Singleplayer</span>
                        <span class="action-sub">Play a local world</span>
                    </span>
                    <span class="action-arrow"><Icon name="chevron-right" size={16}/></span>
                </button>

                <div class="action-group">
                    <button type="button" class="action" on:click={() => openScreen("multiplayer")}>
                        <span class="action-icon"><Icon name="server" size={20}/></span>
                        <span class="action-copy">
                            <span class="action-title">Multiplayer</span>
                            <span class="action-sub">Servers and Realms</span>
                        </span>
                        <span class="action-arrow"><Icon name="chevron-right" size={16}/></span>
                    </button>
                    <button type="button" class="realms" on:click={() => openScreen("multiplayer_realms")}>
                        Realms
                    </button>
                </div>

                <button type="button" class="action" class:open={clientButtonsShown} on:click={toggleClientButtons}>
                    <span class="action-icon"><Icon name="crown" size={20}/></span>
                    <span class="action-copy">
                        <span class="action-title">LiquidBounce</span>
                        <span class="action-sub">Client tools and settings</span>
                    </span>
                    <span class="action-arrow" class:rotated={clientButtonsShown}>
                        <Icon name="chevron-down" size={16}/>
                    </span>
                </button>

                {#if clientButtonsShown}
                    <div class="client-panel" transition:fly|local={{duration: 260, y: -8}}>
                        <button type="button" class="client-tile" on:click={() => openScreen("clickgui")}>
                            <span class="client-tile-icon"><Icon name="grid" size={18}/></span>
                            <span>
                                <span class="client-tile-title">Click GUI</span>
                                <span class="client-tile-sub">Modules, HUD and configs</span>
                            </span>
                        </button>

                        <button type="button" class="client-tile" on:click={() => openScreen("proxymanager")}>
                            <span class="client-tile-icon"><Icon name="globe" size={18}/></span>
                            <span>
                                <span class="client-tile-title">Proxy Manager</span>
                                <span class="client-tile-sub">Route your connection</span>
                            </span>
                        </button>

                        <button type="button" class="client-tile" on:click={() => openScreen("altmanager")}>
                            <span class="client-tile-icon"><Icon name="user" size={18}/></span>
                            <span>
                                <span class="client-tile-title">Alt Manager</span>
                                <span class="client-tile-sub">Accounts and sessions</span>
                            </span>
                        </button>
                    </div>
                {/if}

                <button type="button" class="action" on:click={() => openScreen("options")}>
                    <span class="action-icon"><Icon name="settings" size={20}/></span>
                    <span class="action-copy">
                        <span class="action-title">Options</span>
                        <span class="action-sub">Game settings</span>
                    </span>
                    <span class="action-arrow"><Icon name="chevron-right" size={16}/></span>
                </button>
            </div>
        </section>

        <aside class="rail">
            <div class="glass session-card">
                <div class="rail-label">Session</div>

                <div class="session-name">{clientInfo?.clientName ?? "LiquidBounce"}</div>

                <div class="session-meta">
                    <div class="meta-row">
                        <span>Client</span>
                        <strong>{clientInfo?.clientVersion ?? "—"}</strong>
                    </div>
                    <div class="meta-row">
                        <span>Minecraft</span>
                        <strong>{clientInfo?.gameVersion ?? "—"}</strong>
                    </div>
                    {#if clientInfo?.development}
                        <div class="meta-row">
                            <span>Build</span>
                            <strong class="dev">Development</strong>
                        </div>
                    {/if}
                </div>

                <div class="status" class:online={clientInfo !== null}>
                    <span class="status-dot"></span>
                    {clientInfo ? "Client API connected" : "Waiting for client"}
                </div>
            </div>

            <div class="glass links-card">
                <div class="rail-label">Community</div>

                <div class="social-row">
                    <button type="button" class="social" title="Discord"
                            on:click={() => openLink("MAINTAINER_DISCORD")}>
                        <img src="img/menu/icon-discord.svg" alt="Discord">
                    </button>
                    <button type="button" class="social" title="GitHub"
                            on:click={() => openLink("MAINTAINER_GITHUB")}>
                        <img src="img/menu/icon-github.svg" alt="GitHub">
                    </button>
                    <button type="button" class="social" title="Forum"
                            on:click={() => openLink("MAINTAINER_FORUM")}>
                        <img src="img/menu/icon-nodebb.svg" alt="Forum">
                    </button>
                    <button type="button" class="social" title="Twitter"
                            on:click={() => openLink("MAINTAINER_TWITTER")}>
                        <img src="img/menu/icon-twitter.svg" alt="Twitter">
                    </button>
                    <button type="button" class="social" title="YouTube"
                            on:click={() => openLink("MAINTAINER_YOUTUBE")}>
                        <img src="img/menu/icon-youtube.svg" alt="YouTube">
                    </button>
                </div>

                <button type="button" class="website" on:click={() => openLink("CLIENT_WEBSITE")}>
                    liquidbounce.net
                    <Icon name="chevron-right" size={14}/>
                </button>
            </div>
        </aside>
    </div>

    <footer class="footer">
        <div class="footer-actions">
            <button type="button" class="footer-button" on:click={exitClient}>
                <Icon name="power" size={14}/>
                Exit
            </button>
            <button type="button" class="footer-button" on:click={toggleBasicMode}>
                <Icon name="eye" size={14}/>
                Basic Mode
            </button>
            <button type="button" class="footer-button" on:click={toggleBackgroundShaderEnabled}>
                <Icon name="image" size={14}/>
                Toggle Shader
            </button>
        </div>

        <div class="footer-note">Claude for LiquidBounce</div>
    </footer>
</div>

<style lang="scss">
  .title-screen {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    gap: 22px;
    isolation: isolate;
  }

  .content {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    align-items: center;
    gap: clamp(28px, 4.5vw, 84px);
  }

  .hero {
    min-width: 0;
    max-width: 720px;
    padding: 4px 0;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 11px;
    color: color-mix(in srgb, var(--claude-text-dim) 88%, transparent);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .eyebrow-line {
    width: 34px;
    height: 1px;
    background: linear-gradient(90deg, var(--claude-accent), transparent);
  }

  .eyebrow-cross {
    color: var(--claude-accent);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    letter-spacing: 0;
  }

  h1 {
    margin: 17px 0 15px;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(48px, 4.9vw, 78px);
    font-weight: 600;
    letter-spacing: -.038em;
    line-height: .96;
    text-shadow: 0 22px 60px rgba(0, 0, 0, .42);

    em {
      color: var(--claude-glint);
      font-weight: 500;
    }
  }

  .lede {
    max-width: 500px;
    color: var(--claude-text-dim);
    font-size: 14.5px;
    line-height: 1.65;
  }

  .primary-nav {
    display: flex;
    flex-direction: column;
    gap: 9px;
    max-width: 660px;
    margin-top: 31px;
  }

  .action-group {
    position: relative;
  }

  .action {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 70px;
    padding: 11px 18px 11px 13px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6.5%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--claude-card) 60%, transparent);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .028);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    backdrop-filter: blur(12px);
    transition: background-color .16s ease, border-color .16s ease, transform .16s ease, box-shadow .16s ease;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background: linear-gradient(100deg, color-mix(in srgb, var(--claude-accent) 9%, transparent), transparent 52%);
      opacity: 0;
      transition: opacity .16s ease;
    }

    &:hover,
    &.open {
      border-color: color-mix(in srgb, var(--claude-accent) 32%, transparent);
      background: color-mix(in srgb, var(--claude-card) 82%, transparent);
      box-shadow: 0 12px 34px rgba(0, 0, 0, .22), inset 0 1px 0 rgba(255, 255, 255, .05);
      transform: translateX(3px);

      &::before {
        opacity: 1;
      }

      .action-icon {
        color: var(--claude-accent);
        border-color: color-mix(in srgb, var(--claude-accent) 28%, transparent);
        background: color-mix(in srgb, var(--claude-accent) 12%, transparent);
      }

      .action-arrow {
        color: var(--claude-text);
      }
    }
  }

  .action-icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: none;
    border: 1px solid color-mix(in srgb, var(--claude-text) 7%, transparent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
    color: var(--claude-text-soft);
    transition: color .16s ease, background-color .16s ease, border-color .16s ease;
  }

  .action-copy {
    position: relative;
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 3px;
  }

  .action-title {
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 23px;
    font-weight: 600;
    letter-spacing: -.015em;
    line-height: 1.1;
  }

  .action-sub {
    color: var(--claude-text-muted);
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: .25px;
  }

  .action-arrow {
    position: relative;
    display: grid;
    place-items: center;
    color: var(--claude-text-muted);
    transition: color .16s ease, transform .2s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }

  .realms {
    position: absolute;
    top: 50%;
    right: 44px;
    transform: translateY(-50%);
    padding: 4px 9px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 26%, transparent);
    border-radius: 5px;
    background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
    color: var(--claude-glint);
    font: inherit;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .8px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-accent) 50%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 18%, transparent);
    }
  }

  .client-panel {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 1px 0 3px;
    padding: 9px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 16%, transparent);
    border-radius: 12px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-accent) 5%, transparent), transparent),
      color-mix(in srgb, var(--claude-background) 64%, transparent);
  }

  .client-tile {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 8%, transparent);
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);

      .client-tile-icon {
        color: var(--claude-accent);
      }
    }
  }

  .client-tile-icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-dim);
    transition: color .15s ease;
  }

  .client-tile-title,
  .client-tile-sub {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .client-tile-title {
    color: var(--claude-text-soft);
    font-size: 12px;
    font-weight: 600;
  }

  .client-tile-sub {
    margin-top: 2px;
    color: var(--claude-text-muted);
    font-size: 9.5px;
  }

  .rail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 8px;
  }

  .glass {
    border: 1px solid color-mix(in srgb, var(--claude-text) 6.5%, transparent);
    border-radius: 14px;
    background:
      radial-gradient(110% 130% at 0% 0%, color-mix(in srgb, var(--claude-accent) 7%, transparent), transparent 56%),
      color-mix(in srgb, var(--claude-card) 58%, transparent);
    box-shadow: 0 20px 46px rgba(0, 0, 0, .24), inset 0 1px 0 rgba(255, 255, 255, .035);
    backdrop-filter: blur(14px);
  }

  .session-card {
    padding: 21px;
  }

  .rail-label {
    color: var(--claude-text-muted);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .session-name {
    margin-top: 12px;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 27px;
    font-weight: 600;
    letter-spacing: -.025em;
    line-height: 1.05;
  }

  .session-meta {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 17px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
  }

  .meta-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    color: var(--claude-text-muted);
    font-size: 12px;

    strong {
      overflow: hidden;
      color: var(--claude-text-dim);
      font-size: 12px;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.dev {
        color: var(--claude-glint);
      }
    }
  }

  .status {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 16px;
    color: var(--claude-text-muted);
    font-size: 11px;
    font-weight: 500;

    &.online {
      color: color-mix(in srgb, #6fdc9a 76%, var(--claude-text));
    }
  }

  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--claude-text-muted);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-text-muted) 12%, transparent);

    .status.online & {
      background: #6fdc9a;
      box-shadow: 0 0 0 3px color-mix(in srgb, #6fdc9a 14%, transparent), 0 0 12px color-mix(in srgb, #6fdc9a 45%, transparent);
    }
  }

  .links-card {
    padding: 17px 19px 14px;
  }

  .social-row {
    display: flex;
    gap: 6px;
    margin-top: 12px;
  }

  .social {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: 1;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6.5%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text) 2.5%, transparent);
    cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease, transform .15s ease;

    img {
      width: 16px;
      height: 16px;
      opacity: .6;
      transition: opacity .15s ease;
    }

    &:hover {
      border-color: color-mix(in srgb, var(--claude-accent) 30%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      transform: translateY(-1px);

      img {
        opacity: 1;
      }
    }
  }

  .website {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 11px;
    padding: 9px 0 0;
    border: none;
    border-top: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    background: transparent;
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 12px;
    letter-spacing: .2px;
    cursor: pointer;
    transition: color .15s ease;

    &:hover {
      color: var(--claude-glint);
    }
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding-top: 4px;
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .footer-button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: color .15s ease, background-color .15s ease, border-color .15s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 7%, transparent);
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      color: var(--claude-text-soft);
    }
  }

  .footer-note {
    color: color-mix(in srgb, var(--claude-text-muted) 72%, transparent);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 12px;
    font-style: italic;
    letter-spacing: .2px;
  }

  @media (max-width: 1180px) {
    .content {
      grid-template-columns: minmax(0, 1fr);
    }

    .rail {
      display: none;
    }

    .hero {
      max-width: 760px;
    }
  }

  @media (max-height: 760px) {
    .title-screen {
      gap: 12px;
    }

    h1 {
      font-size: clamp(38px, 4vw, 56px);
    }

    .lede {
      display: none;
    }

    .primary-nav {
      margin-top: 20px;
    }

    .action {
      min-height: 58px;
    }

    .rail {
      display: none;
    }

    .content {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
