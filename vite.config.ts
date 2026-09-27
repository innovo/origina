import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/** Local dev without DATABASE_URL: boot the embedded PGLite DB before traffic. */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "origina:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
        ensureDbReady?: () => Promise<void>;
      };
      await mod.ensureDbReady?.();
    },
  };
}

// NITRO_PRESET picks the deploy target: "vercel" (default) or "node-server"
// for a VPS / Docker (`node .output/server/index.mjs`).
const nitroPreset = process.env.NITRO_PRESET ?? "vercel";

export default defineConfig(({ command, isPreview }) => ({
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  preview: { host: "127.0.0.1", port: 8081, strictPort: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview ? [nitro({ preset: nitroPreset })] : []),
    viteReact(),
  ],
}));
