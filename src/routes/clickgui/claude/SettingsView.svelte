<script lang="ts">
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";
    import KeyCap from "./KeyCap.svelte";
    import ClaudeSetting from "./ClaudeSetting.svelte";
    import BindField from "./BindField.svelte";
    import {claudeTheme} from "./theme.svelte";
    import {formatKey} from "./format";
    import {getGlobalSettings, getModule, getModuleSettings, setGlobalSettings, setModuleSettings} from "../../../integration/rest";
    import type {BindSetting, ConfigurableSetting, ModuleSetting} from "../../../integration/types";

    let {notify} = $props<{
        notify: (message: string, icon?: string) => void;
    }>();

    let accent = $state(claudeTheme.customAccent ?? claudeTheme.current.accent);
    let accentText = $state(accent.toUpperCase());

    let menuBind = $state<BindSetting | null>(null);
    let fallbackBind = $state<string | null>(null);
    let menuLoading = $state(true);
    let menuFailed = $state(false);

    let globalSettings = $state<ConfigurableSetting | null>(null);
    let globalLoading = $state(true);
    let globalFailed = $state(false);
    let globalSaveState = $state<"idle" | "saving" | "saved">("idle");

    let menuSaveTimer: ReturnType<typeof setTimeout> | undefined;
    let globalSaveTimer: ReturnType<typeof setTimeout> | undefined;

    $effect(() => {
        accent = claudeTheme.customAccent ?? claudeTheme.current.accent;
        accentText = accent.toUpperCase();
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

    async function loadMenuBind() {
        menuLoading = true;
        menuFailed = false;
        try {
            const [settings, module] = await Promise.all([
                getModuleSettings("ClickGUI"),
                getModule("ClickGUI")
            ]);
            menuBind = findBind(settings.value);
            fallbackBind = menuBind ? null : formatKey(module.keyBind.boundKey);
        } catch (error) {
            console.error("[PrestigeBounce] Could not load the menu bind", error);
            menuFailed = true;
        } finally {
            menuLoading = false;
        }
    }

    async function loadGlobal() {
        globalLoading = true;
        globalFailed = false;
        try {
            globalSettings = await getGlobalSettings();
        } catch (error) {
            console.error("[PrestigeBounce] Could not load global settings", error);
            globalFailed = true;
        } finally {
            globalLoading = false;
        }
    }

    function saveMenuBind() {
        if (!menuBind) return;
        if (menuSaveTimer !== undefined) clearTimeout(menuSaveTimer);
        menuSaveTimer = setTimeout(() => {
            void (async () => {
                try {
                    const settings = await getModuleSettings("ClickGUI");
                    const bind = findBind(settings.value);
                    if (!bind) return;
                    bind.value = {...menuBind!.value};
                    await setModuleSettings("ClickGUI", $state.snapshot(settings));
                    notify("Menu bind updated", "keybinds");
                } catch (error) {
                    console.error("[PrestigeBounce] Could not save the menu bind", error);
                    notify("Could not save the menu bind", "x");
                }
            })();
        }, 120);
    }

    function saveGlobal() {
        if (!globalSettings) return;
        globalSaveState = "saving";
        if (globalSaveTimer !== undefined) clearTimeout(globalSaveTimer);
        globalSaveTimer = setTimeout(() => {
            void (async () => {
                try {
                    await setGlobalSettings($state.snapshot(globalSettings!));
                    globalSaveState = "saved";
                    setTimeout(() => globalSaveState = "idle", 1400);
                } catch (error) {
                    console.error("[PrestigeBounce] Could not save global settings", error);
                    globalSaveState = "idle";
                    notify("Could not save settings", "x");
                }
            })();
        }, 140);
    }

    function setAccent(value: string) {
        if (!/^#[0-9a-f]{6}$/i.test(value)) return;
        claudeTheme.setAccent(value);
        accent = value;
        accentText = value.toUpperCase();
    }

    function commitAccentText() {
        const value = accentText.trim().startsWith("#") ? accentText.trim() : `#${accentText.trim()}`;
        if (!/^#[0-9a-f]{6}$/i.test(value)) {
            accentText = accent.toUpperCase();
            return;
        }
        setAccent(value);
        notify("Accent updated", "theme");
    }

    function resetAccent() {
        claudeTheme.select(claudeTheme.current);
        notify("Accent reset", "refresh");
    }

    onMount(() => {
        void loadMenuBind();
        void loadGlobal();
        return () => {
            if (menuSaveTimer !== undefined) clearTimeout(menuSaveTimer);
            if (globalSaveTimer !== undefined) clearTimeout(globalSaveTimer);
        };
    });
</script>

<div class="view">
    <header class="view-head">
        <div>
            <h1>Settings</h1>
            <p>Appearance and keybinds</p>
        </div>
    </header>

    <div class="view-scroll">
        <div class="top-grid">
            <section class="card accent-card">
                <header class="card-head">
                    <div>
                        <h2>Main color</h2>
                        <p>Accent for trails, effects and HUD</p>
                    </div>
                    <span class="accent-preview" style={`background: ${accent};`}></span>
                </header>

                <div class="accent-body">
                    <div class="gradient-panel" style={`--accent: ${accent};`}>
                        <span class="gradient-cursor" style={`background: ${accent};`}></span>
                    </div>
                    <div class="accent-row">
                        <label class="swatch">
                            <input
                                    type="color"
                                    value={accent}
                                    oninput={(event) => setAccent((event.currentTarget as HTMLInputElement).value)}
                            />
                            <span style={`background: ${accent};`}></span>
                        </label>
                        <input
                                class="hex"
                                type="text"
                                bind:value={accentText}
                                spellcheck="false"
                                onchange={commitAccentText}
                        />
                        {#if claudeTheme.customAccent}
                            <button type="button" class="reset" onclick={resetAccent}>Reset</button>
                        {/if}
                    </div>
                    <p class="accent-note">
                        Theme <strong>{claudeTheme.current.name}</strong> · changes apply instantly
                    </p>
                </div>
            </section>

            <section class="card bind-card">
                <header class="card-head">
                    <div>
                        <h2>Menu Bind</h2>
                        <p>Key to open/close this menu</p>
                    </div>
                    <span class="card-icon"><Icon name="keybinds" size={15}/></span>
                </header>

                <div class="bind-body">
                    {#if menuLoading}
                        <div class="line-loading">Loading bind…</div>
                    {:else if menuFailed}
                        <div class="line-failed">
                            Bind could not be loaded.
                            <button type="button" onclick={loadMenuBind}>Retry</button>
                        </div>
                    {:else if menuBind}
                        <div class="bind-row">
                            <span>Toggle menu</span>
                            <BindField
                                    bind:value={menuBind.value}
                                    compact={true}
                                    onchange={saveMenuBind}
                            />
                        </div>
                        <p class="bind-note">Click the bind to record a new key. Right click is ignored while recording.</p>
                    {:else}
                        <div class="bind-row">
                            <span>Toggle menu</span>
                            <KeyCap>{fallbackBind ?? "None"}</KeyCap>
                        </div>
                        <p class="bind-note">This build does not expose the menu bind through module settings.</p>
                    {/if}
                </div>
            </section>
        </div>

        <section class="card global-card">
            <header class="card-head">
                <div>
                    <h2>Client Settings</h2>
                    <p>Real LiquidBounce global settings · changes save automatically</p>
                </div>
                <span class="save-state" class:saving={globalSaveState === "saving"}>
                    {#if globalSaveState === "saving"}
                        Saving…
                    {:else if globalSaveState === "saved"}
                        Saved
                    {:else}
                        Auto-save
                    {/if}
                </span>
            </header>

            <div class="global-body">
                {#if globalLoading}
                    <div class="line-loading"><span class="loader"></span> Loading client settings…</div>
                {:else if globalFailed}
                    <div class="line-failed">
                        Client settings could not be loaded.
                        <button type="button" onclick={loadGlobal}>Try again</button>
                    </div>
                {:else if globalSettings && globalSettings.value.length > 0}
                    {#each globalSettings.value as setting (setting.name)}
                        <ClaudeSetting
                                {setting}
                                path="claude.global"
                                onchange={saveGlobal}
                        />
                    {/each}
                {:else}
                    <div class="line-loading">No global settings are available.</div>
                {/if}
            </div>
        </section>
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

  .view-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 8px 8px 1px;
    margin-right: -8px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 13%, transparent) transparent;
  }

  .top-grid {
    display: grid;
    grid-template-columns: minmax(320px, 1.05fr) minmax(300px, 1fr);
    gap: 14px;
    align-items: start;
  }

  .card {
    border: 1px solid var(--claude-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--claude-text) 2.3%, var(--claude-card));
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 15px 17px 13px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);

    h2 {
      margin: 0;
      color: var(--claude-text);
      font-size: 12px;
      font-weight: 650;
      letter-spacing: .05px;
    }

    p {
      margin: 4px 0 0;
      color: var(--claude-text-muted);
      font-size: 9.5px;
    }
  }

  .accent-preview {
    width: 19px;
    height: 19px;
    border-radius: 5px;
    box-shadow: 0 0 12px color-mix(in srgb, var(--claude-accent) 32%, transparent);
  }

  .card-icon {
    display: grid;
    place-items: center;
    width: 27px;
    height: 27px;
    border-radius: 6px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
  }

  .accent-body {
    padding: 14px 17px 15px;
  }

  .gradient-panel {
    position: relative;
    height: 112px;
    border-radius: 7px;
    border: 1px solid var(--claude-border);
    background:
      linear-gradient(90deg, #05060c, var(--accent)),
      linear-gradient(0deg, #05060c, transparent);
    overflow: hidden;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(0deg, rgba(0, 0, 0, .85), transparent 70%);
    }
  }

  .gradient-cursor {
    position: absolute;
    left: 66%;
    top: 29%;
    z-index: 1;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .5);
  }

  .accent-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 11px;
  }

  .swatch {
    position: relative;
    width: 31px;
    height: 29px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    overflow: hidden;
    cursor: pointer;

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    span {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  .hex {
    width: 104px;
    height: 29px;
    padding: 0 8px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-soft);
    font-family: monospace;
    font-size: 10.5px;

    &:focus {
      border-color: var(--claude-accent-line);
    }
  }

  .reset {
    height: 29px;
    padding: 0 9px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: transparent;
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 9.5px;
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
    }
  }

  .accent-note,
  .bind-note {
    margin: 9px 0 0;
    color: var(--claude-text-muted);
    font-size: 9.5px;

    strong {
      color: var(--claude-text-dim);
      font-weight: 550;
    }
  }

  .bind-body {
    padding: 15px 17px;
  }

  .bind-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    min-height: 36px;

    > span {
      color: var(--claude-text-dim);
      font-size: 10.5px;
    }
  }

  .line-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    color: var(--claude-text-muted);
    font-size: 10.5px;

    .loader {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 2px solid color-mix(in srgb, var(--claude-text) 14%, transparent);
      border-top-color: var(--claude-accent);
      animation: spin .7s linear infinite;
    }
  }

  .line-failed {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    color: #ff9da5;
    font-size: 10.5px;

    button {
      padding: 3px 7px;
      border-radius: 4px;
      border: 1px solid color-mix(in srgb, #ff5964 28%, transparent);
      background: transparent;
      color: #ff9da5;
      font: inherit;
      font-size: 9.5px;
      cursor: pointer;
    }
  }

  .global-card {
    margin-top: 15px;
  }

  .save-state {
    color: var(--claude-text-muted);
    font-size: 8.5px;
    letter-spacing: .3px;
    text-transform: uppercase;

    &.saving {
      color: var(--claude-accent);
    }
  }

  .global-body {
    padding: 2px 17px 9px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 980px) {
    .top-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
