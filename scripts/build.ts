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
import { join, relative } from "node:path";
import { zipSync } from "fflate";
import { SolidPlugin as solidPlugin } from "bun-plugin-solid";

const startTime = performance.now();
const projectRoot = join(import.meta.dirname || ".", "..");
const distDir = join(projectRoot, "dist");
const chromeDir = join(distDir, "chrome");
const firefoxDir = join(distDir, "firefox");
const webDistDir = join(distDir, "web");
const extSrcDir = join(projectRoot, "apps", "extension", "src");
const webSrcDir = join(projectRoot, "apps", "web", "src");
const uiDir = join(projectRoot, "packages", "ui", "src");

// Determine build target and flags from arguments
const args = process.argv.slice(2);
const validTargets = ["extension", "chrome", "firefox", "web", "all", "dev"];
const targetArg = args.find((a) => validTargets.includes(a)) || "extension";
const isFastDev = args.includes("--fast") || targetArg === "dev";

const buildChrome = ["extension", "chrome", "all", "dev"].includes(targetArg);
const buildFirefox = ["extension", "firefox", "all", "dev"].includes(targetArg);
const buildWeb = ["web", "all"].includes(targetArg);
const buildExtension = buildChrome || buildFirefox;

// Clean and create target output directories
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

function bundleCss(entryPath: string): string {
  if (!existsSync(entryPath)) return "";
  const dir = join(entryPath, "..");
  let content = readFileSync(entryPath, "utf8");
  content = content.replace(/@import\s+["'](\.\/[^"']+)["'];/g, (_, relPath) => {
    const importedFilePath = join(dir, relPath);
    return bundleCss(importedFilePath);
  });
  return content;
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
  const bundledAppCss = bundleCss(join(uiDir, "styles", "app.css"));

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

      // Copy bundled CSS assets
      writeFileSync(join(targetDir, "popup.css"), bundledAppCss);
      writeFileSync(join(targetDir, "guide.css"), bundledAppCss);
    };

    copyExtensionAssets(chromeDir);
    copyExtensionAssets(firefoxDir, true);
  }

  if (buildWeb) {
    const webHtmlPath = join(webSrcDir, "index.html");
    if (existsSync(webHtmlPath)) {
      let webHtmlContent = readFileSync(webHtmlPath, "utf8");
      webHtmlContent = webHtmlContent.replace("web-entry.tsx", "web-entry.js");
      writeFileSync(join(webDistDir, "index.html"), webHtmlContent);
    }
    writeFileSync(join(webDistDir, "web.css"), bundledAppCss);
  }

  console.log("✓ Assets copied successfully.");
}

function getFolderFilesRecursive(dir: string, baseDir: string): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relPath = relative(baseDir, fullPath).replace(/\\/g, "/");
    if (statSync(fullPath).isDirectory()) {
      Object.assign(files, getFolderFilesRecursive(fullPath, baseDir));
    } else {
      files[relPath] = new Uint8Array(readFileSync(fullPath));
    }
  }
  return files;
}

async function zipFolderNative(sourceDir: string, outputFile: string): Promise<void> {
  if (!existsSync(sourceDir)) return;
  const filesMap = getFolderFilesRecursive(sourceDir, sourceDir);
  if (Object.keys(filesMap).length === 0) return;
  const compressionLevel = isFastDev ? 1 : 9;
  const zipped = zipSync(filesMap, { level: compressionLevel });
  writeFileSync(outputFile, zipped);
}

async function createZipPackages() {
  if (!buildExtension) return;

  const chromeZipPath = join(distDir, "chrome.zip");
  const firefoxZipPath = join(distDir, "firefox.zip");

  const tasks: Promise<void>[] = [];

  // Skip chrome.zip in dev mode (Chrome uses unpacked dist/chrome)
  if (buildChrome && !isFastDev && !args.includes("--no-zip-chrome")) {
    tasks.push(zipFolderNative(chromeDir, chromeZipPath));
  }

  // Always create firefox.zip when building firefox (including dev mode)
  if (buildFirefox && !args.includes("--no-zip-firefox")) {
    tasks.push(zipFolderNative(firefoxDir, firefoxZipPath));
  }

  if (tasks.length > 0) {
    console.log("Creating ZIP packages...");
    try {
      await Promise.all(tasks);
      console.log("✓ ZIP packaging successful.");
    } catch (zipErr) {
      console.error("ZIP packaging failed:", zipErr);
      process.exit(1);
    }
  }
}

async function runCommandOrExit(name: string, command: string, cmdArgs: string[]) {
  const proc = Bun.spawn([command, ...cmdArgs], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: projectRoot,
  });

  const [stdoutStr, stderrStr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    console.error(`\n❌ ${name} failed! Error output:\n`);
    if (stdoutStr.trim()) console.error(stdoutStr);
    if (stderrStr.trim()) console.error(stderrStr);
    process.exit(exitCode ?? 1);
  }
}

async function runVerifications() {
  console.log("Running TypeCheck & Tests...");
  try {
    await Promise.all([
      runCommandOrExit("bun typecheck", "bun", ["run", "typecheck"]),
      runCommandOrExit("bun test", "bun", ["test"]),
    ]);
    console.log("✓ TypeCheck & Tests passed.");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(errorMsg);
    process.exit(1);
  }
}

async function buildTargetDirectory(outputDir: string) {
  const extEntryPoints = [
    join(extSrcDir, "extension/background.ts"),
    join(extSrcDir, "extension/fido2-content-script.ts"),
    join(extSrcDir, "extension/fido2-page-script.ts"),
    join(extSrcDir, "extension/autofill-content-script.ts"),
    join(extSrcDir, "popup-entry.tsx"),
    join(extSrcDir, "guide-entry.tsx"),
  ];

  const buildResult = await Bun.build({
    entrypoints: extEntryPoints,
    outdir: outputDir,
    target: "browser",
    format: "iife",
    naming: "[name].[ext]",
    plugins: [solidPlugin()],
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  });

  if (!buildResult.success) {
    console.error(`Bun.build failed for ${outputDir}:`, buildResult.logs);
    process.exit(1);
  }

  // Rename popup-entry.js -> popup.js & guide-entry.js -> guide.js
  const popupEntryJs = join(outputDir, "popup-entry.js");
  const popupJs = join(outputDir, "popup.js");
  if (existsSync(popupEntryJs)) {
    if (existsSync(popupJs)) rmSync(popupJs);
    copyFileSync(popupEntryJs, popupJs);
    rmSync(popupEntryJs);
  }

  const guideEntryJs = join(outputDir, "guide-entry.js");
  const guideJs = join(outputDir, "guide.js");
  if (existsSync(guideEntryJs)) {
    if (existsSync(guideJs)) rmSync(guideJs);
    copyFileSync(guideEntryJs, guideJs);
    rmSync(guideEntryJs);
  }
}

async function runBuild() {
  copyAssets();
  console.log(`Bundling with Bun.build (${targetArg.toUpperCase()})...`);
  try {
    if (buildExtension) {
      await buildTargetDirectory(chromeDir);
      readdirSync(chromeDir).forEach((file) => {
        if (file.endsWith(".js")) {
          copyFileSync(join(chromeDir, file), join(firefoxDir, file));
        }
      });
    }

    if (buildWeb) {
      const webResult = await Bun.build({
        entrypoints: [join(webSrcDir, "web-entry.tsx")],
        outdir: webDistDir,
        target: "browser",
        naming: "[name].[ext]",
        plugins: [solidPlugin()],
        define: { "process.env.NODE_ENV": JSON.stringify("production") },
      });

      if (!webResult.success) {
        console.error("Bun.build failed for web:", webResult.logs);
        process.exit(1);
      }
    }

    console.log("✓ Bundling with Bun.build successful.");
    if (buildExtension) {
      await createZipPackages();
    }

    console.log("\nDone! Output files in /dist:");
    if (buildExtension) {
      if (buildChrome) console.log("  - chrome/        (unpacked Extension)");
      if (buildFirefox) console.log("  - firefox/       (unpacked Extension)");
      if (buildChrome && !isFastDev && !args.includes("--no-zip-chrome")) {
        console.log("  - chrome.zip     (packed Chrome ZIP)");
      }
      if (buildFirefox && !args.includes("--no-zip-firefox")) {
        console.log("  - firefox.zip    (packed Firefox ZIP)");
      }
    }
    if (buildWeb) {
      console.log("  - web/           (standalone Web App)");
    }
  } catch (e) {
    console.error("Bun.build failed:", e);
    process.exit(1);
  }
}

if (!args.includes("--no-test")) {
  await Promise.all([runVerifications(), runBuild()]);
} else {
  await runBuild();
}
const duration = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(`\n🎉 Total build time: ${duration}s`);
