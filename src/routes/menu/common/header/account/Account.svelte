<script lang="ts">
    import ToolTip from "../../ToolTip.svelte";
    import {
        directLoginToCrackedAccount,
        getAccounts,
        getSession,
        loginToAccount,
        openScreen,
        randomUsername
    } from "../../../../../integration/rest";
    import {onMount} from "svelte";
    import {listen} from "../../../../../integration/ws";
    import {location} from "svelte-spa-router";
    import {quintOut} from "svelte/easing";
    import {fade, slide, fly} from "svelte/transition";
    import type {Account} from "../../../../../integration/types";
    import Avatar from "./Avatar.svelte";
    import {notification} from "../notification_store";
    import RippleLoader from "../../RippleLoader.svelte";
    import {isLoggingIn} from "../../../altmanager/altmanager_store";
    import {isAnniversary} from "../../../../../util/utils";
    import {escapeLayer} from "../../../../../integration/escape";

    let username = "";
    let service = "";
    let avatar = "";
    let online = true;

    let expanded = false;
    let accountElement: HTMLElement;
    let headerElement: HTMLElement;

    let searchQuery = "";
    let accounts: Account[] = [];

    $: renderedAccounts = accounts.filter(a => a.username.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "");

    $: inAccountManager = $location === "/altmanager";
    $: inTitle = $location === "/title";

    async function refreshSession() {
        const session = await getSession();
        username = session.username;
        service = session.service;
        avatar = session.avatar;
        online = session.online;
    }

    async function refreshAccounts() {
        accounts = await getAccounts();
    }

    onMount(async () => {
        await refreshSession();
        await refreshAccounts();
    });

    listen("session", async () => {
        await refreshSession();
    });

    listen("accountManagerRemoval", async () => {
        await refreshAccounts();
    });

    listen("accountManagerAddition", async () => {
        await refreshAccounts();
    });

    function handleWindowClick(e: MouseEvent) {
        if (!accountElement.contains(e.target as Node)) {
            expanded = false;
            searchQuery = "";
        }
    }

    function handleSelectClick(e: MouseEvent) {
        if (!expanded) {
            // Prevent icon buttons from opening quick switcher
            expanded = !(e.target as HTMLElement).classList.contains("icon");
        } else {
            expanded = !headerElement.contains(e.target as Node);
        }

        if (!expanded) {
            searchQuery = "";
        }
    }

    const layer = escapeLayer(() => {
        expanded = false;
        searchQuery = "";
    });
    $: layer.setOpen(expanded);

    async function login(account: Account) {
        notification.set({
            title: "AltManager",
            message: "Logging in...",
            error: false
        });

        await loginToAccount(account.id);
    }

    async function loginWithRandomUsername() {
        const username = await randomUsername();
        await directLoginToCrackedAccount(username, false);
    }
</script>

<svelte:window on:click={handleWindowClick}/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="account" class:expanded bind:this={accountElement} on:click={handleSelectClick}>
    <div class="header" bind:this={headerElement}>
        {#if $isLoggingIn}
            <div class="avatar-wrapper" transition:fade={{ duration: 200 }}>
                <RippleLoader size={68} />
            </div>
        {:else}
            <div class="avatar-wrapper">
                <object data={avatar} type="image/png" class="avatar" aria-label="avatar" in:fade={{ duration: 200, delay: 200 }}>
                    <img src="img/steve.png" alt=avatar class="avatar">
                </object>

                {#if isAnniversary() && inTitle}
                    <img transition:fly={{duration: 500, y: -10}} class="party-hat" src="img/anniversary/party-hat.svg" alt="party-hat">
                {/if}
            </div>
        {/if}
        <div class="username">{username}</div>
        <div class="account-type">
            {#if online}
                <span class="online">{service}</span>
            {:else}
                <span class="offline">{service}</span>
            {/if}
        </div>
        <div class="buttons">
            <button class="icon-button" type="button" on:click={loginWithRandomUsername}>
                <ToolTip text="Random username"/>

                <img class="icon" src="img/menu/account/icon-random.svg" alt="random username">
            </button>
            <button class="icon-button" disabled={inAccountManager} type="button"
                    on:click={() => openScreen("altmanager")}>
                <ToolTip text="Change account"/>

                <img class="icon" src="img/menu/icon-pen.svg" alt="change account">
            </button>
        </div>
    </div>

    {#if expanded}
        <div class="quick-switcher" transition:fade|global={{ duration: 200, easing: quintOut }}>
            <!-- svelte-ignore a11y_autofocus -->
            <input type="text" autofocus class="account-search" placeholder="Search..." bind:value={searchQuery}>

            {#if accounts.length > 0}
                {#if renderedAccounts.length > 0}
                    <div class="account-list">
                        {#each renderedAccounts as a}
                            <div on:click={() => login(a)} class="account-item"
                                 transition:slide|global={{ duration: 200, easing: quintOut }}
                                 class:active={a.username === username}>
                                <Avatar url={a.avatar}/>
                                <div class="username">{a.username}</div>
                                <div class="type">{a.type}</div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="placeholder">No results</div>
                {/if}
            {:else}
                <div class="placeholder">Account list is empty</div>
            {/if}
        </div>
    {/if}
</div>

<style lang="scss">

  .account {
    width: 320px;
    position: relative;

    &.expanded {
      .header {
        border-radius: 9px 9px 0 0;
      }
    }
  }

  .header {
    background-color: var(--menu-account-header-background-color);
    border: 1px solid color-mix(in srgb, var(--claude-text) 6.5%, transparent);
    padding: 6px 9px;
    border-radius: 9px;
    align-items: center;
    display: grid;
    grid-template-areas:
        "a b c"
        "a d c";
    grid-template-columns: max-content 1fr max-content;
    column-gap: 10px;
    cursor: pointer;
    transition: ease border-radius .2s, border-color .15s ease, background-color .15s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 12%, transparent);
      background-color: color-mix(in srgb, var(--claude-card) 78%, transparent);
    }

    .avatar-wrapper {
      grid-area: a;
      position: relative;

      .avatar {
        height: 36px;
        width: 36px;
        border-radius: 8px;
      }

      .party-hat {
        position: absolute;
        height: 65px;
        top: -35px;
        left: -19px;
        transform: rotate(-30deg);
      }
    }

    .username {
      font-weight: 600;
      color: var(--menu-text-color);
      font-size: 14px;
      grid-area: b;
      align-self: flex-end;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .account-type {
      font-weight: 500;
      font-size: 9.5px;
      grid-area: d;
      align-self: flex-start;

      .online {
        color: var(--menu-account-premium-color);
      }

      .offline {
        color: var(--menu-text-dimmed-color);
      }
    }

    .buttons {
      grid-area: c;
      display: flex;
      column-gap: 4px;
      align-items: center;
    }

    .icon-button {
      background-color: transparent;
      border: none;
      position: relative;
      height: 26px;
      width: 26px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      cursor: pointer;
      transition: ease opacity .2s, background-color .15s ease;

      &:hover {
        background-color: color-mix(in srgb, var(--claude-text) 6%, transparent);
      }

      .icon {
        width: 12px;
        height: 12px;
        opacity: .65;
      }

      &:disabled {
        pointer-events: none;
        opacity: .5;
      }
    }
  }

  .quick-switcher {
    position: absolute;
    z-index: 1000;
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
    border-top: none;
    border-radius: 0 0 9px 9px;
    background-color: var(--menu-account-switcher-background-color);
    box-shadow: 0 20px 40px rgba(0, 0, 0, .4);
    overflow: hidden;

    .placeholder {
      font-weight: 500;
      font-size: 12px;
      color: var(--menu-text-dimmed-color);
      padding: 13px 14px;
    }

    .account-search {
      background-color: var(--menu-account-search-background-color);
      border: none;
      color: var(--menu-text-color);
      font-family: "Inter", sans-serif;
      padding: 11px 12px 11px 36px;
      width: 100%;
      font-size: 12px;
      background-image: url("/img/menu/icon-search.svg");
      background-repeat: no-repeat;
      background-position: 13px center;
      background-size: 14px 14px;

      &::placeholder {
        color: color-mix(in srgb, var(--claude-text-muted) 78%, transparent);
      }
    }

    .account-list {
      max-height: 310px;
      overflow: auto;
    }

    .account-item {
      color: var(--menu-text-dimmed-color);
      font-size: 12px;
      padding: 8px 12px;
      transition: ease color .2s, background-color .15s ease;
      cursor: pointer;
      display: grid;
      grid-template-areas:
        "a b"
        "a c";
      grid-template-columns: max-content 1fr;
      column-gap: 10px;

      :global(.avatar-wrapper) {
        width: 30px;
        height: 30px;
        align-self: center;
      }

      .username {
        grid-area: b;
        font-weight: 600;
        font-size: 12px;
        transition: ease color .2s;
      }

      .type {
        grid-area: c;
        font-size: 9px;
      }

      &:hover {
        color: var(--menu-text-color);
        background-color: color-mix(in srgb, var(--claude-text) 4%, transparent);
      }

      &.active {
        .username {
          color: var(--accent-color);
        }
      }
    }
  }
</style>
