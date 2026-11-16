<script lang="ts">
    import Icon from "./Icon.svelte";

    let {
        value = $bindable(""),
        placeholder = "Search",
        oninput
    } = $props<{
        value?: string;
        placeholder?: string;
        oninput?: (value: string) => void;
    }>();

    function handleInput(event: Event) {
        const next = (event.currentTarget as HTMLInputElement).value;
        value = next;
        oninput?.(next);
    }
</script>

<label class="search-field">
    <Icon name="search" size={17}/>
    <input
            type="search"
            {placeholder}
            value={value}
            oninput={handleInput}
            spellcheck="false"
            autocomplete="off"
    />
    {#if value}
        <button type="button" class="clear" aria-label="Clear search" onclick={() => {
            value = "";
            oninput?.("");
        }}>
            <Icon name="x" size={13}/>
        </button>
    {/if}
</label>

<style lang="scss">
  .search-field {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 13px;
    border-radius: 9px;
    color: var(--claude-text-muted);
    background: color-mix(in srgb, var(--claude-text) 3%, transparent);
    border: 1px solid var(--claude-border);
    transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease;

    &:focus-within {
      border-color: var(--claude-accent-line);
      background: color-mix(in srgb, var(--claude-text) 4.5%, transparent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--claude-accent) 8%, transparent);
    }

    input {
      flex: 1;
      min-width: 0;
      height: 100%;
      border: none;
      background: transparent;
      color: var(--claude-text);
      font: inherit;
      font-size: 13px;

      &::placeholder {
        color: var(--claude-text-muted);
      }

      &::-webkit-search-cancel-button {
        display: none;
      }
    }
  }

  .clear {
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    border: none;
    border-radius: 50%;
    color: var(--claude-text-dim);
    background: color-mix(in srgb, var(--claude-text) 8%, transparent);
    cursor: pointer;

    &:hover {
      color: var(--claude-text);
      background: color-mix(in srgb, var(--claude-text) 14%, transparent);
    }
  }
</style>
