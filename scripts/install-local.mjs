import {cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const themeFolder = process.env.THEME_FOLDER ?? "prestigebounce-local";
const appData = process.env.APPDATA ?? "";
const home = process.env.USERPROFILE ?? process.env.HOME ?? "";

const candidates = [
    process.env.LIQUIDBOUNCE_DIR,
    path.join(appData, "CCBlueX", "LiquidLauncher", "data", "gameDir", "nextgen", "LiquidBounce"),
    path.join(appData, "CCBlueX", "LiquidLauncher", "data", "gameDir", "legacy", "LiquidBounce"),
    path.join(appData, ".minecraft", "LiquidBounce"),
    path.join(home, ".liquidbounce")
].filter(Boolean);

if (!existsSync(path.join(dist, "metadata.json"))) {
    console.error("[install] dist/metadata.json is missing. Run `npm run build` first.");
    process.exit(1);
}

const liquidBounce = candidates.find(candidate => existsSync(path.join(candidate, "themes")))
    ?? candidates.find(candidate => existsSync(candidate));

if (!liquidBounce) {
    console.error("[install] Could not find a LiquidBounce installation.");
    console.error("[install] Set LIQUIDBOUNCE_DIR to the LiquidBounce game directory and try again.");
    process.exit(1);
}

const target = path.join(liquidBounce, "themes", themeFolder);

rmSync(target, {recursive: true, force: true});
mkdirSync(target, {recursive: true});
cpSync(dist, target, {recursive: true});

// Give the local copy its own id so it can live next to the marketplace build.
const metadataPath = path.join(target, "metadata.json");
const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
metadata.id = themeFolder;
metadata.name = `${metadata.name} Local`;
writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`[install] Installed the current build to:`);
console.log(`[install]   ${target}`);
console.log("");
console.log("[install] In LiquidBounce, run:");
console.log("[install]   .client theme reload");
console.log(`[install]   .client theme set ${themeFolder}`);
