<script lang="ts">
    import {createEventDispatcher} from "svelte";

    export let value: boolean;
    export let title: string;

    const dispatch = createEventDispatcher();
</script>

<label class="switch-setting">
    <span class="switch">
        <input type="checkbox" bind:checked={value} on:change={() => dispatch("change")}/>
        <span class="slider"></span>
    </span>

    <span class="title">{title}</span>
</label>

<style lang="scss">

  .switch-setting {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .title {
    color: var(--menu-text-color);
    font-size: 15px;
    margin-left: 9px;
    font-weight: 500;
    white-space: nowrap;
  }

  .slider {
    position: absolute;
    inset: 0;
    background-color: var(--menu-switch-track-color);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--claude-text) 12%, transparent);
    transition: ease background-color .25s, box-shadow .25s;
    border-radius: 999px;

    &::before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      top: 2px;
      left: 2px;
      background-color: var(--menu-switch-thumb-color);
      transition: ease transform .25s, ease background-color .25s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, .35);
    }
  }

  .switch {
    position: relative;
    display: block;
    flex: none;
    width: 32px;
    height: 18px;
    margin: 0 2px;

    input {
      display: none;
    }

    input:checked + .slider {
      background-color: var(--menu-switch-track-active-color);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--claude-accent) 45%, transparent);
    }

    input:checked + .slider::before {
      transform: translateX(14px);
      background-color: var(--menu-switch-thumb-active-color);
    }
  }
</style>
