<script lang="ts">
    import Toggle from "./Toggle.svelte";
    import Slider from "./Slider.svelte";
    import RangeControl from "./RangeControl.svelte";
    import Select from "./Select.svelte";
    import ColorField from "./ColorField.svelte";
    import BindField from "./BindField.svelte";
    import KeyField from "./KeyField.svelte";
    import Icon from "./Icon.svelte";
    import GenericSetting from "../setting/common/GenericSetting.svelte";
    import ClaudeSetting from "./ClaudeSetting.svelte";
    import type {
        BindSetting,
        BooleanSetting,
        ChoiceSetting,
        ChooseSetting,
        ColorSetting,
        ConfigurableSetting,
        FloatRangeSetting,
        FloatSetting,
        IntRangeSetting,
        IntSetting,
        KeySetting,
        ModuleSetting,
        MultiChooseSetting,
        TextSetting,
        TogglableSetting
    } from "../../../integration/types";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../theme/theme_config";
    import {setItem} from "../../../integration/persistent_storage";

    let {
        setting,
        path,
        onchange,
        nested = false
    } = $props<{
        setting: ModuleSetting;
        path: string;
        onchange: () => void;
        nested?: boolean;
    }>();

    const thisPath = `${path}.${setting.name}`;

    let expanded = $state(localStorage.getItem(`claude.${thisPath}`) === "true");
    let selectError = $state<string | null>(null);

    function toggleExpanded() {
        expanded = !expanded;
        setItem(`claude.${thisPath}`, expanded.toString());
    }

    function pretty(name: string) {
        return $spaceSeperatedNames ? convertToSpacedString(name) : name;
    }

    function commitSetting(next: ModuleSetting = setting) {
        // The setting object itself is mutated in place by the control. Some
        // API models only send the value tree back, so a fresh object keeps
        // the parent array reactive even when a control reassigns a field.
        void next;
        onchange();
    }

    function toggleMulti(choice: string, multi: MultiChooseSetting) {
        if (multi.value.includes(choice)) {
            const next = multi.value.filter(value => value !== choice);
            if (next.length === 0 && !multi.canBeNone) {
                selectError = choice;
                setTimeout(() => selectError = null, 500);
                return;
            }
            multi.value = next;
        } else {
            multi.value = [...multi.value, choice];
        }
        commitSetting();
    }
</script>

{#if setting.valueType === "BOOLEAN"}
    {@const boolean = setting as BooleanSetting}
    <div class="setting-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <Toggle
                    checked={boolean.value}
                    label={pretty(setting.name)}
                    small={nested}
                    onchange={(next) => {
                        boolean.value = next;
                        commitSetting();
                    }}
            />
        </div>
    </div>

{:else if setting.valueType === "INT"}
    {@const number = setting as IntSetting}
    <div class="setting-row has-slider" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <Slider
                    value={number.value}
                    min={number.range.from}
                    max={number.range.to}
                    step={1}
                    integer={true}
                    suffix={number.suffix}
                    oninput={(next) => number.value = next}
                    onchange={() => commitSetting()}
            />
        </div>
    </div>

{:else if setting.valueType === "FLOAT"}
    {@const number = setting as FloatSetting}
    <div class="setting-row has-slider" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <Slider
                    value={number.value}
                    min={number.range.from}
                    max={number.range.to}
                    step={0.01}
                    decimals={2}
                    suffix={number.suffix}
                    oninput={(next) => number.value = next}
                    onchange={() => commitSetting()}
            />
        </div>
    </div>

{:else if setting.valueType === "INT_RANGE"}
    {@const range = setting as IntRangeSetting}
    <div class="setting-row has-slider" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <RangeControl
                    from={range.value.from}
                    to={range.value.to}
                    min={range.range.from}
                    max={range.range.to}
                    step={1}
                    decimals={0}
                    suffix={range.suffix}
                    oninput={(from, to) => range.value = {from, to}}
                    onchange={() => commitSetting()}
            />
        </div>
    </div>

{:else if setting.valueType === "FLOAT_RANGE"}
    {@const range = setting as FloatRangeSetting}
    <div class="setting-row has-slider" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <RangeControl
                    from={range.value.from}
                    to={range.value.to}
                    min={range.range.from}
                    max={range.range.to}
                    step={0.01}
                    decimals={2}
                    suffix={range.suffix}
                    oninput={(from, to) => range.value = {from, to}}
                    onchange={() => commitSetting()}
            />
        </div>
    </div>

{:else if setting.valueType === "CHOOSE"}
    {@const choose = setting as ChooseSetting}
    <div class="setting-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <Select
                    value={choose.value}
                    options={choose.choices}
                    onchange={(value) => {
                        choose.value = value;
                        commitSetting();
                    }}
            />
        </div>
    </div>

{:else if setting.valueType === "CHOICE"}
    {@const choice = setting as ChoiceSetting}
    {@const activeSettings = (choice.choices[choice.active]?.value ?? []) as ModuleSetting[]}
    <div class="setting-row group-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <Select
                    value={choice.active}
                    options={Object.keys(choice.choices)}
                    onchange={(value) => {
                        choice.active = value;
                        commitSetting();
                    }}
            />
            {#if activeSettings.length > 0}
                <button
                        type="button"
                        class="expand-button"
                        class:expanded
                        aria-label="Expand settings"
                        aria-expanded={expanded}
                        onclick={toggleExpanded}
                >
                    <Icon name="chevron-down" size={14}/>
                </button>
            {/if}
        </div>
    </div>
    {#if expanded && activeSettings.length > 0}
        <div class="nested-settings">
            {#each activeSettings as nestedSetting (nestedSetting.name)}
                <ClaudeSetting
                        setting={nestedSetting}
                        path={thisPath}
                        onchange={() => {
                            commitSetting();
                        }}
                        nested={true}
                />
            {/each}
        </div>
    {/if}

{:else if setting.valueType === "TOGGLEABLE"}
    {@const togglable = setting as TogglableSetting}
    {@const enabledSetting = togglable.value[0] as BooleanSetting}
    {@const nestedSettings = togglable.value.slice(1)}
    <div class="setting-row group-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <Toggle
                    checked={enabledSetting.value}
                    label={pretty(setting.name)}
                    small={nested}
                    onchange={(next) => {
                        enabledSetting.value = next;
                        commitSetting();
                    }}
            />
            {#if nestedSettings.length > 0}
                <button
                        type="button"
                        class="expand-button"
                        class:expanded
                        aria-label="Expand settings"
                        aria-expanded={expanded}
                        onclick={toggleExpanded}
                >
                    <Icon name="chevron-down" size={14}/>
                </button>
            {/if}
        </div>
    </div>
    {#if expanded && nestedSettings.length > 0}
        <div class="nested-settings">
            {#each nestedSettings as nestedSetting (nestedSetting.name)}
                <ClaudeSetting
                        setting={nestedSetting}
                        path={thisPath}
                        onchange={commitSetting}
                        nested={true}
                />
            {/each}
        </div>
    {/if}

{:else if setting.valueType === "CONFIGURABLE"}
    {@const configurable = setting as ConfigurableSetting}
    <div class="setting-row group-row" class:nested>
        <button type="button" class="group-toggle" onclick={toggleExpanded}>
            <span class="row-info">
                <span class="row-label">{pretty(setting.name)}</span>
                {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
            </span>
            <span class="group-count">{configurable.value.length} settings</span>
            <span class="expand-button" class:expanded>
                <Icon name="chevron-down" size={14}/>
            </span>
        </button>
    </div>
    {#if expanded}
        <div class="nested-settings">
            {#each configurable.value as nestedSetting (nestedSetting.name)}
                <ClaudeSetting
                        setting={nestedSetting}
                        path={thisPath}
                        onchange={commitSetting}
                        nested={true}
                />
            {/each}
        </div>
    {/if}

{:else if setting.valueType === "MULTI_CHOOSE"}
    {@const multi = setting as MultiChooseSetting}
    <div class="setting-row group-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <span class="group-count">{multi.value.length}/{multi.choices.length}</span>
            <button
                    type="button"
                    class="expand-button"
                    class:expanded
                    aria-label="Expand choices"
                    aria-expanded={expanded}
                    onclick={toggleExpanded}
            >
                <Icon name="chevron-down" size={14}/>
            </button>
        </div>
    </div>
    {#if expanded}
        <div class="choice-chips">
            {#each multi.choices as choice (choice)}
                <button
                        type="button"
                        class="chip"
                        class:active={multi.value.includes(choice)}
                        class:error={selectError === choice}
                        onclick={() => toggleMulti(choice, multi)}
                >
                    {pretty(choice)}
                </button>
            {/each}
        </div>
    {/if}

{:else if setting.valueType === "COLOR"}
    {@const color = setting as ColorSetting}
    <div class="setting-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <ColorField
                    value={color.value}
                    oninput={(next) => color.value = next}
                    onchange={() => commitSetting()}
            />
        </div>
    </div>

{:else if setting.valueType === "TEXT"}
    {@const text = setting as TextSetting}
    <div class="setting-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <input
                    class="text-input"
                    type="text"
                    spellcheck="false"
                    value={text.value}
                    placeholder={pretty(setting.name)}
                    onchange={(event) => {
                        text.value = (event.currentTarget as HTMLInputElement).value;
                        commitSetting();
                    }}
            />
        </div>
    </div>

{:else if setting.valueType === "BIND"}
    {@const bind = setting as BindSetting}
    <div class="setting-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <BindField bind:value={bind.value} onchange={commitSetting}/>
        </div>
    </div>

{:else if setting.valueType === "KEY"}
    {@const key = setting as KeySetting}
    <div class="setting-row" class:nested>
        <div class="row-info">
            <span class="row-label">{pretty(setting.name)}</span>
            {#if setting.description}<span class="row-description">{setting.description}</span>{/if}
        </div>
        <div class="row-control">
            <KeyField bind:value={key.value} onchange={commitSetting}/>
        </div>
    </div>

{:else}
    <div class="delegated" class:nested>
        <GenericSetting {path} bind:setting on:change={commitSetting}/>
    </div>
{/if}

<style lang="scss">
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    min-height: 51px;
    padding: 9px 4px;

    &.nested {
      min-height: 45px;
      padding: 7px 2px;
    }

    .row-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .row-label {
      color: var(--claude-text);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .05px;
    }

    .row-description {
      color: var(--claude-text-muted);
      font-size: 10px;
      line-height: 1.35;
    }

    .row-control {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: none;
      margin-left: auto;
    }

    &.has-slider .row-control {
      flex: 1;
      justify-content: flex-end;
    }
  }

  .setting-row + .setting-row,
  .delegated + .setting-row,
  .setting-row + .delegated {
    border-top: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
  }

  .group-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    padding: 0;

    .row-info {
      flex: 1;
    }

    &:hover .row-label {
      color: var(--claude-accent);
    }
  }

  .group-count {
    color: var(--claude-text-muted);
    font-size: 9.5px;
    white-space: nowrap;
  }

  .expand-button {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--claude-text-muted);
    cursor: pointer;
    transition: color .16s ease, background-color .16s ease;

    :global(svg) {
      transition: transform .2s ease;
      transform: rotate(-90deg);
    }

    &.expanded :global(svg) {
      transform: rotate(0);
    }

    &:hover {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-text) 6%, transparent);
    }
  }

  .nested-settings {
    margin: 0 4px 8px 13px;
    padding-left: 13px;
    border-left: 1px solid color-mix(in srgb, var(--claude-accent) 28%, transparent);

    :global(.setting-row) {
      border-top: 1px solid color-mix(in srgb, var(--claude-text) 4.5%, transparent);
    }

    :global(.setting-row:first-child) {
      border-top: none;
    }
  }

  .choice-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 4px 12px 13px;
    padding: 10px 0 2px 13px;
    border-left: 1px solid color-mix(in srgb, var(--claude-accent) 28%, transparent);
  }

  .chip {
    min-height: 25px;
    padding: 0 9px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 3.5%, transparent);
    color: var(--claude-text-dim);
    font: inherit;
    font-size: 10px;
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
      border-color: var(--claude-border-strong);
    }

    &.active {
      color: var(--claude-accent);
      border-color: var(--claude-accent-line);
      background: color-mix(in srgb, var(--claude-accent) 10%, transparent);
    }

    &.error {
      color: #ff8d96;
      border-color: color-mix(in srgb, #ff5964 45%, transparent);
    }
  }

  .text-input {
    width: 205px;
    height: 30px;
    padding: 0 9px;
    border-radius: 5px;
    border: 1px solid var(--claude-border);
    background: color-mix(in srgb, var(--claude-text) 4%, transparent);
    color: var(--claude-text-soft);
    font: inherit;
    font-size: 10.5px;

    &:focus {
      border-color: var(--claude-accent-line);
    }
  }

  .delegated {
    padding: 3px 6px;

    &:global(.nested) {
      padding: 2px 4px;
    }
  }
</style>
