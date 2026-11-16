<script lang="ts">
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";
    import Toast from "./Toast.svelte";
    import ModuleBrowser from "./ModuleBrowser.svelte";
    import ModuleDetail from "./ModuleDetail.svelte";
    import ThemesView from "./ThemesView.svelte";
    import SettingsView from "./SettingsView.svelte";
    import ConfigsView from "./ConfigsView.svelte";
    import SocialsView from "./SocialsView.svelte";
    import KeybindsView from "./KeybindsView.svelte";
    import MarketplaceView from "./MarketplaceView.svelte";
    import HudEditor from "../tabs/hud_editor/HudEditor.svelte";
    import {claudeTheme} from "./theme.svelte";
    import {escapeLayer} from "../../../integration/escape";
    import {listen} from "../../../integration/ws";
    import {getCategories, getModules, setModuleEnabled} from "../../../integration/rest";
    import type {Module, ModuleCategory} from "../../../integration/types";
    import type {ModuleToggleEvent} from "../../../integration/events";

    type GeneralView = "settings" | "themes" | "configs" | "socials" | "keybinds" | "marketplace" | "hud";

    const generalNav: { id: GeneralView; label: string; icon: string }[] = [
        {id: "settings", label: "Settings", icon: "settings"},
        {id: "themes", label: "Theme", icon: "theme"},
        {id: "configs", label: "Configs", icon: "configs"},
        {id: "marketplace", label: "Marketplace", icon: "marketplace"},
        {id: "socials", label: "Socials", icon: "socials"},
        {id: "keybinds", label: "Keybinds", icon: "keybinds"}
    ];

    let modules = $state<Module[]>([]);
    let categories = $state<ModuleCategory[]>([]);
    let loading = $state(true);
    let loadError = $state<string | null>(null);
    let activeCategory = $state("Combat");
    let generalView = $state<GeneralView | null>(null);
    let selectedName = $state<string | null>(null);
    let toastMessage = $state<string | null>(null);
    let toastIcon = $state("sparkles");
    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    const selectedModule = $derived(modules.find(module => module.name === selectedName) ?? null);

    const displayedCategories = $derived.by(() => {
        if (categories.length > 0) {
            return categories.map(category => category.name);
        }
        return [...new Set(modules.map(module => module.category))];
    });

    const categoryCounts = $derived.by(() => {
        const counts: Record<string, number> = {};
        for (const module of modules) {
            counts[module.category] = (counts[module.category] ?? 0) + 1;
        }
        return counts;
    });

    const layer = escapeLayer(() => {
        selectedName = null;
    });
    $effect(() => layer.setOpen(selectedName !== null));

    function notify(message: string, icon = "sparkles") {
        toastMessage = message;
        toastIcon = icon;
        if (toastTimer !== undefined) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastMessage = null, 2400);
    }

    function categoryIcon(name: string) {
        const lower = name.toLowerCase();
        if (lower.includes("combat")) return "combat";
        if (lower.includes("mace")) return "mace";
        if (lower.includes("spear")) return "spear";
        if (lower.includes("movement")) return "movement";
        if (lower.includes("visual") || lower.includes("render")) return "visual";
        if (lower.includes("misc") || lower.includes("fun")) return "misc";
        if (lower.includes("player")) return "socials";
        if (lower.includes("world")) return "globe";
        if (lower.includes("exploit")) return "shield";
        return "box";
    }

    function selectCategory(name: string) {
        activeCategory = name;
        generalView = null;
        selectedName = null;
    }

    function selectGeneral(view: GeneralView) {
        if (view === "hud") {
            generalView = "hud";
            selectedName = null;
            return;
        }
        generalView = view;
        selectedName = null;
    }

    function openModule(module: Module) {
        selectedName = module.name;
    }

    async function toggleModule(name: string, enabled: boolean) {
        const previous = modules;
        modules = modules.map(module => module.name === name ? {...module, enabled} : module);
        try {
            await setModuleEnabled(name, enabled);
        } catch (error) {
            modules = previous;
            notify("Could not update module", "x");
            console.error(`[Claude] Failed to toggle ${name}`, error);
        }
    }

    async function loadModules() {
        try {
            const [loadedModules, loadedCategories] = await Promise.all([getModules(), getCategories()]);
            modules = loadedModules;
            categories = loadedCategories;
            loadError = null;

            if (!displayedCategories.includes(activeCategory) && displayedCategories.length > 0) {
                activeCategory = displayedCategories[0];
            }
        } catch (error) {
            console.error("[Claude] Could not load modules", error);
            loadError = "The client API could not be reached.";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        claudeTheme.init();
        void loadModules();
        return () => {
            if (toastTimer !== undefined) clearTimeout(toastTimer);
        };
    });

    listen("moduleToggle", (event: ModuleToggleEvent) => {
        modules = modules.map(module =>
            module.name === event.moduleName ? {...module, enabled: event.enabled, hidden: event.hidden} : module
        );
    });

    listen("keybindChange", () => {
        void loadModules();
    });
</script>

{#if generalView === "hud"}
    <div class="hud-fullscreen">
        <HudEditor ondone={() => generalView = "settings"}/>
    </div>
{:else}
    <div class="claude-overlay">
        <div class="claude-window">
            <aside class="claude-sidebar">
                <div class="brand">
                    <span class="brand-mark"><Icon name="crown" size={17}/></span>
                    <div class="brand-copy">
                        <div class="brand-title"><span>Claude</span><em>Client</em></div>
                        <div class="brand-subtitle">BETA RELEASE 4.30</div>
                    </div>
                </div>

                <nav class="sidebar-nav">
                    <div class="nav-group">
                        <div class="nav-label">Modules</div>
                        {#if loading}
                            <div class="nav-loading">Loading…</div>
                        {:else if loadError}
                            <button type="button" class="nav-retry" onclick={() => { loading = true; void loadModules(); }}>
                                <Icon name="refresh" size={13}/>
                                Retry
                            </button>
                        {:else}
                            {#each displayedCategories as category (category)}
                                <button
                                        type="button"
                                        class="nav-item"
                                        class:active={generalView === null && activeCategory === category}
                                        onclick={() => selectCategory(category)}
                                >
                                    <Icon name={categoryIcon(category)} size={15}/>
                                    <span class="nav-text">{category}</span>
                                    <span class="nav-count">{categoryCounts[category] ?? 0}</span>
                                </button>
                            {/each}
                        {/if}
                    </div>

                    <div class="nav-divider"></div>

                    <div class="nav-group">
                        <div class="nav-label">General</div>
                        {#each generalNav as entry (entry.id)}
                            <button
                                    type="button"
                                    class="nav-item"
                                    class:active={generalView === entry.id}
                                    onclick={() => selectGeneral(entry.id)}
                            >
                                <Icon name={entry.icon} size={15}/>
                                <span class="nav-text">{entry.label}</span>
                                {#if entry.id === "marketplace"}
                                    <span class="nav-new">NEW</span>
                                {/if}
                            </button>
                        {/each}
                        <button
                                type="button"
                                class="nav-item"
                                onclick={() => selectGeneral("hud")}
                        >
                            <Icon name="hud" size={15}/>
                            <span class="nav-text">HUD Editor</span>
                        </button>
                    </div>
                </nav>

                <div class="sidebar-footer">
                    <span class="footer-dot"></span>
                    Claude Client
                    <span class="footer-version">v4.30</span>
                </div>
            </aside>

            <main class="claude-main">
                {#if selectedModule}
                    <ModuleDetail
                            module={selectedModule}
                            onBack={() => selectedName = null}
                            onToggle={toggleModule}
                    />
                {:else if generalView === "settings"}
                    <SettingsView {notify}/>
                {:else if generalView === "themes"}
                    <ThemesView {notify}/>
                {:else if generalView === "configs"}
                    <ConfigsView {notify} onModulesChanged={loadModules}/>
                {:else if generalView === "socials"}
                    <SocialsView {notify}/>
                {:else if generalView === "keybinds"}
                    <KeybindsView {modules} {notify} onChanged={loadModules}/>
                {:else if generalView === "marketplace"}
                    <MarketplaceView {notify}/>
                {:else}
                    <ModuleBrowser
                            {modules}
                            category={activeCategory}
                            {loading}
                            onToggle={toggleModule}
                            onOpen={openModule}
                    />
                {/if}
            </main>

            {#if toastMessage}
                <Toast message={toastMessage} icon={toastIcon}/>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
  :global(:root) {
    --claude-accent: #8b7cf6;
    --claude-accent-rgb: 139, 124, 246;
    --claude-accent-soft: rgba(139, 124, 246, .16);
    --claude-accent-faint: rgba(139, 124, 246, .08);
    --claude-accent-line: rgba(139, 124, 246, .35);
    --claude-glint: #b2a6ff;
    --claude-background: #0a0d1c;
    --claude-card: #12162b;
    --claude-glow: rgba(139, 124, 246, .24);
    --claude-text: #f1f0fa;
    --claude-text-soft: #d9d7ea;
    --claude-text-dim: #aeacc8;
    --claude-text-muted: #777594;
    --claude-border: rgba(255, 255, 255, .075);
    --claude-border-strong: rgba(255, 255, 255, .145);
  }

  .claude-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
    background:
      radial-gradient(90% 70% at 50% 42%, rgba(3, 5, 15, .44), rgba(3, 4, 12, .72)),
      rgba(3, 4, 12, .40);
    backdrop-filter: blur(2.5px);
    animation: overlay-in .24s ease both;
    overflow: hidden;
  }

  .claude-window {
    position: relative;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    width: min(1194px, 94vw);
    height: min(788px, 90vh);
    min-height: 540px;
    border-radius: 17px;
    border: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
    background:
      radial-gradient(90% 110% at 12% -12%, color-mix(in srgb, var(--claude-accent) 11%, transparent), transparent 48%),
      radial-gradient(80% 100% at 105% 105%, color-mix(in srgb, var(--claude-accent) 7%, transparent), transparent 52%),
      linear-gradient(180deg, color-mix(in srgb, var(--claude-card) 72%, #050711), color-mix(in srgb, var(--claude-background) 94%, black));
    box-shadow:
      0 44px 110px rgba(0, 0, 0, .66),
      0 0 0 1px rgba(0, 0, 0, .35),
      inset 0 1px 0 rgba(255, 255, 255, .045);
    overflow: hidden;
    animation: window-in .32s cubic-bezier(.18, .85, .25, 1) both;
    isolation: isolate;
  }

  .claude-window::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      linear-gradient(115deg, transparent 20%, color-mix(in srgb, var(--claude-text) 2.2%, transparent) 42%, transparent 62%);
    opacity: .7;
  }

  .claude-sidebar {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 21px 16px 17px;
    border-right: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-text) 2.2%, transparent), transparent 30%),
      color-mix(in srgb, var(--claude-background) 72%, black);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px 22px;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 27px;
    height: 27px;
    flex: none;
    border-radius: 50%;
    color: #f5eeff;
    background:
      linear-gradient(160deg, color-mix(in srgb, var(--claude-accent) 92%, white), color-mix(in srgb, var(--claude-accent) 60%, #251e5c));
    box-shadow: 0 0 18px color-mix(in srgb, var(--claude-accent) 32%, transparent);
  }

  .brand-copy {
    min-width: 0;
  }

  .brand-title {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -.2px;
    line-height: 1.1;
    white-space: nowrap;

    em {
      font-weight: 500;
    }
  }

  .brand-subtitle {
    margin-top: 3px;
    color: var(--claude-text-muted);
    font-size: 6.5px;
    font-weight: 600;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .sidebar-nav {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 2px;
    scrollbar-width: none;
  }

  .nav-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-label {
    padding: 5px 10px 7px;
    color: color-mix(in srgb, var(--claude-text-muted) 86%, transparent);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 1.15px;
    text-transform: uppercase;
  }

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    min-height: 36px;
    padding: 0 11px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: color .15s ease, background-color .15s ease, border-color .15s ease;

    :global(svg) {
      color: color-mix(in srgb, currentColor 88%, transparent);
    }

    &:hover {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-text) 4.4%, transparent);
    }

    &.active {
      color: var(--claude-text);
      border-color: color-mix(in srgb, var(--claude-accent) 22%, transparent);
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 20%, transparent), color-mix(in srgb, var(--claude-accent) 8%, transparent));
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--claude-accent) 6%, transparent);

      :global(svg) {
        color: var(--claude-accent);
      }
    }
  }

  .nav-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-count {
    color: color-mix(in srgb, var(--claude-text-muted) 90%, transparent);
    font-size: 9.5px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .nav-new {
    padding: 2px 5px;
    border-radius: 3px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 11%, transparent);
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: .4px;
  }

  .nav-divider {
    height: 1px;
    margin: 13px 10px 12px;
    background: color-mix(in srgb, var(--claude-text) 5.5%, transparent);
  }

  .nav-loading,
  .nav-retry {
    min-height: 34px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--claude-text-muted);
    font: inherit;
    font-size: 11px;
  }

  .nav-retry {
    border: 1px solid var(--claude-border);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
    }
  }

  .sidebar-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 16px 10px 0;
    color: color-mix(in srgb, var(--claude-text-muted) 72%, transparent);
    font-size: 8px;
    letter-spacing: .2px;
    white-space: nowrap;
  }

  .footer-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--claude-accent);
    box-shadow: 0 0 6px var(--claude-accent);
  }

  .footer-version {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  .claude-main {
    min-width: 0;
    min-height: 0;
    padding: 30px 36px 27px;
    overflow: hidden;
  }

  .hud-fullscreen {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--claude-accent) 6%, transparent), transparent 62%),
      var(--claude-background);
  }

  @keyframes overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes window-in {
    from { opacity: 0; transform: translateY(12px) scale(.988); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 1050px) {
    .claude-window {
      grid-template-columns: 228px minmax(0, 1fr);
    }

    .claude-main {
      padding: 26px 27px 24px;
    }
  }

  @media (max-height: 660px) {
    .claude-overlay {
      padding: 10px;
    }

    .claude-window {
      height: calc(100vh - 20px);
      min-height: 0;
    }

    .brand {
      padding-bottom: 14px;
    }

    .claude-main {
      padding-top: 22px;
      padding-bottom: 18px;
    }
  }
</style>
