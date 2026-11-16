<script lang="ts">
    import Icon from "./Icon.svelte";
    import Toggle from "./Toggle.svelte";
    import type {Module} from "../../../integration/types";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../theme/theme_config";

    let {
        module,
        view = "list",
        onToggle,
        onOpen
    } = $props<{
        module: Module;
        view?: "list" | "grid";
        onToggle: (name: string, enabled: boolean) => void;
        onOpen: (module: Module) => void;
    }>();

    const title = $derived($spaceSeperatedNames ? convertToSpacedString(module.name) : module.name);
</script>

<div
        class="module-card {view}"
        class:enabled={module.enabled}
        role="button"
        tabindex="0"
        onclick={() => onOpen(module)}
        onkeydown={(event) => {
            if (event.key === "Enter" || event.key === " ") onOpen(module);
        }}
>
    <div class="module-main">
        <h3>{title}</h3>
        <p>{module.description}</p>
    </div>

    <button
            type="button"
            class="open"
            aria-label={`Open ${title} settings`}
            onclick={(event) => {
                event.stopPropagation();
                onOpen(module);
            }}
    >
        <Icon name="chevron-right" size={14}/>
    </button>

    <Toggle
            checked={module.enabled}
            label={`Toggle ${title}`}
            small={view === "grid"}
            onchange={(next) => onToggle(module.name, next)}
    />
</div>

<style lang="scss">
  .module-card {
    position: relative;
    display: grid;
    align-items: center;
    border: 1px solid var(--claude-border);
    border-radius: 9px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--claude-text) 2.6%, transparent), transparent);
    cursor: pointer;
    transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease;
    outline: none;

    &:hover {
      border-color: var(--claude-border-strong);
      background: color-mix(in srgb, var(--claude-text) 3.6%, var(--claude-card));
      box-shadow: 0 10px 28px rgba(0, 0, 0, .18);
    }

    &:focus-visible {
      border-color: var(--claude-accent-line);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-accent) 10%, transparent);
    }

    &.enabled {
      border-color: color-mix(in srgb, var(--claude-accent) 24%, var(--claude-border));
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 5%, transparent), transparent 42%),
        color-mix(in srgb, var(--claude-text) 2.6%, var(--claude-card));
    }

    h3 {
      margin: 0;
      color: var(--claude-text);
      font-size: 14px;
      font-weight: 650;
      letter-spacing: .05px;
    }

    p {
      margin: 3px 0 0;
      color: var(--claude-text-muted);
      font-size: 11px;
      line-height: 1.4;
    }
  }

  .module-card.list {
    grid-template-columns: minmax(0, 1fr) 24px auto;
    gap: 16px;
    min-height: 60px;
    padding: 10px 17px 10px 20px;

    .module-main {
      min-width: 0;
    }

    p {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .open {
      justify-self: end;
    }
  }

  .module-card.grid {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "main toggle"
      "open open";
    align-items: start;
    min-height: 138px;
    padding: 16px 16px 13px;

    .module-main {
      grid-area: main;
      min-width: 0;
      padding-right: 8px;
    }

    p {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    :global(.toggle) {
      grid-area: toggle;
      margin-top: 1px;
    }

    .open {
      grid-area: open;
    }

    .open {
      align-self: end;
      justify-self: end;
      width: 26px;
      height: 26px;
    }
  }

  .open {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: color .16s ease, background-color .16s ease;

    &:hover {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
    }
  }
</style>
