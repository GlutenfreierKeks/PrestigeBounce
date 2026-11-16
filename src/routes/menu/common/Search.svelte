<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import {escapeLayer} from "../../../integration/escape";

    let value = "";

    const dispatch = createEventDispatcher<{
        search: { query: string }
    }>();

    const layer = escapeLayer(() => {
        value = "";
        dispatch("search", {query: value});
    });
    $: layer.setOpen(value !== "");
</script>

<input class="search" type="text" placeholder="Search…" bind:value={value}
       on:input={() => dispatch("search", {query: value})} spellcheck="false">

<style lang="scss">

  .search {
    background-color: var(--menu-search-background-color);
    border: 1px solid color-mix(in srgb, var(--claude-text) 6%, transparent);
    color: var(--menu-text-color);
    font-family: "Inter", sans-serif;
    font-size: 14px;
    border-radius: 7px;
    background-image: url("/img/menu/icon-search.svg");
    background-repeat: no-repeat;
    background-position: 13px center;
    background-size: 15px;
    padding: 10px 12px 10px 38px;
    flex: 1;
    transition: border-color .16s ease, background-color .16s ease;

    &::placeholder {
      color: color-mix(in srgb, var(--claude-text-muted) 78%, transparent);
    }

    &:focus {
      border-color: color-mix(in srgb, var(--claude-accent) 40%, transparent);
      background-color: color-mix(in srgb, var(--claude-background) 48%, transparent);
    }
  }
</style>
