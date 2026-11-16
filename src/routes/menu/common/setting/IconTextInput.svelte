<script lang="ts">
    export let icon: string;
    export let title: string;
    export let type = "text";
    export let value = "";
    export let maxLength: number | null = null;
    export let pattern: string | null = null;
</script>

<div class="icon-text-input">
    <div class="icon">
        <img src="img/menu/icon-{icon}.svg" alt={icon}>
    </div>
    {#if type === "text"}
        <input {pattern} maxlength={maxLength} class="input" spellcheck="false" type="text" placeholder={title} bind:value={value} autocomplete="off">
    {:else if type === "password"}
        <input {pattern} maxlength={maxLength} class="input" type="password" placeholder={title} bind:value={value} autocomplete="off">
    {/if}
    <div class="button-container">
        <slot />
    </div>
</div>

<style lang="scss">

  .icon-text-input {
    display: grid;
    grid-template-columns: max-content 1fr max-content;
  }

  .icon {
    height: 44px;
    width: 44px;
    background-color: var(--menu-input-icon-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px 0 0 8px;

    img {
      width: 16px;
      height: 16px;
      opacity: .8;
    }
  }

  .input {
    color: var(--menu-text-color);
    font-family: "Inter", sans-serif;
    font-size: 14px;
    background-color: var(--menu-input-background-color);
    border: none;
    padding: 0 14px;
    border-radius: 0 8px 8px 0;
    border-left: 1px solid var(--menu-input-divider-color);
    width: 100%;
    height: 44px;

    &:invalid {
      border: 1px solid var(--menu-input-error-border-color);
    }
  }

  .button-container {
    display: flex;
    align-items: center;
  }
</style>
