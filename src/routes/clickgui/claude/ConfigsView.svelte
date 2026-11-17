<script lang="ts">
    import Icon from "./Icon.svelte";
    import SearchField from "./SearchField.svelte";
    import Button from "./Button.svelte";
    import Modal from "./Modal.svelte";
    import ConfigCard from "./ConfigCard.svelte";
    import {
        getGlobalSettings,
        getModuleSettings,
        getModules,
        setGlobalSettings,
        setModuleEnabled,
        setModuleSettings
    } from "../../../integration/rest";
    import type {
        ConfigurableSetting
    } from "../../../integration/types";
    import {formatDate, makeId, readStored, timeAgo, writeStored} from "./storage";

    let {notify, onModulesChanged} = $props<{
        notify: (message: string, icon?: string) => void;
        onModulesChanged: () => Promise<void>;
    }>();

    type Tab = "personal" | "create";

    type SnapshotModule = {
        name: string;
        enabled: boolean;
        category?: string;
        settings?: ConfigurableSetting;
    };

    type PersonalConfig = {
        id: string;
        name: string;
        description: string;
        createdAt: number;
        updatedAt: number;
        modules: SnapshotModule[];
        global?: ConfigurableSetting;
    };

    type Dialog =
        | {mode: "edit"; config: PersonalConfig}
        | {mode: "preview"; config: PersonalConfig}
        | {mode: "delete"; config: PersonalConfig}
        | null;

    const STORAGE_KEY = "claude.configs.personal";
    const MAX_PERSONAL = 40;
    const MAX_NAME = 20;
    const MAX_DESCRIPTION = 50;

    let tab = $state<Tab>("personal");
    let search = $state("");

    let personal = $state<PersonalConfig[]>(readStored<PersonalConfig[]>(STORAGE_KEY, []));
    let dialog = $state<Dialog>(null);
    let formName = $state("");
    let formDescription = $state("");
    let busy = $state(false);
    let applyingId = $state<string | null>(null);
    let formError = $state<string | null>(null);

    const personalEnabled = $derived.by(() => {
        const counts: Record<string, number> = {};
        for (const config of personal) {
            counts[config.id] = config.modules.filter(module => module.enabled).length;
        }
        return counts;
    });

    const visiblePersonal = $derived.by(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return personal;
        return personal.filter(config =>
            `${config.name} ${config.description} ${personalTags(config).join(" ")}`.toLowerCase().includes(needle)
        );
    });

    const createNameValid = $derived.by(() => {
        const length = formName.trim().length;
        return length >= 3 && length <= MAX_NAME;
    });

    const createDescriptionValid = $derived.by(() => {
        const length = formDescription.trim().length;
        return length >= 3 && length <= MAX_DESCRIPTION;
    });

    function personalTags(config: PersonalConfig): string[] {
        const counts = new Map<string, number>();
        for (const module of config.modules) {
            if (!module.enabled || !module.category) continue;
            counts.set(module.category, (counts.get(module.category) ?? 0) + 1);
        }
        return [...counts.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0, 3)
            .map(([category]) => category);
    }

    function selectTab(next: Tab) {
        if (tab === next) return;
        tab = next;
        search = "";
        formError = null;
    }

    function startCreate() {
        tab = "create";
        search = "";
        formName = "";
        formDescription = "";
        formError = null;
    }

    function openEdit(config: PersonalConfig) {
        formName = config.name;
        formDescription = config.description;
        formError = null;
        dialog = {mode: "edit", config};
    }

    async function captureSnapshot(): Promise<{modules: SnapshotModule[]; global?: ConfigurableSetting}> {
        const [modules, global] = await Promise.all([
            getModules(),
            getGlobalSettings().catch(error => {
                console.error("[PrestigeBounce] Could not capture global settings", error);
                return undefined;
            })
        ]);

        const settings = new Map<string, ConfigurableSetting>();
        await Promise.all(modules.filter(module => module.enabled).map(async module => {
            try {
                settings.set(module.name, await getModuleSettings(module.name));
            } catch (error) {
                console.error(`[PrestigeBounce] Could not capture ${module.name}`, error);
            }
        }));

        return {
            modules: modules.map(module => ({
                name: module.name,
                enabled: module.enabled,
                category: module.category,
                settings: settings.get(module.name)
            })),
            global
        };
    }

    async function createConfig() {
        const name = formName.trim();
        const description = formDescription.trim();

        if (name.length < 3 || name.length > MAX_NAME) {
            formError = `Name must be between 3 and ${MAX_NAME} characters.`;
            return;
        }
        if (description.length < 3 || description.length > MAX_DESCRIPTION) {
            formError = `Description must be between 3 and ${MAX_DESCRIPTION} characters.`;
            return;
        }
        if (personal.some(config => config.name.toLowerCase() === name.toLowerCase())) {
            formError = "A config with this name already exists.";
            return;
        }
        if (personal.length >= MAX_PERSONAL) {
            formError = `You can keep up to ${MAX_PERSONAL} personal configs.`;
            return;
        }

        busy = true;
        formError = null;
        try {
            const snapshot = await captureSnapshot();
            const now = Date.now();
            const config: PersonalConfig = {
                id: makeId(),
                name,
                description,
                createdAt: now,
                updatedAt: now,
                ...snapshot
            };
            const next = [config, ...personal];
            if (!writeStored(STORAGE_KEY, next)) {
                formError = "Could not save the config. Local storage may be full.";
                return;
            }
            personal = next;
            formName = "";
            formDescription = "";
            tab = "personal";
            notify(`Config saved · ${name}`, "configs");
        } catch (error) {
            console.error("[PrestigeBounce] Could not create config", error);
            formError = "Could not capture the current client settings.";
        } finally {
            busy = false;
        }
    }

    function updateConfig(config: PersonalConfig) {
        const name = formName.trim();
        const description = formDescription.trim();

        if (name.length < 3 || name.length > MAX_NAME) {
            formError = `Name must be between 3 and ${MAX_NAME} characters.`;
            return;
        }
        if (description.length > MAX_DESCRIPTION) {
            formError = `Description can be at most ${MAX_DESCRIPTION} characters.`;
            return;
        }
        if (personal.some(entry => entry.id !== config.id && entry.name.toLowerCase() === name.toLowerCase())) {
            formError = "A config with this name already exists.";
            return;
        }

        const next = personal.map(entry => entry.id === config.id
            ? {...entry, name, description, updatedAt: Date.now()}
            : entry);
        if (!writeStored(STORAGE_KEY, next)) {
            formError = "Could not save the config. Local storage may be full.";
            return;
        }
        personal = next;
        dialog = null;
        notify("Config updated", "configs");
    }

    async function applyPersonal(config: PersonalConfig) {
        if (busy) return;
        busy = true;
        applyingId = config.id;
        try {
            const current = await getModules();
            const desired = new Map(config.modules.map(module => [module.name, module]));
            const toggles = current
                .filter(module => module.enabled !== (desired.get(module.name)?.enabled ?? false))
                .map(module => setModuleEnabled(module.name, desired.get(module.name)?.enabled ?? false));

            await Promise.all(toggles);

            const settings = config.modules.filter(module => module.enabled && module.settings);
            await Promise.all(settings.map(module =>
                setModuleSettings(module.name, $state.snapshot(module.settings!))
                    .catch(error => console.error(`[PrestigeBounce] Could not apply ${module.name}`, error))
            ));

            if (config.global) {
                await setGlobalSettings($state.snapshot(config.global))
                    .catch(error => console.error("[PrestigeBounce] Could not apply global settings", error));
            }

            await onModulesChanged();
            notify(`Config loaded · ${config.name}`, "configs");
            dialog = null;
        } catch (error) {
            console.error("[PrestigeBounce] Could not apply personal config", error);
            notify("Could not load this config", "x");
        } finally {
            busy = false;
            applyingId = null;
        }
    }

    function deleteConfig(config: PersonalConfig) {
        const next = personal.filter(entry => entry.id !== config.id);
        if (!writeStored(STORAGE_KEY, next)) {
            notify("Could not delete the config", "x");
            return;
        }
        personal = next;
        dialog = null;
        notify("Config deleted", "trash");
    }

</script>

<div class="view">
    <header class="view-head">
        <h1>Configs</h1>
    </header>

    <div class="config-toolbar">
        <div class="config-tabs" role="tablist" aria-label="Config views">
            <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "personal"}
                    class="config-tab"
                    class:active={tab === "personal"}
                    onclick={() => selectTab("personal")}
            >
                Personal configs
            </button>
            <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "create"}
                    class="config-tab"
                    class:active={tab === "create"}
                    onclick={() => selectTab("create")}
            >
                Create config
            </button>
        </div>

        {#if tab !== "create"}
            <div class="toolbar-tools">
                <div class="head-search">
                    <SearchField
                            bind:value={search}
                            placeholder="Search your configs"
                    />
                </div>
            </div>
        {/if}
    </div>

    {#if tab === "personal"}
        <div class="view-scroll">
            {#if personal.length === 0}
                <div class="empty">
                    <span class="empty-icon"><Icon name="configs" size={21}/></span>
                    <strong>No personal configs</strong>
                    <p>Capture your current modules, settings and binds as a reusable snapshot.</p>
                    <Button variant="primary" icon="plus" onclick={startCreate}>Create your first config</Button>
                </div>
            {:else if visiblePersonal.length === 0}
                <div class="empty">
                    <span class="empty-icon"><Icon name="search" size={21}/></span>
                    <strong>No matching configs</strong>
                    <p>Try a different name or description.</p>
                </div>
            {:else}
                <div class="config-grid">
                    {#each visiblePersonal as config (config.id)}
                        <ConfigCard
                                name={config.name}
                                description={config.description || "No description provided."}
                                author="You"
                                date={formatDate(config.updatedAt)}
                                tags={personalTags(config)}
                                badge={String(personalEnabled[config.id] ?? 0)}
                                badgeTitle="Enabled modules"
                                primaryLabel="Download"
                                secondaryLabel="Edit"
                                loading={applyingId === config.id}
                                onOpen={() => dialog = {mode: "preview", config}}
                                onPrimary={() => applyPersonal(config)}
                                onSecondary={() => openEdit(config)}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    {:else}
        <div class="view-scroll create-scroll">
            <div class="create-layout">
                <section class="create-panel">
                    <header class="panel-head">
                        <h2>Create a new config</h2>
                        <p>Snapshots your current settings and saves them as a config</p>
                    </header>

                    <label class="field">
                        <span class="field-label">
                            Config name
                            <em class:limit={formName.length >= MAX_NAME}>{formName.length}/{MAX_NAME}</em>
                        </span>
                        <input
                                type="text"
                                bind:value={formName}
                                maxlength={MAX_NAME}
                                placeholder="e.g. Crystal PvP config"
                                autocomplete="off"
                        />
                    </label>

                    <label class="field">
                        <span class="field-label">
                            Description
                            <em class:limit={formDescription.length >= MAX_DESCRIPTION}>{formDescription.length}/{MAX_DESCRIPTION}</em>
                        </span>
                        <textarea
                                bind:value={formDescription}
                                maxlength={MAX_DESCRIPTION}
                                rows="3"
                                placeholder="What the config does"
                        ></textarea>
                    </label>

                    <div class="field-row">
                        <div class="field">
                            <span class="field-label">Visibility</span>
                            <div class="fake-select" title="Personal configs are stored on this computer">
                                <Icon name="lock" size={13}/>
                                <span>Personal</span>
                                <em>Only you</em>
                            </div>
                        </div>
                        <div class="field">
                            <span class="field-label">Tags</span>
                            <div class="fake-select" title="Tags are derived from enabled module categories">
                                <Icon name="tag" size={13}/>
                                <span>Automatic</span>
                                <em>By modules</em>
                            </div>
                        </div>
                    </div>

                    {#if formError}
                        <p class="form-error">{formError}</p>
                    {/if}

                    <Button variant="primary" full icon="plus" disabled={busy} onclick={createConfig}>
                        {busy ? "Saving snapshot…" : "Create config"}
                    </Button>
                </section>

                <aside class="preview-column">
                    <div class="preview-head">
                        <h2>Preview</h2>
                        <p>How it looks on the site</p>
                    </div>

                    <article class="preview-card">
                        <div class="preview-top">
                            <strong>{formName.trim() || "Config name"}</strong>
                            <span class="preview-badge">0</span>
                        </div>
                        <p class="preview-description">{formDescription.trim() || "Your description will appear here"}</p>
                        <div class="preview-meta">
                            <span>by <strong>You</strong></span>
                            <span>Just now</span>
                        </div>
                        <div class="preview-tags"><span>No tags</span></div>
                        <div class="preview-actions">
                            <span class="preview-primary">Download</span>
                            <span class="preview-secondary">Edit</span>
                        </div>
                    </article>

                    <ul class="checklist">
                        <li class:ok={createNameValid}>
                            <span class="bullet">{#if createNameValid}<Icon name="check" size={9}/>{/if}</span>
                            Name needs 3–{MAX_NAME} chars
                        </li>
                        <li class:ok={createDescriptionValid}>
                            <span class="bullet">{#if createDescriptionValid}<Icon name="check" size={9}/>{/if}</span>
                            Description needs 3–{MAX_DESCRIPTION} chars
                        </li>
                        <li class="ok">
                            <span class="bullet"><Icon name="check" size={9}/></span>
                            Only you can see it
                        </li>
                    </ul>
                </aside>
            </div>
        </div>
    {/if}
</div>

{#if dialog}
    <Modal
            title={dialog.mode === "edit" ? "Edit config" : dialog.mode === "preview" ? dialog.config.name : "Delete config"}
            subtitle={dialog.mode === "edit"
                ? "Changes are saved on this computer"
                : dialog.mode === "preview"
                    ? `${personalEnabled[dialog.config.id] ?? 0} modules enabled`
                    : "This cannot be undone"}
            width={dialog.mode === "preview" ? 560 : 480}
            onclose={() => dialog = null}
    >
        {#if dialog.mode === "edit"}
            <label class="field">
                <span class="field-label">Name <em class:limit={formName.length >= MAX_NAME}>{formName.length}/{MAX_NAME}</em></span>
                <input type="text" bind:value={formName} maxlength={MAX_NAME} placeholder="e.g. Nether PvP" autocomplete="off"/>
            </label>
            <label class="field">
                <span class="field-label">Description <em class:limit={formDescription.length >= MAX_DESCRIPTION}>{formDescription.length}/{MAX_DESCRIPTION}</em></span>
                <textarea bind:value={formDescription} maxlength={MAX_DESCRIPTION} rows="3" placeholder="What is this config for?"></textarea>
            </label>

            {#if formError}
                <p class="form-error">{formError}</p>
            {/if}

            {#snippet footer()}
                <Button
                        variant="danger"
                        icon="trash"
                        onclick={() => {
                            if (dialog?.mode === "edit") dialog = {mode: "delete", config: dialog.config};
                        }}
                >
                    Delete
                </Button>
                <span class="footer-spacer"></span>
                <Button variant="ghost" onclick={() => dialog = null}>Cancel</Button>
                <Button
                        variant="primary"
                        icon="check"
                        onclick={() => {
                            if (dialog?.mode === "edit") updateConfig(dialog.config);
                        }}
                >
                    Save changes
                </Button>
            {/snippet}
        {:else if dialog.mode === "preview"}
            {@const enabledModules = dialog.config.modules.filter(module => module.enabled)}
            <div class="preview-stats">
                <span><strong>{enabledModules.length}</strong> enabled modules</span>
                <span>Created {timeAgo(dialog.config.createdAt)}</span>
                <span>Updated {timeAgo(dialog.config.updatedAt)}</span>
            </div>
            {#if dialog.config.description}
                <p class="preview-desc">{dialog.config.description}</p>
            {/if}
            <div class="preview-modules">
                {#each enabledModules as module (module.name)}
                    <span class="preview-chip">{module.name}{#if module.settings}<i>·</i>{/if}</span>
                {/each}
            </div>

            {#snippet footer()}
                <Button variant="ghost" onclick={() => dialog = null}>Close</Button>
                <Button
                        variant="primary"
                        icon="download"
                        disabled={busy}
                        onclick={() => {
                            if (dialog?.mode === "preview") applyPersonal(dialog.config);
                        }}
                >
                    {busy ? "Loading…" : "Load config"}
                </Button>
            {/snippet}
        {:else}
            {@const config = dialog.config}
            <p class="delete-copy">
                Delete <strong>{config.name}</strong>? This only removes the local snapshot.
            </p>

            {#snippet footer()}
                <Button variant="ghost" onclick={() => dialog = null}>Cancel</Button>
                <Button variant="danger" icon="trash" onclick={() => deleteConfig(config)}>Delete</Button>
            {/snippet}
        {/if}
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
    flex: none;

    h1 {
      margin: 0;
      color: var(--claude-text);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -.3px;
    }
  }

  .config-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex: none;
    margin-top: 20px;
  }

  .config-tabs {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
  }

  .config-tab {
    height: 40px;
    padding: 0 30px;
    border-radius: 8px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.4%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 11px;
    font-weight: 550;
    white-space: nowrap;
    cursor: pointer;
    transition: color .16s ease, border-color .16s ease, background-color .16s ease, box-shadow .16s ease;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    }

    &.active {
      color: #fff;
      border-color: transparent;
      background: var(--claude-accent);
      box-shadow: 0 8px 22px color-mix(in srgb, var(--claude-accent) 18%, transparent);
    }
  }

  .toolbar-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
    min-width: 0;
  }

  .view-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 24px 8px 8px 1px;
    margin-right: -8px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 13%, transparent) transparent;
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 30px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 400px;
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

  .create-scroll {
    padding-top: 22px;
  }

  .create-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(240px, .9fr);
    gap: 30px;
    align-items: start;
    max-width: 100%;
  }

  .create-panel {
    display: flex;
    flex-direction: column;
    min-height: 384px;
    padding: 21px 22px 20px;
    border: 1px solid var(--claude-border);
    border-radius: 10px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-text) 2.4%, transparent), transparent 58%);
  }

  .panel-head {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      color: var(--claude-text);
      font-size: 15px;
      font-weight: 650;
      letter-spacing: .05px;
    }

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 10px;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 15px;

    input,
    textarea {
      width: 100%;
      padding: 10px 12px;
      border-radius: 7px;
      border: 1px solid var(--claude-border);
      background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
      color: var(--claude-text);
      font: inherit;
      font-size: 11.5px;
      resize: none;

      &:focus {
        border-color: var(--claude-accent-line);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-accent) 8%, transparent);
      }

      &::placeholder {
        color: var(--claude-text-muted);
      }
    }

    textarea {
      min-height: 72px;
    }
  }

  .field-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: var(--claude-text-dim);
    font-size: 10px;
    font-weight: 550;

    em {
      color: var(--claude-text-muted);
      font-style: normal;
      font-weight: 400;
      font-variant-numeric: tabular-nums;

      &.limit {
        color: #ffb18a;
      }
    }
  }

  .field-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    .field {
      margin-bottom: 15px;
    }
  }

  .fake-select {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 37px;
    padding: 0 12px;
    border-radius: 7px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
    color: var(--claude-text-soft);
    font-size: 11px;

    :global(svg) {
      color: var(--claude-text-muted);
    }

    em {
      margin-left: auto;
      color: var(--claude-text-muted);
      font-size: 8.5px;
      font-style: normal;
    }
  }

  .form-error {
    margin: -3px 0 12px;
    color: #ff9da5;
    font-size: 9.5px;
  }

  .create-panel :global(.claude-button) {
    margin-top: auto;
    min-height: 37px;
  }

  .preview-column {
    min-width: 0;
  }

  .preview-head {
    h2 {
      margin: 0;
      color: var(--claude-text);
      font-size: 14px;
      font-weight: 650;
    }

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 9.5px;
    }
  }

  .preview-card {
    display: flex;
    flex-direction: column;
    min-height: 176px;
    margin-top: 16px;
    padding: 15px 16px 14px;
    border: 1px solid var(--claude-border);
    border-radius: 9px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-text) 2.4%, transparent), transparent);
  }

  .preview-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;

    strong {
      overflow: hidden;
      color: var(--claude-text);
      font-size: 13px;
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .preview-badge {
    flex: none;
    min-width: 34px;
    padding: 4px 7px;
    border-radius: 4px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 12%, transparent);
    font-size: 9px;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .preview-description {
    display: -webkit-box;
    margin: 8px 0 0;
    overflow: hidden;
    color: var(--claude-text-muted);
    font-size: 10px;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    min-height: 30px;
  }

  .preview-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 9px;
    color: var(--claude-text-muted);
    font-size: 9px;

    strong {
      color: #8ee3bb;
      font-weight: 550;
    }
  }

  .preview-tags {
    display: flex;
    gap: 4px;
    margin-top: 7px;

    span {
      padding: 2px 5px;
      border-radius: 3px;
      border: 1px solid var(--claude-border);
      color: var(--claude-text-muted);
      font-size: 8px;
    }
  }

  .preview-actions {
    display: flex;
    gap: 6px;
    margin-top: auto;
    padding-top: 12px;
  }

  .preview-primary,
  .preview-secondary {
    flex: 1;
    display: grid;
    place-items: center;
    height: 31px;
    border-radius: 5px;
    font-size: 10.5px;
    font-weight: 550;
  }

  .preview-primary {
    color: #fff;
    background: var(--claude-accent);
  }

  .preview-secondary {
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-dim);
  }

  .checklist {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin: 15px 0 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--claude-text-muted);
      font-size: 9.5px;

      &.ok {
        color: var(--claude-text-dim);

        .bullet {
          color: #fff;
          border-color: transparent;
          background: var(--claude-accent);
        }
      }
    }
  }

  .bullet {
    display: grid;
    place-items: center;
    width: 14px;
    height: 14px;
    flex: none;
    border-radius: 50%;
    border: 1px solid var(--claude-border-strong);
    color: var(--claude-text-muted);
  }

  .footer-spacer {
    flex: 1;
  }

  .preview-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 13px;
    color: var(--claude-text-muted);
    font-size: 9.5px;

    strong {
      color: var(--claude-text-soft);
      font-weight: 600;
    }
  }

  .preview-desc {
    margin: 11px 0 0;
    color: var(--claude-text-muted);
    font-size: 10.5px;
    line-height: 1.6;
  }

  .preview-modules {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 13px;
    max-height: 190px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .preview-chip {
    padding: 4px 7px;
    border-radius: 4px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-dim);
    font-size: 8.5px;

    i {
      margin-left: 4px;
      color: var(--claude-accent);
      font-style: normal;
    }
  }

  .delete-copy {
    margin: 0;
    color: var(--claude-text-muted);
    font-size: 11px;
    line-height: 1.6;

    strong {
      color: var(--claude-text);
      font-weight: 600;
    }
  }

  @media (max-width: 1080px) {
    .config-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .create-layout {
      grid-template-columns: 1fr;
    }

    .preview-column {
      max-width: 380px;
    }
  }

  @media (max-width: 880px) {
    .config-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .toolbar-tools {
      width: 100%;
    }

    .head-search {
      width: 100%;
    }

    .config-grid {
      grid-template-columns: 1fr;
      gap: 13px;
    }
  }
</style>
