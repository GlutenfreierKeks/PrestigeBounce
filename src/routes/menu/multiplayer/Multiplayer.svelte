<script lang="ts">
    import Icon from "../../clickgui/claude/Icon.svelte";
    import TextComponent from "../common/TextComponent.svelte";
    import SingleSelect from "../common/setting/select/SingleSelect.svelte";
    import WrappedSetting from "../common/setting/WrappedSetting.svelte";
    import AddServerModal from "./AddServerModal.svelte";
    import DirectConnectModal from "./DirectConnectModal.svelte";
    import EditServerModal from "./EditServerModal.svelte";
    import {onDestroy, onMount} from "svelte";
    import {fly} from "svelte/transition";
    import {SortableList} from "@jhubbardsf/svelte-sortablejs";
    import {
        openLink,
        connectToServer,
        getClientInfo,
        getLanServers,
        getModule,
        getProtocols,
        getSelectedProtocol,
        getServers,
        getSpooferSettings,
        openScreen,
        orderServers,
        removeServer as removeServerRest,
        setModuleEnabled,
        setSelectedProtocol,
        setSpooferSettings
    } from "../../../integration/rest";
    import type {ClientInfo, ConfigurableSetting, Protocol, Server} from "../../../integration/types";
    import {listen} from "../../../integration/ws";
    import type {ServerPingedEvent} from "../../../integration/events";
    import {REST_BASE} from "../../../integration/host";

    let onlineOnly = false;
    let searchQuery = "";
    let advancedOpen = false;
    let remountKey = 0;
    let actionError = "";
    let errorTimer: ReturnType<typeof setTimeout> | null = null;

    let addServerModalVisible = false;
    let directConnectModalVisible = false;
    let editServerModalVisible = false;
    let currentEditServer: Server | null = null;

    let clientInfo: ClientInfo | null = null;
    let autoConfig = false;
    let spooferConfigurable: ConfigurableSetting | null = null;
    let servers: Server[] = [];
    let lanServers: Server[] = [];
    let renderedServers: Server[] = [];
    let protocols: Protocol[] = [];
    let selectedProtocol: Protocol = {
        name: "",
        version: -1
    };

    let lanPollInterval: ReturnType<typeof setInterval> | null = null;

    $: {
        let combined = [...servers, ...lanServers];
        if (onlineOnly) {
            combined = combined.filter(server => server.ping > 0);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            combined = combined.filter(server =>
                server.name.toLowerCase().includes(query) ||
                server.address.toLowerCase().includes(query)
            );
        }
        renderedServers = combined;
    }

    $: savedCount = servers.length;
    $: onlineCount = [...servers, ...lanServers].filter(server => server.ping > 0).length;
    $: canSort = renderedServers.length === servers.length && lanServers.length === 0;

    onMount(async () => {
        try {
            clientInfo = await getClientInfo();
        } catch (error) {
            console.error("[PrestigeBounce] Could not read client info", error);
        }

        try {
            spooferConfigurable = await getSpooferSettings();
            autoConfig = (await getModule("AutoConfig")).enabled;
        } catch (error) {
            console.error("[PrestigeBounce] Could not load connection settings", error);
        }

        try {
            await refreshServers();
            await refreshLanServers();
            protocols = await getProtocols();
            selectedProtocol = await getSelectedProtocol();
        } catch (error) {
            console.error("[PrestigeBounce] Could not load server screen", error);
            flashError("Could not reach the client API");
        }

        // Poll for LAN servers every 3 seconds
        lanPollInterval = setInterval(refreshLanServers, 3000);
    });

    listen("serverPinged", (pingedEvent: ServerPingedEvent) => {
        const server = pingedEvent.server;
        servers = servers.map((current) => {
            if (current.address === server.address) {
                const clone = structuredClone(server);
                clone.id = current.id;
                clone.name = current.name;
                clone.resourcePackPolicy = current.resourcePackPolicy;
                return clone;
            } else {
                return current;
            }
        });
    });

    async function refreshServers() {
        servers = await getServers();
        await refreshLanServers();
    }

    async function refreshLanServers() {
        try {
            lanServers = await getLanServers();
        } catch (error) {
            console.error("[PrestigeBounce] Could not poll LAN servers", error);
        }
    }

    onDestroy(() => {
        if (lanPollInterval !== null) {
            clearInterval(lanPollInterval);
        }
        if (errorTimer !== null) {
            clearTimeout(errorTimer);
        }
    });

    function flashError(message: string) {
        actionError = message;
        if (errorTimer !== null) {
            clearTimeout(errorTimer);
        }
        errorTimer = setTimeout(() => actionError = "", 4000);
    }

    async function removeServer(id: number) {
        try {
            await removeServerRest(id);
            await refreshServers();
        } catch (error) {
            console.error("[PrestigeBounce] Could not remove server", error);
            flashError("Could not remove server");
        }
    }

    function getPingClass(ping: number) {
        if (ping <= 0) {
            return "bad";
        }
        if (ping <= 50) {
            return "good";
        }
        if (ping <= 100) {
            return "warn";
        }
        return "bad";
    }

    function getPingLabel(ping: number) {
        return ping > 0 ? `${ping} ms` : "Offline";
    }

    async function changeProtocolVersion(e: CustomEvent<{ value: string }>) {
        const protocol = protocols.find(candidate => candidate.name == e.detail.value);
        if (!protocol) {
            return;
        }

        try {
            await setSelectedProtocol(protocol);
            selectedProtocol = await getSelectedProtocol();
        } catch (error) {
            console.error("[PrestigeBounce] Could not change protocol", error);
            flashError("Could not change protocol");
        }
    }

    async function handleServerSort(e: any) {
        const oldIndex = e.oldIndex;
        const newIndex = e.newIndex;

        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
            return;
        }

        const order = Array.from({length: servers.length}, (_, index) => index);
        order.splice(oldIndex, 1);
        order.splice(newIndex, 0, oldIndex);

        try {
            await orderServers(order);
            await refreshServers();
        } catch (error) {
            console.error("[PrestigeBounce] Could not reorder servers", error);
            flashError("Could not save server order");
            await refreshServers();
        } finally {
            remountKey++;
        }
    }

    function editServer(server: Server) {
        currentEditServer = server;
        editServerModalVisible = true;
    }

    async function updateSpooferSettings() {
        if (!spooferConfigurable) {
            return;
        }

        try {
            await setSpooferSettings(spooferConfigurable);
            spooferConfigurable = await getSpooferSettings();
        } catch (error) {
            console.error("[PrestigeBounce] Could not save spoofer settings", error);
            flashError("Could not save spoofer settings");
        }
    }

    async function toggleAutoConfig() {
        autoConfig = !autoConfig;
        try {
            await setModuleEnabled("AutoConfig", autoConfig);
        } catch (error) {
            autoConfig = !autoConfig;
            console.error("[PrestigeBounce] Could not toggle AutoConfig", error);
            flashError("Could not toggle Auto Config");
        }
    }

    function serverIcon(server: Server) {
        return server.ping < 0 || !server.icon
            ? `${REST_BASE}/api/v1/client/resource?id=minecraft:textures/misc/unknown_server.png`
            : `data:image/png;base64,${server.icon}`;
    }
</script>

<AddServerModal bind:visible={addServerModalVisible} on:serverAdd={refreshServers}/>

{#if currentEditServer}
    <EditServerModal bind:visible={editServerModalVisible} address={currentEditServer.address}
                     name={currentEditServer.name} on:serverEdit={refreshServers} id={currentEditServer.id}
                     resourcePackPolicy={currentEditServer.resourcePackPolicy}/>
{/if}

<DirectConnectModal bind:visible={directConnectModalVisible}/>

<div class="server-screen">
    <header class="page-head">
        <div class="head-copy">
            <div class="eyebrow">
                <span class="eyebrow-line"></span>
                Multiplayer
            </div>
            <h1>Servers</h1>
            <p>{savedCount} saved{#if lanServers.length > 0} · {lanServers.length} LAN{/if} · {onlineCount} online</p>
        </div>

        <div class="head-actions">
            <button type="button" class="primary-button" on:click={() => addServerModalVisible = true}>
                <Icon name="plus" size={15}/>
                Add server
            </button>
            <button type="button" class="secondary-button" on:click={() => directConnectModalVisible = true}>
                <Icon name="send" size={15}/>
                Direct connect
            </button>
        </div>
    </header>

    <div class="toolbar">
        <label class="search-field">
            <Icon name="search" size={16}/>
            <input type="text" placeholder="Search name or address…" bind:value={searchQuery} spellcheck="false">
            {#if searchQuery}
                <button type="button" class="clear-search" title="Clear search" on:click={() => searchQuery = ""}>
                    <Icon name="x" size={13}/>
                </button>
            {/if}
        </label>

        <button type="button" class="tool-toggle" class:active={onlineOnly} on:click={() => onlineOnly = !onlineOnly}>
            <span class="toggle-indicator"></span>
            Online only
        </button>

        <button type="button" class="tool-toggle" class:active={autoConfig} on:click={toggleAutoConfig}>
            <span class="toggle-indicator"></span>
            Auto Config
        </button>

        <button type="button" class="tool-toggle" class:active={advancedOpen} on:click={() => advancedOpen = !advancedOpen}>
            <Icon name="settings" size={13}/>
            Connection
            <Icon name="chevron-down" size={12} class={`chevron${advancedOpen ? " rotated" : ""}`}/>
        </button>
    </div>

    {#if advancedOpen}
        <div class="advanced-panel" transition:fly|local={{duration: 220, y: -6}}>
            {#if spooferConfigurable}
                <WrappedSetting bind:value={spooferConfigurable} on:change={updateSpooferSettings} path="multiplayer.spoofer"/>
            {/if}

            {#if clientInfo && clientInfo.viaFabricPlus}
                <SingleSelect title="Version" value={selectedProtocol.name} options={protocols.map(protocol => protocol.name)}
                              on:change={changeProtocolVersion}/>
                <button type="button" class="ghost-button" on:click={() => openScreen("viafabricplus_protocol_selection")}>
                    ViaFabricPlus
                </button>
            {:else}
                <button type="button" class="ghost-button" on:click={() => openLink("VIAFABRICPLUS")}>
                    <Icon name="download" size={14}/>
                    Install ViaFabricPlus
                </button>
            {/if}
        </div>
    {/if}

    {#if actionError}
        <div class="error-banner">
            <Icon name="x" size={13}/>
            {actionError}
        </div>
    {/if}

    <div class="server-list">
        {#if renderedServers.length === 0}
            <div class="empty-state">
                <span class="empty-icon"><Icon name="server" size={26}/></span>
                <div class="empty-title">{searchQuery || onlineOnly ? "No servers match" : "No servers yet"}</div>
                <p>
                    {searchQuery || onlineOnly
                        ? "Try a different search or turn off the online-only filter."
                        : "Add a saved server or connect directly to an address."}
                </p>
                {#if !searchQuery && !onlineOnly}
                    <div class="empty-actions">
                        <button type="button" class="primary-button" on:click={() => addServerModalVisible = true}>
                            <Icon name="plus" size={14}/>
                            Add server
                        </button>
                        <button type="button" class="secondary-button" on:click={() => directConnectModalVisible = true}>
                            <Icon name="send" size={14}/>
                            Direct connect
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            {#key remountKey}
                {#if canSort}
                    <SortableList class="server-rows" onSort={handleServerSort} forceFallback={true} animation={160}>
                        {#each renderedServers as server (server.id + "-" + server.address)}
                            {@render serverRow(server)}
                        {/each}
                    </SortableList>
                {:else}
                    <div class="server-rows">
                        {#each renderedServers as server (server.id + "-" + server.address)}
                            {@render serverRow(server)}
                        {/each}
                    </div>
                {/if}
            {/key}
        {/if}
    </div>

    <footer class="footer">
        <button type="button" class="footer-button" on:click={() => openScreen("title")}>
            <Icon name="arrow-left" size={14}/>
            Back
        </button>

        <span class="footer-hint">
            {#if canSort}
                <span class="drag-grip"></span>
                Drag to reorder
            {:else}
                Double-click a server to join
            {/if}
        </span>

        <button type="button" class="footer-button" on:click={refreshServers}>
            <Icon name="refresh" size={14}/>
            Refresh
        </button>
    </footer>
</div>

{#snippet serverRow(server: Server)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="server-row" on:dblclick={() => connectToServer(server.address)}>
        <span class="drag-grip" title={canSort ? "Drag to reorder" : undefined} class:hidden={!canSort}></span>

        <div class="server-icon">
            <img src={serverIcon(server)} alt="">
            <span class="ping-dot {getPingClass(server.ping)}"></span>
        </div>

        <div class="server-info">
            <div class="server-title-line">
                <span class="server-name">{server.name}</span>
                {#if server.lan}
                    <span class="tag lan">LAN</span>
                {/if}
                {#if server.ping > 0}
                    <span class="tag">{server.players.online}/{server.players.max} players</span>
                    <span class="tag">{server.version}</span>
                {/if}
            </div>

            <div class="server-address">{server.address}</div>

            <div class="server-motd">
                <TextComponent allowPreformatting={true} preFormattingMonospace={false} fontSize={12}
                               textComponent={server.ping <= 0 ? "§cCan't connect to server" : server.label}/>
            </div>
        </div>

        <div class="server-ping {getPingClass(server.ping)}">
            {getPingLabel(server.ping)}
        </div>

        <div class="row-actions">
            {#if !server.lan}
                <button type="button" class="row-icon" title="Edit server"
                        on:click|stopPropagation={() => editServer(server)}>
                    <Icon name="edit" size={14}/>
                </button>
                <button type="button" class="row-icon danger" title="Remove server"
                        on:click|stopPropagation={() => removeServer(server.id)}>
                    <Icon name="trash" size={14}/>
                </button>
            {/if}

            <button type="button" class="join-button" on:click|stopPropagation={() => connectToServer(server.address)}>
                <Icon name="play" size={11}/>
                Join
            </button>
        </div>
    </div>
{/snippet}

<style lang="scss">
  .server-screen {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    gap: 14px;
    width: min(100%, 1760px);
    margin-inline: auto;
    isolation: isolate;
  }

  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
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
    margin-top: 6px;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(34px, 3vw, 46px);
    font-weight: 600;
    letter-spacing: -.03em;
    line-height: 1;
  }

  .head-copy p {
    margin-top: 7px;
    color: var(--claude-text-muted);
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: .2px;
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 3px;
  }

  .primary-button,
  .secondary-button,
  .ghost-button,
  .footer-button,
  .join-button,
  .row-icon,
  .tool-toggle,
  .clear-search {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid transparent;
    border-radius: 7px;
    font: inherit;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease, transform .16s ease;
  }

  .primary-button {
    min-height: 36px;
    padding: 0 15px;
    background: var(--claude-accent);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 7px 20px color-mix(in srgb, var(--claude-accent) 22%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--claude-accent) 88%, white);
    }
  }

  .secondary-button {
    min-height: 36px;
    padding: 0 14px;
    border-color: color-mix(in srgb, var(--claude-text) 8%, transparent);
    background: color-mix(in srgb, var(--claude-card) 62%, transparent);
    color: var(--claude-text-soft);
    font-size: 13px;
    font-weight: 550;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 15%, transparent);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
      color: var(--claude-text);
    }
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    border-radius: 11px;
    background: color-mix(in srgb, var(--claude-card) 54%, transparent);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .025);
    backdrop-filter: blur(12px);
  }

  .search-field {
    display: flex;
    align-items: center;
    gap: 9px;
    flex: 1;
    min-width: 0;
    height: 34px;
    padding: 0 12px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-background) 38%, transparent);
    color: var(--claude-text-muted);
    transition: border-color .16s ease, background-color .16s ease;

    &:focus-within {
      border-color: color-mix(in srgb, var(--claude-accent) 40%, transparent);
      background: color-mix(in srgb, var(--claude-background) 48%, transparent);
    }

    input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      color: var(--claude-text);
      font: inherit;
      font-size: 13px;
      outline: none;

      &::placeholder {
        color: color-mix(in srgb, var(--claude-text-muted) 78%, transparent);
      }
    }
  }

  .clear-search {
    width: 19px;
    height: 19px;
    padding: 0;
    background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    color: var(--claude-text-muted);

    &:hover {
      background: color-mix(in srgb, var(--claude-text) 9%, transparent);
      color: var(--claude-text);
    }
  }

  .tool-toggle {
    flex: none;
    height: 34px;
    padding: 0 11px;
    border-color: color-mix(in srgb, var(--claude-text) 6%, transparent);
    background: transparent;
    color: var(--claude-text-muted);
    font-size: 12px;
    font-weight: 550;
    white-space: nowrap;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 12%, transparent);
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      color: var(--claude-text-soft);
    }

    &.active {
      border-color: color-mix(in srgb, var(--claude-accent) 30%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 11%, transparent);
      color: var(--claude-glint);
    }

    .chevron {
      transition: transform .2s ease;

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .toggle-indicator {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--claude-text-muted) 70%, transparent);
    transition: background-color .16s ease, box-shadow .16s ease;

    .tool-toggle.active & {
      background: var(--claude-accent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--claude-accent) 65%, transparent);
    }
  }

  .advanced-panel {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 14%, transparent);
    border-radius: 10px;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 5%, transparent), transparent 40%),
      color-mix(in srgb, var(--claude-background) 56%, transparent);

    :global(.wrapped-setting) {
      min-width: 240px;
    }

    :global(.wrapped-setting .header) {
      border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
      border-radius: 7px;
      background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    }

    :global(.wrapped-setting .configurable-title),
    :global(.wrapped-setting :global(.title)) {
      color: var(--claude-text-soft);
      font-size: 13px;
    }

    :global(.select) {
      min-width: 190px;
    }

    :global(.select .header) {
      border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
      border-radius: 7px;
      background: color-mix(in srgb, var(--claude-text) 3%, transparent);
      padding: 8px 10px;
    }

    :global(.select .title) {
      color: var(--claude-text-soft);
      font-size: 12.5px;

      :global(.title) {
        color: var(--claude-text-muted);
      }
    }

    :global(.select .options) {
      border: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
      border-radius: 0 0 7px 7px;
      background: color-mix(in srgb, var(--claude-card) 96%, black);

      :global(.option) {
        color: var(--claude-text-dim);
        font-size: 12.5px;
        padding: 8px 10px;

        &:hover {
          color: var(--claude-text);
          background: color-mix(in srgb, var(--claude-text) 4%, transparent);
        }

        &:global(.active) {
          color: var(--claude-accent);
        }
      }
    }
  }

  .ghost-button {
    height: 34px;
    padding: 0 12px;
    border-color: color-mix(in srgb, var(--claude-text) 8%, transparent);
    background: transparent;
    color: var(--claude-text-dim);
    font-size: 12px;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-accent) 30%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 8%, transparent);
      color: var(--claude-glint);
    }
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border: 1px solid color-mix(in srgb, #ff5964 24%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, #ff5964 8%, transparent);
    color: #ffb3b8;
    font-size: 12px;
    font-weight: 550;
  }

  .server-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--claude-card) 48%, transparent);
    box-shadow: 0 20px 50px rgba(0, 0, 0, .2), inset 0 1px 0 rgba(255, 255, 255, .025);
    backdrop-filter: blur(12px);
  }

  :global(.server-rows) {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
  }

  .server-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px 11px 8px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: color-mix(in srgb, var(--claude-text) 2.2%, transparent);
    cursor: grab;
    transition: background-color .15s ease, border-color .15s ease, transform .15s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-accent) 22%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 6%, transparent);

      .row-actions {
        opacity: 1;
      }
    }

    &:active {
      cursor: grabbing;
    }
  }

  .drag-grip {
    width: 9px;
    height: 24px;
    flex: none;
    opacity: .28;
    background-image: radial-gradient(circle, var(--claude-text) 1px, transparent 1.1px);
    background-size: 5px 5px;
    background-position: 1px 2px;
    transition: opacity .15s ease;

    &.hidden {
      visibility: hidden;
    }

    .server-row:hover & {
      opacity: .6;
    }
  }

  .server-icon {
    position: relative;
    width: 46px;
    height: 46px;
    flex: none;

    img {
      width: 46px;
      height: 46px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--claude-text) 7%, transparent);
      image-rendering: pixelated;
      object-fit: cover;
    }
  }

  .ping-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 8px;
    height: 8px;
    border: 2px solid color-mix(in srgb, var(--claude-background) 82%, black);
    border-radius: 50%;

    &.good {
      background: #5fd68a;
      box-shadow: 0 0 8px color-mix(in srgb, #5fd68a 55%, transparent);
    }

    &.warn {
      background: #e8c45a;
      box-shadow: 0 0 8px color-mix(in srgb, #e8c45a 45%, transparent);
    }

    &.bad {
      background: #ef6469;
      box-shadow: 0 0 8px color-mix(in srgb, #ef6469 45%, transparent);
    }
  }

  .server-info {
    flex: 1;
    min-width: 0;
  }

  .server-title-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .server-name {
    overflow: hidden;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag {
    flex: none;
    padding: 2px 6px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-muted);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .2px;
    white-space: nowrap;

    &.lan {
      border-color: color-mix(in srgb, var(--claude-accent) 24%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      color: var(--claude-glint);
    }
  }

  .server-address {
    margin-top: 2px;
    overflow: hidden;
    color: color-mix(in srgb, var(--claude-text-muted) 82%, transparent);
    font-size: 11.5px;
    letter-spacing: .1px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .server-motd {
    margin-top: 3px;
    overflow: hidden;
    color: var(--claude-text-dim);
    font-size: 13px;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .server-ping {
    flex: none;
    min-width: 52px;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    letter-spacing: .1px;

    &.good {
      background: color-mix(in srgb, #5fd68a 10%, transparent);
      color: #7fe5a3;
    }

    &.warn {
      background: color-mix(in srgb, #e8c45a 10%, transparent);
      color: #edcf7a;
    }

    &.bad {
      background: color-mix(in srgb, #ef6469 9%, transparent);
      color: #f18b8f;
    }
  }

  .row-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    opacity: .45;
    transition: opacity .15s ease;
  }

  .row-icon {
    width: 30px;
    height: 30px;
    padding: 0;
    background: transparent;
    color: var(--claude-text-muted);

    &:hover {
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
      color: var(--claude-text);
    }

    &.danger:hover {
      border-color: color-mix(in srgb, #ff5964 24%, transparent);
      background: color-mix(in srgb, #ff5964 9%, transparent);
      color: #ff8d96;
    }
  }

  .join-button {
    height: 30px;
    padding: 0 12px;
    border-color: color-mix(in srgb, var(--claude-accent) 24%, transparent);
    background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
    color: var(--claude-glint);
    font-size: 11.5px;
    font-weight: 650;

    &:hover {
      border-color: transparent;
      background: var(--claude-accent);
      color: #fff;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 260px;
    padding: 30px;
    text-align: center;
  }

  .empty-icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 20%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--claude-accent) 7%, transparent);
    color: var(--claude-accent);
  }

  .empty-title {
    margin-top: 14px;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 22px;
    font-weight: 600;
  }

  .empty-state p {
    max-width: 330px;
    margin-top: 6px;
    color: var(--claude-text-muted);
    font-size: 13px;
    line-height: 1.55;
  }

  .empty-actions {
    display: flex;
    gap: 8px;
    margin-top: 17px;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .footer-button {
    padding: 8px 11px;
    background: transparent;
    color: var(--claude-text-muted);
    font-size: 12px;
    font-weight: 500;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 7%, transparent);
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      color: var(--claude-text-soft);
    }
  }

  .footer-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    color: color-mix(in srgb, var(--claude-text-muted) 72%, transparent);
    font-size: 11px;
    letter-spacing: .25px;
  }

  @media (max-width: 1080px) {
    .tool-toggle {
      font-size: 10px;
    }

    .server-ping {
      display: none;
    }
  }

  @media (max-height: 800px) {
    .server-screen {
      gap: 9px;
    }

    .page-head {
      align-items: center;
    }

    h1 {
      font-size: 32px;
    }

    .head-copy p {
      margin-top: 3px;
    }

    .server-row {
      padding-top: 6px;
      padding-bottom: 6px;
    }

    .server-icon,
    .server-icon img {
      width: 36px;
      height: 36px;
    }

    .server-motd {
      display: none;
    }
  }
</style>
