<script lang="ts">
    import ArmorStatus from "./ArmorStatus.svelte";
    import {listen} from "../../../../integration/ws.js";
    import type {PlayerData} from "../../../../integration/types";
    import {REST_BASE} from "../../../../integration/host";
    import {fly} from "svelte/transition";
    import HealthProgress from "./HealthProgress.svelte";
    import type {TargetChangeEvent} from "../../../../integration/events";
    import Icon from "../../../clickgui/claude/Icon.svelte";

    let target: PlayerData | null = null;
    let visible = true;

    let hideTimeout: ReturnType<typeof setTimeout>;

    function startHideTimeout() {
        hideTimeout = setTimeout(() => {
            visible = false;
        }, 1000);
    }

    $: healthPercent = target ? Math.max(0, Math.min(1, target.actualHealth / Math.max(target.maxHealth, 1))) : 0;

    listen("targetChange", (data: TargetChangeEvent) => {
        target = data.target;
        visible = true;
        clearTimeout(hideTimeout);
        startHideTimeout();
    });

    startHideTimeout();
</script>

{#if visible && target != null}
    <div class="targethud" transition:fly={{ y: -8, duration: 180 }}>
        <div class="topline">
            <span class="eyebrow"><span class="eyebrow-dot"></span> Target</span>
            {#if target.ping !== undefined}
                <span class="ping" class:good={target.ping <= 60} class:okay={target.ping > 60 && target.ping <= 130} class:bad={target.ping > 130}>
                    {target.ping} ms
                </span>
            {/if}
        </div>

        <div class="main-wrapper">
            <div class="avatar">
                <img src="{REST_BASE}/api/v1/client/resource/skin?uuid={target.uuid}" alt="avatar" />
            </div>

            <div class="identity">
                <div class="name-row">
                    <span class="name">{target.username}</span>
                    {#if target.absorption > 0}
                        <span class="absorption">+{Math.ceil(target.absorption)}</span>
                    {/if}
                </div>

                <div class="health-line">
                    <Icon name="heart" size={11}/>
                    <span class="health-value">{Math.ceil(target.actualHealth)}</span>
                    <span class="health-max">/ {Math.ceil(target.maxHealth)}</span>
                    <span class="armor-value"><Icon name="shield" size={10}/> {Math.floor(target.armor)}</span>
                </div>

                <HealthProgress maxHealth={target.maxHealth + target.absorption} health={target.actualHealth + target.absorption} under={healthPercent <= .3}/>
            </div>

            <div class="armor-stats">
                {#if target.armorItems[3].count > 0}
                    <ArmorStatus itemStack={target.armorItems[3]} />
                {/if}
                {#if target.armorItems[2].count > 0}
                    <ArmorStatus itemStack={target.armorItems[2]} />
                {/if}
                {#if target.armorItems[1].count > 0}
                    <ArmorStatus itemStack={target.armorItems[1]} />
                {/if}
                {#if target.armorItems[0].count > 0}
                    <ArmorStatus itemStack={target.armorItems[0]} />
                {/if}
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .targethud {
        position: relative;
        min-width: 238px;
        max-width: 320px;
        border: 1px solid var(--hud-border);
        border-radius: var(--hud-radius);
        background:
          radial-gradient(120% 130% at 0% 0%, color-mix(in srgb, var(--hud-accent) 11%, transparent), transparent 48%),
          var(--hud-surface);
        box-shadow: var(--hud-shadow);
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 12px;
          right: 12px;
          height: 1px;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--hud-accent) 44%, transparent), transparent);
        }
    }

    .topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 7px 11px 0;
    }

    .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--hud-text-muted);
        font-size: 7.5px;
        font-weight: 650;
        letter-spacing: 1.2px;
        text-transform: uppercase;
    }

    .eyebrow-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--hud-accent);
        box-shadow: 0 0 7px var(--hud-accent);
    }

    .ping {
        color: var(--hud-text-muted);
        font-size: 8px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;

        &.good { color: #74d39a; }
        &.okay { color: #e8c96a; }
        &.bad { color: #ef7f8a; }
    }

    .main-wrapper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        padding: 8px 11px 11px;
    }

    .avatar {
        position: relative;
        height: 42px;
        width: 42px;
        border-radius: 7px;
        border: 1px solid color-mix(in srgb, var(--hud-text) 10%, transparent);
        background-image: url("/img/steve.png");
        background-repeat: no-repeat;
        background-size: cover;
        image-rendering: pixelated;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, .3);

        img {
            position: absolute;
            width: 800%;
            left: -100%;
            top: -100%;
        }
    }

    .identity {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .name-row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .name {
        overflow: hidden;
        color: var(--hud-text);
        font-size: 12.5px;
        font-weight: 650;
        letter-spacing: .1px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .absorption {
        flex: none;
        padding: 1px 4px;
        border-radius: 3px;
        color: #e8c96a;
        background: color-mix(in srgb, #e8c96a 12%, transparent);
        font-size: 7.5px;
        font-weight: 700;
        letter-spacing: .3px;
    }

    .health-line {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--hud-text-muted);
        font-size: 8.5px;
        font-variant-numeric: tabular-nums;
        line-height: 1;

        :global(svg) {
            color: #ff7785;
        }
    }

    .health-value {
        color: var(--hud-text-soft);
        font-size: 10px;
        font-weight: 650;
    }

    .health-max {
        color: var(--hud-text-muted);
        font-size: 8.5px;
        font-weight: 500;
    }

    .armor-value {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin-left: auto;

        :global(svg) {
            color: #93bdff;
        }
    }

    .armor-stats {
        display: grid;
        grid-template-columns: repeat(2, 22px);
        gap: 3px;
        padding-left: 4px;
        border-left: 1px solid color-mix(in srgb, var(--hud-text) 6%, transparent);
    }
</style>
