<script lang="ts">
    import Icon from "./Icon.svelte";
    import {claudeTheme, themes, type ClaudeTheme} from "./theme.svelte";

    let {notify} = $props<{
        notify: (message: string, icon?: string) => void;
    }>();

    let accent = $state(claudeTheme.customAccent ?? claudeTheme.current.accent);

    function choose(theme: ClaudeTheme) {
        claudeTheme.select(theme);
        accent = theme.accent;
        notify(`Theme · ${theme.name}`, "theme");
    }

    function setAccent(value: string) {
        if (!/^#[0-9a-f]{6}$/i.test(value)) return;
        accent = value;
        claudeTheme.setAccent(value);
    }

    function resetAccent() {
        claudeTheme.select(claudeTheme.current);
        accent = claudeTheme.current.accent;
        notify("Custom accent reset", "refresh");
    }
</script>

<div class="view">
    <header class="view-head">
        <div>
            <h1>Themes</h1>
            <p>Menu accent and colors</p>
        </div>
        <div class="active-note">
            <span class="dot" style={`background: ${claudeTheme.customAccent ?? claudeTheme.current.accent};`}></span>
            {claudeTheme.current.name}
            {#if claudeTheme.customAccent}<span class="custom-label">custom</span>{/if}
        </div>
    </header>

    <div class="view-scroll">
        <div class="theme-grid">
            {#each themes as theme (theme.id)}
                {@const selected = claudeTheme.current.id === theme.id && !claudeTheme.customAccent}
                <button
                        type="button"
                        class="theme-card"
                        class:selected
                        style={`--card-accent: ${theme.accent}; --card-bg: ${theme.background}; --card-tone: ${theme.card}; --card-glint: ${theme.glint};`}
                        onclick={() => choose(theme)}
                >
                    <span class="palette">
                        <span class="swatch" style={`background: ${theme.background};`}></span>
                        <span class="swatch" style={`background: ${theme.card};`}></span>
                        <span class="swatch" style={`background: ${theme.accent};`}></span>
                        <span class="swatch" style={`background: ${theme.glint};`}></span>
                        <span class="glass" style={`color: ${theme.glint};`}>GLASS</span>
                        {#if selected}
                            <span class="check"><Icon name="check" size={11}/></span>
                        {/if}
                    </span>
                    <span class="theme-copy">
                        <strong>{theme.name}</strong>
                        <span>{theme.description}</span>
                    </span>
                </button>
            {/each}
        </div>

        <section class="custom-card">
            <div class="custom-copy">
                <h2><Icon name="sparkles" size={15}/> Custom accent</h2>
                <p>Override the selected theme's accent without changing its surfaces.</p>
            </div>
            <div class="custom-controls">
                <label class="accent-swatch">
                    <input
                            type="color"
                            value={accent}
                            oninput={(event) => setAccent((event.currentTarget as HTMLInputElement).value)}
                    />
                    <span style={`background: ${accent};`}></span>
                </label>
                <input
                        class="hex-input"
                        type="text"
                        value={accent.toUpperCase()}
                        spellcheck="false"
                        onchange={(event) => setAccent((event.currentTarget as HTMLInputElement).value)}
                />
                {#if claudeTheme.customAccent}
                    <button type="button" class="reset" onclick={resetAccent}>Reset</button>
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
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
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

  .active-note {
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 30px;
    padding: 0 11px;
    border-radius: 999px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    color: var(--claude-text-dim);
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      box-shadow: 0 0 9px currentColor;
    }

    .custom-label {
      color: var(--claude-accent);
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }
  }

  .view-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 19px 8px 8px 1px;
    margin-right: -8px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--claude-text) 13%, transparent) transparent;
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    padding: 0;
    border: 1px solid var(--claude-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--claude-text) 2.3%, var(--claude-card));
    color: inherit;
    font: inherit;
    text-align: left;
    overflow: hidden;
    cursor: pointer;
    transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;

    &:hover {
      border-color: var(--claude-border-strong);
      box-shadow: 0 10px 28px rgba(0, 0, 0, .2);
      transform: translateY(-1px);
    }

    &.selected {
      border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--card-accent) 16%, transparent),
        0 12px 32px color-mix(in srgb, var(--card-accent) 9%, transparent);
    }
  }

  .palette {
    position: relative;
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr .9fr;
    height: 38px;
    margin: 9px 9px 0;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .055);

    .swatch {
      display: block;
      height: 100%;
    }
  }

  .glass {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    padding: 2px 5px;
    border-radius: 3px;
    background: rgba(7, 8, 19, .55);
    font-size: 6px;
    font-weight: 650;
    letter-spacing: .75px;
    backdrop-filter: blur(5px);
  }

  .check {
    position: absolute;
    right: 6px;
    bottom: 5px;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: #fff;
    background: var(--card-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, .38);
  }

  .theme-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 11px 10px;

    strong {
      color: var(--claude-text);
      font-size: 11.5px;
      font-weight: 650;
      letter-spacing: .1px;
    }

    span {
      color: var(--claude-text-muted);
      font-size: 9.5px;
      line-height: 1.3;
    }
  }

  .custom-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    margin-top: 16px;
    padding: 15px 17px;
    border-radius: 10px;
    border: 1px solid var(--claude-border);
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--claude-accent) 5%, transparent), transparent 36%),
      color-mix(in srgb, var(--claude-text) 2.3%, var(--claude-card));
  }

  .custom-copy {
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--claude-text);
      font-size: 12px;
      font-weight: 650;

      :global(svg) {
        color: var(--claude-accent);
      }
    }

    p {
      margin: 5px 0 0;
      color: var(--claude-text-muted);
      font-size: 10px;
    }
  }

  .custom-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }

  .accent-swatch {
    position: relative;
    width: 34px;
    height: 30px;
    border-radius: 6px;
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

  .hex-input {
    width: 92px;
    height: 30px;
    padding: 0 9px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-soft);
    font-family: monospace;
    font-size: 10.5px;
    letter-spacing: .3px;

    &:focus {
      border-color: var(--claude-accent-line);
    }
  }

  .reset {
    height: 30px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--claude-border);
    background: transparent;
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 10px;
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
    }
  }

  @media (max-width: 1040px) {
    .theme-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .theme-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
