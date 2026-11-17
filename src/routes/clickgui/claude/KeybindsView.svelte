<script lang="ts">
    import {tick} from "svelte";
    import Icon from "./Icon.svelte";
    import KeyCap from "./KeyCap.svelte";
    import SearchField from "./SearchField.svelte";
    import BindField from "./BindField.svelte";
    import {formatKey, sameBind} from "./format";
    import {getModuleSettings, setModuleSettings} from "../../../integration/rest";
    import type {BindSetting, InputBind, Module, ModuleSetting} from "../../../integration/types";
    import {UNKNOWN_KEY} from "../../../util/utils";

    let {
        modules,
        notify,
        onChanged
    } = $props<{
        modules: Module[];
        notify: (message: string, icon?: string) => void;
        onChanged: () => Promise<void>;
    }>();

    let search = $state("");
    let showUnbound = $state(false);
    let editing = $state<string | null>(null);
    let draft = $state<InputBind | null>(null);
    let saving = $state(false);

    const boundModules = $derived((modules as Module[]).filter((module: Module) => module.keyBind.boundKey !== UNKNOWN_KEY));
    const visible = $derived.by(() => {
        const needle = search.trim().toLowerCase();
        return (modules as Module[])
            .filter((module: Module) => showUnbound || module.keyBind.boundKey !== UNKNOWN_KEY)
            .filter((module: Module) => !needle
                || module.name.toLowerCase().includes(needle)
                || module.category.toLowerCase().includes(needle))
            .sort((left: Module, right: Module) => left.name.localeCompare(right.name));
    });

    function findBind(settings: ModuleSetting[]): BindSetting | null {
        for (const setting of settings) {
            if (setting.valueType === "BIND") {
                return setting as BindSetting;
            }
            const children = (setting as { value?: unknown }).value;
            if (Array.isArray(children)) {
                const found = findBind(children as ModuleSetting[]);
                if (found) return found;
            }
        }
        return null;
    }

    async function startEdit(module: Module) {
        editing = module.name;
        draft = {
            boundKey: module.keyBind.boundKey,
            action: module.keyBind.action,
            modifiers: [...(module.keyBind.modifiers ?? [])]
        };
        await tick();
        const rows = document.querySelectorAll<HTMLElement>(".bind-row");
        for (const element of rows) {
            if (element.dataset.module === module.name) {
                element.scrollIntoView({block: "nearest"});
                break;
            }
        }
    }

    function cancelEdit() {
        editing = null;
        draft = null;
    }

    async function saveBind(module: Module, bind: InputBind) {
        if (saving) return;
        saving = true;
        try {
            const settings = await getModuleSettings(module.name);
            const target = findBind(settings.value);
            if (!target) {
                throw new Error("This module does not expose a Bind setting.");
            }
            target.value = {
                boundKey: bind.boundKey,
                action: bind.action,
                modifiers: [...(bind.modifiers ?? [])]
            };
            await setModuleSettings(module.name, $state.snapshot(settings));
            await onChanged();
            notify(`${module.name} · ${formatKey(bind.boundKey)}`, "keybinds");
            cancelEdit();
        } catch (error) {
            console.error(`[PrestigeBounce] Could not update the bind for ${module.name}`, error);
            notify("Could not save the keybind", "x");
        } finally {
            saving = false;
        }
    }

    async function removeBind(module: Module) {
        await saveBind(module, {
            boundKey: UNKNOWN_KEY,
            action: module.keyBind.action,
            modifiers: []
        });
    }
</script>

<div class="view">
    <header class="view-head">
        <div>
            <h1>Keybinds</h1>
            <p>Rebind any module</p>
        </div>
        <div class="head-tools">
            <button
                    type="button"
                    class="show-chip"
                    class:active={showUnbound}
                    onclick={() => showUnbound = !showUnbound}
            >
                <Icon name="keybinds" size={13}/>
                {showUnbound ? "All modules" : "Bound only"}
            </button>
            <div class="head-search">
                <SearchField bind:value={search} placeholder="Search modules"/>
            </div>
        </div>
    </header>

    <div class="summary">
        {boundModules.length} bound · {modules.length - boundModules.length} unbound
    </div>

    <div class="view-scroll">
        {#if visible.length === 0}
            <div class="empty">
                <span class="empty-icon"><Icon name="keybinds" size={20}/></span>
                <p>{showUnbound ? "No modules match your search" : "No keybinds assigned yet"}</p>
                <button type="button" onclick={() => showUnbound = true}>Show all modules</button>
            </div>
        {:else}
            <div class="bind-list">
                {#each visible as module (module.name)}
                    {@const isEditing = editing === module.name}
                    <article class="bind-row" class:editing={isEditing} data-module={module.name}>
                        <div class="bind-copy">
                            <strong>{module.name}</strong>
                            <span>{module.category}</span>
                        </div>

                        {#if isEditing && draft}
                            <div class="bind-editor">
                                <BindField bind:value={draft} compact={true}/>
                                <div class="editor-actions">
                                    <button
                                            type="button"
                                            class="save"
                                            disabled={saving || sameBind(draft, module.keyBind)}
                                            onclick={() => saveBind(module, draft!)}
                                    >
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button type="button" class="cancel" onclick={cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        {:else}
                            <div class="bind-value">
                                {#if module.keyBind.boundKey !== UNKNOWN_KEY}
                                    <KeyCap small={true}>
                                        {formatKey(module.keyBind.boundKey)}
                                        {#if module.keyBind.modifiers?.length}
                                            <span class="modifiers">{module.keyBind.modifiers.join("+")}</span>
                                        {/if}
                                    </KeyCap>
                                    <span class="action-label">{module.keyBind.action}</span>
                                {:else}
                                    <span class="unbound">Press key</span>
                                {/if}
                            </div>

                            <div class="row-actions">
                                <button type="button" class="row-button" onclick={() => startEdit(module)}>
                                    {module.keyBind.boundKey === UNKNOWN_KEY ? "Bind" : "Edit"}
                                </button>
                                <button
                                        type="button"
                                        class="row-button danger"
                                        disabled={module.keyBind.boundKey === UNKNOWN_KEY}
                                        onclick={() => removeBind(module)}
                                >
                                    Delete
                                </button>
                            </div>
                        {/if}
                    </article>
                {/each}
            </div>
        {/if}
    </div>
</div>

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
    gap: 24px;
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
    gap: 9px;
    padding-top: 2px;
  }

  .head-search {
    width: 246px;
  }

  .show-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 31px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 9.5px;
    cursor: pointer;
    white-space: nowrap;

    &:hover,
    &.active {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
    }

    &.active {
      color: var(--claude-accent);
      border-color: var(--claude-accent-line);
      background: color-mix(in srgb, var(--claude-accent) 8%, transparent);
    }
  }

  .summary {
    flex: none;
    margin: 14px 0 10px;
    color: var(--claude-text-muted);
    font-size: 9.5px;
    letter-spacing: .15px;
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

  .bind-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .bind-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(160px, auto) 150px;
    align-items: center;
    gap: 16px;
    min-height: 58px;
    padding: 10px 15px 10px 17px;
    border: 1px solid var(--claude-border);
    border-radius: 9px;
    background: color-mix(in srgb, var(--claude-text) 2.4%, transparent);
    transition: border-color .16s ease, background-color .16s ease;

    &:hover {
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 3.4%, var(--claude-card));
    }

    &.editing {
      border-color: var(--claude-accent-line);
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 5%, transparent), transparent 45%),
        color-mix(in srgb, var(--claude-text) 2.5%, var(--claude-card));
    }
  }

  .bind-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    strong {
      overflow: hidden;
      color: var(--claude-text);
      font-size: 11.5px;
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--claude-text-muted);
      font-size: 9.5px;
    }
  }

  .bind-value {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .action-label {
    color: var(--claude-text-muted);
    font-size: 8.5px;
    letter-spacing: .3px;
    text-transform: uppercase;
  }

  .unbound {
    color: var(--claude-text-muted);
    font-size: 10.5px;
  }

  .modifiers {
    margin-left: 3px;
    color: var(--claude-accent);
    font-size: 8.5px;
  }

  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: 7px;
  }

  .row-button {
    min-width: 64px;
    height: 28px;
    padding: 0 9px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 9.5px;
    font-weight: 500;
    cursor: pointer;
    transition: color .16s ease, border-color .16s ease, background-color .16s ease;

    &:hover:not(:disabled) {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
    }

    &.danger:hover:not(:disabled) {
      color: #ff9da5;
      border-color: color-mix(in srgb, #ff5964 28%, transparent);
      background: color-mix(in srgb, #ff5964 7%, transparent);
    }

    &:disabled {
      opacity: .38;
      cursor: default;
    }
  }

  .bind-editor {
    grid-column: 2 / 4;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 9px;
  }

  .editor-actions {
    display: flex;
    gap: 6px;
  }

  .save,
  .cancel {
    height: 28px;
    padding: 0 10px;
    border-radius: 5px;
    font: inherit;
    font-size: 9.5px;
    cursor: pointer;
  }

  .save {
    border: none;
    background: var(--claude-accent);
    color: #fff;

    &:disabled {
      opacity: .4;
      cursor: default;
    }
  }

  .cancel {
    border: 1px solid var(--claude-border);
    background: transparent;
    color: var(--claude-text-dim);

    &:hover {
      color: var(--claude-text);
    }
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 300px;
    color: var(--claude-text-muted);

    .empty-icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      color: var(--claude-accent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
    }

    p {
      margin: 0;
      font-size: 11.5px;
    }

    button {
      margin-top: 2px;
      padding: 5px 10px;
      border-radius: 5px;
      border: 1px solid var(--claude-border);
      background: transparent;
      color: var(--claude-accent);
      font: inherit;
      font-size: 10px;
      cursor: pointer;
    }
  }

  @media (max-width: 1030px) {
    .bind-row {
      grid-template-columns: minmax(0, 1fr) minmax(140px, auto) 140px;
    }

    .head-search {
      width: 190px;
    }
  }
</style>
