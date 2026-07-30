import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { compile } from "sass";
import * as esbuild from "esbuild";
import type { PluginBuild } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const __dirname = import.meta.dirname || ".";
const projectRoot = join(__dirname, "..", "..");
const distDir = join(projectRoot, "dist");
const webDistDir = join(distDir, "web");
const srcDir = join(__dirname, "src");
const uiDir = join(projectRoot, "packages", "ui", "src");

const isWatch = Deno.args.includes("--watch");

// 1. Clean and create web output directory
if (!isWatch) {
  if (existsSync(webDistDir)) rmSync(webDistDir, { recursive: true });
  mkdirSync(webDistDir, { recursive: true });
} else {
  if (!existsSync(webDistDir)) mkdirSync(webDistDir, { recursive: true });
}

function compileSCSS() {
  console.log("Compiling SCSS for Web App...");
  try {
    const scssPath = join(uiDir, "styles", "app.scss");
    if (!existsSync(scssPath)) {
      console.log("app.scss does not exist, skipping SCSS compilation.");
      return;
    }
    const compiled = compile(scssPath, { sourceMap: false });
    writeFileSync(join(webDistDir, "web.css"), compiled.css);
    console.log("✓ SCSS compilation successful.");
  } catch (e) {
    console.error("SCSS compilation failed:", e);
    if (!isWatch) Deno.exit(1);
  }
}

function copyAssets() {
  console.log("Copying Web assets...");
  const htmlPath = join(srcDir, "index.html");
  if (existsSync(htmlPath)) {
    const content = readFileSync(htmlPath, "utf8");
    writeFileSync(join(webDistDir, "index.html"), content);
  }
  console.log("✓ Web assets copied successfully.");
}

async function runBuild() {
  compileSCSS();
  copyAssets();

  const pathAliasPlugin = {
    name: "path-alias",
    setup(build: PluginBuild) {
      build.onResolve({ filter: /^@gistwarden\/domain/ }, () => {
        return { path: join(projectRoot, "packages", "domain", "mod.ts") };
      });
      build.onResolve({ filter: /^@gistwarden\/repository/ }, () => {
        return { path: join(projectRoot, "packages", "repository", "mod.ts") };
      });
      build.onResolve({ filter: /^@gistwarden\/network/ }, () => {
        return { path: join(projectRoot, "packages", "network", "mod.ts") };
      });
      build.onResolve({ filter: /^@gistwarden\/orchestrator/ }, () => {
        return {
          path: join(projectRoot, "packages", "orchestrator", "mod.ts"),
        };
      });
      build.onResolve({ filter: /^@gistwarden\/ui/ }, () => {
        return { path: join(projectRoot, "packages", "ui", "mod.ts") };
      });
      build.onResolve({ filter: /^zxcvbn$/ }, () => {
        const p1 = join(
          projectRoot,
          "node_modules",
          ".deno",
          "@zxcvbn-ts+core@3.0.4",
          "node_modules",
          "@zxcvbn-ts",
          "core",
          "dist",
          "index.esm.js",
        );
        const p2 = join(
          projectRoot,
          "node_modules",
          "@zxcvbn-ts",
          "core",
          "dist",
          "index.esm.js",
        );
        return { path: existsSync(p1) ? p1 : p2 };
      });
      build.onResolve({ filter: /^@\// }, (args) => {
        const rel = args.path.substring(2);
        if (
          rel.startsWith("core/crypto") || rel.startsWith("core/totp-utils") ||
          rel.startsWith("core/session-manager") ||
          rel.startsWith("core/session-signal") ||
          rel.startsWith("core/types") || rel.startsWith("core/constants") ||
          rel.startsWith("core/generator-utils") ||
          rel.startsWith("core/domain-utils") ||
          rel.startsWith("core/cbor-utils") ||
          rel.startsWith("core/wordlist") ||
          rel.startsWith("core/csv-parser") ||
          rel.startsWith("core/json-utils") ||
          rel.startsWith("core/i18n") || rel.startsWith("core/locales")
        ) {
          return {
            path: join(
              projectRoot,
              "packages",
              "domain",
              "src",
              rel.substring(5),
            ),
          };
        }
        if (
          rel.startsWith("core/storage") ||
          rel.startsWith("core/storage-schemas")
        ) {
          return {
            path: join(
              projectRoot,
              "packages",
              "repository",
              "src",
              rel.substring(5),
            ),
          };
        }
        if (rel.startsWith("core/fetch-utils")) {
          return {
            path: join(
              projectRoot,
              "packages",
              "network",
              "src",
              "fetch-utils.ts",
            ),
          };
        }
        if (rel.startsWith("providers/")) {
          return {
            path: join(
              projectRoot,
              "packages",
              "network",
              "src",
              rel.substring(10),
            ),
          };
        }
        if (
          rel.startsWith("core/session-usecases") ||
          rel.startsWith("core/app-init") ||
          rel.startsWith("core/messaging") ||
          rel.startsWith("core/messaging-contracts") ||
          rel.startsWith("core/alarms") || rel.startsWith("core/idle") ||
          rel.startsWith("core/ui-service")
        ) {
          return {
            path: join(
              projectRoot,
              "packages",
              "orchestrator",
              "src",
              rel.substring(5),
            ),
          };
        }
        return { path: join(uiDir, rel) };
      });
    },
  };

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: {
      "web-entry": join(srcDir, "web-entry.tsx"),
    },
    bundle: true,
    outdir: webDistDir,
    format: "esm",
    target: "es2022",
    sourcemap: false,
    minify: false,
    plugins: [solidPlugin(), pathAliasPlugin],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  };

  console.log("Bundling Web App with esbuild...");
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log("Watching for Web App changes...");
    } else {
      await esbuild.build(buildOptions);
      console.log("✓ Web App JS/TS bundling successful.");
      console.log("\nDone! Web App Files in /dist/web:");
      console.log("  - index.html");
      console.log("  - web-entry.js");
      console.log("  - web.css");

      esbuild.stop();
    }
  } catch (e) {
    console.error("Web App Esbuild bundling failed:", e);
    esbuild.stop();
    if (!isWatch) Deno.exit(1);
  }
}

await runBuild();
