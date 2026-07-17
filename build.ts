import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { build, context, type PluginBuild } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";
import { compile } from "sass";
import AdmZip from "adm-zip";

const __dirname = import.meta.dirname || ".";
const distDir = join(__dirname, "dist");
const chromeDir = join(distDir, "chrome");
const firefoxDir = join(distDir, "firefox");
const srcDir = join(__dirname, "src");

const isWatch = Deno.args.includes("--watch");

// 1. Clean and create directories
if (!isWatch) {
  [distDir, chromeDir, firefoxDir].forEach((dir) => {
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
    const scssPath = join(srcDir, "styles", "app.scss");
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
    join(srcDir, "shared", "constants.ts"),
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
              id: `${appNameLower}@kien.hm`,
              strict_min_version: "109.0",
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

    // Copy icons if exist
    const iconsTarget = join(targetDir, "icons");
    const iconsSrc = join(srcDir, "icons");
    copyDirRecursive(iconsSrc, iconsTarget);

    // Copy images if exist
    const imagesTarget = join(targetDir, "images");
    const imagesSrc = join(srcDir, "images");
    copyDirRecursive(imagesSrc, imagesTarget);
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

async function runBuild() {
  compileSCSS();
  copyAssets();

  // Entry points for bundling
  const entryPoints = {
    background: join(srcDir, "extension/background.ts"),
    "fido2-content-script": join(srcDir, "extension/fido2-content-script.ts"),
    "fido2-page-script": join(srcDir, "extension/fido2-page-script.ts"),
    popup: join(srcDir, "popup-entry.tsx"),
    guide: join(srcDir, "guide-entry.tsx"),
  };

  // Custom path-alias resolver plugin for esbuild
  const pathAliasPlugin = {
    name: "path-alias",
    setup(build: PluginBuild) {
      build.onResolve({ filter: /^@\// }, (args) => {
        const relativePath = args.path.substring(2); // remove "@/"
        const resolvedPath = join(srcDir, relativePath);
        return { path: resolvedPath };
      });
    },
  };

  // Common esbuild config
  const commonConfig = {
    entryPoints,
    bundle: true,
    minify: false,
    sourcemap: true,
    platform: "browser" as const,
    target: ["esnext"],
    plugins: [pathAliasPlugin, solidPlugin()],
  };

  if (isWatch) {
    console.log("Starting esbuild watch mode...");
    // Chrome watch
    const chromeCtx = await context({
      ...commonConfig,
      outdir: chromeDir,
      entryNames: "[name]",
    });
    await chromeCtx.watch();

    // Firefox watch
    const firefoxCtx = await context({
      ...commonConfig,
      outdir: firefoxDir,
      entryNames: "[name]",
    });
    await firefoxCtx.watch();

    console.log("Watching for file changes. Press Ctrl+C to stop.");

    // Simple watch loop for SCSS and assets
    const watcher = Deno.watchFs(srcDir);
    for await (const event of watcher) {
      const hasScssChange = event.paths.some((p) => p.endsWith(".scss"));
      const hasAssetChange = event.paths.some((p) =>
        p.endsWith(".json") || p.endsWith(".html") || p.includes("icons") ||
        p.includes("images")
      );
      if (hasScssChange) {
        compileSCSS();
      }
      if (hasAssetChange) {
        copyAssets();
      }
    }
  } else {
    console.log("Bundling with esbuild...");
    try {
      // Build for Chrome
      await build({
        ...commonConfig,
        outdir: chromeDir,
        entryNames: "[name]",
      });

      // Build for Firefox
      await build({
        ...commonConfig,
        outdir: firefoxDir,
        entryNames: "[name]",
      });

      console.log("✓ JS/TS bundling successful.");
      createZipPackages();
      console.log("Done! Files in /dist:");
      console.log("  - chrome/        (unpacked directory)");
      console.log("  - firefox/       (unpacked directory)");
      console.log("  - chrome.zip     (packed for Chrome)");
      console.log("  - firefox.zip    (packed for Firefox)");
    } catch (err) {
      console.error("Esbuild bundling failed:", err);
      Deno.exit(1);
    }
  }
}

runBuild().catch((err) => {
  console.error("Build failed:", err);
  Deno.exit(1);
});
