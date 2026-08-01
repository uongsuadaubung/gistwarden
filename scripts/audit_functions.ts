import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface FunctionDetail {
  name: string;
  kind: "function" | "arrow" | "class" | "method";
  isExported: boolean;
  line: number;
}

interface FileAudit {
  filePath: string;
  functions: FunctionDetail[];
}

function getFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== ".git") {
        results.push(...getFilesRecursive(filePath));
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(filePath);
    }
  }
  return results;
}

function auditCodebase(): FileAudit[] {
  const results: FileAudit[] = [];
  const rootDirs = ["packages", "apps"];

  for (const rootDir of rootDirs) {
    const files = getFilesRecursive(rootDir);
    for (const filePath of files) {
      const content = readFileSync(filePath, "utf8");
      const lines = content.split("\n");
      const functions: FunctionDetail[] = [];

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();

        // Match export function / function
        const funcMatch = trimmed.match(
          /^(export\s+)?(async\s+)?function\s+([A-Za-z0-9_$]+)/,
        );
        if (funcMatch) {
          functions.push({
            name: funcMatch[3],
            kind: "function",
            isExported: !!funcMatch[1],
            line: lineNum,
          });
          return;
        }

        // Match export const foo = (...) => / function
        const arrowMatch = trimmed.match(
          /^(export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/,
        );
        if (arrowMatch) {
          functions.push({
            name: arrowMatch[2],
            kind: "arrow",
            isExported: !!arrowMatch[1],
            line: lineNum,
          });
          return;
        }

        // Match class definition
        const classMatch = trimmed.match(
          /^(export\s+)?(abstract\s+)?class\s+([A-Za-z0-9_$]+)/,
        );
        if (classMatch) {
          functions.push({
            name: classMatch[3],
            kind: "class",
            isExported: !!classMatch[1],
            line: lineNum,
          });
        }
      });

      if (functions.length > 0) {
        results.push({
          filePath: filePath.replace(/\\/g, "/"),
          functions,
        });
      }
    }
  }

  return results;
}

const auditResult = auditCodebase();
const summaryPath = "scratch/function_audit.json";
writeFileSync(summaryPath, JSON.stringify(auditResult, null, 2), "utf8");
console.log(`✓ Audit complete. Saved ${auditResult.length} files to ${summaryPath}`);
