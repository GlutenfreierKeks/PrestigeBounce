<script lang="ts">
    import {
        deleteScreen,
        getAccounts,
        loginToAccount as loginToAccountRest,
        orderAccounts,
        removeAccount as restRemoveAccount,
        restoreSession,
        setAccountFavorite
    } from "../../../integration/rest.js";
    import type {Account} from "../../../integration/types";
    import {onMount} from "svelte";
    import {SortableList} from "@jhubbardsf/svelte-sortablejs";
    import MultiSelect from "../common/setting/select/MultiSelect.svelte";
    import AddAccountModal from "./addaccount/AddAccountModal.svelte";
    import DirectLoginModal from "./directLogin/DirectLoginModal.svelte";
    import {listen} from "../../../integration/ws";
    import {notification} from "../common/header/notification_store";
    import type {
        AccountManagerAdditionEvent,
        AccountManagerLoginEvent,
    } from "../../../integration/events.js";
    import MenuPageHeader from "../common/MenuPageHeader.svelte";
    import PageButton from "../common/buttons/PageButton.svelte";
    import Icon from "../../clickgui/claude/Icon.svelte";

    let premiumOnly = false;
    let favoritesOnly = false;
    let accountTypes = ["Mojang", "TheAltening"];
    let accounts: Account[] = [];
    let renderedAccounts: Account[] = [];
    let searchQuery = "";
    let remountKey = 0;

    let addAccountModalVisible = false;
    let directLoginModalVisible = false;

    $: {
        let filteredAccounts = accounts;
        if (premiumOnly) {
            filteredAccounts = filteredAccounts.filter(a => a.type !== "Cracked");
        }
        if (favoritesOnly) {
            filteredAccounts = filteredAccounts.filter(a => a.favorite);
        }
        if (!accountTypes.includes("Mojang")) {
            filteredAccounts = filteredAccounts.filter(a => a.type !== "Cracked" && a.type !== "Microsoft")
        }
        if (!accountTypes.includes("TheAltening")) {
            filteredAccounts = filteredAccounts.filter(a => a.type !== "TheAltening")
        }
        if (searchQuery) {
            filteredAccounts = filteredAccounts.filter(a => a.username.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        renderedAccounts = filteredAccounts;
    }

    $: canSort = accounts.length === renderedAccounts.length;

    async function refreshAccounts() {
        accounts = await getAccounts();
    }

    onMount(async () => {
        await refreshAccounts();
        renderedAccounts = accounts;
    });

    async function handleAccountSort(e: any) {
        const oldIndex = e.oldIndex;
        const newIndex = e.newIndex;

        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
            return;
        }

        const order = Array.from({length: accounts.length}, (_, index) => index);
        order.splice(oldIndex, 1);
        order.splice(newIndex, 0, oldIndex);

        try {
            await orderAccounts(order);
            await refreshAccounts();
        } finally {
            remountKey++;
        }
    }

    async function removeAccount(id: number) {
        await restRemoveAccount(id);
        await refreshAccounts();
    }

    async function loginToRandomAccount() {
        const account = renderedAccounts[Math.floor(Math.random() * renderedAccounts.length)];
        if (account) {
            await loginToAccount(account.id);
        }
    }

    async function toggleFavorite(index: number, favorite: boolean) {
        await setAccountFavorite(index, favorite);
        await refreshAccounts();
    }

    async function loginToAccount(id: number) {
        notification.set({
            title: "AltManager",
            message: "Logging in...",
            error: false
        });
        await loginToAccountRest(id);
    }

    listen("accountManagerAddition", (e: AccountManagerAdditionEvent) => {
        addAccountModalVisible = false;
        refreshAccounts();
    });

    listen("accountManagerLogin", (e: AccountManagerLoginEvent) => {
        directLoginModalVisible = false;
    });
</script>

<DirectLoginModal bind:visible={directLoginModalVisible}/>

<AddAccountModal bind:visible={addAccountModalVisible}/>

<div class="page-shell">
    <MenuPageHeader eyebrow="Account manager" title="Accounts"
                     subtitle={`${accounts.length} accounts · ${renderedAccounts.length} shown`}>
        <svelte:fragment slot="actions">
            <PageButton icon="send" on:click={() => directLoginModalVisible = true}>Direct login</PageButton>
            <PageButton variant="primary" icon="plus" on:click={() => addAccountModalVisible = true}>Add account</PageButton>
        </svelte:fragment>
    </MenuPageHeader>

    <div class="toolbar">
        <label class="search-field">
            <Icon name="search" size={16}/>
            <input type="text" placeholder="Search accounts…" bind:value={searchQuery} spellcheck="false">
            {#if searchQuery}
                <button type="button" class="clear-search" title="Clear search" on:click={() => searchQuery = ""}>
                    <Icon name="x" size={13}/>
                </button>
            {/if}
        </label>

        <button type="button" class="tool-toggle" class:active={premiumOnly} on:click={() => premiumOnly = !premiumOnly}>
            <span class="toggle-indicator"></span>
            Premium only
        </button>

        <button type="button" class="tool-toggle" class:active={favoritesOnly}
                on:click={() => favoritesOnly = !favoritesOnly}>
            <span class="toggle-indicator"></span>
            Favorites
        </button>

        <div class="filter">
            <MultiSelect title="Account Type" options={["Mojang", "TheAltening"]} bind:values={accountTypes}/>
        </div>
    </div>

    <div class="account-list">
        {#if renderedAccounts.length === 0}
            <div class="empty-state">
                <span class="empty-icon"><Icon name="user" size={26}/></span>
                <div class="empty-title">{accounts.length === 0 ? "No accounts yet" : "No accounts match"}</div>
                <p>
                    {accounts.length === 0
                        ? "Add a Microsoft, Mojang or cracked account to switch between alts."
                        : "Try a different search or clear the premium and favorite filters."}
                </p>
                {#if accounts.length === 0}
                    <div class="empty-actions">
                        <button type="button" class="primary-button" on:click={() => addAccountModalVisible = true}>
                            <Icon name="plus" size={14}/>
                            Add account
                        </button>
                        <button type="button" class="secondary-button" on:click={() => directLoginModalVisible = true}>
                            <Icon name="send" size={14}/>
                            Direct login
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            {#key remountKey}
                {#if canSort}
                    <SortableList class="account-rows" onSort={handleAccountSort} forceFallback={true} animation={160}>
                        {#each renderedAccounts as account (account.id)}
                            {@render accountRow(account)}
                        {/each}
                    </SortableList>
                {:else}
                    <div class="account-rows">
                        {#each renderedAccounts as account (account.id)}
                            {@render accountRow(account)}
                        {/each}
                    </div>
                {/if}
            {/key}
        {/if}
    </div>

    <footer class="page-footer">
        <button type="button" class="footer-button" on:click={() => deleteScreen()}>
            <Icon name="arrow-left" size={14}/>
            Back
        </button>

        <span class="footer-hint">Double-click an account to log in</span>

        <div class="footer-actions">
            <button type="button" class="footer-button" disabled={renderedAccounts.length === 0}
                    on:click={loginToRandomAccount}>
                <Icon name="dots" size={14}/>
                Random
            </button>
            <button type="button" class="footer-button" on:click={restoreSession}>
                <Icon name="refresh" size={14}/>
                Restore
            </button>
        </div>
    </footer>
</div>

{#snippet accountRow(account: Account)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="account-row" on:dblclick={() => loginToAccount(account.id)}>
        <span class="drag-grip" title={canSort ? "Drag to reorder" : undefined} class:hidden={!canSort}></span>

        <div class="account-avatar">
            <img src={account.avatar} alt="">
        </div>

        <div class="account-info">
            <div class="account-title-line">
                <span class="account-name">{account.username}</span>
                <span class="tag">{account.type}</span>
                {#if account.favorite}
                    <span class="tag favorite">Favorite</span>
                {/if}
            </div>

            <div class="account-uuid">{account.uuid}</div>
        </div>

        <div class="row-actions">
            <button type="button" class="row-icon" class:is-favorite={account.favorite}
                    title={account.favorite ? "Remove favorite" : "Add favorite"}
                    on:click|stopPropagation={() => toggleFavorite(account.id, !account.favorite)}>
                <Icon name="heart" size={14}/>
            </button>
            <button type="button" class="row-icon danger" title="Delete account"
                    on:click|stopPropagation={() => removeAccount(account.id)}>
                <Icon name="trash" size={14}/>
            </button>
            <button type="button" class="login-button" on:click|stopPropagation={() => loginToAccount(account.id)}>
                <Icon name="play" size={11}/>
                Login
            </button>
        </div>
    </div>
{/snippet}

<style lang="scss">
  .page-shell {
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

  :global(.page-head) {
    margin-bottom: 0;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 19px;
    height: 19px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: background-color .16s ease, color .16s ease;

    &:hover {
      background: color-mix(in srgb, var(--claude-text) 9%, transparent);
      color: var(--claude-text);
    }
  }

  .tool-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex: none;
    height: 34px;
    padding: 0 11px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    border-radius: 7px;
    background: transparent;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 12px;
    font-weight: 550;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease;

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

  .filter {
    flex: none;

    :global(.select) {
      min-width: 198px;
    }

    :global(.select .header) {
      height: 34px;
      padding: 0 11px;
      border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
      border-radius: 7px;
      background: transparent;
    }

    :global(.select .header .title) {
      color: var(--claude-text-muted);
      font-size: 12px;
      font-weight: 550;
    }

    :global(.select .header img) {
      opacity: .5;
    }

    :global(.select.expanded .header) {
      border-radius: 7px 7px 0 0;
      border-color: color-mix(in srgb, var(--claude-accent) 30%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 8%, transparent);
    }

    :global(.select .options) {
      border: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
      border-radius: 0 0 7px 7px;
      background: color-mix(in srgb, var(--claude-card) 96%, black);
      box-shadow: 0 20px 40px rgba(0, 0, 0, .35);
    }

    :global(.select .option) {
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

  .account-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--claude-card) 48%, transparent);
    box-shadow: 0 20px 50px rgba(0, 0, 0, .2), inset 0 1px 0 rgba(255, 255, 255, .025);
    backdrop-filter: blur(12px);
  }

  :global(.account-rows) {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
  }

  .account-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px 11px 8px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: color-mix(in srgb, var(--claude-text) 2.2%, transparent);
    cursor: grab;
    transition: background-color .15s ease, border-color .15s ease;

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

    .account-row:hover & {
      opacity: .6;
    }
  }

  .account-avatar {
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

  .account-info {
    flex: 1;
    min-width: 0;
  }

  .account-title-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .account-name {
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
    padding: 2px 7px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .2px;
    white-space: nowrap;

    &.favorite {
      border-color: color-mix(in srgb, var(--claude-accent) 24%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      color: var(--claude-glint);
    }
  }

  .account-uuid {
    margin-top: 3px;
    overflow: hidden;
    color: color-mix(in srgb, var(--claude-text-muted) 82%, transparent);
    font-family: monospace;
    font-size: 12px;
    letter-spacing: .1px;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease;

    &:hover {
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
      color: var(--claude-text);
    }

    &.is-favorite {
      color: var(--claude-accent);
    }

    &.danger:hover {
      border-color: color-mix(in srgb, #ff5964 24%, transparent);
      background: color-mix(in srgb, #ff5964 9%, transparent);
      color: #ff8d96;
    }
  }

  .login-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 24%, transparent);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
    color: var(--claude-glint);
    font: inherit;
    font-size: 11.5px;
    font-weight: 650;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease;

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
    max-width: 340px;
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

  .primary-button,
  .secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 15px;
    border: 1px solid transparent;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease;
  }

  .primary-button {
    background: var(--claude-accent);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 7px 20px color-mix(in srgb, var(--claude-accent) 22%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--claude-accent) 88%, white);
    }
  }

  .secondary-button {
    border-color: color-mix(in srgb, var(--claude-text) 8%, transparent);
    background: color-mix(in srgb, var(--claude-card) 62%, transparent);
    color: var(--claude-text-soft);
    font-weight: 550;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 15%, transparent);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
      color: var(--claude-text);
    }
  }

  .page-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .footer-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 11px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, color .16s ease;

    &:hover:not([disabled]) {
      border-color: color-mix(in srgb, var(--claude-text) 7%, transparent);
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      color: var(--claude-text-soft);
    }

    &[disabled] {
      opacity: .4;
      cursor: default;
    }
  }

  .footer-hint {
    color: color-mix(in srgb, var(--claude-text-muted) 72%, transparent);
    font-size: 11px;
    letter-spacing: .25px;
  }

  @media (max-width: 1080px) {
    .tool-toggle {
      font-size: 10px;
    }

    .filter :global(.select) {
      min-width: 160px;
    }
  }

  @media (max-height: 800px) {
    .page-shell {
      gap: 9px;
    }

    .account-row {
      padding-top: 6px;
      padding-bottom: 6px;
    }

    .account-avatar,
    .account-avatar img {
      width: 36px;
      height: 36px;
    }
  }
</style>
