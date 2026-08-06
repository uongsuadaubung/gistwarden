/**
 * ============================================================================
 * GISTWARDEN BUILD SCRIPT & CLI DOCUMENTATION
 * ============================================================================
 *
 * Mô tả:
 * Script đóng gói đa mục tiêu cho Gistwarden hỗ trợ 4 chế độ build chính:
 *
 * 1. `dev` (Development Mode - Mặc định):
 *    - Build duy nhất thư mục `dist/chrome` (Unpacked Extension cho Chrome/Edge).
 *    - Nén `dist/chrome` sang `chrome.zip` bằng mức nén nhanh nhất (`Fastest`).
 *    - Copy `chrome.zip` sang `firefox.zip` và tráo file `manifest.json` chuẩn Firefox vào.
 *    - Xóa file tạm `chrome.zip` (vì Chrome chạy trực tiếp thư mục `dist/chrome`).
 *    - Đầu ra: `dist/chrome/` và `dist/firefox.zip`.
 *
 * 2. `extension` (Extension Release Mode):
 *    - Build thư mục `dist/chrome` và copy sang thư mục `dist/firefox`.
 *    - Tạo file `manifest.json` chuẩn cho Firefox trong `dist/firefox`.
 *    - Nén cả 2 thư mục thành `dist/chrome.zip` và `dist/firefox.zip`.
 *    - Đầu ra: `dist/chrome/`, `dist/firefox/`, `dist/chrome.zip`, `dist/firefox.zip`.
 *
 * 3. `web` (Web Application Mode):
 *    - Build ứng dụng Web độc lập vào thư mục `dist/web`.
 *    - Đầu ra: `dist/web/`.
 *
 * 4. `all` (Full Release Mode):
 *    - Thực hiện cả 2 quy trình `extension` và `web` với mức nén cao nhất (`Optimal`).
 *    - Đầu ra: `dist/chrome/`, `dist/firefox/`, `dist/chrome.zip`, `dist/firefox.zip`, `dist/web/`.
 *
 * Cú pháp chạy:
 *   bun run build [dev | extension | web | all]
 * ============================================================================
 */

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
import { execSync } from "node:child_process";
import { join } from "node:path";
import * as esbuild from "esbuild";
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

// Determine build target and flags from CLI arguments
const args = process.argv.slice(2);
const validTargets = ["dev", "extension", "web", "all"];
const targetArg = args.find((a) => validTargets.includes(a)) || "dev";

const isDevMode = targetArg === "dev";
const isExtensionMode = targetArg === "extension";
const isWebMode = targetArg === "web";
const isAllMode = targetArg === "all";

const isFastDev = isDevMode || args.includes("--fast");
const isHighCompression = isAllMode ||
  (isExtensionMode && !args.includes("--fast"));

const buildChrome = isDevMode || isExtensionMode || isAllMode;
const buildFirefox = isDevMode || isExtensionMode || isAllMode;
const buildWeb = isWebMode || isAllMode;
const buildExtension = buildChrome || buildFirefox;

// Clean and create target output directories
if (buildExtension) {
  if (existsSync(chromeDir)) rmSync(chromeDir, { recursive: true });
  mkdirSync(chromeDir, { recursive: true });

  if (isExtensionMode || isAllMode) {
    if (existsSync(firefoxDir)) rmSync(firefoxDir, { recursive: true });
    mkdirSync(firefoxDir, { recursive: true });
  }
}
if (buildWeb) {
  if (existsSync(webDistDir)) rmSync(webDistDir, { recursive: true });
  mkdirSync(webDistDir, { recursive: true });
}

function bundleCss(entryPath: string): string {
  if (!existsSync(entryPath)) return "";
  const dir = join(entryPath, "..");
  let content = readFileSync(entryPath, "utf8");
  content = content.replace(
    /@import\s+["'](\.\/[^"']+)["'];/g,
    (_, relPath) => {
      const importedFilePath = join(dir, relPath);
      return bundleCss(importedFilePath);
    },
  );
  return content;
}

function getFirefoxManifestContent(): string {
  const filePath = join(extSrcDir, "manifest.json");
  if (!existsSync(filePath)) return "";
  let content = readFileSync(filePath, "utf8");
  const manifestObj = JSON.parse(content);
  const constantsContent = readFileSync(
    join(projectRoot, "packages", "domain", "src", "constants.ts"),
    "utf8",
  );
  const appNameMatch = constantsContent.match(
    /export const APP_NAME = "([^"]+)";/,
  );
  const appName = appNameMatch ? appNameMatch[1] : "Gistwarden";
  const appNameLower = appName.toLowerCase().replace(/[^a-z0-9]/g, "");

  manifestObj.name = appName;
  manifestObj.action.default_title = appName;
  manifestObj.background = {
    scripts: ["background.js"],
    type: "module",
  };
  manifestObj.browser_specific_settings = {
    gecko: {
      id: `${appNameLower}@uongsuadaubung.github.io`,
      strict_min_version: "142.0",
      data_collection_permissions: {
        required: ["none"],
      },
    },
  };
  manifestObj.web_accessible_resources = [
    {
      resources: ["gistwarden_wasm_bg.wasm"],
      matches: ["<all_urls>"],
    },
  ];
  return JSON.stringify(manifestObj, null, 2);
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
    const copyExtensionAssetsToDir = (targetDir: string, isFirefox = false) => {
      assets.forEach((file) => {
        const filePath = join(extSrcDir, file);
        if (!existsSync(filePath)) return;
        let content = readFileSync(filePath, "utf8");

        if (file === "manifest.json") {
          if (isFirefox) {
            content = getFirefoxManifestContent();
          } else {
            const manifestObj = JSON.parse(content);
            manifestObj.name = appName;
            manifestObj.action.default_title = appName;
            manifestObj.web_accessible_resources = [
              {
                resources: ["gistwarden_wasm_bg.wasm"],
                matches: ["<all_urls>"],
              },
            ];
            content = JSON.stringify(manifestObj, null, 2);
          }
        }
        writeFileSync(join(targetDir, file), content);
      });

      copyDirRecursive(join(uiDir, "icons"), join(targetDir, "icons"));
      copyDirRecursive(join(extSrcDir, "icons"), join(targetDir, "icons"));
      copyDirRecursive(join(uiDir, "images"), join(targetDir, "images"));
      copyDirRecursive(join(extSrcDir, "images"), join(targetDir, "images"));

      writeFileSync(join(targetDir, "popup.css"), bundledAppCss);
      writeFileSync(join(targetDir, "guide.css"), bundledAppCss);

      const wasmBinaryPath = join(
        projectRoot,
        "packages",
        "domain",
        "src",
        "wasm",
        "generated",
        "gistwarden_wasm_bg.wasm",
      );
      if (existsSync(wasmBinaryPath)) {
        copyFileSync(
          wasmBinaryPath,
          join(targetDir, "gistwarden_wasm_bg.wasm"),
        );
      }
    };

    copyExtensionAssetsToDir(chromeDir, false);

    if (isExtensionMode || isAllMode) {
      copyExtensionAssetsToDir(firefoxDir, true);
    }
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

async function zipFolderNative(
  sourceDir: string,
  outputFile: string,
): Promise<void> {
  if (!existsSync(sourceDir)) return;
  if (existsSync(outputFile)) {
    try {
      rmSync(outputFile, { force: true });
    } catch {
      // Ignore transient file handle lock
    }
  }

  const zipLevelFlag = isHighCompression ? "-9" : "-1";

  try {
    if (process.platform === "win32") {
      const winSourceDir = sourceDir.replace(/\//g, "\\");
      const winOutput = outputFile.replace(/\//g, "\\");
      execSync(`tar.exe -a -c -f "${winOutput}" -C "${winSourceDir}" *`, {
        stdio: "ignore",
      });
    } else {
      execSync(`zip ${zipLevelFlag} -r -q "${outputFile}" *`, {
        cwd: sourceDir,
        stdio: "ignore",
      });
    }
  } catch (err: any) {
    const errorDetails = err?.stderr?.toString() || err?.stdout?.toString() ||
      err?.message || String(err);
    console.warn(`[Build] Warning: Native zip creation failed:`, errorDetails);
  }
}

function swapManifestInZip(zipPath: string, manifestFilePath: string): void {
  if (process.platform === "win32") {
    const winZipPath = zipPath.replace(/\//g, "\\");
    const winManifestPath = manifestFilePath.replace(/\//g, "\\");
    const psScript = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open('${winZipPath}', 'Update')
    $entry = $zip.GetEntry('manifest.json')
    if ($entry) { $entry.Delete() }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, '${winManifestPath}', 'manifest.json')
    $zip.Dispose()
    `;
    const encoded = Buffer.from(psScript, "utf16le").toString("base64");
    execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      stdio: "ignore",
    });
  } else {
    execSync(`zip -j -q "${zipPath}" "${manifestFilePath}"`, {
      stdio: "ignore",
    });
  }
}

async function createZipPackages() {
  if (!buildExtension) return;

  const chromeZipPath = join(distDir, "chrome.zip");
  const firefoxZipPath = join(distDir, "firefox.zip");

  console.log("Creating ZIP packages...");
  try {
    if (isDevMode) {
      // DEV MODE: Fast path - Zip chrome folder ONCE, copy to firefox.zip and swap manifest in 0.05s!
      await zipFolderNative(chromeDir, chromeZipPath);
      const tempFfManifest = join(distDir, "_firefox_manifest.json");
      writeFileSync(tempFfManifest, getFirefoxManifestContent());
      if (existsSync(firefoxZipPath)) {
        try {
          rmSync(firefoxZipPath, { force: true });
        } catch {
          // Ignore
        }
      }
      copyFileSync(chromeZipPath, firefoxZipPath);
      swapManifestInZip(firefoxZipPath, tempFfManifest);
      if (existsSync(tempFfManifest)) rmSync(tempFfManifest);
      if (existsSync(chromeZipPath)) rmSync(chromeZipPath);
    } else {
      // EXTENSION / ALL MODE: Compress both chromeDir and firefoxDir
      await Promise.all([
        zipFolderNative(chromeDir, chromeZipPath),
        zipFolderNative(firefoxDir, firefoxZipPath),
      ]);
    }

    console.log("✓ ZIP packaging successful.");
  } catch (zipErr) {
    console.error("ZIP packaging failed:", zipErr);
    process.exit(1);
  }
}

async function runCommandOrExit(
  name: string,
  command: string,
  cmdArgs: string[],
) {
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
    console.error(`❌ ${name} failed! Error output:\n`);
    if (stdoutStr.trim()) console.error(stdoutStr);
    if (stderrStr.trim()) console.error(stderrStr);
    process.exit(exitCode ?? 1);
  }
}

async function runVerifications() {
  console.log("Running Lint, TypeCheck & Tests...");
  try {
    await Promise.all([
      runCommandOrExit("bun lint", "bun", ["run", "lint"]),
      runCommandOrExit("bun typecheck", "bun", ["run", "typecheck"]),
      runCommandOrExit("bun test", "bun", ["test"]),
    ]);
    console.log("✓ Lint, TypeCheck & Tests passed.");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(errorMsg);
    process.exit(1);
  }
}

async function buildTargetDirectory(outputDir: string) {
  const esmEntryPoints = [
    { in: join(extSrcDir, "extension/background.ts"), out: "background" },
    { in: join(extSrcDir, "popup-entry.tsx"), out: "popup" },
    { in: join(extSrcDir, "guide-entry.tsx"), out: "guide" },
  ];

  const iifeEntryPoints = [
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
  ];

  await esbuild.build({
    entryPoints: esmEntryPoints,
    bundle: true,
    outdir: outputDir,
    format: "esm",
    target: "es2022",
    plugins: [solidPlugin()],
    minify: !isFastDev,
    define: { "process.env.NODE_ENV": '"production"' },
  });

  await esbuild.build({
    entryPoints: iifeEntryPoints,
    bundle: true,
    outdir: outputDir,
    format: "iife",
    target: "es2022",
    plugins: [solidPlugin()],
    minify: !isFastDev,
    define: { "process.env.NODE_ENV": '"production"' },
    logOverride: { "empty-import-meta": "silent" },
  });
}

async function runBuild() {
  copyAssets();
  console.log(`Bundling with esbuild (${targetArg.toUpperCase()})...`);
  try {
    if (buildExtension) {
      await buildTargetDirectory(chromeDir);

      if (isExtensionMode || isAllMode) {
        readdirSync(chromeDir).forEach((file) => {
          if (file.endsWith(".js")) {
            copyFileSync(join(chromeDir, file), join(firefoxDir, file));
          }
        });
      }
    }

    if (buildWeb) {
      await esbuild.build({
        entryPoints: [{
          in: join(webSrcDir, "web-entry.tsx"),
          out: "web-entry",
        }],
        bundle: true,
        outdir: webDistDir,
        format: "esm",
        target: "es2022",
        plugins: [solidPlugin()],
        minify: !isFastDev,
        define: { "process.env.NODE_ENV": '"production"' },
      });
    }

    console.log("✓ Bundling successful.");
    if (buildExtension) {
      await createZipPackages();
    }

    console.log("\nDone! Output files in /dist:");
    if (isDevMode) {
      console.log("  - chrome/        (unpacked Extension)");
      console.log("  - firefox.zip    (packed Firefox ZIP)");
    } else if (isExtensionMode) {
      console.log("  - chrome/        (unpacked Extension)");
      console.log("  - firefox/       (unpacked Extension)");
      console.log("  - chrome.zip     (packed Chrome ZIP)");
      console.log("  - firefox.zip    (packed Firefox ZIP)");
    } else if (isWebMode) {
      console.log("  - web/           (standalone Web App)");
    } else if (isAllMode) {
      console.log("  - chrome/        (unpacked Extension)");
      console.log("  - firefox/       (unpacked Extension)");
      console.log("  - chrome.zip     (packed Chrome ZIP)");
      console.log("  - firefox.zip    (packed Firefox ZIP)");
    }
  } catch (e) {
    console.error("Bun.build failed:", e);
    process.exit(1);
  }
}

async function buildWasm() {
  console.log("Building Rust WASM package (DEV mode)...");
  try {
    await runCommandOrExit("bun build:wasm", "bun", ["run", "build:wasm"]);
    console.log("✓ Rust WASM built successfully.");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Rust WASM build failed:", errorMsg);
    process.exit(1);
  }
}

if (isDevMode) {
  await buildWasm();
}

if (!args.includes("--no-test")) {
  await Promise.all([runVerifications(), runBuild()]);
} else {
  await runBuild();
}
const duration = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(`\n🎉 Total build time: ${duration}s`);
