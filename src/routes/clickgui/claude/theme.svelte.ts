export type ClaudeTheme = {
    id: string;
    name: string;
    description: string;
    accent: string;
    background: string;
    card: string;
    glint: string;
};

const STORAGE_KEY = "claude.theme";
const ACCENT_STORAGE_KEY = "claude.theme.accent";

export const themes: ClaudeTheme[] = [
    {
        id: "claude",
        name: "Claude",
        description: "Glass + violet. The signature Claude theme",
        accent: "#8b7cf6",
        background: "#0a0d1c",
        card: "#12162b",
        glint: "#b2a6ff"
    },
    {
        id: "nova",
        name: "Nova",
        description: "Dark indigo + cyan",
        accent: "#35ddd4",
        background: "#07181b",
        card: "#0d2327",
        glint: "#8ffcf4"
    },
    {
        id: "rose",
        name: "Rose",
        description: "Black plum + pink",
        accent: "#f44d9f",
        background: "#180a13",
        card: "#25101d",
        glint: "#ff9dcd"
    },
    {
        id: "ember",
        name: "Ember",
        description: "Charcoal + orange",
        accent: "#f5822d",
        background: "#170f09",
        card: "#24180e",
        glint: "#ffba80"
    },
    {
        id: "forest",
        name: "Forest",
        description: "Deep moss + green",
        accent: "#3fd28f",
        background: "#08160f",
        card: "#0e2117",
        glint: "#8af0bf"
    },
    {
        id: "indigo",
        name: "Indigo",
        description: "Dark navy + indigo",
        accent: "#756cf8",
        background: "#0a0d20",
        card: "#121631",
        glint: "#b3adff"
    },
    {
        id: "magenta",
        name: "Magenta",
        description: "Dark plum + magenta",
        accent: "#dc3bf2",
        background: "#170a1e",
        card: "#24102d",
        glint: "#f19bff"
    },
    {
        id: "ocean",
        name: "Ocean",
        description: "Deep navy + blue",
        accent: "#4c94ff",
        background: "#071426",
        card: "#0d2038",
        glint: "#9bc4ff"
    },
    {
        id: "crimson",
        name: "Crimson",
        description: "Near-black + red",
        accent: "#f04b58",
        background: "#19080a",
        card: "#281013",
        glint: "#ff9aa2"
    },
    {
        id: "lime",
        name: "Lime",
        description: "Dark olive + lime",
        accent: "#b9ec38",
        background: "#101507",
        card: "#1a2110",
        glint: "#dcff8e"
    },
    {
        id: "gold",
        name: "Gold",
        description: "Dark brown + gold",
        accent: "#f3be2c",
        background: "#171207",
        card: "#241b0c",
        glint: "#ffe08a"
    },
    {
        id: "aurora",
        name: "Aurora",
        description: "Deep teal + mint",
        accent: "#52e4c2",
        background: "#061716",
        card: "#0c2421",
        glint: "#a0ffe4"
    },
    {
        id: "cobalt",
        name: "Cobalt",
        description: "Uniform deep blue",
        accent: "#4c7fe8",
        background: "#07101d",
        card: "#0d192b",
        glint: "#9ab7ff"
    },
    {
        id: "mauve",
        name: "Mauve",
        description: "Dusty muted purple",
        accent: "#c58add",
        background: "#150d18",
        card: "#211426",
        glint: "#e1b3f3"
    },
    {
        id: "sage",
        name: "Sage",
        description: "Soft muted green",
        accent: "#a8d6a4",
        background: "#0e150e",
        card: "#182117",
        glint: "#d2f0cf"
    },
    {
        id: "sand",
        name: "Sand",
        description: "Beige paper + gold",
        accent: "#d7b877",
        background: "#171208",
        card: "#241c10",
        glint: "#f0d8a6"
    },
    {
        id: "ink",
        name: "Ink",
        description: "Jet black + cyan ink",
        accent: "#31c6d6",
        background: "#061013",
        card: "#0c1d21",
        glint: "#8ee8f2"
    },
    {
        id: "wine",
        name: "Wine",
        description: "Burgundy + bronze",
        accent: "#c0647e",
        background: "#16090d",
        card: "#221016",
        glint: "#e8a2b4"
    },
    {
        id: "pewter",
        name: "Pewter",
        description: "Brushed steel",
        accent: "#c9d3df",
        background: "#0c1014",
        card: "#161c22",
        glint: "#eef3f8"
    },
    {
        id: "olive",
        name: "Olive",
        description: "Military olive",
        accent: "#bcc34a",
        background: "#111208",
        card: "#1c1e0f",
        glint: "#e0e68a"
    },
    {
        id: "plum",
        name: "Plum",
        description: "Deep plum",
        accent: "#b26bd4",
        background: "#140b18",
        card: "#201126",
        glint: "#dca6f0"
    },
    {
        id: "brick",
        name: "Brick",
        description: "Terracotta red",
        accent: "#d86f52",
        background: "#180d09",
        card: "#24140e",
        glint: "#f0ac94"
    }
];

function hexToRgb(hex: string): [number, number, number] {
    const value = hex.replace("#", "");
    return [
        parseInt(value.substring(0, 2), 16),
        parseInt(value.substring(2, 4), 16),
        parseInt(value.substring(4, 6), 16)
    ];
}

function rgba(hex: string, alpha: number): string {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyTheme(theme: ClaudeTheme, customAccent?: string) {
    const root = document.documentElement;
    const accent = customAccent || theme.accent;

    root.style.setProperty("--claude-accent", accent);
    root.style.setProperty("--claude-accent-rgb", hexToRgb(accent).join(", "));
    root.style.setProperty("--claude-accent-soft", rgba(accent, 0.16));
    root.style.setProperty("--claude-accent-faint", rgba(accent, 0.08));
    root.style.setProperty("--claude-accent-line", rgba(accent, 0.35));
    root.style.setProperty("--claude-glint", theme.glint);
    root.style.setProperty("--claude-background", theme.background);
    root.style.setProperty("--claude-background-deep", theme.background);
    root.style.setProperty("--claude-card", theme.card);
    root.style.setProperty("--claude-glow", rgba(accent, 0.24));

    // Keep the rest of the client in step with the selected theme.
    root.style.setProperty("--accent-color", accent);
    root.style.setProperty("--surface-color", theme.background);
}

class ClaudeThemeState {
    current = $state<ClaudeTheme>(themes[0]);
    customAccent = $state<string | null>(null);

    init() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const theme = themes.find(t => t.id === saved) ?? themes[0];
            const customAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
            this.current = theme;
            this.customAccent = customAccent;
            applyTheme(theme, customAccent ?? undefined);
        } catch {
            applyTheme(themes[0]);
        }
    }

    select(theme: ClaudeTheme) {
        this.current = theme;
        this.customAccent = null;
        localStorage.setItem(STORAGE_KEY, theme.id);
        localStorage.removeItem(ACCENT_STORAGE_KEY);
        applyTheme(theme);
    }

    setAccent(color: string) {
        if (!/^#[0-9a-f]{6}$/i.test(color)) return;
        this.customAccent = color;
        localStorage.setItem(STORAGE_KEY, this.current.id);
        localStorage.setItem(ACCENT_STORAGE_KEY, color);
        applyTheme(this.current, color);
    }
}

export const claudeTheme = new ClaudeThemeState();
