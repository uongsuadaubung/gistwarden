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
import * as esbuild from "esbuild";
import type { PluginBuild } from "esbuild";
import AdmZip from "adm-zip";

import { solidPlugin } from "esbuild-plugin-solid";
const startTime = performance.now();
const projectRoot = join(import.meta.dirname || ".", "..");
const distDir = join(projectRoot, "dist");
const chromeDir = join(distDir, "chrome");
const firefoxDir = join(distDir, "firefox");
const webDistDir = join(distDir, "web");
const extSrcDir = join(projectRoot, "apps", "extension", "src");
const webSrcDir = join(projectRoot, "apps", "web", "src");
const uiDir = join(projectRoot, "packages", "ui", "src");

// Determine build target from arguments: "extension" (default), "web", or "all"
const targetArg =
  Deno.args.find((a) => ["extension", "web", "all"].includes(a)) || "extension";
const isWatch = Deno.args.includes("--watch");

const buildExtension = targetArg === "extension" || targetArg === "all";
const buildWeb = targetArg === "web" || targetArg === "all";

// Clean and create target output directories
if (!isWatch) {
  if (buildExtension) {
    [chromeDir, firefoxDir].forEach((dir) => {
      if (existsSync(dir)) rmSync(dir, { recursive: true });
      mkdirSync(dir, { recursive: true });
    });
  }
  if (buildWeb) {
    if (existsSync(webDistDir)) rmSync(webDistDir, { recursive: true });
    mkdirSync(webDistDir, { recursive: true });
  }
}

function copyAssets() {
  console.log(`Copying assets (${targetArg.toUpperCase()} mode)...`);

  const constantsContent = readFileSync(
    join(projectRoot, "packages", "domain", "src", "constants.ts"),
    "utf8",
  );
  const appNameMatch = constantsContent.match(
    /export const APP_NAME = "([^"]+)";/,
  );
  const appName = appNameMatch ? appNameMatch[1] : "Gistwarden";
  const appNameLower = appName.toLowerCase().replace(/[^a-z0-9]/g, "");

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

  if (buildExtension) {
    const assets = ["manifest.json", "popup.html", "guide.html"];
    const copyExtensionAssets = (targetDir: string, isFirefox = false) => {
      assets.forEach((file) => {
        const filePath = join(extSrcDir, file);
        if (!existsSync(filePath)) return;
        let content = readFileSync(filePath, "utf8");

        if (file === "manifest.json") {
          const manifestObj = JSON.parse(content);
          manifestObj.name = appName;
          manifestObj.action.default_title = appName;

          if (isFirefox) {
            delete manifestObj.background.service_worker;
            manifestObj.background.scripts = [
              "background.js",
              "fido2-content-script.js",
            ];
            manifestObj.browser_specific_settings = {
              gecko: {
                id: `${appNameLower}@gistwarden.org`,
                strict_min_version: "109.0",
              },
            };
          }
          content = JSON.stringify(manifestObj, null, 2);
        }
        writeFileSync(join(targetDir, file), content);
      });

      copyDirRecursive(join(uiDir, "icons"), join(targetDir, "icons"));
      copyDirRecursive(join(extSrcDir, "icons"), join(targetDir, "icons"));
      copyDirRecursive(join(uiDir, "images"), join(targetDir, "images"));
      copyDirRecursive(join(extSrcDir, "images"), join(targetDir, "images"));
    };

    copyExtensionAssets(chromeDir);
    copyExtensionAssets(firefoxDir, true);
  }

  if (buildWeb) {
    const webHtmlPath = join(webSrcDir, "index.html");
    if (existsSync(webHtmlPath)) {
      const webHtmlContent = readFileSync(webHtmlPath, "utf8");
      writeFileSync(join(webDistDir, "index.html"), webHtmlContent);
    }
  }

  console.log("✓ Assets copied successfully.");
}

async function createZipPackages() {
  if (isWatch || !buildExtension) return;
  console.log("Creating ZIP packages...");
  try {
    await Promise.all([
      Promise.resolve().then(() => {
        const chromeZip = new AdmZip();
        chromeZip.addLocalFolder(chromeDir);
        chromeZip.writeZip(join(distDir, "chrome.zip"));
      }),
      Promise.resolve().then(() => {
        const firefoxZip = new AdmZip();
        firefoxZip.addLocalFolder(firefoxDir);
        firefoxZip.writeZip(join(distDir, "firefox.zip"));
      }),
    ]);
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
  console.log("Chạy kiểm tra song song (Lint, Check, Test)...");
  try {
    await Promise.all([
      runCommandOrExit("deno lint", ["lint"]),
      runCommandOrExit("deno check", ["check"]),
      runCommandOrExit("deno test", ["test", "-A", "--no-check"]),
    ]);
    console.log("=====================================");
    console.log("Hoàn thành tất cả các bước kiểm tra!\n");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(errorMsg);
    Deno.exit(1);
  }
}

async function runBuild() {
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
          return { path: join(extSrcDir, rel) };
        }
        return { path: join(uiDir, rel) };
      });
    },
  };

  const builds: Promise<unknown>[] = [];

  if (buildExtension) {
    const extEntryPoints = [
      { in: join(extSrcDir, "extension/background.ts"), out: "background" },
      {
        in: join(extSrcDir, "extension/fido2-content-script.ts"),
        out: "fido2-content-script",
      },
      {
        in: join(extSrcDir, "extension/fido2-page-script.ts"),
        out: "fido2-page-script",
      },
      {
        in: join(extSrcDir, "extension/autofill-content-script.ts"),
        out: "autofill-content-script",
      },
      { in: join(extSrcDir, "popup-entry.tsx"), out: "popup" },
      { in: join(extSrcDir, "guide-entry.tsx"), out: "guide" },
      { in: join(uiDir, "styles", "app.css"), out: "popup" },
      { in: join(uiDir, "styles", "app.css"), out: "guide" },
    ];

    const extBuildOptions: esbuild.BuildOptions = {
      entryPoints: extEntryPoints,
      bundle: true,
      outdir: chromeDir,
      format: "esm",
      target: "es2022",
      sourcemap: false,
      minify: false,
      plugins: [solidPlugin(), pathAliasPlugin],
      define: { "process.env.NODE_ENV": '"production"' },
    };

    if (isWatch) {
      const ctxChrome = await esbuild.context(extBuildOptions);
      const ctxFirefox = await esbuild.context({
        ...extBuildOptions,
        outdir: firefoxDir,
      });
      await ctxChrome.watch();
      await ctxFirefox.watch();
    } else {
      builds.push(esbuild.build(extBuildOptions));
      builds.push(esbuild.build({ ...extBuildOptions, outdir: firefoxDir }));
    }
  }

  if (buildWeb) {
    const webBuildOptions: esbuild.BuildOptions = {
      entryPoints: [
        { in: join(webSrcDir, "web-entry.tsx"), out: "web-entry" },
        { in: join(uiDir, "styles", "app.css"), out: "web" },
      ],
      bundle: true,
      outdir: webDistDir,
      format: "esm",
      target: "es2022",
      sourcemap: false,
      minify: false,
      plugins: [solidPlugin(), pathAliasPlugin],
      define: { "process.env.NODE_ENV": '"production"' },
    };

    if (isWatch) {
      const ctxWeb = await esbuild.context(webBuildOptions);
      await ctxWeb.watch();
    } else {
      builds.push(esbuild.build(webBuildOptions));
    }
  }

  console.log(`Bundling esbuild targets (${targetArg.toUpperCase()})...`);
  try {
    if (!isWatch) {
      await Promise.all(builds);
      console.log("✓ Bundling successful.");
      if (buildExtension) await createZipPackages();

      console.log("\nDone! Output files in /dist:");
      if (buildExtension) {
        console.log("  - chrome/        (unpacked Extension)");
        console.log("  - firefox/       (unpacked Extension)");
        console.log("  - chrome.zip     (packed Chrome ZIP)");
        console.log("  - firefox.zip    (packed Firefox ZIP)");
      }
      if (buildWeb) {
        console.log("  - web/           (standalone Web App)");
      }
      esbuild.stop();
    } else {
      console.log("Watching for changes...");
    }
  } catch (e) {
    console.error("Esbuild bundling failed:", e);
    esbuild.stop();
    if (!isWatch) Deno.exit(1);
  }
}

if (!isWatch) {
  await Promise.all([runVerifications(), runBuild()]);
  const duration = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Total build time: ${duration}s`);
} else {
  await runBuild();
}
