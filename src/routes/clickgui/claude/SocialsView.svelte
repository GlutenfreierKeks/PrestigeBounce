<script lang="ts">
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";
    import SearchField from "./SearchField.svelte";
    import Button from "./Button.svelte";
    import Modal from "./Modal.svelte";
    import {getSession} from "../../../integration/rest";
    import type {Session} from "../../../integration/types";
    import {readStored, timeAgo, writeStored} from "./storage";

    let {notify} = $props<{
        notify: (message: string, icon?: string) => void;
    }>();

    type Friend = {
        name: string;
        addedAt: number;
    };

    const STORAGE_KEY = "claude.friends";

    let friends = $state<Friend[]>(readStored<Friend[]>(STORAGE_KEY, []));
    let tab = $state<"all" | "friends">("all");
    let search = $state("");
    let session = $state<Session | null>(null);
    let adding = $state(false);
    let addName = $state("");
    let addError = $state<string | null>(null);
    let confirmRemove = $state<Friend | null>(null);

    const players = $derived.by(() => {
        const entries: {name: string; addedAt?: number; self: boolean}[] = [];
        if (session?.username) {
            entries.push({name: session.username, self: true});
        }
        for (const friend of friends) {
            if (!entries.some(entry => entry.name.toLowerCase() === friend.name.toLowerCase())) {
                entries.push({name: friend.name, addedAt: friend.addedAt, self: false});
            }
        }
        return entries;
    });

    const visible = $derived.by(() => {
        const needle = search.trim().toLowerCase();
        const source = tab === "friends"
            ? friends.map(friend => ({name: friend.name, addedAt: friend.addedAt, self: false}))
            : players;
        return source
            .filter(player => !needle || player.name.toLowerCase().includes(needle))
            .sort((left, right) => Number(right.self) - Number(left.self)
                || left.name.localeCompare(right.name));
    });

    const friendNames = $derived(new Set(friends.map(friend => friend.name.toLowerCase())));

    function isFriend(name: string) {
        return friendNames.has(name.toLowerCase());
    }

    function persist(next: Friend[]) {
        if (!writeStored(STORAGE_KEY, next)) {
            notify("Could not save your friends list", "x");
            return false;
        }
        friends = next;
        return true;
    }

    function addFriend(name = addName) {
        const trimmed = name.trim();
        if (!trimmed) {
            addError = "Enter a player name.";
            return;
        }
        if (!/^[A-Za-z0-9_]{3,16}$/.test(trimmed)) {
            addError = "Use a valid Minecraft username (3–16 characters).";
            return;
        }
        if (isFriend(trimmed)) {
            addError = "This player is already in your friends list.";
            return;
        }
        if (friends.length >= 100) {
            addError = "Your friends list is full.";
            return;
        }
        if (persist([...friends, {name: trimmed, addedAt: Date.now()}])) {
            addName = "";
            addError = null;
            adding = false;
            notify(`${trimmed} added to friends`, "socials");
        }
    }

    function removeFriend(friend: Friend) {
        if (persist(friends.filter(entry => entry.name !== friend.name))) {
            confirmRemove = null;
            notify(`${friend.name} removed`, "trash");
        }
    }

    function openAdd() {
        addName = search.trim() || "";
        addError = null;
        adding = true;
    }

    onMount(() => {
        getSession()
            .then(value => session = value)
            .catch(error => console.error("[PrestigeBounce] Could not load the current session", error));
    });
</script>

<div class="view">
    <header class="view-head">
        <div>
            <h1>Socials</h1>
            <p>Friends and known players</p>
        </div>
        <div class="head-tools">
            <div class="head-search">
                <SearchField bind:value={search} placeholder="Search players"/>
            </div>
            <Button variant="primary" icon="plus" onclick={openAdd}>Add friend</Button>
        </div>
    </header>

    <div class="browser-toolbar">
        <div class="type-tabs" role="tablist" aria-label="Socials view">
            <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "all"}
                    class="type-tab"
                    class:active={tab === "all"}
                    onclick={() => tab = "all"}
            >
                <Icon name="globe" size={14}/>
                All Players
            </button>
            <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "friends"}
                    class="type-tab"
                    class:active={tab === "friends"}
                    onclick={() => tab = "friends"}
            >
                <Icon name="socials" size={14}/>
                Friends
                {#if friends.length > 0}<span class="count">{friends.length}</span>{/if}
            </button>
        </div>

        <div class="local-note">
            <Icon name="lock" size={12}/>
            Stored locally
        </div>
    </div>

    <div class="result-note">
        {#if tab === "friends"}
            {friends.length} {friends.length === 1 ? "friend" : "friends"}
        {:else}
            {players.length} known {players.length === 1 ? "player" : "players"} · {friends.length} added
        {/if}
        {#if search.trim()} · matching “{search.trim()}”{/if}
    </div>

    <div class="view-scroll">
        {#if visible.length === 0}
            <div class="empty">
                <span class="empty-icon"><Icon name={search.trim() ? "search" : "socials"} size={21}/></span>
                <strong>{search.trim() ? "No matching players" : tab === "friends" ? "No friends yet" : "No players yet"}</strong>
                <p>
                    {#if search.trim()}
                        Add “{search.trim()}” to your friends list or try another name.
                    {:else if tab === "friends"}
                        Add players by username to keep them close.
                    {:else}
                        Join a server or add a player by username.
                    {/if}
                </p>
                {#if search.trim()}
                    <Button variant="primary" icon="plus" onclick={openAdd}>Add {search.trim()}</Button>
                {:else}
                    <Button variant="primary" icon="plus" onclick={openAdd}>Add friend</Button>
                {/if}
            </div>
        {:else}
            <div class="player-list">
                {#each visible as player (player.name)}
                    {@const friend = friends.find(entry => entry.name.toLowerCase() === player.name.toLowerCase())}
                    <article class="player-row" class:self={player.self}>
                        <span class="avatar">{player.name.substring(0, 2).toUpperCase()}</span>
                        <div class="player-copy">
                            <div class="name-line">
                                <strong>{player.name}</strong>
                                {#if player.self}<span class="you">You</span>{/if}
                                {#if friend}<span class="friend-tag">Friend</span>{/if}
                            </div>
                            <span class="player-meta">
                                {#if player.self}
                                    {session?.online ? "Online" : "Current session"}
                                {:else if friend}
                                    Added {timeAgo(friend.addedAt)}
                                {:else}
                                    Known player
                                {/if}
                            </span>
                        </div>

                        <div class="row-actions">
                            {#if !player.self}
                                {#if friend}
                                    <button type="button" class="row-button danger" onclick={() => confirmRemove = friend}>
                                        Remove
                                    </button>
                                {:else}
                                    <button type="button" class="row-button add" onclick={() => addFriend(player.name)}>
                                        <Icon name="plus" size={12}/>
                                        Add friend
                                    </button>
                                {/if}
                            {/if}
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if adding}
    <Modal
            title="Add friend"
            subtitle="Friends are saved on this computer"
            width={430}
            onclose={() => adding = false}
    >
        <label class="field">
            <span>Player name</span>
            <input
                    type="text"
                    bind:value={addName}
                    maxlength="16"
                    placeholder="Username"
                    autocomplete="off"
                    onkeydown={(event) => {
                        if (event.key === "Enter") addFriend();
                    }}
            />
        </label>
        {#if addError}
            <p class="form-error">{addError}</p>
        {/if}
        <p class="hint">
            LiquidBounce does not expose an online player list to themes, so this list is kept locally.
        </p>

        {#snippet footer()}
            <Button variant="ghost" onclick={() => adding = false}>Cancel</Button>
            <Button variant="primary" icon="plus" onclick={() => addFriend()}>Add friend</Button>
        {/snippet}
    </Modal>
{/if}

{#if confirmRemove}
    <Modal
            title="Remove friend"
            subtitle={confirmRemove.name}
            width={400}
            onclose={() => confirmRemove = null}
    >
        <p class="confirm-copy">Remove <strong>{confirmRemove.name}</strong> from your friends list?</p>

        {#snippet footer()}
            <Button variant="ghost" onclick={() => confirmRemove = null}>Cancel</Button>
            <Button variant="danger" icon="trash" onclick={() => removeFriend(confirmRemove!)}>Remove</Button>
        {/snippet}
    </Modal>
{/if}

<style lang="scss">
  .view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .view-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 22px;
    flex: none;

    h1 {
      margin: 0;
      color: var(--claude-text);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -.3px;
    }

    p {
      margin: 7px 0 0;
      color: var(--claude-text-muted);
      font-size: 11px;
    }
  }

  .head-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 2px;
  }

  .head-search {
    width: 238px;
  }

  .browser-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex: none;
    margin-top: 18px;
  }

  .type-tabs {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px;
    border-radius: 9px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 2.5%, transparent);
  }

  .type-tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 28px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 10px;
    font-weight: 550;
    cursor: pointer;

    &:hover {
      color: var(--claude-text-dim);
    }

    &.active {
      color: var(--claude-text);
      border-color: color-mix(in srgb, var(--claude-accent) 20%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 12%, transparent);

      :global(svg) {
        color: var(--claude-accent);
      }
    }

    .count {
      display: grid;
      place-items: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 4px;
      color: var(--claude-text-muted);
      background: color-mix(in srgb, var(--claude-text) 7%, transparent);
      font-size: 8px;
    }
  }

  .local-note {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--claude-text-muted);
    font-size: 8.5px;
  }

  .result-note {
    flex: none;
    min-height: 27px;
    padding: 11px 1px 8px;
    color: var(--claude-text-muted);
    font-size: 9.5px;
  }

  .view-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1px 8px 8px 1px;
    margin-right: -8px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 13%, transparent) transparent;
  }

  .player-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .player-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 58px;
    padding: 9px 14px 9px 15px;
    border: 1px solid var(--claude-border);
    border-radius: 9px;
    background: color-mix(in srgb, var(--claude-text) 2.4%, transparent);
    transition: border-color .16s ease, background-color .16s ease;

    &:hover {
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 3.2%, var(--claude-card));
    }

    &.self {
      border-color: color-mix(in srgb, var(--claude-accent) 17%, var(--claude-border));
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 4%, transparent), transparent 44%),
        color-mix(in srgb, var(--claude-text) 2.2%, transparent);
    }
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: 8px;
    color: var(--claude-text-soft);
    background:
      linear-gradient(150deg, color-mix(in srgb, var(--claude-accent) 28%, transparent), color-mix(in srgb, var(--claude-accent) 8%, transparent));
    border: 1px solid color-mix(in srgb, var(--claude-accent) 22%, transparent);
    font-size: 10px;
    font-weight: 650;
    letter-spacing: .3px;
  }

  .player-copy {
    flex: 1;
    min-width: 0;
  }

  .name-line {
    display: flex;
    align-items: center;
    gap: 6px;

    strong {
      overflow: hidden;
      color: var(--claude-text);
      font-size: 11.5px;
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .you,
  .friend-tag {
    padding: 2px 5px;
    border-radius: 3px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: .4px;
    text-transform: uppercase;
  }

  .friend-tag {
    color: #8ee3bb;
    background: color-mix(in srgb, #45d49a 9%, transparent);
  }

  .player-meta {
    display: block;
    margin-top: 4px;
    color: var(--claude-text-muted);
    font-size: 8.5px;
  }

  .row-actions {
    flex: none;
  }

  .row-button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: transparent;
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 9px;
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    }

    &.add {
      color: var(--claude-accent);
      border-color: color-mix(in srgb, var(--claude-accent) 20%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 7%, transparent);
    }

    &.danger:hover {
      color: #ff9da5;
      border-color: color-mix(in srgb, #ff5964 26%, transparent);
      background: color-mix(in srgb, #ff5964 7%, transparent);
    }
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 330px;
    color: var(--claude-text-muted);
    text-align: center;

    .empty-icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      margin-bottom: 3px;
      border-radius: 13px;
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
    }

    strong {
      color: var(--claude-text-soft);
      font-size: 12px;
      font-weight: 600;
    }

    p {
      max-width: 360px;
      margin: 0;
      font-size: 10.5px;
      line-height: 1.5;
    }

    :global(.claude-button) {
      margin-top: 6px;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    > span {
      color: var(--claude-text-dim);
      font-size: 9.5px;
      font-weight: 550;
    }

    input {
      width: 100%;
      padding: 9px 11px;
      border-radius: 7px;
      border: 1px solid var(--claude-border);
      background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
      color: var(--claude-text);
      font: inherit;
      font-size: 11px;

      &:focus {
        border-color: var(--claude-accent-line);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-accent) 8%, transparent);
      }

      &::placeholder {
        color: var(--claude-text-muted);
      }
    }
  }

  .form-error {
    margin: 9px 0 0;
    color: #ff9da5;
    font-size: 9.5px;
  }

  .hint {
    margin: 12px 0 0;
    color: var(--claude-text-muted);
    font-size: 9px;
    line-height: 1.5;
  }

  .confirm-copy {
    margin: 0;
    color: var(--claude-text-muted);
    font-size: 11px;
    line-height: 1.6;

    strong {
      color: var(--claude-text);
      font-weight: 600;
    }
  }

  @media (max-width: 980px) {
    .head-search {
      width: 190px;
    }
  }
</style>
