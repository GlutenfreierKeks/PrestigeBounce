import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

const PORT = Number(process.env.MOCK_PORT ?? 54812);
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const ICON_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "icons");
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function icon(name) {
    return fs.readFileSync(path.join(ICON_DIR, `${name}.png`)).toString("base64");
}

function stack(identifier, count = 1, displayName = undefined, extra = {}) {
    return {
        identifier: `minecraft:${identifier}`,
        count,
        damage: 0,
        maxDamage: 0,
        displayName: displayName ?? identifier.split("_").map(part => part[0].toUpperCase() + part.slice(1)).join(" "),
        ...extra
    };
}

const air = {identifier: "minecraft:air", count: 0, damage: 0, maxDamage: 0, displayName: "Air"};

const mainInventory = Array.from({length: 36}, () => air);
mainInventory[0] = stack("diamond_sword", 1, "Diamond Sword", {damage: 640, maxDamage: 1561, enchantments: {sharpness: 5, unbreaking: 3}});
mainInventory[1] = stack("bow", 1, "Bow", {damage: 120, maxDamage: 384, enchantments: {power: 4, infinity: 1}});
mainInventory[2] = stack("iron_pickaxe", 1, "Iron Pickaxe", {damage: 88, maxDamage: 250, enchantments: {efficiency: 4}});
mainInventory[3] = stack("golden_apple", 16, "Golden Apple");
mainInventory[4] = stack("ender_pearl", 12, "Ender Pearl");
mainInventory[5] = stack("water_bucket", 1, "Water Bucket");
mainInventory[6] = stack("oak_planks", 64, "Oak Planks");
mainInventory[7] = stack("torch", 48, "Torch");
mainInventory[8] = stack("cooked_beef", 32, "Steak");
mainInventory[9] = stack("netherite_sword", 1, "Netherite Sword", {damage: 420, maxDamage: 2031, enchantments: {sharpness: 5, looting: 3}});
mainInventory[10] = stack("shield", 1, "Shield");
mainInventory[11] = stack("arrow", 64, "Arrow");
mainInventory[12] = stack("ender_eye", 6, "Eye of Ender");
mainInventory[13] = stack("experience_bottle", 24, "Bottle o' Enchanting");
mainInventory[14] = stack("totem_of_undying", 1, "Totem of Undying");
mainInventory[15] = stack("gold_ingot", 32, "Gold Ingot");
mainInventory[16] = stack("iron_ingot", 48, "Iron Ingot");
mainInventory[17] = stack("obsidian", 16, "Obsidian");
mainInventory[18] = stack("diamond_block", 8, "Block of Diamond");
mainInventory[19] = stack("emerald_block", 5, "Block of Emerald");
mainInventory[20] = stack("gold_block", 7, "Block of Gold");
mainInventory[21] = stack("bookshelf", 12, "Bookshelf");
mainInventory[22] = stack("anvil", 2, "Anvil");
mainInventory[23] = stack("blaze_rod", 18, "Blaze Rod");
mainInventory[24] = stack("string", 32, "String");
mainInventory[25] = stack("leather", 24, "Leather");
mainInventory[26] = stack("book", 9, "Book");
mainInventory[27] = stack("potion", 3, "Potion of Healing", {enchantments: {}});
mainInventory[28] = stack("splash_potion", 2, "Splash Potion");
mainInventory[29] = stack("ender_pearl", 16, "Ender Pearl");
mainInventory[30] = stack("golden_apple", 8, "Golden Apple");
mainInventory[31] = stack("arrow", 32, "Arrow");
mainInventory[32] = stack("torch", 64, "Torch");
mainInventory[33] = stack("oak_planks", 48, "Oak Planks");
mainInventory[34] = stack("obsidian", 24, "Obsidian");
mainInventory[35] = stack("water_bucket", 1, "Water Bucket");

const enderChest = Array.from({length: 27}, () => air);
enderChest[0] = stack("diamond_block", 32, "Block of Diamond");
enderChest[1] = stack("netherite_sword", 1, "Netherite Sword");
enderChest[2] = stack("golden_apple", 64, "Golden Apple");
enderChest[3] = stack("ender_pearl", 64, "Ender Pearl");
enderChest[4] = stack("experience_bottle", 64, "Bottle o' Enchanting");
enderChest[9] = stack("totem_of_undying", 3, "Totem of Undying");
enderChest[10] = stack("emerald_block", 16, "Block of Emerald");
enderChest[11] = stack("anvil", 4, "Anvil");
enderChest[12] = stack("obsidian", 64, "Obsidian");
enderChest[18] = stack("diamond_helmet", 1, "Diamond Helmet");
enderChest[19] = stack("netherite_chestplate", 1, "Netherite Chestplate");
enderChest[20] = stack("golden_leggings", 1, "Golden Leggings");
enderChest[21] = stack("iron_boots", 1, "Iron Boots");

const inventory = {
    armor: [
        stack("diamond_helmet", 1, "Diamond Helmet", {damage: 40, maxDamage: 363, enchantments: {protection: 4, unbreaking: 3}}),
        stack("netherite_chestplate", 1, "Netherite Chestplate", {damage: 72, maxDamage: 592, enchantments: {protection: 4, mending: 1}}),
        stack("golden_leggings", 1, "Golden Leggings", {damage: 12, maxDamage: 105, enchantments: {protection: 3}}),
        stack("iron_boots", 1, "Iron Boots", {damage: 20, maxDamage: 195, enchantments: {feather_falling: 4, soul_speed: 3}})
    ],
    main: mainInventory,
    crafting: [
        stack("oak_planks", 4, "Oak Planks"),
        stack("oak_planks", 4, "Oak Planks"),
        stack("oak_planks", 4, "Oak Planks"),
        stack("oak_planks", 4, "Oak Planks")
    ],
    enderChest
};

const playerData = {
    username: "GlutenfreierKeks",
    uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
    dimension: "minecraft:overworld",
    position: {x: 128.4, y: 64, z: -312.7},
    netherPosition: {x: 16.05, y: 64, z: -39.09},
    blockPosition: {x: 128, y: 64, z: -313},
    velocity: {x: 0, y: -0.08, z: 0},
    selectedSlot: 0,
    gameMode: "SURVIVAL",
    ping: 38,
    health: 18,
    actualHealth: 18,
    maxHealth: 20,
    absorption: 0,
    yaw: 92.4,
    pitch: 12.8,
    armor: 19,
    food: 17,
    air: 300,
    maxAir: 300,
    experienceLevel: 34,
    experienceProgress: 0.62,
    effects: [
        {effect: "speed", localizedName: "Speed", duration: 240, amplifier: 1, ambient: false, infinite: false, visible: true, showIcon: true, color: -6750208},
        {effect: "night_vision", localizedName: "Night Vision", duration: 600, amplifier: 0, ambient: false, infinite: false, visible: true, showIcon: true, color: -10079232}
    ],
    mainHandStack: mainInventory[0],
    offHandStack: stack("totem_of_undying", 1, "Totem of Undying"),
    armorItems: inventory.armor,
    scoreboard: {
        header: {text: "PrestigeBounce"},
        entries: []
    }
};

const servers = [
    {
        id: 1,
        address: "play.hypixel.net",
        icon: icon("grass_block_side"),
        label: "Hypixel",
        players: {max: 100000, online: 42315},
        name: "Hypixel",
        online: true,
        playerCountLabel: "42.3k / 100k",
        protocolVersion: 767,
        version: "1.21",
        ping: 38,
        resourcePackPolicy: "Prompt",
        lan: false
    },
    {
        id: 2,
        address: "mc.loyisa.cn",
        icon: icon("stone"),
        label: "Loyisa",
        players: {max: 5000, online: 1204},
        name: "Loyisa",
        online: true,
        playerCountLabel: "1.2k / 5k",
        protocolVersion: 767,
        version: "1.21",
        ping: 74,
        resourcePackPolicy: "Prompt",
        lan: false
    },
    {
        id: 3,
        address: "play.cubecraft.net",
        icon: icon("diamond_block"),
        label: "CubeCraft",
        players: {max: 20000, online: 8130},
        name: "CubeCraft Games",
        online: true,
        playerCountLabel: "8.1k / 20k",
        protocolVersion: 767,
        version: "1.21",
        ping: 126,
        resourcePackPolicy: "Prompt",
        lan: false
    },
    {
        id: 4,
        address: "mc.hypixel.net",
        icon: icon("dirt"),
        label: "Backup",
        players: {max: 0, online: 0},
        name: "Hypixel Backup",
        online: false,
        playerCountLabel: "Offline",
        protocolVersion: -1,
        version: "",
        ping: 0,
        resourcePackPolicy: "Prompt",
        lan: false
    },
    {
        id: 5,
        address: "localhost:25565",
        icon: icon("redstone_block"),
        label: "Test",
        players: {max: 20, online: 3},
        name: "LAN World",
        online: true,
        playerCountLabel: "3 / 20",
        protocolVersion: 767,
        version: "1.21",
        ping: 2,
        resourcePackPolicy: "Prompt",
        lan: true
    }
];

const theme = {
    name: "PrestigeBounce",
    id: "claude",
    colors: {
        accent: -7633674,
        tint: -16118500
    },
    settings: {}
};

const accounts = [
    {
        avatar: `http://localhost:${PORT}/player-head.png`,
        favorite: true,
        id: 1,
        type: "Microsoft",
        username: "GlutenfreierKeks",
        uuid: "069a79f444e94726a5befca90e38aaf5"
    },
    {
        avatar: `http://localhost:${PORT}/player-head.png`,
        favorite: false,
        id: 2,
        type: "Cracked",
        username: "PrestigeFan",
        uuid: "00000000000000000000000000000002"
    },
    {
        avatar: `http://localhost:${PORT}/player-head.png`,
        favorite: true,
        id: 3,
        type: "Microsoft",
        username: "AltAccount",
        uuid: "00000000000000000000000000000003"
    }
];

const KEY_NONE = "key.keyboard.unknown";

function mod(name, category, tag, description, enabled = false, aliases = []) {
    return {
        name,
        category,
        keyBind: {boundKey: KEY_NONE, action: "Toggle", modifiers: []},
        enabled,
        description,
        hidden: false,
        aliases,
        tag
    };
}

const mockModules = [
    mod("KillAura", "Combat", "Vanilla", "Attacks nearby entities within range.", true, ["Aura", "KA"]),
    mod("Criticals", "Combat", "Vanilla", "Forces critical hits on every attack."),
    mod("AutoArmor", "Combat", "Vanilla", "Automatically equips the best armor."),
    mod("Backtrack", "Combat", "Bypass", "Delays incoming position packets to land more hits."),
    mod("Velocity", "Combat", "Ghost", "Reduces or cancels knockback."),
    mod("Reach", "Combat", "Bypass", "Extends your attack range."),
    mod("MaceSlam", "Combat", "Mace", "Times mace smashes at the peak of a fall."),
    mod("SpearAttack", "Combat", "Spear", "Automates spear attacks while charging."),
    mod("HitBox", "Combat", "Bypass", "Expands entity hitboxes."),

    mod("Sprint", "Movement", "Vanilla", "Keeps sprinting in all directions.", true),
    mod("Speed", "Movement", "Bypass", "Increases movement speed."),
    mod("Fly", "Movement", "Bypass", "Allows creative-style flight."),
    mod("LongJump", "Movement", "Bypass", "Jumps further than usual."),
    mod("NoSlow", "Movement", "Vanilla", "Prevents slowdown from items and blocks."),
    mod("Step", "Movement", "Vanilla", "Steps up full blocks."),
    mod("SafeWalk", "Movement", "Vanilla", "Prevents walking off edges."),
    mod("Jesus", "Movement", "Bypass", "Walk across liquids."),

    mod("AutoTotem", "Player", "Vanilla", "Keeps a totem in your offhand.", true),
    mod("ChestStealer", "Player", "Vanilla", "Takes items from containers."),
    mod("InvManager", "Player", "Vanilla", "Sorts and cleans your inventory."),
    mod("FastPlace", "Player", "Vanilla", "Removes block placement delay."),
    mod("NoFall", "Player", "Vanilla", "Prevents fall damage."),
    mod("AutoTool", "Player", "Vanilla", "Switches to the best tool."),
    mod("ChestAura", "Player", "Bypass", "Opens and loots nearby chests."),

    mod("Scaffold", "World", "Vanilla", "Places blocks beneath you.", true),
    mod("Tower", "World", "Vanilla", "Builds a tower beneath you."),
    mod("Nuker", "World", "Bypass", "Breaks blocks around you."),
    mod("Timer", "World", "Bypass", "Changes the game speed."),
    mod("AutoFarm", "World", "Bypass", "Automates farming routines."),
    mod("LiquidPlace", "World", "Bypass", "Places blocks into liquids."),

    mod("ESP", "Render", "Vanilla", "Highlights entities through walls.", true),
    mod("Tracers", "Render", "Vanilla", "Draws lines to entities.", true),
    mod("NameTags", "Render", "Vanilla", "Renders enhanced name tags."),
    mod("StorageESP", "Render", "Vanilla", "Highlights containers and storage."),
    mod("XRay", "Render", "Bypass", "Only renders selected ores."),
    mod("Fullbright", "Render", "Vanilla", "Removes darkness.", true),
    mod("Trajectories", "Render", "Vanilla", "Predicts projectile paths."),
    mod("HUD", "Render", "Vanilla", "Renders the in-game HUD.", true),

    mod("AntiAFK", "Misc", "Vanilla", "Prevents being kicked for inactivity.", true),
    mod("Spammer", "Misc", "Bypass", "Sends messages on an interval."),
    mod("Announcer", "Misc", "Vanilla", "Announces client actions in chat."),
    mod("MiddleClickAction", "Misc", "Vanilla", "Binds an action to middle click."),

    mod("Disabler", "Exploit", "Bypass", "Bypasses anticheat checks."),
    mod("GhostHand", "Exploit", "Bypass", "Interacts through walls."),
    mod("NoRotate", "Exploit", "Bypass", "Ignores server rotation packets."),

    mod("AutoConfig", "Client", null, "Automatically loads configs for servers."),
    mod("Theme", "Client", null, "Manages the client theme."),
    mod("IRC", "Client", null, "Connects to the LiquidBounce IRC.")
];

const moduleKeys = {
    KillAura: "key.keyboard.r",
    Sprint: "key.keyboard.left.control",
    Velocity: "key.keyboard.v",
    Scaffold: "key.keyboard.y",
    ESP: "key.keyboard.e",
    Fullbright: "key.keyboard.g",
    Fly: "key.keyboard.f",
    AutoTotem: "key.keyboard.t",
    NoFall: "key.keyboard.n",
    Speed: "key.keyboard.b"
};

for (const module of mockModules) {
    const boundKey = moduleKeys[module.name];
    if (boundKey) module.keyBind.boundKey = boundKey;
}

function hud(id, name, description, horizontalAlignment, verticalAlignment, horizontalOffset, verticalOffset, settings = {}, width = undefined, height = undefined) {
    return {
        name,
        id,
        description,
        width,
        height,
        settings: {
            enabled: true,
            zIndex: 0,
            alignment: {horizontalAlignment, verticalAlignment, horizontalOffset, verticalOffset},
            ...settings
        }
    };
}

const mockHudComponents = [
    hud("watermark", "Watermark", "Client branding with live stats.", "Left", "Top", 8, 8,
        {showFps: true, showPing: true, showTime: true, showServer: true, timeFormat: "24h"}, 240, 32),
    hud("tabgui", "TabGui", "Category and module navigator.", "Left", "Top", 8, 48, {}, 150, 176),
    hud("arraylist", "ArrayList", "Enabled modules sorted by width.", "Right", "Top", 8, 8,
        {showTags: true, itemAlignment: "Right", order: "Descending"}, 190, 230),
    hud("hotbar", "Hotbar", "Health, hunger, armor and inventory slots.", "CenterTranslated", "Bottom", 0, 70, {}, 405, 92)
];

const nowIso = new Date().toISOString();

function marketItem(id, name, description, author, downloads, score, tagNames, featured = false) {
    return {
        item: {
            id,
            uid: `mock-${id}`,
            type: "Config",
            name,
            branch: "main",
            description,
            featured,
            created_at: nowIso,
            updated_at: nowIso,
            status: "Active",
            author,
            downloads,
            score,
            visibility: "public",
            tags: tagNames.map((tagName, index) => ({id: id * 100 + index, name: tagName})),
            target_servers: [],
            screenshots: [],
            can_edit: false,
            can_manage: false,
            contributors: [{uid: "mock", nickname: author}]
        },
        isSubscribed: false
    };
}

const mockMarketplace = {
    items: [
        marketItem(901, "Prestige Config", "The signature PrestigeBounce setup with tuned combat, movement and visuals.", "GlutenfreierKeks", 12480, 4.9, ["Combat", "Movement", "Visuals"], true),
        marketItem(902, "Aurora", "A soft visual configuration built around clean ESP, tracers and a minimal HUD.", "Nova", 8612, 4.7, ["Visuals", "HUD"]),
        marketItem(903, "Ranked Bedwars", "Fast bridging, safe scaffold and reliable combat settings for ranked queues.", "Vertex", 15340, 4.8, ["Combat", "Movement"]),
        marketItem(904, "Skyblock QoL", "Quality-of-life automation for farming, dungeons and storage management.", "Lumen", 6921, 4.5, ["World", "Player"]),
        marketItem(905, "Vanilla Plus", "Subtle improvements that keep the game feeling close to vanilla.", "Kite", 4380, 4.4, ["Vanilla", "HUD"]),
        marketItem(906, "Nightfall", "A dark visual preset with restrained accents and a compact HUD layout.", "Mira", 5145, 4.6, ["Visuals", "Theme"])
    ],
    pagination: {current: 1, pages: 1, items: 6}
};

const mockCategories = [
    {name: "Combat", icon: null},
    {name: "Movement", icon: null},
    {name: "Player", icon: null},
    {name: "World", icon: null},
    {name: "Render", icon: null},
    {name: "Misc", icon: null},
    {name: "Exploit", icon: null},
    {name: "Client", icon: null}
];

const routes = {
    "/api/v1/client/theme/prestigebounce": theme,
    "/api/v1/client/theme/claude": theme,
    "/api/v1/client/virtualScreen": {name: ""},
    "/api/v1/client/player": playerData,
    "/api/v1/client/player/inventory": inventory,
    "/api/v1/client/window": {
        width: 1920,
        height: 1080,
        scaledWidth: 960,
        scaledHeight: 540,
        scaleFactor: 2,
        guiScale: 2
    },
    "/api/v1/client/connection": {
        remoteAddress: "203.0.113.42:25565",
        serverAddress: "play.hypixel.net",
        proxy: false
    },
    "/api/v1/client/localStorage/all": {items: []},
    "/api/v1/client/info": {
        os: "windows",
        gameVersion: "1.21.4",
        clientVersion: "b2026-11-16",
        clientName: "LiquidBounce",
        development: true,
        fps: 240,
        gameDir: "gameDir",
        clientDir: "clientDir",
        inGame: false,
        viaFabricPlus: true,
        hasProtocolHack: true
    },
    "/api/v1/client/update": {
        development: true,
        commit: "a1b2c3d",
        update: null
    },
    "/api/v1/client/session": {
        username: "GlutenfreierKeks",
        type: "Microsoft",
        service: "Minecraft",
        avatar: `http://localhost:${PORT}/player-head.png`,
        online: true,
        uuid: "069a79f444e94726a5befca90e38aaf5"
    },
    "/api/v1/client/accounts": accounts,
    "/api/v1/client/servers": servers.filter((server) => !server.lan),
    "/api/v1/client/servers/lan": servers.filter((server) => server.lan),
    "/api/v1/client/spoofer": {
        name: "Spoofer",
        valueType: "CONFIGURABLE",
        value: [
            {name: "Enabled", valueType: "BOOLEAN", value: false},
            {name: "Mode", valueType: "CHOOSE", value: "Random", choices: ["Random", "Static"]},
            {name: "Spoof Address", valueType: "TEXT", value: ""}
        ]
    },
    "/api/v1/client/modules": mockModules,
    "/api/v1/client/modules/categories": mockCategories,
    "/api/v1/client/marketplace": mockMarketplace,
    "/api/v1/client/components/prestigebounce": mockHudComponents,
    "/api/v1/client/components/prestigebounce/catalog": mockHudComponents.map(component => ({
        name: component.name,
        description: component.description,
        id: component.id,
        singleton: true,
        canAdd: false
    })),
    "/api/v1/client/components/native": [],
    "/api/v1/client/components/native/catalog": [],
    "/api/v1/client/module/AutoConfig": {
        name: "AutoConfig",
        description: "",
        category: "OTHER",
        enabled: false,
        settings: null
    },
    "/api/v1/client/module/ClickGUI": {
        name: "ClickGUI",
        description: "Opens the client interface.",
        category: "Client",
        enabled: false,
        hidden: false,
        aliases: [],
        tag: null,
        keyBind: {boundKey: "key.keyboard.right.shift", action: "Toggle", modifiers: []}
    },
    "/api/v1/client/global": {
        name: "Global",
        valueType: "CONFIGURABLE",
        value: [
            {
                name: "Language",
                valueType: "CONFIGURABLE",
                value: [
                    {name: "Language", valueType: "CHOOSE", value: "English", choices: ["English", "German", "French"]}
                ]
            },
            {
                name: "Commands",
                valueType: "CONFIGURABLE",
                value: [
                    {name: "Prefix", valueType: "TEXT", value: ".", description: "Command prefix in chat"},
                    {name: "Chat Feedback", valueType: "BOOLEAN", value: true}
                ]
            },
            {
                name: "Targets",
                valueType: "CONFIGURABLE",
                value: [
                    {name: "Ignore Friends", valueType: "BOOLEAN", value: true},
                    {name: "Ignore Teams", valueType: "BOOLEAN", value: true}
                ]
            },
            {
                name: "Blink Manager",
                valueType: "CONFIGURABLE",
                value: [
                    {name: "Esp", valueType: "CHOOSE", value: "Wireframe", choices: ["Wireframe", "Box", "None"]},
                    {name: "Line", valueType: "COLOR", value: 4287331574}
                ]
            }
        ]
    },
    "/api/v1/client/protocols": [
        {name: "Auto", version: -1},
        {name: "1.21.4", version: 769},
        {name: "1.21", version: 767},
        {name: "1.20.4", version: 765},
        {name: "1.8.9", version: 47}
    ],
    "/api/v1/client/protocols/protocol": {name: "Auto", version: -1},
    "/api/v1/client/worlds": [
        {
            id: 1,
            name: "Prestige World",
            displayName: "Prestige World",
            lastPlayed: Date.now(),
            gameMode: "Survival",
            difficulty: "Normal",
            icon: icon("grass_block_side"),
            hardcore: false,
            commandsAllowed: true,
            version: "1.21.4"
        },
        {
            id: 2,
            name: "Skyblock Isles",
            displayName: "Skyblock Isles",
            lastPlayed: Date.now() - 86400000 * 2,
            gameMode: "Survival",
            difficulty: "Hard",
            icon: icon("stone"),
            hardcore: false,
            commandsAllowed: true,
            version: "1.21.4"
        },
        {
            id: 3,
            name: "Redstone Lab",
            displayName: "Redstone Lab",
            lastPlayed: Date.now() - 86400000 * 6,
            gameMode: "Creative",
            difficulty: "Peaceful",
            icon: icon("redstone_block"),
            hardcore: false,
            commandsAllowed: true,
            version: "1.21.4"
        },
        {
            id: 4,
            name: "Hardcore Run",
            displayName: "Hardcore Run",
            lastPlayed: Date.now() - 86400000 * 12,
            gameMode: "Survival",
            difficulty: "Hard",
            icon: icon("crying_obsidian"),
            hardcore: true,
            commandsAllowed: false,
            version: "1.21.4"
        }
    ],
    "/api/v1/client/proxies": [],
    "/api/v1/client/proxy": null
};

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const routePath = req.url.split("?")[0];
    let body = routes[routePath];

    if (routePath === "/__mock/health") {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({ok: true, port: PORT}));
        return;
    }

    if (routePath === "/api/v1/client/modules/toggle") {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({success: true}));
        return;
    }

    if (routePath === "/api/v1/client/hud-editor" || routePath === "/api/v1/client/typing") {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end("{}");
        return;
    }

    if (routePath === "/api/v1/client/modules/settings") {
        const url = new URL(req.url, "http://localhost");
        const moduleName = url.searchParams.get("name");

        if (moduleName === "ClickGUI") {
            body = {
                name: "ClickGUI",
                valueType: "CONFIGURABLE",
                value: [
                    {
                        name: "Menu",
                        valueType: "BIND",
                        value: {boundKey: "key.keyboard.right.shift", action: "Toggle", modifiers: []},
                        defaultValue: {boundKey: "key.keyboard.right.shift", action: "Toggle", modifiers: []}
                    }
                ]
            };
        } else {
            body = {
                name: "HUD",
                valueType: "CONFIGURABLE",
                value: [
                    {name: "SpaceSeperatedNames", valueType: "BOOLEAN", value: true}
                ]
            };
        }
    }

    if (routePath === "/player-head.png" || routePath === "/player-body.png") {
        res.writeHead(200, {"Content-Type": "image/png", "Cache-Control": "public, max-age=3600"});
        res.end(fs.readFileSync(path.join(ICON_DIR, routePath.slice(1))));
        return;
    }

    if (routePath === "/api/v1/client/resource/itemTexture") {
        const url = new URL(req.url, "http://localhost");
        const identifier = (url.searchParams.get("id") ?? "").replace("minecraft:", "");
        const candidates = [
            path.join(ICON_DIR, `${identifier}.png`),
            path.join(ICON_DIR, `${identifier.replace("block_of_", "")}.png`)
        ];
        const file = candidates.find(candidate => fs.existsSync(candidate));

        if (file) {
            res.writeHead(200, {"Content-Type": "image/png", "Cache-Control": "public, max-age=3600"});
            res.end(fs.readFileSync(file));
        } else {
            res.writeHead(200, {"Content-Type": "image/png"});
            res.end(Buffer.from(PNG, "base64"));
        }
        return;
    }

    if (routePath === "/api/v1/client/resource") {
        res.writeHead(200, {"Content-Type": "image/png"});
        res.end(Buffer.from(PNG, "base64"));
        return;
    }

    if (body === undefined) {
        console.log(`[mock] 404 ${req.method} ${req.url}`);
        res.writeHead(404, {"Content-Type": "application/json"});
        res.end(JSON.stringify({reason: "not mocked"}));
        return;
    }

    console.log(`[mock] 200 ${req.method} ${req.url}`);
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(body));
});

server.on("upgrade", (request, socket) => {
    const key = request.headers["sec-websocket-key"];

    if (!key) {
        socket.destroy();
        return;
    }

    const accept = createHash("sha1").update(key + WS_GUID).digest("base64");

    socket.write([
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${accept}`,
        "",
        ""
    ].join("\r\n"));

    // The preview is static, so no server events are needed. Keeping the
    // socket open prevents reconnect noise in the browser console.
    socket.on("data", () => {});
    socket.on("error", () => {});
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`[mock] client API listening on http://127.0.0.1:${PORT}`);
});
