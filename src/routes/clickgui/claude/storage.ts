export function readStored<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch (error) {
        console.error(`[PrestigeBounce] Could not read ${key}`, error);
        return fallback;
    }
}

export function writeStored(key: string, value: unknown): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`[PrestigeBounce] Could not write ${key}`, error);
        return false;
    }
}

export function makeId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(value: number | string | undefined | null): string {
    const timestamp = toTimestamp(value);
    if (timestamp === undefined) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(new Date(timestamp));
}

export function timeAgo(value: number | string | undefined | null): string {
    const timestamp = toTimestamp(value);
    if (timestamp === undefined) return "recently";
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(timestamp);
}

function toTimestamp(value: number | string | undefined | null): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export function compactNumber(value: number | undefined): string {
    const number = value ?? 0;
    if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1_000) return `${(number / 1_000).toFixed(1)}k`;
    return String(number);
}
