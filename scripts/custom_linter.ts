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
          file !== "wasm"
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
      rel.startsWith("core/vault-repository-usecase") ||
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
  const { layer: fileLayer, name: fileLayerName } = getLayerNumberAndName(normalizedPath);

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
          message: "Do not use @ts-ignore. This is strictly forbidden by project rules.",
        });
      }
      if (lineText.includes("@ts-expect-error")) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("@ts-expect-error") + 1,
          ruleId: "no-ts-ignore",
          message: "Do not use @ts-expect-error. This is strictly forbidden by project rules.",
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
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    // Strip inline comments & string literals for code inspection
    const codeNoStrings = lineText
      .replace(/\/\/.*/, "")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, "``");

    // Rule 3: max-params (> 4 parameters)
    const funcParamMatch = codeNoStrings.match(
      /(?:function\s+[A-Za-z0-9_$]*|const\s+[A-Za-z0-9_$]+\s*=\s*(?:async\s*)?)\(([^)]+)\)/,
    );
    if (funcParamMatch && funcParamMatch[1]) {
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
      const matches = Array.from(codeNoStrings.matchAll(/\bas\s+([A-Za-z0-9_$<{}[\]|&"'`]+)/g));
      for (const match of matches) {
        const typeTarget = match[1].trim();
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

    // Rule 4: no-explicit-any
    if (/(:\s*any\b|as\s+any\b|<any>)/.test(codeNoStrings)) {
      const matchPos = codeNoStrings.search(/(:\s*any\b|as\s+any\b|<any>)/);
      issues.push({
        filePath,
        line: lineNum,
        column: matchPos + 1,
        ruleId: "no-explicit-any",
        message: "Do not use 'any' type. Use explicit types or 'unknown' with type guards.",
      });
    }

    // Rule 5: no-props-destructuring (SolidJS)
    if (/\bconst\s*\{[^}]*\}\s*=\s*props\b/.test(codeNoStrings)) {
      issues.push({
        filePath,
        line: lineNum,
        column: lineText.indexOf("props") + 1,
        ruleId: "no-props-destructuring",
        message: "Do not destructure 'props' in SolidJS as it breaks reactivity. Access properties directly (e.g., props.title) or use 'splitProps'.",
      });
    }

    // Rule 6: no-inline-style in TSX
    if (normalizedPath.endsWith(".tsx") && /\bstyle\s*=\s*\{\s*\{/.test(codeNoStrings)) {
      issues.push({
        filePath,
        line: lineNum,
        column: lineText.indexOf("style=") + 1,
        ruleId: "no-inline-style",
        message: "Do not use inline 'style' object/string. Move styles to SCSS/CSS files instead.",
      });
    }

    // Rule 7: no-throw in src/
    if (/\bthrow\s+/.test(codeNoStrings)) {
      if (normalizedPath.includes("/src/") || normalizedPath.includes("\\src\\")) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("throw") + 1,
          ruleId: "no-throw",
          message: "Do not use 'throw' inside 'src/' directory. Use Result from 'neverthrow' for flat error handling.",
        });
      }
    }

    // Rule 8 & 9: Import checking (use-alias-import & strict-layer-boundaries)
    if (trimmed.startsWith("import ")) {
      const importMatch = trimmed.match(/from\s+["']([^"']+)["']/);
      if (importMatch) {
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
        const { layer: targetLayer, name: targetLayerName } = getTargetLayerFromImport(importPath);
        const isServiceWorker =
          normalizedPath.includes("/apps/extension/src/extension/") &&
          !normalizedPath.includes("autofill-content-script");

        if (isServiceWorker && targetLayer === 5) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(importPath) + 1,
            ruleId: "strict-layer-boundaries",
            message: `Layer Violation: Background Worker script must NOT import UI layer components/stores ('${importPath}').`,
          });
        } else if (targetLayer > 0 && fileLayer > 0 && fileLayer < targetLayer) {
          issues.push({
            filePath,
            line: lineNum,
            column: lineText.indexOf(importPath) + 1,
            ruleId: "strict-layer-boundaries",
            message: `Layer Violation: '${fileLayerName}' is forbidden from importing higher layer '${targetLayerName}' ('${importPath}').`,
          });
        }
      }
    }

    // Layer-specific rules:
    // Domain pureness (L1) - JSX is only checked if in a .tsx file or explicit JSX tag with JSX props/closing
    if (fileLayer === 1) {
      if (normalizedPath.endsWith(".tsx") && /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)) {
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
          message: "[Domain Rule] Direct 'fetch()' calls are strictly forbidden in Domain layer. Delegate HTTP requests to Network layer.",
        });
      }
      if (/\b(localStorage|sessionStorage)\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "domain-pureness",
          message: "[Domain Rule] Accessing Web Storage directly is forbidden in Domain layer. Delegate to Repository layer.",
        });
      }
    }

    // Repository boundary (L2)
    if (fileLayer === 2) {
      if (normalizedPath.endsWith(".tsx") && /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "repository-boundary",
          message: "[Repository Rule] Rendering JSX elements is strictly forbidden in Repository layer.",
        });
      }
      if (/\bfetch\s*\(/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: lineText.indexOf("fetch") + 1,
          ruleId: "repository-boundary",
          message: "[Repository Rule] Direct 'fetch()' calls are forbidden in Repository layer. Use Network layer ('packages/network') instead.",
        });
      }
    }

    // Network purity (L3)
    if (fileLayer === 3) {
      if (normalizedPath.endsWith(".tsx") && /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "network-purity",
          message: "[Network Rule] Rendering JSX elements is strictly forbidden in Network layer.",
        });
      }
      if (/\b(localStorage|sessionStorage)\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "network-purity",
          message: "[Network Rule] Direct access to Web Storage is forbidden in Network layer. Return response payload to Orchestrator.",
        });
      }
    }

    // Orchestrator boundary (L4)
    if (fileLayer === 4) {
      if (normalizedPath.endsWith(".tsx") && /<[A-Z][A-Za-z0-9]*/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "orchestrator-boundary",
          message: "[Orchestrator Rule] Rendering JSX components is strictly forbidden in Orchestrator layer.",
        });
      }
      if (/\b(localStorage|sessionStorage)\b/.test(codeNoStrings)) {
        issues.push({
          filePath,
          line: lineNum,
          column: 1,
          ruleId: "orchestrator-boundary",
          message: "[Orchestrator Rule] Direct access to raw Web Storage is forbidden. Use Repository layer abstractions instead.",
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
          message: "[UI Rule] Direct access to 'chrome.storage' is forbidden in UI layer. Delegate data storage operations to Repository/Orchestrator layer.",
        });
      }
    }
  });

  return issues;
}

function runLinter() {
  console.log("🔍 Running Custom AST Linter...");
  const rootDirs = ["packages", "apps"];
  const allFiles: string[] = [];

  for (const dir of rootDirs) {
    const fullDir = resolve(dir);
    allFiles.push(...getFilesRecursive(fullDir));
  }

  let totalIssues = 0;
  const issuesByFile = new Map<string, LintIssue[]>();

  for (const file of allFiles) {
    const issues = lintFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      issuesByFile.set(file, issues);
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
    console.log(`✓ Lint passed clean across ${allFiles.length} file(s).`);
  }
}

runLinter();
