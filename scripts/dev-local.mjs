import {spawn} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import process from "node:process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vitePort = Number(process.env.VITE_PORT ?? 5173);
const mockPort = Number(process.env.MOCK_PORT ?? 54812);
const base = `http://localhost:${vitePort}`;
const children = [];
let stopping = false;

function spawnChild(command, args, options = {}) {
    const child = spawn(command, args, {
        cwd: root,
        stdio: "inherit",
        ...options
    });

    child.on("exit", code => {
        if (stopping) {
            return;
        }

        console.error(`[dev] ${command} stopped unexpectedly (${code ?? "unknown"}).`);
        stop(code ?? 1);
    });

    children.push(child);
    return child;
}

function killTree(child) {
    if (!child || child.exitCode !== null) {
        return;
    }

    if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
            stdio: "ignore",
            windowsHide: true
        });
        return;
    }

    child.kill("SIGTERM");
}

function stop(code = 0) {
    if (stopping) {
        return;
    }

    stopping = true;
    children.forEach(killTree);
    process.exit(code);
}

async function isUp(url) {
    try {
        const response = await fetch(url, {signal: AbortSignal.timeout(1500)});
        return response.ok;
    } catch {
        return false;
    }
}

async function waitFor(url, label, timeout = 30000) {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
        if (await isUp(url)) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 350));
    }

    throw new Error(`${label} did not become ready at ${url}`);
}

function openBrowser(url) {
    if (process.env.NO_OPEN) {
        return;
    }

    if (process.platform === "win32") {
        spawn("cmd", ["/c", "start", "", url], {
            detached: true,
            stdio: "ignore",
            windowsHide: true
        }).unref();
    } else if (process.platform === "darwin") {
        spawn("open", [url], {detached: true, stdio: "ignore"}).unref();
    } else {
        spawn("xdg-open", [url], {detached: true, stdio: "ignore"}).unref();
    }
}

function preview(route) {
    return `${base}/#/${route}?port=${mockPort}&static`;
}

async function main() {
    const mockHealth = `http://127.0.0.1:${mockPort}/__mock/health`;
    const viteRoot = `${base}/`;

    if (await isUp(mockHealth)) {
        console.log(`[dev] Reusing the mock API on port ${mockPort}.`);
    } else {
        console.log(`[dev] Starting the mock API on port ${mockPort}...`);
        spawnChild(process.execPath, [path.join(root, "dev", "mock-server.mjs")], {
            env: {...process.env, MOCK_PORT: String(mockPort)}
        });
        await waitFor(mockHealth, "Mock API");
    }

    if (await isUp(viteRoot)) {
        console.log(`[dev] Reusing Vite on port ${vitePort}.`);
    } else {
        console.log(`[dev] Starting Vite on port ${vitePort}...`);
        const viteArgs = ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(vitePort), "--strictPort"];

        if (process.platform === "win32") {
            spawnChild(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `npm ${viteArgs.join(" ")}`]);
        } else {
            spawnChild("npm", viteArgs);
        }

        await waitFor(viteRoot, "Vite");
    }

    console.log("");
    console.log("[dev] PrestigeBounce local preview is ready.");
    console.log(`[dev] Open: ${preview("title")}`);
    console.log("");
    console.log("[dev] Try:");
    for (const route of ["clickgui", "hud", "inventory", "multiplayer", "singleplayer", "altmanager", "proxymanager", "connecting", "disconnected"]) {
        console.log(`[dev]   ${preview(route)}`);
    }
    console.log("");
    console.log("[dev] In-game live preview:");
    console.log(`[dev]   .client theme set ${base}/`);
    console.log("");
    console.log("[dev] Press Ctrl+C to stop the local preview.");
    console.log("");

    openBrowser(preview("title"));
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

main().catch(error => {
    console.error(`[dev] ${error.message}`);
    stop(1);
});
