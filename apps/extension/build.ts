import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { compile } from "sass";
import * as esbuild from "esbuild";
import type { PluginBuild } from "esbuild";
import AdmZip from "adm-zip";

import { solidPlugin } from "esbuild-plugin-solid";

const __dirname = import.meta.dirname || ".";
const projectRoot = join(__dirname, "..", "..");
const distDir = join(projectRoot, "dist");
const chromeDir = join(distDir, "chrome");
const firefoxDir = join(distDir, "firefox");
const srcDir = join(__dirname, "src");
const uiDir = join(projectRoot, "packages", "ui", "src");

const isWatch = Deno.args.includes("--watch");

// 1. Clean and create directories
if (!isWatch) {
  [chromeDir, firefoxDir].forEach((dir) => {
    if (existsSync(dir)) rmSync(dir, { recursive: true });
    mkdirSync(dir, { recursive: true });
  });
} else {
  [chromeDir, firefoxDir].forEach((dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  });
}

function compileSCSS() {
  console.log("Compiling SCSS...");
  try {
    const scssPath = join(uiDir, "styles", "app.scss");
    if (!existsSync(scssPath)) {
      console.log("app.scss does not exist yet, skipping SCSS compilation.");
      return;
    }
    const compiled = compile(scssPath, {
      sourceMap: false,
    });

    writeFileSync(join(chromeDir, "popup.css"), compiled.css);
    writeFileSync(join(chromeDir, "guide.css"), compiled.css);
    writeFileSync(join(firefoxDir, "popup.css"), compiled.css);
    writeFileSync(join(firefoxDir, "guide.css"), compiled.css);
    console.log("✓ SCSS compilation successful.");
  } catch (e) {
    console.error("SCSS compilation failed:", e);
    if (!isWatch) Deno.exit(1);
  }
}

function copyAssets() {
  console.log("Copying assets...");
  const assets = ["manifest.json", "popup.html", "guide.html"];

  // Read APP_NAME from constants.ts
  const constantsContent = readFileSync(
    join(projectRoot, "packages", "domain", "src", "constants.ts"),
    "utf8",
  );
  const appNameMatch = constantsContent.match(
    /export const APP_NAME = "([^"]+)";/,
  );
  const appName = appNameMatch ? appNameMatch[1] : "Gistwarden";
  const appNameLower = appName.toLowerCase().replace(/[^a-z0-9]/g, "");

  function copyAssetsToDir(targetDir: string, isFirefox = false) {
    assets.forEach((file) => {
      const filePath = join(srcDir, file);
      if (!existsSync(filePath)) return;
      let content: string;
      if (file === "manifest.json") {
        const manifest = JSON.parse(readFileSync(filePath, "utf8"));
        manifest.name = appName;
        if (isFirefox) {
          manifest.browser_specific_settings = {
            gecko: {
              id: `${appNameLower}@uongsuadaubung.github.io`,
              strict_min_version: "142.0",
              data_collection_permissions: {
                required: ["none"],
              },
            },
          };
          manifest.background = {
            scripts: ["background.js"],
            type: "module",
          };
        }
        content = JSON.stringify(manifest, null, 2);
      } else {
        content = readFileSync(filePath, "utf8").replaceAll(
          "Gistwarden",
          appName,
        );
      }
      writeFileSync(join(targetDir, file), content);
    });

    function copyDirRecursive(src: string, dest: string) {
      if (!existsSync(src)) return;
      if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
      readdirSync(src).forEach((item) => {
        if (item === "svg" || item.endsWith(".ts") || item.endsWith(".tsx")) {
          return;
        }
        const srcPath = join(src, item);
        const destPath = join(dest, item);
        if (statSync(srcPath).isDirectory()) {
          copyDirRecursive(srcPath, destPath);
        } else {
          copyFileSync(srcPath, destPath);
        }
      });
    }

    // Copy icons & images if exist in uiDir or srcDir
    copyDirRecursive(join(uiDir, "icons"), join(targetDir, "icons"));
    copyDirRecursive(join(srcDir, "icons"), join(targetDir, "icons"));
    copyDirRecursive(join(uiDir, "images"), join(targetDir, "images"));
    copyDirRecursive(join(srcDir, "images"), join(targetDir, "images"));
  }

  copyAssetsToDir(chromeDir);
  copyAssetsToDir(firefoxDir, true);
  console.log("✓ Assets copied successfully.");
}

function createZipPackages() {
  if (isWatch) return;
  console.log("Creating ZIP packages...");
  try {
    const chromeZip = new AdmZip();
    chromeZip.addLocalFolder(chromeDir);
    chromeZip.writeZip(join(distDir, "chrome.zip"));

    const firefoxZip = new AdmZip();
    firefoxZip.addLocalFolder(firefoxDir);
    firefoxZip.writeZip(join(distDir, "firefox.zip"));
    console.log("✓ ZIP packaging successful.");
  } catch (zipErr) {
    console.error("ZIP packaging failed:", zipErr);
    Deno.exit(1);
  }
}

async function runCommandOrExit(name: string, args: string[]) {
  console.log(`Running ${name}...`);
  const cmd = new Deno.Command(Deno.execPath(), {
    args,
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await cmd.output();
  if (code !== 0) {
    console.error(`❌ ${name} failed. Stopping build.`);
    Deno.exit(code);
  }
  console.log(`✓ ${name} passed.\n`);
}

async function runVerifications() {
  console.log("=====================================");
  console.log("1. Chạy Lint...");
  await runCommandOrExit("deno lint", ["lint"]);

  console.log("=====================================");
  console.log("2. Chạy Check...");
  await runCommandOrExit("deno check", ["check"]);

  console.log("=====================================");
  console.log("3. Chạy Test...");
  await runCommandOrExit("deno test", ["test", "-A"]);
  console.log("=====================================");
  console.log("Hoàn thành tất cả các bước kiểm tra!\n");
}

async function runBuild() {
  compileSCSS();
  copyAssets();

  // Entry points for bundling
  const entryPoints = {
    background: join(srcDir, "extension/background.ts"),
    "fido2-content-script": join(srcDir, "extension/fido2-content-script.ts"),
    "fido2-page-script": join(srcDir, "extension/fido2-page-script.ts"),
    "autofill-content-script": join(
      srcDir,
      "extension/autofill-content-script.ts",
    ),
    popup: join(srcDir, "popup-entry.tsx"),
    guide: join(srcDir, "guide-entry.tsx"),
  };

  // Custom path-alias resolver plugin for esbuild
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
        if (rel.startsWith("extension/")) {
          return { path: join(srcDir, rel) };
        }
        return { path: join(uiDir, rel) };
      });
    },
  };

  const buildOptions: esbuild.BuildOptions = {
    entryPoints,
    bundle: true,
    outdir: chromeDir,
    format: "esm",
    target: "es2022",
    sourcemap: false,
    minify: false,
    plugins: [solidPlugin(), pathAliasPlugin],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  };

  console.log("Bundling with esbuild...");
  try {
    if (isWatch) {
      const ctxChrome = await esbuild.context(buildOptions);
      const ctxFirefox = await esbuild.context({
        ...buildOptions,
        outdir: firefoxDir,
      });

      await ctxChrome.watch();
      await ctxFirefox.watch();
      console.log("Watching for changes in Chrome & Firefox extensions...");
    } else {
      await esbuild.build(buildOptions);
      await esbuild.build({
        ...buildOptions,
        outdir: firefoxDir,
      });
      console.log("✓ JS/TS bundling successful.");

      createZipPackages();
      console.log("\nDone! Extension Files in /dist:");
      console.log("  - chrome/        (unpacked directory)");
      console.log("  - firefox/       (unpacked directory)");
      console.log("  - chrome.zip     (packed for Chrome)");
      console.log("  - firefox.zip    (packed for Firefox)");

      esbuild.stop();
    }
  } catch (e) {
    console.error("Esbuild bundling failed:", e);
    esbuild.stop();
    if (!isWatch) Deno.exit(1);
  }
}

if (!isWatch) {
  await runVerifications();
}

await runBuild();
