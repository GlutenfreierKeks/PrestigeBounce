<script lang="ts">
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";
    import Toggle from "./Toggle.svelte";
    import ClaudeSetting from "./ClaudeSetting.svelte";
    import {getModuleSettings, setModuleSettings} from "../../../integration/rest";
    import type {ConfigurableSetting, Module} from "../../../integration/types";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../theme/theme_config";

    let {
        module,
        onBack,
        onToggle
    } = $props<{
        module: Module;
        onBack: () => void;
        onToggle: (name: string, enabled: boolean) => void;
    }>();

    let configurable = $state<ConfigurableSetting | null>(null);
    let loading = $state(true);
    let failed = $state(false);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const title = $derived($spaceSeperatedNames ? convertToSpacedString(module.name) : module.name);

    async function loadSettings() {
        loading = true;
        failed = false;
        try {
            configurable = await getModuleSettings(module.name);
        } catch (error) {
            console.error(`[Claude] Could not load settings for ${module.name}`, error);
            failed = true;
        } finally {
            loading = false;
        }
    }

    function scheduleSave() {
        if (!configurable) return;
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(() => {
            if (!configurable) return;
            void setModuleSettings(module.name, $state.snapshot(configurable));
        }, 120);
    }

    onMount(loadSettings);
</script>

<div class="module-detail">
    <header class="detail-browser-head">
        <div class="head-copy">
            <h1><em>{module.category}</em> Modules</h1>
            <p>{module.enabled ? "Enabled" : "Disabled"} · Module settings</p>
        </div>
        <button type="button" class="back" onclick={onBack}>
            <Icon name="chevron-left" size={13}/>
            Back
        </button>
    </header>

    <div class="detail-card">
        <header class="detail-head">
            <div>
                <h2>{title}</h2>
                <p>{module.description}</p>
            </div>
            <Toggle
                    checked={module.enabled}
                    label={`Toggle ${title}`}
                    onchange={(next) => onToggle(module.name, next)}
            />
        </header>

        <div class="detail-settings">
            {#if loading}
                <div class="state"><span class="loader"></span> Loading settings…</div>
            {:else if failed}
                <div class="state error">
                    <Icon name="x" size={15}/>
                    Settings could not be loaded.
                    <button type="button" class="retry" onclick={loadSettings}>Try again</button>
                </div>
            {:else if configurable && configurable.value.length > 0}
                {#each configurable.value as setting (setting.name)}
                    <ClaudeSetting
                            setting={setting}
                            path={`clickgui.${module.name}`}
                            onchange={scheduleSave}
                    />
                {/each}
            {:else}
                <div class="state">This module has no settings.</div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
  .module-detail {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    flex: 1;
  }

  .detail-browser-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex: none;
    padding-bottom: 18px;
  }

  .head-copy {
    min-width: 0;

    h1 {
      margin: 0;
      color: var(--claude-text);
      font-family: "Playfair Display", Georgia, serif;
      font-size: 29px;
      font-weight: 600;
      line-height: 1.12;
      letter-spacing: -.35px;

      em {
        font-style: italic;
        font-weight: 600;
      }
    }

    p {
      margin: 8px 0 0;
      color: var(--claude-text-muted);
      font-size: 11px;
      font-weight: 450;
    }
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    margin-top: 2px;
    padding: 0 12px;
    flex: none;
    border-radius: 999px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.4%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 10.5px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color .16s ease, color .16s ease, background-color .16s ease;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    }
  }

  .detail-card {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    border: 1px solid var(--claude-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--claude-text) 2.2%, var(--claude-card));
    overflow: hidden;
  }

  .detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 17px 20px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 6.5%, transparent);

    h2 {
      margin: 0;
      color: var(--claude-text);
      font-size: 13.5px;
      font-weight: 650;
      letter-spacing: .05px;
    }

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 10.5px;
    }
  }

  .detail-settings {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 3px 20px 12px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 14%, transparent) transparent;
  }

  .state {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 24px 4px;
    color: var(--claude-text-muted);
    font-size: 11px;

    &.error {
      color: #ff9da5;
    }
  }

  .retry {
    margin-left: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid color-mix(in srgb, #ff5964 30%, transparent);
    background: transparent;
    color: #ff9da5;
    font: inherit;
    font-size: 10px;
    cursor: pointer;
  }

  .loader {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--claude-text) 15%, transparent);
    border-top-color: var(--claude-accent);
    animation: spin .7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
