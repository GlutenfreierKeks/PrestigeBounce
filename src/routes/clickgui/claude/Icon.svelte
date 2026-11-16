<script lang="ts">
    let {
        name,
        size = 18,
        strokeWidth = 1.8,
        class: className = ""
    } = $props<{
        name: string;
        size?: number;
        strokeWidth?: number;
        class?: string;
    }>();
</script>

<svg
        class={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
>
    {#if name === "crown"}
        <path d="M2.8 8.2 7 11.7l5-7 5 7 4.2-3.5-1.9 10.3H4.7L2.8 8.2Z" fill="currentColor" stroke="none"/>
    {:else if name === "combat"}
        <circle cx="13.5" cy="4.5" r="2"/>
        <path d="m9 20 2.4-5.2L8 12.5l1.3-4.2 4.4-1.1 3 3 2.8 1.2"/>
        <path d="m13.4 9.8-1.8 3.2 4.1 2.3L17.5 20"/>
        <path d="M8.1 8.3 4.5 10l-1.3 4.1"/>
    {:else if name === "mace"}
        <path d="m14.5 4.5 5 5-2.6 2.6a3.5 3.5 0 0 1-5 0l-.1-.1a3.5 3.5 0 0 1 0-5z"/>
        <path d="m12.2 11.4-7.7 7.7a1.5 1.5 0 0 0 2.1 2.1l7.7-7.7"/>
        <path d="m16.8 7.2 4.4-4.4M13.9 4.3l-1.1-1.1M20 10.7l1.1 1.1"/>
    {:else if name === "misc"}
        <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.7L3.4 17.3a2 2 0 1 0 2.8 2.8l5.3-5.3a4.5 4.5 0 0 0 5.7-6l-2.5 2.5-2.3-.4-.4-2.3z"/>
    {:else if name === "movement"}
        <circle cx="12" cy="4.3" r="2.1"/>
        <path d="M12 6.4v6.2"/>
        <path d="m8.4 9.2 3.6-1.2 3.6 1.2"/>
        <path d="m8.6 21 3.4-5 3.4 5"/>
        <path d="m12 12.6-2.1-1.5M12 12.6l2.1-1.5"/>
    {:else if name === "spear"}
        <path d="M4 20 19 5"/>
        <path d="m14 4 6-1-1 6-5-5Z"/>
        <path d="m5.5 16.5 2 2"/>
        <path d="m7.5 14.5 2 2"/>
    {:else if name === "visual"}
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/>
        <circle cx="12" cy="12" r="3"/>
    {:else if name === "settings"}
        <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3"/>
        <circle cx="15" cy="6" r="2"/>
        <circle cx="9" cy="12" r="2"/>
        <circle cx="15" cy="18" r="2"/>
    {:else if name === "theme"}
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 2 2 0 0 1 1.5-3.3H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/>
        <circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none"/>
        <circle cx="10.5" cy="6.8" r="1" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="7.3" r="1" fill="currentColor" stroke="none"/>
        <circle cx="17.4" cy="10.2" r="1" fill="currentColor" stroke="none"/>
    {:else if name === "configs"}
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3l2 2h8A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/>
    {:else if name === "socials"}
        <circle cx="9" cy="8" r="3"/>
        <path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5"/>
        <circle cx="17.5" cy="9" r="2.2"/>
        <path d="M16.3 14.2c2.2.1 3.7 1.7 4.1 4.3"/>
    {:else if name === "keybinds"}
        <rect x="2.5" y="6" width="19" height="12" rx="2.5"/>
        <path d="M6 10h.01M9.3 10h.01M12.6 10h.01M15.9 10h.01M18.5 10h.01M7.5 14h9"/>
    {:else if name === "marketplace"}
        <path d="M5 8h14l1 12H4L5 8Z"/>
        <path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/>
    {:else if name === "hud"}
        <rect x="3" y="3.5" width="18" height="17" rx="2.5"/>
        <path d="M3 9h18M9 9v11.5"/>
    {:else if name === "search"}
        <circle cx="10.8" cy="10.8" r="6.3"/>
        <path d="m16 16 4.2 4.2"/>
    {:else if name === "list"}
        <path d="M8 6h13M8 12h13M8 18h13"/>
        <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>
    {:else if name === "grid"}
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/>
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/>
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/>
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>
    {:else if name === "chevron-right"}
        <path d="m9 5 7 7-7 7"/>
    {:else if name === "chevron-left"}
        <path d="m15 5-7 7 7 7"/>
    {:else if name === "chevron-down"}
        <path d="m5 9 7 7 7-7"/>
    {:else if name === "x"}
        <path d="M6 6l12 12M18 6 6 18"/>
    {:else if name === "check"}
        <path d="m4.5 12.5 5 5 10-11"/>
    {:else if name === "plus"}
        <path d="M12 5v14M5 12h14"/>
    {:else if name === "download"}
        <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
    {:else if name === "upload"}
        <path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>
    {:else if name === "edit"}
        <path d="m4 16.5-.8 4.3 4.3-.8L19.3 8.2a2.1 2.1 0 0 0-3-3L4 16.5Z"/>
        <path d="m13.8 6.7 3.5 3.5"/>
    {:else if name === "trash"}
        <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>
        <path d="M10 11v5M14 11v5"/>
    {:else if name === "tag"}
        <path d="M3.5 3.5h7.2L21 13.8 13.8 21 3.5 10.7V3.5Z"/>
        <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/>
    {:else if name === "sparkles"}
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" fill="currentColor" stroke="none"/>
        <path d="m18.5 14 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" fill="currentColor" stroke="none"/>
        <path d="m5 14 .7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z" fill="currentColor" stroke="none"/>
    {:else if name === "globe"}
        <circle cx="12" cy="12" r="9"/>
        <path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>
    {:else if name === "clock"}
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 2"/>
    {:else if name === "shield"}
        <path d="M12 3 20 6v5.5c0 4.7-3.3 7.9-8 9.5-4.7-1.6-8-4.8-8-9.5V6l8-3Z"/>
        <path d="m8.5 12 2.3 2.3 4.7-4.6"/>
    {:else if name === "box"}
        <path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z"/>
        <path d="m4 7 8 4 8-4M12 11v10"/>
    {:else if name === "filter"}
        <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>
    {:else if name === "refresh"}
        <path d="M20 7v5h-5M4 17v-5h5"/>
        <path d="M6.1 8.3A7.5 7.5 0 0 1 19.8 11M4.2 13A7.5 7.5 0 0 0 17.9 15.7"/>
    {:else if name === "arrow-left"}
        <path d="m10 5-7 7 7 7M3 12h18"/>
    {:else if name === "dots"}
        <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
        <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    {:else if name === "lock"}
        <rect x="4.5" y="10" width="15" height="10" rx="2"/>
        <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    {:else if name === "eye-off"}
        <path d="M3 3l18 18"/>
        <path d="M10.6 6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.1 9.5 6.1a16 16 0 0 1-3.2 3.9M6.5 6.9A16.6 16.6 0 0 0 2.5 12S6 18.1 12 18.1c1.4 0 2.7-.3 3.8-.8"/>
        <path d="M10.1 10.1a2.7 2.7 0 0 0 3.8 3.8"/>
    {:else if name === "server"}
        <rect x="3" y="4" width="18" height="6" rx="1.6"/>
        <rect x="3" y="14" width="18" height="6" rx="1.6"/>
        <path d="M7 7h.01M7 17h.01"/>
    {:else if name === "sword"}
        <path d="M14 4 20 3l-1 6-8.5 8.5-4-4L14 4Z"/>
        <path d="m6.5 13.5-3 3 4 4 3-3M4 20l2-2"/>
    {:else if name === "heart"}
        <path d="M12 20.4S3.6 15.5 3.6 9.4A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.4 3.2c0 6.1-8.4 11-8.4 11Z"/>
    {:else if name === "activity"}
        <path d="M3 12h3.4l2.2-6.5 4.2 13 2.4-6.5H21"/>
    {:else if name === "wifi"}
        <path d="M4.2 9.4a12.4 12.4 0 0 1 15.6 0"/>
        <path d="M7.1 12.7a8.2 8.2 0 0 1 9.8 0"/>
        <path d="M10 16a4 4 0 0 1 4 0"/>
        <circle cx="12" cy="19" r=".9" fill="currentColor" stroke="none"/>
    {:else if name === "map-pin"}
        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/>
        <circle cx="12" cy="10" r="2.5"/>
    {:else if name === "user"}
        <circle cx="12" cy="8" r="3.4"/>
        <path d="M5 20c.5-3.7 3.1-5.8 7-5.8s6.5 2.1 7 5.8"/>
    {:else if name === "monitor"}
        <rect x="3" y="4.5" width="18" height="12.5" rx="2.2"/>
        <path d="M9 21h6M12 17v4"/>
    {:else if name === "move"}
        <path d="M12 3v18M3 12h18"/>
        <path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>
    {:else if name === "power"}
        <path d="M12 3v9"/>
        <path d="M6.4 5.9a8 8 0 1 0 11.2 0"/>
    {:else if name === "eye"}
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/>
        <circle cx="12" cy="12" r="3"/>
    {:else if name === "image"}
        <rect x="3" y="4" width="18" height="16" rx="2.5"/>
        <circle cx="8.5" cy="9.5" r="1.6"/>
        <path d="m4 17 5.2-5.2a2 2 0 0 1 2.8 0L20 20"/>
    {:else if name === "play"}
        <path d="M8 4.8 19 12 8 19.2V4.8Z" fill="currentColor" stroke="none"/>
    {:else if name === "send"}
        <path d="m21 3-7.2 18-3.4-7.4L3 10.2 21 3Z"/>
        <path d="M10.4 13.6 21 3"/>
    {:else}
        <circle cx="12" cy="12" r="8"/>
    {/if}
</svg>

<style>
  svg {
    display: block;
    flex: none;
  }
</style>
