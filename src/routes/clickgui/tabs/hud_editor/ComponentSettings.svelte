<script lang="ts">
    import {onDestroy, onMount, tick} from "svelte";
    import {getComponentSettings, setComponentSettings} from "../../../../integration/rest";
    import type {Alignment, BooleanSetting, ConfigurableSetting, ModuleSetting} from "../../../../integration/types";
    import ClaudeSetting from "../../claude/ClaudeSetting.svelte";
    import Toggle from "../../claude/Toggle.svelte";
    import Icon from "../../claude/Icon.svelte";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../../theme/theme_config";

    export let name: string;
    export let id: string;
    export let alignment: Alignment;
    export let overlayOffset = 0;
    export let onRemove: (() => void) | undefined = undefined;

    let element: HTMLElement | undefined;
    let configurable: ConfigurableSetting | undefined;
    let enabledSetting: BooleanSetting | undefined;
    let nestedSettings: ModuleSetting[] = [];
    let loading = true;
    let failed = false;
    let openBelow = false;
    let shiftX = 0;
    let componentHeight = 0;
    let saving = false;
    let saveError: string | null = null;

    let saveTimer: ReturnType<typeof setTimeout> | undefined;

    const path = `hud.components.${name}.${id}`;
    const SCREEN_EDGE_MARGIN = 14;

    $: prettyName = $spaceSeperatedNames ? convertToSpacedString(name) : name;

    $: alignment.horizontalAlignment,
        alignment.horizontalOffset,
        alignment.verticalAlignment,
        alignment.verticalOffset,
        updatePosition();

    function clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }

    async function updatePosition() {
        await tick();

        const componentElement = element?.parentElement;
        if (!element || !componentElement) {
            return;
        }

        const componentBounds = componentElement.getBoundingClientRect();
        componentHeight = componentBounds.height;

        // Prefer the side with enough room for the whole popover, falling back
        // to the roomier side when neither fits.
        const popoverHeight = element.offsetHeight;
        const spaceAbove = componentBounds.top - SCREEN_EDGE_MARGIN;
        const spaceBelow = window.innerHeight - componentBounds.bottom - SCREEN_EDGE_MARGIN;
        const POPOVER_GAP = 12;

        openBelow = spaceBelow >= popoverHeight + POPOVER_GAP
            || spaceBelow >= spaceAbove;

        // Keep the popover inside the viewport while keeping it anchored to the
        // centre of the selected component.
        const width = element.offsetWidth || 286;
        const anchorCenter = componentBounds.left + componentBounds.width / 2;
        const idealLeft = anchorCenter - width / 2;
        const clampedLeft = clamp(
            idealLeft,
            SCREEN_EDGE_MARGIN,
            Math.max(SCREEN_EDGE_MARGIN, window.innerWidth - SCREEN_EDGE_MARGIN - width)
        );

        shiftX = clampedLeft - idealLeft;
    }

    async function loadSettings() {
        loading = true;
        failed = false;

        try {
            const settings = await getComponentSettings(id);
            settings.value = settings.value.filter(setting => setting.name !== "Alignment");

            configurable = settings;
            enabledSetting = settings.value.find(setting => setting.name === "Enabled") as BooleanSetting | undefined;
            nestedSettings = settings.value.filter(setting => setting !== enabledSetting);
            saveError = null;
        } catch (error) {
            console.error(`[PrestigeBounce] Could not load settings for ${name}`, error);
            failed = true;
        } finally {
            loading = false;
            await updatePosition();
        }
    }

    function scheduleSave() {
        if (!configurable) {
            return;
        }

        if (saveTimer !== undefined) {
            clearTimeout(saveTimer);
        }

        saveTimer = setTimeout(() => {
            saveTimer = undefined;
            void save();
        }, 180);
    }

    async function save() {
        if (!configurable) {
            return;
        }

        saving = true;
        try {
            await setComponentSettings(id, configurable);
            saveError = null;
        } catch (error) {
            console.error(`[PrestigeBounce] Could not save settings for ${name}`, error);
            saveError = error instanceof Error ? error.message : "Could not save the settings";
        } finally {
            saving = false;
        }
    }

    function handleChange() {
        scheduleSave();
    }

    async function toggleEnabled(next: boolean) {
        if (!enabledSetting || !configurable) {
            return;
        }

        enabledSetting.value = next;
        configurable = {...configurable};

        if (saveTimer !== undefined) {
            clearTimeout(saveTimer);
            saveTimer = undefined;
        }

        await save();

        if (!next) {
            onRemove?.();
        }
    }

    function close() {
        onRemove?.();
    }

    onMount(() => {
        void loadSettings();

        const resizeObserver = new ResizeObserver(() => void updatePosition());

        if (element) {
            resizeObserver.observe(element);
        }
        if (element?.parentElement) {
            resizeObserver.observe(element.parentElement);
        }

        window.addEventListener("resize", updatePosition);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updatePosition);
        };
    });

    onDestroy(() => {
        if (saveTimer !== undefined) {
            clearTimeout(saveTimer);
        }
    });
</script>

<div
        class="settings-wrapper"
        class:below={openBelow}
        style="--overlay-offset: {overlayOffset}px; --shift-x: {shiftX}px; --component-height: {componentHeight}px;"
        bind:this={element}
>
    <div class="settings">
        <header class="settings-head">
            <span class="head-mark"><Icon name="hud" size={12}/></span>
            <div class="head-copy">
                <span class="head-name">{prettyName}</span>
                <span class="head-sub">HUD element</span>
            </div>
            <button type="button" class="close-button" aria-label="Close element settings" onclick={close}>
                <Icon name="x" size={12}/>
            </button>
        </header>

        {#if loading}
            <div class="skeleton">
                <span></span>
                <span></span>
                <span></span>
            </div>
        {:else if failed}
            <div class="state">
                <p>Could not load element settings.</p>
                <button type="button" onclick={loadSettings}>
                    <Icon name="refresh" size={11}/>
                    Retry
                </button>
            </div>
        {:else if configurable}
            <div class="settings-body">
                {#if enabledSetting}
                    <div class="enable-row">
                        <div class="enable-copy">
                            <span class="enable-label">Enabled</span>
                            <span class="enable-hint">Show this element on the HUD</span>
                        </div>
                        <Toggle
                                checked={enabledSetting.value}
                                label="Enabled"
                                small
                                onchange={toggleEnabled}
                        />
                    </div>
                {/if}

                {#if nestedSettings.length > 0}
                    <div class="settings-list">
                        {#each nestedSettings as setting (setting.name)}
                            <ClaudeSetting
                                    setting={setting}
                                    path={path}
                                    onchange={handleChange}
                                    nested
                            />
                        {/each}
                    </div>
                {:else}
                    <p class="empty">This element has no extra options.</p>
                {/if}
            </div>

            <footer class="settings-foot">
                <span class="drag-hint"><Icon name="move" size={10}/> Drag element to move</span>
                {#if saveError}
                    <button type="button" class="save-error" title={saveError} onclick={() => void save()}>
                        Save failed · Retry
                    </button>
                {:else if saving}
                    <span class="saving">Saving…</span>
                {/if}
            </footer>
        {/if}
    </div>
</div>

<style lang="scss">
  .settings-wrapper {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 60;
    width: max-content;
    transform: translateX(calc(-50% + var(--shift-x)))
      translateY(calc(-100% - 12px - var(--overlay-offset)));
    transition: transform .18s ease;

    &.below {
      transform: translateX(calc(-50% + var(--shift-x)))
        translateY(calc(var(--component-height) + 12px + var(--overlay-offset)));
    }
  }

  .settings {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 286px;
    max-height: min(390px, 56vh);
    border: 1px solid var(--claude-border);
    border-radius: 10px;
    background:
      radial-gradient(120% 110% at 0% 0%, color-mix(in srgb, var(--claude-accent) 9%, transparent), transparent 46%),
      color-mix(in srgb, var(--claude-background) 96%, black);
    box-shadow: 0 22px 48px rgba(0, 0, 0, .5), 0 0 26px color-mix(in srgb, var(--claude-accent) 9%, transparent), inset 0 1px 0 rgba(255, 255, 255, .045);
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 14px;
      right: 14px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--claude-accent-line), transparent);
    }
  }

  .settings-head {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 10px 9px 11px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
  }

  .head-mark {
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    flex: none;
    border-radius: 6px;
    color: var(--claude-accent);
    background: color-mix(in srgb, var(--claude-accent) 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--claude-accent) 18%, transparent);
  }

  .head-copy {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .head-name {
    overflow: hidden;
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -.15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .head-sub {
    color: var(--claude-text-muted);
    font-size: 7.5px;
    font-weight: 650;
    letter-spacing: .95px;
    text-transform: uppercase;
  }

  .close-button {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-left: auto;
    padding: 0;
    flex: none;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: color .15s ease, background-color .15s ease, border-color .15s ease;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border);
      background: color-mix(in srgb, var(--claude-text) 5%, transparent);
    }
  }

  .settings-body {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
      width: 3px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: color-mix(in srgb, var(--claude-text) 14%, transparent);
    }
  }

  .enable-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 10px 13px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    background: linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 8%, transparent), transparent 70%);
  }

  .enable-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .enable-label {
    color: var(--claude-text);
    font-size: 11.5px;
    font-weight: 600;
  }

  .enable-hint {
    color: var(--claude-text-muted);
    font-size: 9px;
  }

  .settings-list {
    padding: 2px 9px 4px;

    :global(.setting-row) {
      padding-right: 3px;
      padding-left: 3px;
    }

    :global(.row-label) {
      font-size: 11.5px;
    }

    :global(.text-input) {
      width: 150px;
    }
  }

  .empty {
    margin: 0;
    padding: 14px 13px;
    color: var(--claude-text-muted);
    font-size: 10px;
    font-style: italic;
  }

  .settings-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 27px;
    padding: 6px 12px;
    border-top: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    background: color-mix(in srgb, var(--claude-background) 60%, transparent);
  }

  .drag-hint {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--claude-text-muted);
    font-size: 9px;
    font-weight: 500;

    :global(svg) {
      color: var(--claude-accent);
      opacity: .85;
    }
  }

  .saving {
    color: var(--claude-accent);
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: .3px;
    text-transform: uppercase;
    animation: saving-pulse 1.2s ease-in-out infinite;
  }

  .save-error {
    flex: none;
    padding: 0;
    border: none;
    background: none;
    color: #ff9da5;
    font: inherit;
    font-size: 8.5px;
    font-weight: 650;
    letter-spacing: .3px;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #ffc8cd;
    }
  }

  @keyframes saving-pulse {
    0%, 100% { opacity: .45; }
    50% { opacity: 1; }
  }

  .skeleton {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 13px;

    span {
      height: 9px;
      border-radius: 4px;
      background: linear-gradient(90deg,
        color-mix(in srgb, var(--claude-text) 5%, transparent),
        color-mix(in srgb, var(--claude-text) 9%, transparent),
        color-mix(in srgb, var(--claude-text) 5%, transparent));
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;

      &:nth-child(2) { width: 78%; }
      &:nth-child(3) { width: 56%; }
    }
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  .state {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 9px;
    padding: 14px;

    p {
      margin: 0;
      color: var(--claude-text-dim);
      font-size: 10.5px;
      line-height: 1.4;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 26px;
      padding: 0 10px;
      border: 1px solid var(--claude-accent-line);
      border-radius: 5px;
      background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
      color: var(--claude-text);
      font: inherit;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
    }
  }
</style>
