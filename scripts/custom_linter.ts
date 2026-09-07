import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

interface LintIssue {
  filePath: string;
  line: number;
  column: number;
  ruleId: string;
  message: string;
}

function getFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        if (
          file !== "node_modules" &&
          file !== "dist" &&
          file !== ".git" &&
          file !== "scratch" &&
          file !== "wasm" &&
          file !== "worker"
        ) {
          results.push(...getFilesRecursive(filePath));
        }
      } else if (
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(".d.ts")
      ) {
        results.push(filePath);
      }
    }
  } catch {
    // ignore missing dir
  }
  return results;
}

function getLayerNumberAndName(normalizedPath: string): {
  layer: number;
  name: string;
} {
  if (normalizedPath.includes("/packages/domain/")) {
    return { layer: 1, name: "Domain (L1)" };
  }
  if (normalizedPath.includes("/packages/repository/")) {
    return { layer: 2, name: "Repository (L2)" };
  }
  if (normalizedPath.includes("/packages/network/")) {
    return { layer: 3, name: "Network (L3)" };
  }
  if (normalizedPath.includes("/packages/orchestrator/")) {
    return { layer: 4, name: "Orchestrator (L4)" };
  }
  if (normalizedPath.includes("/packages/ui/")) {
    return { layer: 5, name: "UI (L5)" };
  }
  if (normalizedPath.includes("/apps/")) {
    return { layer: 6, name: "App (L6)" };
  }
  return { layer: 0, name: "Unknown" };
}

const ALLOWED_TARGET_LAYERS: Record<number, number[]> = {
  1: [1], // Domain (L1): Can ONLY import Domain (L1)
  2: [1, 2], // Repository (L2): Can ONLY import Domain (L1), Repository (L2)
  3: [1, 3], // Network (L3): Can ONLY import Domain (L1), Network (L3)
  4: [1, 2, 3, 4], // Orchestrator (L4): Can import Domain (L1), Repository (L2), Network (L3), Orchestrator (L4)
  5: [1, 4, 5], // UI (L5): Can ONLY import Domain (L1), Orchestrator (L4), UI (L5) - STRICTLY FORBIDDEN from Repository (L2) & Network (L3)!
  6: [1, 2, 4, 5, 6], // App Hosts (L6): Can import Domain (L1), Repository (L2), Orchestrator (L4), UI (L5), App (L6)
};

function getTargetLayerFromImport(importPath: string): {
  layer: number;
  name: string;
} {
  if (
    importPath.startsWith("@gistwarden/domain") ||
    importPath.includes("/packages/domain/")
  ) {
    return { layer: 1, name: "Domain (L1)" };
  }
  if (
    importPath.startsWith("@gistwarden/repository") ||
    importPath.includes("/packages/repository/")
  ) {
    return { layer: 2, name: "Repository (L2)" };
  }
  if (
    importPath.startsWith("@gistwarden/network") ||
    importPath.includes("/packages/network/")
  ) {
    return { layer: 3, name: "Network (L3)" };
  }
  if (
    importPath.startsWith("@gistwarden/orchestrator") ||
    importPath.includes("/packages/orchestrator/")
  ) {
    return { layer: 4, name: "Orchestrator (L4)" };
  }
  if (
    importPath.startsWith("@gistwarden/ui") ||
    importPath.includes("/packages/ui/")
  ) {
    return { layer: 5, name: "UI (L5)" };
  }
  if (
    importPath.startsWith("@gistwarden/extension") ||
    importPath.startsWith("@gistwarden/web") ||
    importPath.includes("/apps/")
  ) {
    return { layer: 6, name: "App (L6)" };
  }

  if (importPath.startsWith("@/")) {
    const rel = importPath.substring(2);
    if (
      rel.startsWith("core/crypto") ||
      rel.startsWith("core/totp-utils") ||
      rel.startsWith("core/session-manager") ||
      rel.startsWith("core/types") ||
      rel.startsWith("core/constants") ||
      rel.startsWith("core/generator-utils") ||
      rel.startsWith("core/domain-utils") ||
      rel.startsWith("core/cbor-utils") ||
      rel.startsWith("core/wordlist") ||
      rel.startsWith("core/csv-parser") ||
      rel.startsWith("core/json-utils") ||
      rel.startsWith("core/i18n") ||
      rel.startsWith("core/locales") ||
      rel.startsWith("core/logger")
    ) {
      return { layer: 1, name: "Domain (L1)" };
    }
    if (
      rel.startsWith("core/storage") ||
      rel.startsWith("core/storage-schemas")
    ) {
      return { layer: 2, name: "Repository (L2)" };
    }
    if (
      rel.startsWith("core/fetch-utils") ||
      rel.startsWith("providers/") ||
      rel.startsWith("features/sync/github-api")
    ) {
      return { layer: 3, name: "Network (L3)" };
    }
    if (
      rel.startsWith("core/session-usecases") ||
      rel.startsWith("core/autofill-usecases") ||
      rel.startsWith("core/vault-mutation-usecases") ||
      rel.startsWith("core/app-init") ||
      rel.startsWith("core/messaging") ||
      rel.startsWith("core/messaging-contracts") ||
      rel.startsWith("core/alarms") ||
      rel.startsWith("core/idle") ||
      rel.startsWith("core/ui-service") ||
      rel.startsWith("core/runtime")
    ) {
      return { layer: 4, name: "Orchestrator (L4)" };
    }
    if (
      rel.startsWith("features/") ||
      rel.startsWith("components/") ||
      rel.startsWith("styles/") ||
      rel.startsWith("icons/") ||
      rel.startsWith("core/")
    ) {
      return { layer: 5, name: "UI (L5)" };
    }
    if (rel.startsWith("extension/")) {
      return { layer: 6, name: "App (L6)" };
    }
  }

  return { layer: 0, name: "External" };
}

function lintFile(filePath: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const normalizedPath = filePath.replace(/\\/g, "/");
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const { layer: fileLayer, name: fileLayerName } =
    getLayerNumberAndName(normalizedPath);

  // Skip auto-generated WASM files
  if (normalizedPath.includes("/wasm/generated/")) {
    return issues;
  }

  // Rule 1: Check no-ts-ignore & no-ts-expect-error
  if (!normalizedPath.includes("custom_linter.ts")) {
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      if (lineText.includes("@ts-ignore")) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("@ts-ignore") + 1,
          ruleId: "no-ts-ignore",
          message:
            "Do not use @ts-ignore. This is strictly forbidden by project rules.",
        });
      }
      if (lineText.includes("@ts-expect-error")) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("@ts-expect-error") + 1,
          ruleId: "no-ts-ignore",
          message:
            "Do not use @ts-expect-error. This is strictly forbidden by project rules.",
        });
      }
    });
  }

  // Rule 2: Check imports-first
  let hasSeenNonImportCode = false;
  let inImportBlock = false;
  let inCommentBlock = false;

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed) return;

    if (inCommentBlock) {
      if (trimmed.includes("*/")) {
        inCommentBlock = false;
      }
      return;
    }

    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) {
        inCommentBlock = true;
      }
      return;
    }

    if (trimmed.startsWith("//")) return;

    if (inImportBlock) {
      if (
        trimmed.includes("from ") ||
        trimmed.includes('from"') ||
        trimmed.includes("from'") ||
        trimmed.endsWith(";")
      ) {
        inImportBlock = false;
      }
      return;
    }

    if (
      trimmed.startsWith("type ") ||
      trimmed.startsWith("interface ") ||
      trimmed.startsWith("export type ") ||
      trimmed.startsWith("export interface ")
    ) {
      return;
    }

    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("import{") ||
      trimmed.startsWith("import type ")
    ) {
      if (hasSeenNonImportCode) {
        issues.push({
          filePath,
          line: idx + 1,
          column: lineText.indexOf("import") + 1,
          ruleId: "imports-first",
          message:
            "All 'import' statements must be placed at the very top of the file before any other code statements.",
        });
      }
      if (
        !trimmed.includes("from ") &&
        !trimmed.includes('from"') &&
        !trimmed.includes("from'") &&
        !trimmed.endsWith(";")
      ) {
        inImportBlock = true;
      }
    } else {
      hasSeenNonImportCode = true;
    }
  });

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    // Ignore comment lines
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*")
    ) {
      return;
    }

    // Strip inline comments & string literals for code inspection
    if (
      lineText.includes("linter-disable") ||
      lineText.includes("eslint-disable")
    )
      return;

    const codeNoStrings = lineText
      .replace(/\/\/.*/, "")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, "``");

    // Rule 3: max-params (> 4 parameters)
    const funcParamMatch = codeNoStrings.match(
      /(?:function\s+[A-Za-z0-9_$]*|const\s+[A-Za-z0-9_$]+\s*=\s*(?:async\s*)?)\(([^)]+)\)/,
    );
    if (funcParamMatch?.[1]) {
      const paramsList = funcParamMatch[1].split(",").map((p) => p.trim());
      if (paramsList.length > 4) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("(") + 1,
          ruleId: "max-params",
          message: `Function has too many parameters (${paramsList.length}/4). Please refactor it using an Options Object.`,
        });
      }
    }

    // Rule 4: no-as-assertion
    if (/\bas\b/.test(codeNoStrings)) {
      const matches = Array.from(
        codeNoStrings.matchAll(/\bas\s+([A-Za-z0-9_$<{}[\]|&"'`]+)/g),
      );
      for (const match of matches) {
        const typeTarget = (match[1] || "").trim();
        const fullMatch = match[0];
        const matchPos = match.index ?? 0;
        const prefixBeforeMatch = codeNoStrings.substring(0, matchPos).trim();

        // Allow export { default as Foo }, import { foo as bar }, import * as Foo, export * as Foo
        const isImportExportAlias =
          prefixBeforeMatch.endsWith("export") ||
          prefixBeforeMatch.endsWith("import") ||
          /export\s*\{[^}]*$/.test(prefixBeforeMatch) ||
          /import\s*\{[^}]*$/.test(prefixBeforeMatch) ||
          /import\s*\*\s*$/.test(prefixBeforeMatch) ||
          /export\s*\*\s*$/.test(prefixBeforeMatch) ||
          /^[A-Za-z0-9_$]+\s*$/.test(prefixBeforeMatch) ||
          /^[A-Za-z0-9_$]+\s*,\s*$/.test(prefixBeforeMatch) ||
          /\{[^}]*\b[A-Za-z0-9_$]+\s*$/.test(prefixBeforeMatch);

        if (typeTarget !== "const" && !isImportExportAlias) {
          issues.push({
            filePath,
            line: lineNum,
            column: matchPos + 1,
            ruleId: "no-as-assertion",
            message: `Do not use 'as' type assertions ('${fullMatch}'). Use proper type guards, schema parsing, or type narrowing instead.`,
          });
        }
      }
    }

    // Rule 5: no-props-destructuring (SolidJS)
    if (/\bconst\s*\{[^}]*\}\s*=\s*props\b/.test(codeNoStrings)) {
      issues.push({
        filePath,
        line: lineNum,
        column: lineText.indexOf("props") + 1,
        ruleId: "no-props-destructuring",
        message:
          "Do not destructure 'props' in SolidJS as it breaks reactivity. Access properties directly (e.g., props.title) or use 'splitProps'.",
      });
    }

    // Rule 6: no-inline-style in TSX
    if (
      normalizedPath.endsWith(".tsx") &&
      (/\bstyle\s*=\s*\{\s*\{/.test(codeNoStrings) ||
        /\bstyle\s*=\s*["'][^"']+["']/.test(codeNoStrings))
    ) {
      issues.push({
        filePath,
        line: lineNum,
        column: lineText.indexOf("style=") + 1,
        ruleId: "no-inline-style",
        message:
          "Do not use inline 'style' object/string in TSX. Move styles to SCSS/CSS files instead.",
      });
    }

    // Rule 7: no-throw in src/
    if (/\bthrow\s+/.test(codeNoStrings)) {
      const isAssertNever =
        /assertNever/.test(lineText) || /function assertNever/.test(lineText);
      if (
        !isAssertNever &&
        (normalizedPath.includes("/src/") || normalizedPath.includes("\\src\\"))
      ) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("throw") + 1,
          ruleId: "no-throw",
          message:
            "Do not use 'throw' inside 'src/' directory. Use Result from 'neverthrow' for flat error handling.",
        });
      }
    }

    // Rule 8 & 9: Import checking (use-alias-import & strict-layer-boundaries)
    if (trimmed.startsWith("import ")) {
      const importMatch = trimmed.match(/from\s+["']([^"']+)["']/);
      if (importMatch?.[1]) {
        const importPath = importMatch[1];

        // Rule 8: use-alias-import
        if (
          normalizedPath.includes("/src/") &&
          !normalizedPath.includes("/packages/") &&
          (importPath.startsWith("./") || importPath.startsWith("../"))
        ) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(importPath) + 1,
            ruleId: "use-alias-import",
            message: `Do not use relative import path '${importPath}'. Use '@/' path alias instead inside 'src/' directory.`,
          });
        }

        // Rule 9: strict-layer-boundaries
        const { layer: targetLayer, name: targetLayerName } =
          getTargetLayerFromImport(importPath);
        const isServiceWorker =
          normalizedPath.includes("/apps/extension/src/extension/") &&
          !normalizedPath.includes("autofill-content-script");

        const allowedLayers = ALLOWED_TARGET_LAYERS[fileLayer];

        if (isServiceWorker && targetLayer === 5) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(importPath) + 1,
            ruleId: "strict-layer-boundaries",
            message: `Layer Violation: Background Worker script must NOT import UI layer components/stores ('${importPath}').`,
          });
        } else if (
          targetLayer > 0 &&
          fileLayer > 0 &&
          allowedLayers &&
          !allowedLayers.includes(targetLayer)
        ) {
          const allowedNames =
            allowedLayers.length > 0
              ? allowedLayers.map((l) => `L${l}`).join(", ")
              : "None (pure layer)";
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(importPath) + 1,
            ruleId: "strict-layer-boundaries",
            message: `Layer Violation: '${fileLayerName}' is strictly forbidden from importing layer '${targetLayerName}' ('${importPath}'). Allowed target layers: ${allowedNames}.`,
          });
        }
      }
    }

    // Layer-specific rules:
    // Domain pureness (L1) - JSX is only checked if in a .tsx file or explicit JSX tag with JSX props/closing
    if (fileLayer === 1) {
      if (
        normalizedPath.endsWith(".tsx") &&
        /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)
      ) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "domain-pureness",
          message: `[Domain Rule] Rendering JSX elements is strictly forbidden in Domain layer ('${normalizedPath}').`,
        });
      }
      if (/\bfetch\s*\(/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("fetch") + 1,
          ruleId: "domain-pureness",
          message:
            "[Domain Rule] Direct 'fetch()' calls are strictly forbidden in Domain layer. Delegate HTTP requests to Network layer.",
        });
      }
      if (/\b(localStorage|sessionStorage)\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "domain-pureness",
          message:
            "[Domain Rule] Accessing Web Storage directly is forbidden in Domain layer. Delegate to Repository layer.",
        });
      }
    }

    // Repository boundary (L2)
    if (fileLayer === 2) {
      if (
        normalizedPath.endsWith(".tsx") &&
        /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)
      ) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "repository-boundary",
          message:
            "[Repository Rule] Rendering JSX elements is strictly forbidden in Repository layer.",
        });
      }
      if (/\bfetch\s*\(/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("fetch") + 1,
          ruleId: "repository-boundary",
          message:
            "[Repository Rule] Direct 'fetch()' calls are forbidden in Repository layer. Use Network layer ('packages/network') instead.",
        });
      }
    }

    // Network purity (L3)
    if (fileLayer === 3) {
      if (
        normalizedPath.endsWith(".tsx") &&
        /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)
      ) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "network-purity",
          message:
            "[Network Rule] Rendering JSX elements is strictly forbidden in Network layer.",
        });
      }
      if (/\b(localStorage|sessionStorage)\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "network-purity",
          message:
            "[Network Rule] Direct access to Web Storage is forbidden in Network layer. Return response payload to Orchestrator.",
        });
      }
    }

    // Orchestrator boundary (L4)
    if (fileLayer === 4) {
      if (
        normalizedPath.endsWith(".tsx") &&
        /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)
      ) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "orchestrator-boundary",
          message:
            "[Orchestrator Rule] Rendering JSX components is strictly forbidden in Orchestrator layer.",
        });
      }
      if (/\b(localStorage|sessionStorage)\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "orchestrator-boundary",
          message:
            "[Orchestrator Rule] Direct access to raw Web Storage is forbidden. Use Repository layer abstractions instead.",
        });
      }
    }

    // UI boundary (L5)
    if (fileLayer === 5) {
      if (/\bchrome\.storage\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("chrome.storage") + 1,
          ruleId: "ui-boundary",
          message:
            "[UI Rule] Direct access to 'chrome.storage' is forbidden in UI layer. Delegate data storage operations to Repository/Orchestrator layer.",
        });
      }
    }
  });

  return issues;
}

const DYNAMIC_CSS_VAR_WHITELIST = new Set(["--menu-x", "--menu-y"]);

function getCssFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        if (
          file !== "node_modules" &&
          file !== "dist" &&
          file !== ".git" &&
          file !== "scratch" &&
          file !== "wasm"
        ) {
          results.push(...getCssFilesRecursive(filePath));
        }
      } else if (file.endsWith(".css") || file.endsWith(".scss")) {
        results.push(filePath);
      }
    }
  } catch {
    // ignore missing dir
  }
  return results;
}

function collectAllCssDefinitions(cssFiles: string[]): Set<string> {
  const defined = new Set<string>();
  const defRegex = /(--[\w-]+)\s*:/g;

  for (const filePath of cssFiles) {
    const content = readFileSync(filePath, "utf-8");
    let match = defRegex.exec(content);
    while (match !== null) {
      if (match[1]) {
        defined.add(match[1]);
      }
      match = defRegex.exec(content);
    }
  }
  return defined;
}

const COLOR_VALUE_REGEX =
  /(#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]+\)|\bhsla?\([^)]+\))/;

function lintCssFile(
  filePath: string,
  globalDefinedVars: Set<string>,
): LintIssue[] {
  const issues: LintIssue[] = [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const isVariablesCssFile = filePath.endsWith("variables.css");

  const localDefs = new Set<string>();
  const defRegex = /(--[\w-]+)\s*:/g;
  let defMatch = defRegex.exec(content);
  while (defMatch !== null) {
    if (defMatch[1]) {
      localDefs.add(defMatch[1]);
    }
    defMatch = defRegex.exec(content);
  }

  const varUsageRegex = /var\(\s*(--[\w-]+)(\s*,\s*[^)]+)?\)/g;

  lines.forEach((rawLineText, idx) => {
    const lineNum = idx + 1;
    // Strip CSS comments (e.g., /* ... */ or // ...) to avoid false positive lint triggers
    const lineText = rawLineText
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*/g, "");

    // Rule: No hardcoded color variable definitions outside variables.css
    if (!isVariablesCssFile) {
      const colorDefMatch = /(--[\w-]+)\s*:\s*([^;]+);/.exec(lineText);
      if (colorDefMatch && colorDefMatch[1] && colorDefMatch[2]) {
        const varName = colorDefMatch[1];
        const varValue = colorDefMatch[2];
        if (COLOR_VALUE_REGEX.test(varValue)) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(varName) + 1,
            ruleId: "css-no-local-color-var",
            message: `[CSS Rule] Defining color variables outside 'variables.css' is forbidden ('${varName}: ${varValue.trim()}'). Move color tokens to 'variables.css'.`,
          });
        }
      }

      // Rule: No hardcoded color values in property declarations outside variables.css
      const propColorMatch = /^\s*([\w-]+)\s*:\s*([^;]+);/.exec(lineText);
      if (propColorMatch && propColorMatch[1] && propColorMatch[2]) {
        const propName = propColorMatch[1];
        const propVal = propColorMatch[2].trim();
        if (
          !propName.startsWith("--") &&
          !propVal.includes("data:image/svg+xml")
        ) {
          const rawColorMatch = propVal.match(
            /#(?:[0-9a-fA-F]{3,4}){1,2}\b|\brgba?\([^)]+\)|\bhsla?\([^)]+\)/g,
          );
          if (rawColorMatch && rawColorMatch.length > 0) {
            issues.push({
              filePath,
              line: lineNum,
              column: lineText.indexOf(propName) + 1,
              ruleId: "css-no-hardcoded-color",
              message: `[CSS Rule] Hardcoded color '${rawColorMatch.join(", ")}' in '${propName}' is forbidden. Use design tokens (e.g. var(--white), var(--primary)...).`,
            });
          }
        }
      }

      // Rule: No hardcoded z-index values outside variables.css
      const zIndexMatch = /\bz-index\s*:\s*([^;]+);/.exec(lineText);
      if (zIndexMatch && zIndexMatch[1]) {
        const zVal = zIndexMatch[1].trim();
        if (
          !zVal.includes("var(") &&
          !zVal.includes("auto") &&
          !zVal.includes("inherit") &&
          !zVal.includes("unset")
        ) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("z-index") + 1,
            ruleId: "css-no-hardcoded-z-index",
            message: `[CSS Rule] Hardcoded z-index '${zVal}' is forbidden. Use design tokens (e.g. var(--z-base|header|dropdown|modal|toast|max)).`,
          });
        }
      }

      // Rule: No hardcoded transition values or raw un-tokenized durations outside variables.css
      const transitionMatch = /\btransition\s*:\s*([^;]+);/.exec(lineText);
      if (transitionMatch && transitionMatch[1]) {
        const transVal = transitionMatch[1].trim();
        // Remove valid var(...) design tokens from string to check if raw durations remain
        const cleanedVal = transVal.replace(/var\([^)]+\)/g, "").trim();
        const rawTimeMatches = cleanedVal.match(/\b\d+(\.\d+)?(s|ms)\b/g);

        if (rawTimeMatches && rawTimeMatches.length > 0) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("transition") + 1,
            ruleId: "css-no-hardcoded-transition-duration",
            message: `[CSS Rule] Hardcoded transition duration '${transVal}' (${rawTimeMatches.join(", ")}) is forbidden. Use transition tokens (e.g. var(--transition-fast), var(--transition-normal), var(--transition-colors)).`,
          });
        } else if (
          transVal.includes("background-color var(--transition-") &&
          transVal.includes("color var(--transition-")
        ) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("transition") + 1,
            ruleId: "css-use-composite-transition-token",
            message: `[CSS Rule] Verbose transition declaration '${transVal}' can be simplified using composite token var(--transition-colors) or var(--transition-colors-fast).`,
          });
        }
      }

      // Rule: No hardcoded border-radius values matching standard tokens
      const radiusMatch = /\bborder-radius\s*:\s*([^;]+);/.exec(lineText);
      if (radiusMatch && radiusMatch[1]) {
        const val = radiusMatch[1].trim();
        const pxMatches = val.match(/\b(?![01]px\b)\d+(\.\d+)?px\b/g);
        if (pxMatches && pxMatches.length > 0) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("border-radius") + 1,
            ruleId: "css-no-hardcoded-radius",
            message: `[CSS Rule] Hardcoded border-radius '${val}' contains raw pixel value (${pxMatches.join(", ")}). Use design tokens (e.g. var(--radius-xs|sm|md|lg|full)).`,
          });
        }
      }

      // Rule: No hardcoded border width values or raw 1px solid var(...) declarations (Enforce border tokens)
      const borderMatch =
        /\bborder(-top|-right|-bottom|-left)?\s*:\s*([^;]+);/.exec(lineText);
      if (borderMatch && borderMatch[2]) {
        const val = borderMatch[2].trim();
        const pxMatches = val.match(/\b(?![01]px\b)\d+(\.\d+)?px\b/g);
        if (pxMatches && pxMatches.length > 0) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("border") + 1,
            ruleId: "css-no-hardcoded-border-width",
            message: `[CSS Rule] Hardcoded border '${val}' contains raw pixel width (${pxMatches.join(", ")}). Use border design tokens (e.g. var(--border-std), var(--border-width-medium|thick)).`,
          });
        } else if (
          /^(1px\s+solid|var\(--border-width-[\w-]+\)\s+solid)\s+var\(/.test(
            val,
          )
        ) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("border") + 1,
            ruleId: "css-no-raw-1px-border",
            message: `[CSS Rule] Un-tokenized border declaration '${val}' is forbidden. Use composite border design tokens (e.g. var(--border-std), var(--border-accent-warning-amber), var(--border-accent-lg-error)).`,
          });
        }
      }

      // Rule: No hardcoded box-shadow values containing raw px offsets/blur (excluding var(...) design tokens)
      const shadowMatch = /\bbox-shadow\s*:\s*([^;]+);/.exec(lineText);
      if (shadowMatch && shadowMatch[1]) {
        const val = shadowMatch[1].trim();
        // Remove var(...) tokens before scanning for hardcoded raw px
        const cleanedVal = val.replace(/var\([^)]+\)/g, "");
        const pxMatches = cleanedVal.match(/\b(?![01]px\b)\d+(\.\d+)?px\b/g);
        if (pxMatches && pxMatches.length > 0) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("box-shadow") + 1,
            ruleId: "css-no-hardcoded-box-shadow",
            message: `[CSS Rule] Hardcoded box-shadow '${val}' contains raw pixel value (${pxMatches.join(", ")}). Use design tokens (e.g. var(--shadow-sm|card|large|modal-slide)).`,
          });
        }
      }

      // Rule: No hardcoded spacing values (margin, padding, gap)
      const spacingMatch =
        /\b(margin|padding|gap)(-top|-right|-bottom|-left)?\s*:\s*([^;]+);/.exec(
          lineText,
        );
      if (spacingMatch && spacingMatch[3]) {
        const val = spacingMatch[3].trim();
        const pxMatches = val.match(/\b(?![01]px\b)\d+(\.\d+)?px\b/g);
        if (pxMatches && pxMatches.length > 0) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(spacingMatch[1] ?? "") + 1,
            ruleId: "css-no-hardcoded-spacing",
            message: `[CSS Rule] Hardcoded spacing '${val}' contains raw pixel value (${pxMatches.join(", ")}). Use design tokens (e.g. var(--space-1|2|3|4|5|6|8)).`,
          });
        }
      }

      // Rule: No hardcoded font-size values outside variables.css
      const fontSizeMatch = /\bfont-size\s*:\s*([^;]+);/.exec(lineText);
      if (fontSizeMatch && fontSizeMatch[1]) {
        const val = fontSizeMatch[1].trim();
        // Flag any font-size using raw px, rem, or em numbers instead of var(--font-size-*)
        if (
          !val.startsWith("var(--font-size-") &&
          !val.startsWith("inherit") &&
          !val.startsWith("unset")
        ) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("font-size") + 1,
            ruleId: "css-no-hardcoded-font-size",
            message: `[CSS Rule] Hardcoded font-size '${val}' is forbidden. Use design tokens (e.g. var(--font-size-10|11|12|13|14|15|16|18|20)).`,
          });
        }
      }

      // Rule: No hardcoded opacity values outside variables.css (excluding 0, 1, inherit, unset)
      const opacityMatch = /\bopacity\s*:\s*([^;]+);/.exec(lineText);
      if (opacityMatch && opacityMatch[1]) {
        const val = opacityMatch[1].trim();
        if (
          !val.includes("var(") &&
          val !== "0" &&
          val !== "1" &&
          val !== "inherit" &&
          val !== "unset"
        ) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf("opacity") + 1,
            ruleId: "css-no-hardcoded-opacity",
            message: `[CSS Rule] Hardcoded opacity '${val}' is forbidden. Use opacity design tokens (e.g. var(--opacity-disabled|disabled-subtle|subtle|muted|medium|hover)).`,
          });
        }
      }
    }

    let useMatch = varUsageRegex.exec(lineText);
    while (useMatch !== null) {
      const varName = useMatch[1];
      const hasFallback = Boolean(useMatch[2]);
      const col = useMatch.index + 1;

      if (varName) {
        const isDeclared =
          globalDefinedVars.has(varName) ||
          localDefs.has(varName) ||
          DYNAMIC_CSS_VAR_WHITELIST.has(varName);

        if (!isDeclared) {
          issues.push({
            filePath,
            line: lineNum,
            column: col,
            ruleId: "css-undeclared-var",
            message: `[CSS Rule] Undeclared CSS variable '${varName}'. Define it in 'variables.css' or local CSS file.`,
          });
        }

        if (globalDefinedVars.has(varName) && hasFallback) {
          issues.push({
            filePath,
            line: lineNum,
            column: col,
            ruleId: "css-redundant-fallback",
            message: `[CSS Rule] Redundant fallback in 'var(${varName}, ...)'. Variable is already standardized in global design tokens.`,
          });
        }
      }

      useMatch = varUsageRegex.exec(lineText);
    }
  });

  return issues;
}

function runLinter() {
  console.log("🔍 Running Custom AST & CSS Linter...");
  const rootDirs = ["packages", "apps"];
  const allTsFiles: string[] = [];
  const allCssFiles: string[] = [];

  for (const dir of rootDirs) {
    const fullDir = resolve(dir);
    allTsFiles.push(...getFilesRecursive(fullDir));
    allCssFiles.push(...getCssFilesRecursive(fullDir));
  }

  const globalCssDefs = collectAllCssDefinitions(allCssFiles);

  let totalIssues = 0;
  const issuesByFile = new Map<string, LintIssue[]>();

  // Lint TypeScript / TSX files
  for (const file of allTsFiles) {
    const issues = lintFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      issuesByFile.set(file, issues);
    }
  }

  // Lint CSS / SCSS files
  for (const file of allCssFiles) {
    const cssIssues = lintCssFile(file, globalCssDefs);
    if (cssIssues.length > 0) {
      totalIssues += cssIssues.length;
      const existing = issuesByFile.get(file) ?? [];
      issuesByFile.set(file, [...existing, ...cssIssues]);
    }
  }

  if (totalIssues > 0) {
    console.error(`\n❌ Found ${totalIssues} lint issue(s):\n`);
    for (const [file, issues] of issuesByFile) {
      console.error(`📄 ${file}:`);
      for (const issue of issues) {
        console.error(
          `  - L${issue.line}:${issue.column} [${issue.ruleId}] ${issue.message}`,
        );
      }
    }
    console.error("\n💥 Linting failed!");
    process.exit(1);
  } else {
    console.log(
      `✓ Lint passed clean across ${allTsFiles.length} TS file(s) and ${allCssFiles.length} CSS file(s).`,
    );
  }
}

runLinter();
