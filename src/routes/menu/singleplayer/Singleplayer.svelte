<script lang="ts">
    import {
        editWorld,
        getWorlds,
        openScreen,
        openWorld,
        removeWorld as removeWorldRest
    } from "../../../integration/rest.js";
    import type {World} from "../../../integration/types";
    import {onMount} from "svelte";
    import MultiSelect from "../common/setting/select/MultiSelect.svelte";
    import MenuPageHeader from "../common/MenuPageHeader.svelte";
    import PageButton from "../common/buttons/PageButton.svelte";
    import {REST_BASE} from "../../../integration/host";
    import dateFormat from "dateformat";
    import Icon from "../../clickgui/claude/Icon.svelte";

    let gameModes = ["Survival", "Creative", "Adventure", "Spectator"];
    let difficulties = ["Peaceful", "Easy", "Normal", "Hard"];
    let searchQuery = "";

    let worlds: World[] = [];
    let renderedWorlds = worlds;

    $: {
        let filteredWorlds = worlds;
        filteredWorlds = filteredWorlds.filter(w => gameModes.includes(capitalize(w.gameMode)));
        filteredWorlds = filteredWorlds.filter(w => difficulties.includes(capitalize(w.difficulty)));
        if (searchQuery) {
            filteredWorlds = filteredWorlds.filter(w => w.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        renderedWorlds = filteredWorlds;
    }

    function capitalize(s: string) {
        return s[0].toUpperCase() + s.slice(1);
    }

    onMount(async () => {
        await refreshWorlds();
        renderedWorlds = worlds;
    });

    async function refreshWorlds() {
        worlds = await getWorlds();
    }

    async function removeWorld(name: string) {
        await removeWorldRest(name);
        await refreshWorlds();
    }

    function worldIcon(world: World) {
        return !world.icon
            ? `${REST_BASE}/api/v1/client/resource?id=minecraft:textures/misc/unknown_server.png`
            : `data:image/png;base64,${world.icon}`;
    }
</script>

<div class="page-shell">
    <MenuPageHeader eyebrow="Singleplayer" title="Worlds"
                     subtitle={`${worlds.length} worlds · ${renderedWorlds.length} shown`}>
        <svelte:fragment slot="actions">
            <PageButton icon="refresh" on:click={refreshWorlds}>Refresh</PageButton>
            <PageButton variant="primary" icon="plus" on:click={() => openScreen("create_world")}>Create world</PageButton>
        </svelte:fragment>
    </MenuPageHeader>

    <div class="toolbar">
        <label class="search-field">
            <Icon name="search" size={16}/>
            <input type="text" placeholder="Search worlds…" bind:value={searchQuery} spellcheck="false">
            {#if searchQuery}
                <button type="button" class="clear-search" title="Clear search" on:click={() => searchQuery = ""}>
                    <Icon name="x" size={13}/>
                </button>
            {/if}
        </label>

        <div class="filter">
            <MultiSelect title="Game Mode" options={["Survival", "Creative", "Adventure", "Spectator"]}
                         bind:values={gameModes}/>
        </div>
        <div class="filter">
            <MultiSelect title="Difficulty" options={["Peaceful", "Easy", "Normal", "Hard"]} bind:values={difficulties}/>
        </div>
    </div>

    <div class="world-list">
        {#if renderedWorlds.length === 0}
            <div class="empty-state">
                <span class="empty-icon"><Icon name="map-pin" size={26}/></span>
                <div class="empty-title">{worlds.length === 0 ? "No worlds found" : "No worlds match"}</div>
                <p>
                    {worlds.length === 0
                        ? "Create a new world or drop an existing save into your saves folder."
                        : "Try a different search or clear the game mode and difficulty filters."}
                </p>
                {#if worlds.length === 0}
                    <div class="empty-actions">
                        <button type="button" class="primary-button" on:click={() => openScreen("create_world")}>
                            <Icon name="plus" size={14}/>
                            Create world
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="world-rows">
                {#each renderedWorlds as world (world.id + "-" + world.name)}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div class="world-row" on:dblclick={() => openWorld(world.name)}>
                        <div class="world-icon">
                            <img src={worldIcon(world)} alt="">
                        </div>

                        <div class="world-info">
                            <div class="world-title-line">
                                <span class="world-name">{world.displayName}</span>
                                <span class="tag">{capitalize(world.gameMode)}</span>
                                <span class="tag">{capitalize(world.difficulty)}</span>
                                {#if world.hardcore}
                                    <span class="tag hardcore">Hardcore</span>
                                {/if}
                                <span class="tag">{world.version}</span>
                            </div>

                            <div class="world-meta">
                                {world.name} · {dateFormat(new Date(world.lastPlayed), "mmm d, yyyy · h:MM TT")}
                            </div>
                        </div>

                        <div class="row-actions">
                            <button type="button" class="row-icon" title="Edit world"
                                    on:click|stopPropagation={() => editWorld(world.name)}>
                                <Icon name="edit" size={14}/>
                            </button>
                            <button type="button" class="row-icon danger" title="Delete world"
                                    on:click|stopPropagation={() => removeWorld(world.name)}>
                                <Icon name="trash" size={14}/>
                            </button>
                            <button type="button" class="open-button" on:click|stopPropagation={() => openWorld(world.name)}>
                                <Icon name="play" size={11}/>
                                Open
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <footer class="page-footer">
        <button type="button" class="footer-button" on:click={() => openScreen("title")}>
            <Icon name="arrow-left" size={14}/>
            Back
        </button>

        <span class="footer-hint">Double-click a world to play</span>

        <button type="button" class="footer-button" on:click={() => openScreen("create_world")}>
            <Icon name="plus" size={14}/>
            New world
        </button>
    </footer>
</div>

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

  .world-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--claude-card) 48%, transparent);
    box-shadow: 0 20px 50px rgba(0, 0, 0, .2), inset 0 1px 0 rgba(255, 255, 255, .025);
    backdrop-filter: blur(12px);
  }

  .world-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
  }

  .world-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: color-mix(in srgb, var(--claude-text) 2.2%, transparent);
    cursor: default;
    transition: background-color .15s ease, border-color .15s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--claude-accent) 22%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 6%, transparent);

      .row-actions {
        opacity: 1;
      }
    }
  }

  .world-icon {
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

  .world-info {
    flex: 1;
    min-width: 0;
  }

  .world-title-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .world-name {
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

    &.hardcore {
      border-color: color-mix(in srgb, #ff5964 26%, transparent);
      background: color-mix(in srgb, #ff5964 9%, transparent);
      color: #ff9aa1;
    }
  }

  .world-meta {
    margin-top: 3px;
    overflow: hidden;
    color: color-mix(in srgb, var(--claude-text-muted) 82%, transparent);
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

    &.danger:hover {
      border-color: color-mix(in srgb, #ff5964 24%, transparent);
      background: color-mix(in srgb, #ff5964 9%, transparent);
      color: #ff8d96;
    }
  }

  .open-button {
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

  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 15px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: var(--claude-accent);
    color: #fff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 7px 20px color-mix(in srgb, var(--claude-accent) 22%, transparent);
    transition: background-color .16s ease;

    &:hover {
      background: color-mix(in srgb, var(--claude-accent) 88%, white);
    }
  }

  .page-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
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

    &:hover {
      border-color: color-mix(in srgb, var(--claude-text) 7%, transparent);
      background: color-mix(in srgb, var(--claude-text) 4%, transparent);
      color: var(--claude-text-soft);
    }
  }

  .footer-hint {
    color: color-mix(in srgb, var(--claude-text-muted) 72%, transparent);
    font-size: 11px;
    letter-spacing: .25px;
  }

  @media (max-width: 1080px) {
    .filter :global(.select) {
      min-width: 160px;
    }
  }

  @media (max-height: 800px) {
    .page-shell {
      gap: 9px;
    }

    .world-row {
      padding-top: 6px;
      padding-bottom: 6px;
    }

    .world-icon,
    .world-icon img {
      width: 36px;
      height: 36px;
    }
  }
</style>
