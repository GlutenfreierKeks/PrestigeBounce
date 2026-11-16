<script lang="ts">
    export let maxHealth: number;
    export let health: number;
    export let under = false;

    $: width = Math.max(0, Math.min(100, Math.ceil(health / Math.max(maxHealth, 1) * 100)));
</script>

<div class="health-progress" class:under>
    <div class="thumb" style="width: {width}%;"></div>
</div>

<style lang="scss">
    .health-progress {
        position: relative;
        height: 4px;
        margin-top: 1px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--hud-text) 8%, transparent);
        overflow: hidden;
    }

    .thumb {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #ff8a95, #ff5364);
        box-shadow: 0 0 8px color-mix(in srgb, #ff5364 42%, transparent);
        transition: width .35s cubic-bezier(.25, .8, .3, 1), background-color .2s ease;
    }

    .under .thumb {
        background: linear-gradient(90deg, #ffb36b, #ff5364);
        animation: health-pulse 1.4s ease-in-out infinite;
    }

    @keyframes health-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .72; }
    }
</style>
