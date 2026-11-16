import type {InputBind} from "../../../integration/types";
import {UNKNOWN_KEY} from "../../../util/utils";
import {convertToSpacedString} from "../../../theme/theme_config";

const SPECIAL_KEYS: Record<string, string> = {
    "key.mouse.left": "LMB",
    "key.mouse.right": "RMB",
    "key.mouse.middle": "MMB",
    "key.mouse.4": "MB4",
    "key.mouse.5": "MB5",
    "key.mouse.6": "MB6",
    "key.mouse.7": "MB7",
    "key.mouse.8": "MB8",
    "key.keyboard.unknown": "None",
    "key.keyboard.left.shift": "LSHIFT",
    "key.keyboard.right.shift": "RSHIFT",
    "key.keyboard.left.control": "LCTRL",
    "key.keyboard.right.control": "RCTRL",
    "key.keyboard.left.alt": "LALT",
    "key.keyboard.right.alt": "RALT",
    "key.keyboard.left.win": "LWIN",
    "key.keyboard.right.win": "RWIN",
    "key.keyboard.escape": "ESC",
    "key.keyboard.space": "SPACE",
    "key.keyboard.backspace": "BACKSPACE",
    "key.keyboard.enter": "ENTER",
    "key.keyboard.tab": "TAB",
    "key.keyboard.page.up": "PGUP",
    "key.keyboard.page.down": "PGDN",
    "key.keyboard.caps.lock": "CAPS",
    "key.keyboard.print.screen": "PRTSC",
    "key.keyboard.scroll.lock": "SCRLK",
    "key.keyboard.grave.accent": "`",
    "key.keyboard.left.bracket": "[",
    "key.keyboard.right.bracket": "]",
    "key.keyboard.backslash": "\\",
    "key.keyboard.semicolon": ";",
    "key.keyboard.apostrophe": "'",
    "key.keyboard.comma": ",",
    "key.keyboard.period": ".",
    "key.keyboard.slash": "/",
    "key.keyboard.equal": "=",
    "key.keyboard.minus": "-",
    "key.keyboard.up": "UP",
    "key.keyboard.down": "DOWN",
    "key.keyboard.left": "LEFT",
    "key.keyboard.right": "RIGHT"
};

export function formatKey(key: string | undefined): string {
    if (!key || key === UNKNOWN_KEY) return "None";
    if (SPECIAL_KEYS[key]) return SPECIAL_KEYS[key];

    if (key.startsWith("key.keyboard.")) {
        const name = key.substring("key.keyboard.".length);
        if (name.startsWith("keypad.")) {
            return `NUM ${name.substring(7).toUpperCase()}`;
        }
        return name.toUpperCase();
    }

    if (key.startsWith("key.mouse.")) {
        return `MB${key.substring("key.mouse.".length)}`;
    }

    return key.toUpperCase();
}

export function bindLabel(bind: InputBind | undefined, spacedNames = true): string {
    if (!bind) return "None";

    const key = bindLabelKey(bind.boundKey, spacedNames);
    const modifiers = bind.modifiers ?? [];
    if (modifiers.length === 0) return key;

    const modifierLabels = modifiers.map(modifier => {
        switch (modifier) {
            case "Shift":
                return "Shift";
            case "Control":
                return "Ctrl";
            case "Alt":
                return "Alt";
            case "Super":
                return "Super";
        }
    });

    return `${modifierLabels.join("+")}+${key}`;
}

function bindLabelKey(key: string, spacedNames: boolean): string {
    if (key === UNKNOWN_KEY) return "None";

    if (spacedNames && key.startsWith("key.keyboard.") && !SPECIAL_KEYS[key]) {
        return convertToSpacedString(key.substring("key.keyboard.".length));
    }

    return formatKey(key);
}

export function sameBind(a: InputBind | undefined, b: InputBind | undefined): boolean {
    if (!a || !b) return false;
    const aModifiers = a.modifiers ?? [];
    const bModifiers = b.modifiers ?? [];
    return a.boundKey === b.boundKey
        && a.action === b.action
        && aModifiers.length === bModifiers.length
        && aModifiers.every((modifier, index) => modifier === bModifiers[index]);
}

export function marketImageUrl(image: string | undefined): string | null {
    if (!image) return null;
    if (/^(https?:)?\/\//i.test(image) || image.startsWith("data:")) return image;
    return `https://liquidbounce.net/${image.replace(/^\.?\//, "")}`;
}

/**
 * Marketplace descriptions are markdown. Strip the formatting and embedded
 * images so the result can be rendered as plain text in the ClickGUI.
 */
export function marketDescriptionText(description: string | undefined): string {
    if (!description) return "";

    return description
        .replace(/!\[[^\]]*]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/^\s{0,3}#{1,6}\s*/gm, "")
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
        .replace(/^\s{0,3}(?:---+|___+|\*\*\*+)\s*$/gm, "")
        .replace(/[*_~`]{1,3}/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function marketSummary(description: string | undefined): string {
    return marketDescriptionText(description).replace(/\s+/g, " ").trim();
}

