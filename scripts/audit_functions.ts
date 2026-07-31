import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

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

async function auditCodebase(): Promise<FileAudit[]> {
  const results: FileAudit[] = [];
  const rootDirs = ["packages", "apps"];

  for (const rootDir of rootDirs) {
    for await (
      const entry of walk(rootDir, {
        exts: [".ts", ".tsx"],
        skip: [/node_modules/, /dist/, /\.git/],
      })
    ) {
      if (!entry.isFile) continue;

      const content = await Deno.readTextFile(entry.path);
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

        // Match export const foo = ... => or const foo = ... =>
        const constMatch = trimmed.match(
          /^(export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(async\s*)?(\([^)]*\)|[A-Za-z0-9_$]+|\s*)\s*=>/,
        );
        if (constMatch) {
          functions.push({
            name: constMatch[2],
            kind: "arrow",
            isExported: !!constMatch[1],
            line: lineNum,
          });
          return;
        }

        // Match class declaration
        const classMatch = trimmed.match(
          /^(export\s+)?(default\s+)?class\s+([A-Za-z0-9_$]+)/,
        );
        if (classMatch) {
          functions.push({
            name: classMatch[3],
            kind: "class",
            isExported: !!classMatch[1],
            line: lineNum,
          });
          return;
        }

        // Match class method or interface method
        const methodMatch = trimmed.match(
          /^(public|private|protected|async|\s)*(async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*(:\s*[^{]+)?\s*\{/,
        );
        if (
          methodMatch &&
          !["if", "for", "while", "switch", "catch", "constructor"].includes(
            methodMatch[3],
          )
        ) {
          if (
            !functions.some((f) =>
              f.name === methodMatch[3] && f.line === lineNum
            )
          ) {
            functions.push({
              name: methodMatch[3],
              kind: "method",
              isExported: false,
              line: lineNum,
            });
          }
        }
      });

      // Normalize path
      const normalizedPath = entry.path.replace(/\\/g, "/");
      results.push({
        filePath: normalizedPath,
        functions,
      });
    }
  }

  return results.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

// Generate Markdown
const auditData = await auditCodebase();
const totalFiles = auditData.length;
const totalFunctions = auditData.reduce(
  (acc, item) => acc + item.functions.length,
  0,
);

let markdown =
  `# Báo Cáo Tự Động Rà Soát Toàn Bộ File và Function (Automated Codebase AST Audit)

> **Báo cáo này được tạo tự động bởi script \`scripts/audit_functions.ts\`**.
> - **Tổng số file (.ts, .tsx)**: **${totalFiles}**
> - **Tổng số hàm/methods/classes phát hiện được**: **${totalFunctions}**

---

## Danh Sách Chi Tiết Theo File

`;

for (const file of auditData) {
  markdown += `### 📄 File: \`${file.filePath}\`\n`;
  if (file.functions.length === 0) {
    markdown +=
      `*Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc re-exports thuần).* \n\n`;
  } else {
    markdown +=
      `| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |\n`;
    markdown += `| :--- | :--- | :--- | :--- |\n`;
    for (const fn of file.functions) {
      markdown += `| L${fn.line} | \`${fn.name}\` | ${fn.kind} | ${
        fn.isExported ? "✅ Có" : "❌ Không (Internal)"
      } |\n`;
    }
    markdown += `\n`;
  }
}

await Deno.writeTextFile("docs/automated_function_audit.md", markdown);
console.log(
  `[Success] Audit complete! Found ${totalFiles} files and ${totalFunctions} functions.`,
);
console.log(`Report generated at: docs/automated_function_audit.md`);
