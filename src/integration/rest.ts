import {REST_BASE} from "./host";
import type {
    Account,
    ModuleCategory,
    Alignment,
    Browser,
    ClientInfo,
    ClientUpdate,
    ClientUser,
    ConfigurableSetting,
    ConnectionDetails,
    FileSelectDialog,
    FileSelectResult,
    GameWindow,
    GeneratorResult,
    HitResult,
    HudComponent,
    HudComponentCatalogEntry,
    InputBind,
    MarketItem,
    MarketItemDetail,
    MarketItemQuery,
    MarketItemRevision,
    MarketItemStatus,
    MarketItemType,
    MarketItemVisibility,
    MarketContributor,
    MarketplacePage,
    MarketplacePagination,
    MarketReview,
    MarketScreenshot,
    MarketTag,
    Metadata,
    MinecraftKeybind,
    Module,
    PersistentStorageItem,
    PlayerData,
    PrintableKey,
    Protocol,
    Proxy,
    RegistryItem,
    Server,
    Session,
    Theme,
    VirtualScreen,
    World
} from "./types";
import type {PlayerInventory} from "./events";
import {isLoggingIn} from "../routes/menu/altmanager/altmanager_store";
import {replace} from "svelte-spa-router";
import {UNKNOWN_KEY} from "../util/utils";

const API_BASE = `${REST_BASE}/api/v1`;

async function responseError(response: Response, fallback: string): Promise<Error> {
    let detail = "";

    try {
        const text = (await response.text()).trim();
        if (text) {
            try {
                const body = JSON.parse(text);
                detail = body?.reason ?? body?.message ?? body?.error ?? text;
            } catch {
                detail = text;
            }
        }
    } catch {
        // The response body could not be read.
    }

    return new Error(detail ? `${fallback}: ${detail}` : `${fallback} (${response.status})`);
}

export async function getMetadata(): Promise<Metadata> {
    const response = await fetch(`metadata.json`);
    const data: Metadata = await response.json();

    return data;
}

function normalizeBind(bind: Partial<InputBind> | undefined): InputBind {
    return {
        boundKey: bind?.boundKey ?? UNKNOWN_KEY,
        action: bind?.action ?? "Toggle",
        modifiers: bind?.modifiers ?? []
    };
}

/**
 * The client REST serializer omits empty bind modifiers. Normalize the shape so
 * every consumer can rely on `keyBind.modifiers` being an array.
 */
function normalizeModule(module: Module): Module {
    return {
        ...module,
        keyBind: normalizeBind(module.keyBind),
        aliases: module.aliases ?? []
    };
}

export async function getModules(): Promise<Module[]> {
    const response = await fetch(`${API_BASE}/client/modules`);
    const data: Module[] = await response.json();

    return data.map(normalizeModule);
}

export async function getCategories(): Promise<ModuleCategory[]> {
    const response = await fetch(`${API_BASE}/client/modules/categories`);
    const data: [ModuleCategory] = await response.json();

    return data;
}

export async function getModule(name: string): Promise<Module> {
    const response = await fetch(`${API_BASE}/client/module/${name}`);
    const data: Module = await response.json();

    return normalizeModule(data);
}

export async function getModuleSettings(name: string): Promise<ConfigurableSetting> {
    const searchParams = new URLSearchParams({name});

    const response = await fetch(`${API_BASE}/client/modules/settings?${searchParams.toString()}`);
    const data = await response.json();

    return data;
}

export async function setModuleSettings(name: string, settings: ConfigurableSetting) {
    const searchParams = new URLSearchParams({name});

    await fetch(`${API_BASE}/client/modules/settings?${searchParams.toString()}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
    });
}

export async function getSpooferSettings(): Promise<ConfigurableSetting> {
    const response = await fetch(`${API_BASE}/client/spoofer`);
    const data = await response.json();

    return data;
}

export async function setSpooferSettings(settings: ConfigurableSetting) {
    await fetch(`${API_BASE}/client/spoofer`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
    });
}

export async function getGlobalSettings(): Promise<ConfigurableSetting> {
    const response = await fetch(`${API_BASE}/client/global`);
    const data = await response.json();

    return data;
}

export async function setGlobalSettings(settings: ConfigurableSetting) {
    await fetch(`${API_BASE}/client/global`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
    });
}

export async function setModuleEnabled(name: string, enabled: boolean) {
    await fetch(`${API_BASE}/client/modules/toggle`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            enabled
        })
    });
}

export async function getPersistentStorageItems(): Promise<PersistentStorageItem[]> {
    const response = await fetch(`${API_BASE}/client/localStorage/all`);
    const data: PersistentStorageItem[] = (await response.json()).items;

    return data;
}

export async function setPersistentStorageItems(items: PersistentStorageItem[]) {
    await fetch(`${API_BASE}/client/localStorage/all`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({items})
    })
}

export async function getVirtualScreen(): Promise<VirtualScreen> {
    const response = await fetch(`${API_BASE}/client/virtualScreen`);
    const data: VirtualScreen = await response.json();

    return data;
}

export async function confirmVirtualScreen(name: string) {
    await fetch(`${API_BASE}/client/virtualScreen`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name})
    });
}

export async function getPlayerData(): Promise<PlayerData> {
    const response = await fetch(`${API_BASE}/client/player`);
    const data: PlayerData = await response.json();

    return data;
}

export async function openFileDialog(body: FileSelectDialog): Promise<FileSelectResult> {
    const response = await fetch(`${API_BASE}/client/fileDialog`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    return await response.json();
}

export async function getPlayerInventory(): Promise<PlayerInventory> {
    const response = await fetch(`${API_BASE}/client/player/inventory`);
    const data: PlayerInventory = await response.json();

    return data;
}

export async function getCrosshairData(): Promise<HitResult> {
    const response = await fetch(`${API_BASE}/client/crosshair`);
    const data: HitResult = await response.json();

    return data;
}

export async function getPrintableKeyName(key: string): Promise<PrintableKey> {
    const searchParams = new URLSearchParams({key});

    const response = await fetch(`${API_BASE}/client/input?${searchParams.toString()}`);
    const data: PrintableKey = await response.json();

    return data;
}

export async function getMinecraftKeybinds(): Promise<MinecraftKeybind[]> {
    const response = await fetch(`${API_BASE}/client/keybinds`);
    const data: MinecraftKeybind[] = await response.json();

    return data;
}

export async function getRegistryItems(name: string): Promise<Record<string, RegistryItem>> {
    const response = await fetch(`${API_BASE}/client/registry/${name}`);
    const data: Record<string, RegistryItem> = await response.json();

    return data;
}

export async function getSession(): Promise<Session> {
    const response = await fetch(`${API_BASE}/client/session`);
    const data: Session = await response.json();

    return data;
}

export async function openLink(target: string) {
    await fetch(`${API_BASE}/client/openLink`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({target})
    });
}

export async function browsePath(path: string) {
    await fetch(`${API_BASE}/client/browsePath`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({path})
    });
}

export async function exitClient() {
    await fetch(`${API_BASE}/client/exit`, {
        method: "POST"
    });
}

export async function openScreen(name: string) {
    await fetch(`${API_BASE}/client/screen`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name})
    });
}

export async function deleteScreen() {
    await fetch(`${API_BASE}/client/screen`, {
        method: "DELETE"
    });
}

export async function keepScreenEscape(name: string, keep: boolean) {
    await fetch(`${API_BASE}/client/screen/escape`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name, keep})
    });
}

export async function getServers(): Promise<Server[]> {
    const response = await fetch(`${API_BASE}/client/servers`);
    const data: Server[] = await response.json();

    return data;
}

export async function getLanServers(): Promise<Server[]> {
    const response = await fetch(`${API_BASE}/client/servers/lan`);

    if (!response.ok) {
        return [];
    }

    const data: Server[] = await response.json();

    return data;
}

export async function connectToServer(address: string) {
    await fetch(`${API_BASE}/client/servers/connect`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({address})
    });
}

export async function getConnectionDetails(): Promise<ConnectionDetails | null> {
    const response = await fetch(`${API_BASE}/client/connection`);

    if (response.status !== 200) {
        return null;
    }

    const data: ConnectionDetails = await response.json();

    return data;
}

export async function removeServer(id: number) {
    await fetch(`${API_BASE}/client/servers/remove`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id})
    });
}

export async function addServer(name: string, address: string, resourcePackPolicy: string) {
    await fetch(`${API_BASE}/client/servers/add`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name, address, resourcePackPolicy})
    });
}

export async function editServer(id: number, name: string, address: string, resourcePackPolicy: string) {
    await fetch(`${API_BASE}/client/servers/edit`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id, name, address, resourcePackPolicy})
    });
}

export async function orderServers(order: number[]) {
    await fetch(`${API_BASE}/client/servers/order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({order})
    });
}

export async function getProtocols(): Promise<Protocol[]> {
    const response = await fetch(`${API_BASE}/client/protocols`);
    const data: Protocol[] = await response.json();

    return data;
}

export async function getSelectedProtocol(): Promise<Protocol> {
    const response = await fetch(`${API_BASE}/client/protocols/protocol`);
    const data: Protocol = await response.json();

    return data;
}

export async function setSelectedProtocol(protocol: Protocol) {
    await fetch(`${API_BASE}/client/protocols/protocol`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({version: protocol.version})
    });
}

export async function restoreSession() {
    isLoggingIn.set(true);
    await fetch(`${API_BASE}/client/account/restore`, {
        method: "POST",
    }).finally(() => isLoggingIn.set(false));
}

export async function orderAccounts(order: number[]) {
    await fetch(`${API_BASE}/client/accounts/order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({order})
    });
}


export async function addCrackedAccount(username: string, online: boolean) {
    await fetch(`${API_BASE}/client/accounts/new/cracked`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, online})
    });
}

export async function addSessionAccount(token: string) {
    await fetch(`${API_BASE}/client/accounts/new/session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({token})
    });
}

export async function addAlteningAccount(token: string) {
    await fetch(`${API_BASE}/client/accounts/new/altening`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({token})
    });
}

export async function addMicrosoftAccountWebView() {
    await fetch(`${API_BASE}/client/accounts/new/microsoft/webview`, {
        method: "POST",
    });
}

export async function addMicrosoftAccountDeviceCode() {
    await fetch(`${API_BASE}/client/accounts/new/microsoft/device-code`, {
        method: "POST",
    });
}

export async function addMicrosoftAccountDeviceCodeCopyUrl() {
    await fetch(`${API_BASE}/client/accounts/new/microsoft/device-code/clipboard`, {
        method: "POST",
    });
}

export async function addMicrosoftAccountCredentials(email: string, password: string) {
    await fetch(`${API_BASE}/client/accounts/new/microsoft/credentials`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password})
    });
}

export async function setAccountFavorite(id: number, favorite: boolean) {
    if (favorite) {
        await fetch(`${API_BASE}/client/account/favorite`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id})
        });
    } else {
        await fetch(`${API_BASE}/client/account/favorite`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id})
        });
    }
}

export async function removeAccount(id: number) {
    await fetch(`${API_BASE}/client/account`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id})
    });
}

export async function loginToAccount(id: number) {
    isLoggingIn.set(true);
    await fetch(`${API_BASE}/client/account/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id})
    }).finally(() => isLoggingIn.set(false));
}

export async function directLoginToCrackedAccount(username: string, online: boolean) {
    isLoggingIn.set(true);
    await fetch(`${API_BASE}/client/account/login/cracked`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, online})
    }).finally(() => isLoggingIn.set(false));
}

export async function directLoginToSessionAccount(token: string) {
    isLoggingIn.set(true);
    await fetch(`${API_BASE}/client/account/login/session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({token})
    }).finally(() => isLoggingIn.set(false));
}

export async function getAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE}/client/accounts`);
    const data: Account[] = await response.json();

    return data;
}

export async function getWorlds(): Promise<World[]> {
    const response = await fetch(`${API_BASE}/client/worlds`);
    const data: World[] = await response.json();

    return data;
}

export async function openWorld(name: string) {
    const response = await fetch(`${API_BASE}/client/worlds/join`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name})
    });
}

export async function editWorld(name: string) {
    const response = await fetch(`${API_BASE}/client/worlds/edit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name})
    });
}

export async function removeWorld(name: string) {
    const response = await fetch(`${API_BASE}/client/worlds/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name})
    });
}

export async function getProxies(): Promise<Proxy[]> {
    const response = await fetch(`${API_BASE}/client/proxies`);
    const data: Proxy[] = await response.json();

    return data;
}

export async function checkProxy(id: number) {
    await fetch(`${API_BASE}/client/proxies/check`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id})
    });
}

export async function getCurrentProxy(): Promise<Proxy | null> {
    const response = await fetch(`${API_BASE}/client/proxy`);

    if (response.status !== 200) {
        return null;
    }

    const data: Proxy = await response.json();

    return data;
}

export async function disconnectFromProxy() {
    await fetch(`${API_BASE}/client/proxy`, {
        method: "DELETE",
    });
}

export async function setProxyFavorite(id: number, favorite: boolean) {
    if (favorite) {
        await fetch(`${API_BASE}/client/proxies/favorite`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id})
        });
    } else {
        await fetch(`${API_BASE}/client/proxies/favorite`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id})
        });
    }
}

export async function addProxy(host: string, port: number, username: string, password: string, type: string, forwardAuthentication: boolean, proxyResourcePacks: boolean, proxyDns: boolean) {
    await fetch(`${API_BASE}/client/proxies/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({host, port, username, password, type, forwardAuthentication, proxyResourcePacks, proxyDns})
    });
}

export async function editProxy(id: number, host: string, port: number, username: string, password: string, type: string, forwardAuthentication: boolean, proxyResourcePacks: boolean, proxyDns: boolean) {
    await fetch(`${API_BASE}/client/proxies/edit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id, host, port, username, password, type, forwardAuthentication, proxyResourcePacks, proxyDns})
    })
}

export async function addProxyFromClipboard() {
    await fetch(`${API_BASE}/client/proxies/add/clipboard`, {
        method: "POST"
    });
}

export async function removeProxy(id: number) {
    await fetch(`${API_BASE}/client/proxies/remove`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id})
    });
}

export async function connectToProxy(id: number) {
    await fetch(`${API_BASE}/client/proxy`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id})
    });
}

export async function getGameWindow(): Promise<GameWindow> {
    const response = await fetch(`${API_BASE}/client/window`);
    const data: GameWindow = await response.json();

    return data;
}

export async function setHudEditorSelected(selected: boolean): Promise<void> {
    await fetch(`${API_BASE}/client/hud-editor`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({selected})
    });
}

/**
 * @param id Use the ID from [getMetadata].
 */
export async function getTheme(id: string): Promise<Theme> {
    const response = await fetch(`${API_BASE}/client/theme/${id}`);
    return await response.json();
}

/**
 * @param id Use the ID from [getMetadata].
 */
export async function getComponents(id: string): Promise<HudComponent[]> {
    const response = await fetch(`${API_BASE}/client/components/${id}`);
    return await response.json();
}

export async function getNativeComponents(): Promise<HudComponent[]> {
    const response = await fetch(`${API_BASE}/client/components/native`);
    return await response.json();
}

export async function getComponentCatalog(id: string): Promise<HudComponentCatalogEntry[]> {
    const response = await fetch(`${API_BASE}/client/components/${id}/catalog`);
    return await response.json();
}

export async function addComponent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/client/components/${id}`, {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error("Failed to add HUD component");
    }
}

export async function setComponentAlignment(id: string, alignment: Alignment): Promise<void> {
    const response = await fetch(`${API_BASE}/client/components/${id}/alignment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(alignment)
    });

    if (!response.ok) {
        throw await responseError(response, "Could not save the HUD position");
    }
}

export async function bringComponentToFront(id: string): Promise<number> {
    const response = await fetch(`${API_BASE}/client/components/${id}/z-index`, {
        method: "POST"
    });

    if (!response.ok) {
        throw await responseError(response, "Could not bring the HUD element to the front");
    }

    const data: { zIndex: number } = await response.json();
    return data.zIndex;
}

export async function getComponentSettings(id: string): Promise<ConfigurableSetting> {
    const response = await fetch(`${API_BASE}/client/components/${id}/settings`);

    if (!response.ok) {
        throw await responseError(response, "Could not load the HUD element settings");
    }

    return await response.json();
}

export function getComponentFileUrl(id: string, cacheKey?: string): string {
    const url = `${API_BASE}/client/components/${id}/file`;
    return cacheKey === undefined ? url : `${url}?v=${encodeURIComponent(cacheKey)}`;
}

export async function setComponentSettings(id: string, settings: ConfigurableSetting): Promise<void> {
    const response = await fetch(`${API_BASE}/client/components/${id}/settings`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
    });

    if (!response.ok) {
        throw await responseError(response, "Could not save the HUD element settings");
    }
}

export async function getClientInfo(): Promise<ClientInfo> {
    const response = await fetch(`${API_BASE}/client/info`);
    const data: ClientInfo = await response.json();

    return data;
}

export async function getClientUpdate(): Promise<ClientUpdate> {
    const response = await fetch(`${API_BASE}/client/update`);
    const data: ClientUpdate = await response.json();

    return data;
}

export async function reconnectToServer() {
    await fetch(`${API_BASE}/client/reconnect`, {
        method: "POST",
    });
}

export async function toggleBackgroundShaderEnabled() {
    await fetch(`${API_BASE}/client/shader`, {
        method: "POST",
    });
}

export async function toggleBasicMode() {
    await fetch(`${API_BASE}/client/basic-mode`, {
        method: "POST",
    });
}

export async function getBrowser(): Promise<Browser> {
    const response = await fetch(`${API_BASE}/client/browser`);
    const data: Browser = await response.json();

    return data;
}

export async function browserNavigate(url: string) {
    await fetch(`${API_BASE}/client/browser/navigate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({url})
    })
}

export async function browserGoForward() {
    await fetch(`${API_BASE}/client/browser/forward`, {
        method: "POST",
    });
}

export async function browserGoBack() {
    await fetch(`${API_BASE}/client/browser/back`, {
        method: "POST",
    });
}

export async function browserReload() {
    await fetch(`${API_BASE}/client/browser/reload`, {
        method: "POST",
    });
}

export async function browserForceReload() {
    await fetch(`${API_BASE}/client/browser/forceReload`, {
        method: "POST",
    });
}

export async function browserClose() {
    await fetch(`${API_BASE}/client/browser/close`, {
        method: "POST",
    });
}

export async function randomUsername(): Promise<string> {
    let response = await fetch(`${API_BASE}/client/account/random-name`, {
        method: "POST",
    });
    let data: GeneratorResult = await response.json();

    return data.name;
}

let lastTypingState: boolean | null = null;

export async function setTyping(typing: boolean) {
    if (typing === lastTypingState) return;
    lastTypingState = typing;
    await fetch(`${API_BASE}/client/typing`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({typing})
    });
}

export async function getClientUser(): Promise<ClientUser | null> {
    const response = await fetch(`${API_BASE}/client/user`);

    if (!response.ok) {
        if (response.status === 401) {
            return null;
        }
        throw new Error(`Failed to get client user: ${response.status} ${response.statusText}`);
    }

    const data: ClientUser = await response.json();
    return data;
}

export async function loginClientUser() {
    await fetch(`${API_BASE}/client/user/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
}

export async function logoutClientUser() {
    await fetch(`${API_BASE}/client/user/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
}

export function itemTextureUrl(identifier: string) {
    return `${API_BASE}/client/resource/itemTexture?id=${identifier}`
}

export function effectTextureUrl(effectId: string) {
    return `${API_BASE}/client/resource/effectTexture?id=${effectId}`
}

const MARKETPLACE_BASE = `${API_BASE}/client/marketplace`;
const MARKETPLACE_PAGE_LIMIT = 20;
/**
 * The client REST API serializes its own reduced MarketplaceItem model, which
 * does not contain screenshots or contributor metadata. The public API exposes
 * those fields and allows cross-origin reads, so display-only data is merged
 * from there while every action stays on the client REST API.
 */
const PUBLIC_MARKETPLACE_BASE = "https://api.liquidbounce.net/api/v3/marketplace";

async function marketplaceRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${MARKETPLACE_BASE}${path}`, init);

    if (!response.ok) {
        throw await responseError(response, "Marketplace request failed");
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

function marketplaceQuery(query: object): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query) as [string, unknown][]) {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    }
    const encoded = params.toString();
    return encoded ? `?${encoded}` : "";
}

interface RawMarketTag {
    id: number;
    name: string;
}

interface RawMarketContributor {
    uid: string;
    nickname?: string;
    name?: string;
}

interface RawMarketScreenshot {
    id: number;
    url: string;
    position?: number;
}

interface RawMarketFile {
    name?: string;
    size?: number;
    checksum?: string;
}

interface RawMarketRevision {
    id: number;
    item_id: number;
    version: string;
    changelog?: string | null;
    created_at: string;
    status?: string;
    includes_binds?: boolean | null;
    file?: RawMarketFile | null;
}

interface RawMarketReview {
    id: number;
    item_id: number;
    uid: string;
    rating: number;
    review?: string | null;
    created_at: string;
}

interface RawMarketItem {
    id: number;
    uid: string;
    type?: string;
    name: string;
    branch?: string;
    description?: string;
    source_url?: string | null;
    featured?: boolean;
    created_at: string;
    updated_at?: string | null;
    status?: string;
    author?: string;
    downloads?: number;
    score?: number;
    visibility?: string;
    tags?: RawMarketTag[];
    target_servers?: string[];
    screenshots?: RawMarketScreenshot[];
    live_revision_id?: number | null;
    live_revision?: RawMarketRevision | null;
    includes_binds?: boolean | null;
    protocol_name?: string | null;
    protocol_version?: string | null;
    recent_works?: number | null;
    recent_fails?: number | null;
    can_edit?: boolean;
    can_manage?: boolean;
    contributors?: RawMarketContributor[];
    forked_from_item_id?: number | null;
    is_subscribed?: boolean;
    subscribed?: boolean;
}

interface RawMarketRow {
    item?: RawMarketItem;
    isSubscribed?: boolean;
}

interface RawMarketDetailResponse extends RawMarketRow {
    hasUpdate?: boolean;
}

interface RawMarketPage<T> {
    items?: T[];
    pagination?: {
        current?: number;
        pages?: number;
        items?: number;
    };
}

function mapMarketPagination(pagination: RawMarketPage<unknown>["pagination"]): MarketplacePagination {
    return {
        current: pagination?.current ?? 1,
        pages: pagination?.pages ?? 1,
        items: pagination?.items ?? 0
    };
}

function mapMarketScreenshots(screenshots: RawMarketScreenshot[] | undefined): MarketScreenshot[] {
    return (screenshots ?? [])
        .map(screenshot => ({
            id: screenshot.id,
            url: screenshot.url,
            position: screenshot.position ?? 0
        }))
        .sort((left, right) => left.position - right.position);
}

function mapMarketContributors(contributors: RawMarketContributor[] | undefined): MarketContributor[] {
    return (contributors ?? []).map(contributor => ({
        uid: contributor.uid,
        name: contributor.nickname ?? contributor.name ?? contributor.uid
    }));
}

function mapMarketRevision(revision: RawMarketRevision): MarketItemRevision {
    return {
        id: revision.id,
        itemId: revision.item_id,
        version: revision.version,
        changelog: revision.changelog ?? null,
        createdAt: revision.created_at,
        status: (revision.status ?? "Active") as MarketItemStatus,
        includesBinds: revision.includes_binds ?? null,
        file: revision.file
            ? {
                name: revision.file.name ?? "release",
                size: revision.file.size ?? 0,
                checksum: revision.file.checksum ?? ""
            }
            : null
    };
}

function mapMarketItem(raw: RawMarketItem, subscribed = false): MarketItem {
    return {
        id: raw.id,
        uid: raw.uid,
        type: (raw.type ?? "Other") as MarketItemType,
        name: raw.name,
        branch: raw.branch ?? "",
        description: raw.description ?? "",
        sourceUrl: raw.source_url ?? null,
        featured: raw.featured ?? false,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at ?? null,
        status: (raw.status ?? "Active") as MarketItemStatus,
        author: raw.author ?? "Unknown",
        downloads: raw.downloads ?? 0,
        score: raw.score ?? 0,
        visibility: (raw.visibility ?? "public") as MarketItemVisibility,
        tags: (raw.tags ?? []).map(tag => ({id: tag.id, name: tag.name})),
        targetServers: raw.target_servers ?? [],
        screenshots: mapMarketScreenshots(raw.screenshots),
        liveRevisionId: raw.live_revision_id ?? null,
        liveRevision: raw.live_revision ? mapMarketRevision(raw.live_revision) : null,
        includesBinds: raw.includes_binds ?? null,
        protocolName: raw.protocol_name ?? null,
        protocolVersion: raw.protocol_version ?? null,
        recentWorks: raw.recent_works ?? null,
        recentFails: raw.recent_fails ?? null,
        canEdit: raw.can_edit ?? false,
        canManage: raw.can_manage ?? false,
        contributors: mapMarketContributors(raw.contributors),
        forkedFromItemId: raw.forked_from_item_id ?? null,
        subscribed: subscribed || raw.is_subscribed === true || raw.subscribed === true
    };
}

async function requestPublicMarketplace<T>(path: string): Promise<T> {
    const response = await fetch(`${PUBLIC_MARKETPLACE_BASE}${path}`, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw await responseError(response, "Public marketplace request failed");
    }

    return await response.json() as T;
}

/**
 * Fetch screenshot metadata for the visible marketplace page from the public
 * API. Failure is non-fatal: cards simply fall back to their type icon.
 */
export async function getMarketplaceScreenshots(query: MarketItemQuery = {}): Promise<Map<number, MarketScreenshot[]>> {
    try {
        const result = await requestPublicMarketplace<RawMarketPage<RawMarketItem>>(marketplaceQuery({
            page: 1,
            limit: 100,
            type: query.type,
            query: query.query,
            featured: query.featured
        }));

        return new Map((result.items ?? [])
            .filter(item => (item.screenshots?.length ?? 0) > 0)
            .map(item => [item.id, mapMarketScreenshots(item.screenshots)] as const));
    } catch (error) {
        console.warn("[PrestigeBounce] Could not load marketplace screenshots", error);
        return new Map();
    }
}

export async function getMarketplaceItems(query: MarketItemQuery = {}): Promise<MarketplacePage<MarketItem>> {
    const result = await marketplaceRequest<RawMarketPage<RawMarketRow>>(marketplaceQuery({
        ...query,
        limit: query.limit ?? MARKETPLACE_PAGE_LIMIT
    }));

    return {
        items: (result.items ?? []).map(row => {
            const raw = row.item ?? (row as unknown as RawMarketItem);
            return mapMarketItem(raw, row.isSubscribed);
        }),
        pagination: mapMarketPagination(result.pagination)
    };
}

export async function getMarketplaceItem(id: number): Promise<MarketItemDetail> {
    const [result, publicItem] = await Promise.all([
        marketplaceRequest<RawMarketDetailResponse>(`/${id}`),
        requestPublicMarketplace<RawMarketItem>(`/${id}`).catch(error => {
            console.warn(`[PrestigeBounce] Could not load public marketplace details for ${id}`, error);
            return null;
        })
    ]);

    const item = mapMarketItem(result.item ?? (result as unknown as RawMarketItem), result.isSubscribed);

    if (publicItem) {
        item.screenshots = mapMarketScreenshots(publicItem.screenshots);
        item.sourceUrl = publicItem.source_url ?? item.sourceUrl;
        item.contributors = mapMarketContributors(publicItem.contributors);
        item.liveRevision = publicItem.live_revision ? mapMarketRevision(publicItem.live_revision) : item.liveRevision;
        item.canEdit = publicItem.can_edit ?? item.canEdit;
        item.canManage = publicItem.can_manage ?? item.canManage;
    }

    return {
        item,
        isSubscribed: result.isSubscribed ?? item.subscribed,
        hasUpdate: result.hasUpdate ?? false
    };
}

export async function subscribeMarketplaceItem(id: number): Promise<void> {
    await marketplaceRequest<void>(`/${id}/subscribe`, {method: "POST"});
}

export async function unsubscribeMarketplaceItem(id: number): Promise<void> {
    await marketplaceRequest<void>(`/${id}/unsubscribe`, {method: "POST"});
}

export async function getMarketplaceItemRevisions(
    id: number,
    page = 1,
    limit = MARKETPLACE_PAGE_LIMIT
): Promise<MarketplacePage<MarketItemRevision>> {
    const result = await marketplaceRequest<RawMarketPage<RawMarketRevision>>(
        `/${id}/revisions${marketplaceQuery({page, limit})}`
    );

    return {
        items: (result.items ?? []).map(mapMarketRevision),
        pagination: mapMarketPagination(result.pagination)
    };
}

export async function getMarketplaceItemReviews(
    id: number,
    page = 1,
    limit = 10
): Promise<MarketplacePage<MarketReview>> {
    const result = await marketplaceRequest<RawMarketPage<RawMarketReview>>(
        `/${id}/reviews${marketplaceQuery({page, limit})}`
    );

    return {
        items: (result.items ?? []).map(review => ({
            id: review.id,
            itemId: review.item_id,
            uid: review.uid,
            rating: review.rating,
            review: review.review ?? null,
            createdAt: review.created_at
        })),
        pagination: mapMarketPagination(result.pagination)
    };
}
