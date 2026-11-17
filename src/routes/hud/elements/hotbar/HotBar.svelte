<script lang="ts">
    import Status from "./Status.svelte";
    import {listen} from "../../../../integration/ws";
    import type {PlayerData, TextComponent as TTExtComponent} from "../../../../integration/types";
    import {onMount} from "svelte";
    import {getPlayerData} from "../../../../integration/rest";
    import {fade, fly} from "svelte/transition";
    import TextComponent from "../../../menu/common/TextComponent.svelte";
    import type {ClientPlayerDataEvent, OverlayMessageEvent} from "../../../../integration/events";

    let lastSlot = 0;
    let currentSlot = 0;
    let playerData: PlayerData | null = null;
    let maxAbsorption = 0;
    let slotsElement: HTMLElement | undefined;

    let showItemStackName = false;
    let showItemStackNameTimeout: ReturnType<typeof setTimeout> | null = null;
    let itemStackName: TTExtComponent | string | null = null;
    let overlayMessage: OverlayMessageEvent | null = null;
    let overlayMessageTimeout: ReturnType<typeof setTimeout> | null = null;

    function updatePlayerData(s: PlayerData) {
        playerData = s;
        if (playerData.absorption <= 0) {
            maxAbsorption = 0;
        }
        if (playerData.absorption > maxAbsorption) {
            maxAbsorption = playerData.absorption;
        }
        currentSlot = playerData.selectedSlot;
        if (currentSlot !== lastSlot) {
            lastSlot = currentSlot;
            if (playerData.mainHandStack.identifier !== "minecraft:air") {
                itemStackName = playerData.mainHandStack.displayName;
                if (showItemStackNameTimeout !== null) {
                    clearTimeout(showItemStackNameTimeout);
                }
                showItemStackName = true;
                showItemStackNameTimeout = setTimeout(() => {
                    showItemStackName = false;
                }, 2000);
            }
        }
    }

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        updatePlayerData(event.playerData);
    });

    listen("overlayMessage", (event: OverlayMessageEvent) => {
        overlayMessage = event;
        if (overlayMessageTimeout !== null) {
            clearTimeout(overlayMessageTimeout);
        }
        overlayMessageTimeout = setTimeout(() => {
            overlayMessage = null;
        }, 3000)
    });

    onMount(async () => {
        updatePlayerData(await getPlayerData());
    });
</script>

{#if playerData && playerData.gameMode !== "spectator"}
    <div class="hotbar">
        {#if overlayMessage !== null}
            <div class="overlay-message" in:fly={{y: 6, duration: 180}} out:fade={{duration: 200}}
                 style="max-width: {slotsElement?.offsetWidth ?? 0}px">
                <TextComponent fontSize={13} textComponent={overlayMessage.text} allowPreformatting={true} />
            </div>
        {/if}
        {#if showItemStackName && itemStackName !== null}
            <div class="item-name" in:fly={{y: -5, duration: 180}} out:fade={{duration: 200}}>
                <TextComponent fontSize={12} textComponent={itemStackName}/>
            </div>
        {/if}
        <div class="status">

            <div class="pair">
                {#if playerData.armor > 0}
                    <Status
                            max={20}
                            value={playerData.armor}
                            color="var(--hotbar-armor-color)"
                            alignRight={false}
                            icon="shield"
                    />
                {:else}
                    <div></div>
                {/if}

                {#if playerData.air < playerData.maxAir}
                    <Status
                            max={playerData.maxAir}
                            value={playerData.air}
                            color="var(--hotbar-air-color)"
                            alignRight={true}
                    />
                {:else}
                    <div></div>
                {/if}
            </div>

            {#if playerData.gameMode !== "creative"}
                {#if playerData.absorption > 0}
                    <div class="pair">
                        <Status
                                max={maxAbsorption}
                                value={playerData.absorption}
                                color="var(--hotbar-absorption-color)"
                                alignRight={false}
                        />

                        <div></div>
                    </div>
                {/if}
                <div class="pair">
                    <Status
                            max={playerData.maxHealth}
                            value={playerData.health}
                            color="var(--hotbar-health-color)"
                            alignRight={false}
                            icon="heart"
                    />
                    <Status
                            max={20}
                            value={playerData.food}
                            color="var(--hotbar-hunger-color)"
                            alignRight={true}
                            icon="food"
                    />
                </div>
            {/if}
            {#if playerData.experienceLevel > 0}
                <Status
                        max={100} value={playerData.experienceProgress * 100}
                        color="var(--hotbar-experience-color)"
                        alignRight={false}
                        label={playerData.experienceLevel.toString()}
                />
            {/if}

        </div>

        <div class="hotbar-elements">
            <div class="slider" style="left: {currentSlot * 45}px"></div>
            <div class="slots" bind:this={slotsElement}>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
            </div>
        </div>

        {#if playerData?.offHandStack.identifier !== "minecraft:air"}
            <div class="offhand-slot" transition:fade={{duration: 180}}></div>
        {/if}
    </div>
{/if}

<style lang="scss">

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 20px;
  }

  .status {
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    row-gap: 4px;
    column-gap: 20px;
    width: 405px;
  }

  .hotbar-elements {
    position: relative;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--hud-text) 4%, transparent), transparent 30%),
      var(--hud-surface);
    box-shadow: var(--hud-shadow);
    overflow: hidden;

    .slider {
      position: absolute;
      top: 0;
      left: 0;
      width: 45px;
      height: 45px;
      border: 1.5px solid var(--hud-accent);
      border-radius: 7px;
      background: color-mix(in srgb, var(--hud-accent) 10%, transparent);
      box-shadow:
        inset 0 0 16px color-mix(in srgb, var(--hud-accent) 13%, transparent),
        0 0 12px color-mix(in srgb, var(--hud-accent) 20%, transparent);
      z-index: 1;
      pointer-events: none;
      transition: left .22s cubic-bezier(.25, .8, .3, 1);
      animation: slider-pulse 3.4s ease-in-out infinite;
    }

    .slots {
      display: flex;
      width: max-content;
    }

    .slot {
      height: 45px;
      width: 45px;

      & + .slot {
        border-left: 1px solid color-mix(in srgb, var(--hud-text) 3.5%, transparent);
      }
    }
  }

  .offhand-slot {
    height: 45px;
    width: 45px;
    border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius);
    background: var(--hud-surface);
    box-shadow: 0 8px 20px rgba(0, 0, 0, .25);
    position: absolute;
    bottom: 0;
    left: -65px;
  }

  .item-name {
    color: var(--hud-text);
    font-size: 12px;
    margin: 0 auto 10px;
    font-weight: 600;
    background: var(--hud-surface-strong);
    border: 1px solid var(--hud-border);
    padding: 4px 9px;
    border-radius: 6px;
    width: max-content;
    box-shadow: 0 8px 20px rgba(0, 0, 0, .3);
  }

  .overlay-message {
    text-align: center;
    color: var(--hud-text);
    font-weight: 600;
    margin-bottom: 10px;
    overflow: hidden;
    text-shadow: 0 2px 10px rgba(0, 0, 0, .6);
  }

  @keyframes slider-pulse {
    0%, 100% {
      box-shadow:
        inset 0 0 16px color-mix(in srgb, var(--hud-accent) 13%, transparent),
        0 0 12px color-mix(in srgb, var(--hud-accent) 20%, transparent);
    }
    50% {
      box-shadow:
        inset 0 0 18px color-mix(in srgb, var(--hud-accent) 20%, transparent),
        0 0 18px color-mix(in srgb, var(--hud-accent) 32%, transparent);
    }
  }
</style>
