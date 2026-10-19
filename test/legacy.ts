// Loads modules of the last pre-Nuxt version straight from git history, so the tests can prove
// that migrated data and texts are unchanged without keeping the old files around.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Last commit of the hand-rolled Vite app (main before the Nuxt migration). */
export const LEGACY_COMMIT = "5226b0764be369f44c7b2b81471db22b79b6fb3b";

export function legacyAvailable(): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${LEGACY_COMMIT}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

let dir: string | undefined;

export async function importLegacy<T = Record<string, unknown>>(file: string): Promise<T> {
  dir ??= mkdtempSync(join(tmpdir(), "vk-legacy-"));
  const source = execFileSync("git", ["show", `${LEGACY_COMMIT}:${file}`], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const target = join(dir, file);
  writeFileSync(target, source);
  return import(/* @vite-ignore */ pathToFileURL(target).href) as Promise<T>;
}
