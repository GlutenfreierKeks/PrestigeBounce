<script lang="ts">
    import {onMount} from "svelte";

    import Hud from "../../../hud/Hud.svelte";
    import {getGameWindow, setHudEditorSelected} from "../../../../integration/rest";
    import {
        HORIZONTAL_ANCHOR_ZONES,
        HUD_EDITOR_GRID_SIZE,
        type HudEditorDragState,
        VERTICAL_ANCHOR_ZONES
    } from "./constants";
    import ComponentDrawer from "./drawer/ComponentDrawer.svelte";
    import {darken} from "../../clickgui_store";
    import {listen} from "../../../../integration/ws";
    import type {ScaleFactorChangeEvent} from "../../../../integration/events";
    import Icon from "../../claude/Icon.svelte";

    export let ondone: (() => void) | undefined = undefined;

    let dragState: HudEditorDragState | undefined;
    let scaleFactor = 2;
    let showGrid = true;
    let selectedComponentId: string | null = null;

    function handleDragStateChange(state: HudEditorDragState): void {
        dragState = state.dragging ? state : undefined;
    }

    function selectComponent(id: string): void {
        selectedComponentId = id;
    }

    function clearSelection(): void {
        selectedComponentId = null;
    }

    function handleWindowMouseDown(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }

        if (target.closest(".draggable-element, .component-drawer, .editor-chrome, .editor-footer")) {
            return;
        }

        selectedComponentId = null;
    }

    function toClientCoordinate(hudCoordinate: number): number {
        return hudCoordinate * scaleFactor / 2;
    }

    onMount(() => {
        getGameWindow().then(gameWindow => {
            scaleFactor = gameWindow.scaleFactor;
        });

        $darken = false;
        setHudEditorSelected(true);

        return () => {
            $darken = true;
            setHudEditorSelected(false);
        };
    });

    listen("scaleFactorChange", (event: ScaleFactorChangeEvent) => {
        scaleFactor = event.scaleFactor;
    });
</script>

<svelte:window on:mousedown={handleWindowMouseDown}/>

<div
        class="hud-editor"
        class:grid={showGrid}
        class:highlight-grid={showGrid && dragState !== undefined}
        style="--grid-size: {HUD_EDITOR_GRID_SIZE}px;"
>
    {#if dragState}
        <div class="anchor-zones">
            {#each VERTICAL_ANCHOR_ZONES as verticalZone}
                {#each HORIZONTAL_ANCHOR_ZONES as horizontalZone}
                    <div
                            class="anchor-zone"
                            class:active={dragState.verticalZone === verticalZone &&
                                dragState.horizontalZone === horizontalZone}
                    >
                        <div class="anchor-point horizontal-{horizontalZone} vertical-{verticalZone}"></div>
                    </div>
                {/each}
            {/each}
        </div>

        {#if dragState.verticalGuide !== undefined}
            <div class="magnetic-guide vertical" style="left: {toClientCoordinate(dragState.verticalGuide)}px"></div>
        {/if}
        {#if dragState.horizontalGuide !== undefined}
            <div class="magnetic-guide horizontal" style="top: {toClientCoordinate(dragState.horizontalGuide)}px"></div>
        {/if}
    {/if}

    <Hud
            inEditor
            selectedComponentId={selectedComponentId}
            onSelectComponent={selectComponent}
            onDeselectComponent={clearSelection}
            onDragStateChange={handleDragStateChange}
            magneticTargetIds={dragState?.magneticTargetIds ?? []}
    />

    <header class="editor-chrome">
        <div class="editor-brand">
            <span class="brand-mark"><Icon name="hud" size={15}/></span>
            <div class="brand-copy">
                <div class="brand-title">HUD Editor</div>
                <div class="brand-subtitle">
                    {selectedComponentId ? "Element selected" : "Arrange your overlay"}
                </div>
            </div>
        </div>

        <div class="editor-actions">
            <button
                    type="button"
                    class="chrome-button"
                    class:active={showGrid}
                    title="Toggle alignment grid"
                    aria-pressed={showGrid}
                    onclick={() => showGrid = !showGrid}
            >
                <Icon name="grid" size={14}/>
                <span>Grid</span>
            </button>

            <ComponentDrawer/>

            <span class="toolbar-divider"></span>

            <button type="button" class="done-button" onclick={() => ondone?.()}>
                <Icon name="check" size={13}/>
                Done
            </button>
        </div>
    </header>

    <footer class="editor-footer">
        <span class="hint"><Icon name="move" size={11}/> Drag to move</span>
        <span class="hint"><Icon name="settings" size={11}/> Click to configure</span>
        <span class="hint"><Icon name="grid" size={11}/> Hold Shift to ignore snapping</span>
        <span class="footer-brand">Claude <em>HUD</em></span>
    </footer>
</div>

<style lang="scss">
  .hud-editor {
    position: absolute;
    inset: 0;
    overflow: hidden;

    &.grid {
      background-image:
        linear-gradient(to right, color-mix(in srgb, var(--claude-text) 4%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--claude-text) 4%, transparent) 1px, transparent 1px),
        radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--claude-accent) 5%, transparent), transparent 60%);
      background-size: var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size), 100% 100%;
    }

    &.highlight-grid {
      background-image:
        linear-gradient(to right, color-mix(in srgb, var(--claude-accent) 13%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--claude-accent) 13%, transparent) 1px, transparent 1px),
        radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--claude-accent) 7%, transparent), transparent 60%);
      background-size: var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size), 100% 100%;
    }
  }

  .editor-chrome {
    position: absolute;
    top: 16px;
    left: 50%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    width: min(760px, calc(100vw - 32px));
    min-height: 54px;
    padding: 8px 9px 8px 12px;
    border: 1px solid var(--claude-border);
    border-radius: 12px;
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--claude-accent) 7%, transparent), transparent 38%),
      color-mix(in srgb, var(--claude-background) 93%, black);
    box-shadow: 0 20px 44px rgba(0, 0, 0, .45), 0 0 28px color-mix(in srgb, var(--claude-accent) 7%, transparent), inset 0 1px 0 rgba(255, 255, 255, .05);
    transform: translateX(-50%);
    backdrop-filter: blur(10px);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 22px;
      width: 84px;
      height: 1px;
      background: linear-gradient(90deg, var(--claude-accent), transparent);
      opacity: .8;
    }
  }

  .editor-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 33px;
    height: 33px;
    flex: none;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 28%, transparent);
    background:
      radial-gradient(120% 120% at 20% 10%, color-mix(in srgb, var(--claude-accent) 28%, transparent), transparent 65%),
      color-mix(in srgb, var(--claude-card) 82%, transparent);
    color: var(--claude-glint);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 0 16px color-mix(in srgb, var(--claude-accent) 12%, transparent);
  }

  .brand-copy {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .brand-title {
    color: var(--claude-text);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -.2px;
    line-height: 1.15;
  }

  .brand-subtitle {
    overflow: hidden;
    color: var(--claude-text-muted);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: .7px;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .editor-actions {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: none;
  }

  .chrome-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 31px;
    padding: 0 10px;
    border: 1px solid var(--claude-border);
    border-radius: 7px;
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .15px;
    cursor: pointer;
    transition: color .16s ease, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
    }

    &.active {
      color: var(--claude-accent);
      border-color: color-mix(in srgb, var(--claude-accent) 34%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 9%, transparent);
      box-shadow: inset 0 0 14px color-mix(in srgb, var(--claude-accent) 6%, transparent);
    }
  }

  .toolbar-divider {
    width: 1px;
    height: 22px;
    margin: 0 2px;
    background: color-mix(in srgb, var(--claude-text) 8%, transparent);
  }

  .done-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 31px;
    padding: 0 14px;
    border: 1px solid color-mix(in srgb, var(--claude-accent) 46%, transparent);
    border-radius: 7px;
    background:
      linear-gradient(165deg, color-mix(in srgb, var(--claude-accent) 82%, white 5%), color-mix(in srgb, var(--claude-accent) 52%, #1a1438));
    color: #fff;
    font: inherit;
    font-size: 10.5px;
    font-weight: 650;
    letter-spacing: .15px;
    cursor: pointer;
    box-shadow: 0 7px 18px color-mix(in srgb, var(--claude-accent) 24%, transparent), inset 0 1px 0 rgba(255, 255, 255, .18);
    transition: filter .16s ease, box-shadow .16s ease, transform .1s ease;

    &:hover {
      filter: brightness(1.08);
      box-shadow: 0 9px 22px color-mix(in srgb, var(--claude-accent) 32%, transparent), inset 0 1px 0 rgba(255, 255, 255, .22);
    }

    &:active {
      transform: translateY(1px);
    }
  }

  .editor-footer {
    position: absolute;
    left: 50%;
    bottom: 15px;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid var(--claude-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--claude-background) 88%, transparent);
    box-shadow: 0 12px 28px rgba(0, 0, 0, .32);
    transform: translateX(-50%);
    backdrop-filter: blur(8px);
    white-space: nowrap;
  }

  .hint {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--claude-text-muted);
    font-size: 8.5px;
    font-weight: 550;
    letter-spacing: .15px;

    :global(svg) {
      color: color-mix(in srgb, var(--claude-accent) 78%, transparent);
    }
  }

  .footer-brand {
    margin-left: 4px;
    padding-left: 12px;
    border-left: 1px solid color-mix(in srgb, var(--claude-text) 8%, transparent);
    color: var(--claude-text-dim);
    font-family: "Playfair Display", Georgia, serif;
    font-size: 11px;
    font-weight: 600;
    font-style: italic;
    letter-spacing: -.1px;

    em {
      color: var(--claude-text-muted);
      font-family: "Inter", sans-serif;
      font-size: 7px;
      font-style: normal;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  }

  .anchor-zones {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    pointer-events: none;
  }

  .anchor-zone {
    position: relative;
    border: 1px solid color-mix(in srgb, var(--claude-text) 4%, transparent);
    background: color-mix(in srgb, var(--claude-text) 1%, transparent);
    transition: background-color .12s ease, border-color .12s ease;

    &.active {
      border-color: color-mix(in srgb, var(--claude-accent) 32%, transparent);
      background: color-mix(in srgb, var(--claude-accent) 5%, transparent);

      .anchor-point {
        width: 12px;
        height: 12px;
        opacity: 1;
        background: var(--claude-accent);
        box-shadow: 0 0 12px color-mix(in srgb, var(--claude-accent) 65%, transparent);

        &::after {
          opacity: 1;
          transform: scale(1);
        }
      }
    }
  }

  .anchor-point {
    --translate-x: -50%;
    --translate-y: -50%;

    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    opacity: .4;
    background: color-mix(in srgb, var(--claude-text) 30%, transparent);
    transform: translate(var(--translate-x), var(--translate-y));
    transition: width 120ms ease, height 120ms ease, opacity 120ms ease, box-shadow 120ms ease;

    &::after {
      content: "";
      position: absolute;
      inset: -5px;
      border: 1px solid color-mix(in srgb, var(--claude-accent) 60%, transparent);
      border-radius: 50%;
      opacity: 0;
      transform: scale(.6);
      transition: opacity 120ms ease, transform 120ms ease;
    }

    &.horizontal-left {
      left: 0;
      --translate-x: 0;
    }

    &.horizontal-center {
      left: 50%;
    }

    &.horizontal-right {
      left: 100%;
      --translate-x: -100%;
    }

    &.vertical-upper {
      top: 0;
      --translate-y: 0;
    }

    &.vertical-center {
      top: 50%;
    }

    &.vertical-lower {
      top: 100%;
      --translate-y: -100%;
    }
  }

  .magnetic-guide {
    position: absolute;
    z-index: 2;
    pointer-events: none;
    background: color-mix(in srgb, var(--claude-accent) 58%, transparent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--claude-accent) 45%, transparent);

    &.vertical {
      top: 0;
      bottom: 0;
      width: 1px;
      transform: translateX(-50%);
    }

    &.horizontal {
      right: 0;
      left: 0;
      height: 1px;
      transform: translateY(-50%);
    }
  }

  @media (max-width: 640px) {
    .editor-chrome {
      gap: 10px;
      width: calc(100vw - 20px);
      top: 10px;
    }

    .chrome-button span {
      display: none;
    }

    .brand-subtitle,
    .editor-footer .hint:nth-child(3),
    .footer-brand {
      display: none;
    }
  }
</style>
