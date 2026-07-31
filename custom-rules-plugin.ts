/**
 * Bộ luật kiểm tra cú pháp tùy biến dành riêng cho dự án PvZGE Sync.
 * Tương thích chuẩn AST Deno Linter 2.2.0+.
 */

export interface LintNode {
  type: string;
  id?: LintNode;
  init?: LintNode;
  name?: string | { type: string; name: string };
  value?: {
    type: string;
    expression?: { type: string };
  };
  params?: unknown[];
  typeAnnotation?: LintNode;
  typeName?: LintNode;
}

export interface LintContext {
  id?: string;
  filename?: string;
  sourceCode?: { text: string };
  report(descriptor: {
    node: LintNode;
    message: string;
  }): void;
}

export interface LintRule {
  create(context: LintContext): Record<string, (node: LintNode) => void>;
}

export interface LintPlugin {
  name: string;
  rules: Record<string, LintRule>;
}

const customRulesPlugin: LintPlugin = {
  name: "custom-limits",
  rules: {
    // Luật 1: Giới hạn số tham số truyền vào hàm không quá 4
    "max-params": {
      create(context: LintContext) {
        const MAX_PARAMS = 4;

        function checkFunctionParams(node: LintNode) {
          if (node.params && node.params.length > MAX_PARAMS) {
            context.report({
              node,
              message:
                `Function has too many parameters (${node.params.length}/${MAX_PARAMS}). Please refactor it using an Options Object.`,
            });
          }
        }

        return {
          FunctionDeclaration: checkFunctionParams,
          FunctionExpression: checkFunctionParams,
          ArrowFunctionExpression: checkFunctionParams,
        };
      },
    },

    // Luật 2: Cấm giải cấu trúc props trong SolidJS làm mất Reactivity
    "no-props-destructuring": {
      create(context: LintContext) {
        function checkVariableDeclarator(node: LintNode) {
          if (
            node.id &&
            node.id.type === "ObjectPattern" &&
            node.init &&
            node.init.type === "Identifier" &&
            node.init.name === "props"
          ) {
            context.report({
              node,
              message:
                "Do not destructure 'props' in SolidJS as it breaks reactivity. Access properties directly (e.g., props.title) or use 'splitProps'.",
            });
          }
        }

        return {
          VariableDeclarator: checkVariableDeclarator,
        };
      },
    },

    // Luật 3: Cấm sử dụng từ khóa 'as' để ép kiểu thiếu an toàn (cho phép 'as const')
    "no-as-assertion": {
      create(context: LintContext) {
        return {
          TSAsExpression(node: LintNode) {
            const isConst = node.typeAnnotation &&
              node.typeAnnotation.type === "TSTypeReference" &&
              node.typeAnnotation.typeName &&
              node.typeAnnotation.typeName.type === "Identifier" &&
              node.typeAnnotation.typeName.name === "const";

            if (!isConst) {
              context.report({
                node,
                message:
                  "Do not use 'as' type assertions. Use proper type guards, schema parsing, or type narrowing instead.",
              });
            }
          },
        };
      },
    },

    // Luật 4: Cấm sử dụng style inline trong TSX/JSX (Cho phép truyền tiếp style={props.style})
    "no-inline-style": {
      create(context: LintContext) {
        return {
          JSXAttribute(node: LintNode) {
            if (
              node.name &&
              typeof node.name === "object" &&
              node.name.type === "JSXIdentifier" &&
              node.name.name === "style"
            ) {
              const val = node.value;
              const exp = val && val.type === "JSXExpressionContainer"
                ? val.expression
                : null;
              const isPropStyle = exp && exp.type === "MemberExpression";
              const isInline = val && !isPropStyle && (
                val.type === "Literal" ||
                val.type === "StringLiteral" ||
                (exp && (
                  exp.type === "ObjectExpression" ||
                  exp.type === "ConditionalExpression"
                ))
              );
              if (isInline) {
                context.report({
                  node,
                  message:
                    "Do not use inline 'style' object/string. Move styles to SCSS/CSS files instead.",
                });
              }
            }
          },
        };
      },
    },

    // Luật 5: Cấm sử dụng ts-ignore và ts-expect-error
    "no-ts-ignore": {
      create(context: LintContext) {
        return {
          Program(node: LintNode) {
            if (
              context.filename &&
              context.filename.includes("custom-rules-plugin.ts")
            ) return;
            if (
              context.sourceCode && typeof context.sourceCode.text === "string"
            ) {
              const text = context.sourceCode.text;
              if (
                text.includes("@ts" + "-ignore") ||
                text.includes("@ts" + "-expect-error")
              ) {
                context.report({
                  node,
                  message: "Do not use @ts" + "-ignore or @ts" +
                    "-expect-error. This is strictly forbidden by project rules.",
                });
              }
            }
          },
        };
      },
    },

    // Luật 6: Cấm sử dụng từ khóa 'throw' trong thư mục src/
    "no-throw": {
      create(context: LintContext) {
        return {
          ThrowStatement(node: LintNode) {
            if (
              context.filename &&
              (context.filename.includes("/src/") ||
                context.filename.includes("\\src\\"))
            ) {
              context.report({
                node,
                message:
                  "Do not use 'throw' inside 'src/' directory. Use Result from 'neverthrow' for flat error handling.",
              });
            }
          },
        };
      },
    },

    // Luật 7: Cấm các câu lệnh import nằm phía sau câu lệnh mã nguồn khác (bắt buộc tất cả import phải ở đầu file)
    "imports-first": {
      create(context: LintContext) {
        return {
          Program(node: LintNode & { body?: LintNode[] }) {
            if (!node.body || !Array.isArray(node.body)) return;
            let hasSeenNonImport = false;
            for (const statement of node.body) {
              if (statement.type === "ImportDeclaration") {
                if (hasSeenNonImport) {
                  context.report({
                    node: statement,
                    message:
                      "All 'import' statements must be placed at the very top of the file before any other code statements.",
                  });
                }
              } else {
                hasSeenNonImport = true;
              }
            }
          },
        };
      },
    },

    // Luật 8: Bắt buộc sử dụng Path Alias '@/' thay vì đường dẫn tương đối './' hay '../' bên trong thư mục src/
    "use-alias-import": {
      create(context: LintContext) {
        return {
          ImportDeclaration(node: LintNode & { source?: { value?: string } }) {
            if (!context.filename) return;
            const normalizedFilename = context.filename.replace(/\\/g, "/");
            if (
              !normalizedFilename.includes("/src/") ||
              normalizedFilename.includes("/packages/")
            ) return;

            const importPath = node.source?.value;
            if (
              typeof importPath === "string" &&
              (importPath.startsWith("./") || importPath.startsWith("../"))
            ) {
              context.report({
                node,
                message:
                  `Do not use relative import path '${importPath}'. Use '@/' path alias instead inside 'src/' directory.`,
              });
            }
          },
        };
      },
    },

    // Luật 9: Ràng buộc thứ tự tầng kiến trúc (Lower layer cannot call higher layer)
    "strict-layer-boundaries": {
      create(context: LintContext) {
        return {
          ImportDeclaration(node: LintNode & { source?: { value?: string } }) {
            if (!context.filename) return;
            const filename = context.filename.replace(/\\/g, "/");
            const importPath = node.source?.value;
            if (typeof importPath !== "string") return;

            let fileLayer = 0;
            let fileLayerName = "";
            if (filename.includes("/packages/domain/")) {
              fileLayer = 1;
              fileLayerName = "Domain (L1)";
            } else if (filename.includes("/packages/repository/")) {
              fileLayer = 2;
              fileLayerName = "Repository (L2)";
            } else if (filename.includes("/packages/network/")) {
              fileLayer = 3;
              fileLayerName = "Network (L3)";
            } else if (filename.includes("/packages/orchestrator/")) {
              fileLayer = 4;
              fileLayerName = "Orchestrator (L4)";
            } else if (filename.includes("/packages/ui/")) {
              fileLayer = 5;
              fileLayerName = "UI (L5)";
            } else if (filename.includes("/apps/")) {
              fileLayer = 6;
              fileLayerName = "App (L6)";
            }

            if (fileLayer === 0) return;

            let targetLayer = 0;
            let targetLayerName = "";

            if (
              importPath.startsWith("@gistwarden/domain") ||
              importPath.includes("/packages/domain/")
            ) {
              targetLayer = 1;
              targetLayerName = "Domain (L1)";
            } else if (
              importPath.startsWith("@gistwarden/repository") ||
              importPath.includes("/packages/repository/")
            ) {
              targetLayer = 2;
              targetLayerName = "Repository (L2)";
            } else if (
              importPath.startsWith("@gistwarden/network") ||
              importPath.includes("/packages/network/")
            ) {
              targetLayer = 3;
              targetLayerName = "Network (L3)";
            } else if (
              importPath.startsWith("@gistwarden/orchestrator") ||
              importPath.includes("/packages/orchestrator/")
            ) {
              targetLayer = 4;
              targetLayerName = "Orchestrator (L4)";
            } else if (
              importPath.startsWith("@gistwarden/ui") ||
              importPath.includes("/packages/ui/")
            ) {
              targetLayer = 5;
              targetLayerName = "UI (L5)";
            } else if (
              importPath.startsWith("@gistwarden/extension") ||
              importPath.startsWith("@gistwarden/web") ||
              importPath.includes("/apps/")
            ) {
              targetLayer = 6;
              targetLayerName = "App (L6)";
            } else if (importPath.startsWith("@/")) {
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
                rel.startsWith("core/i18n") || rel.startsWith("core/locales") ||
                rel.startsWith("core/logger")
              ) {
                targetLayer = 1;
                targetLayerName = "Domain (L1)";
              } else if (
                rel.startsWith("core/storage") ||
                rel.startsWith("core/storage-schemas")
              ) {
                targetLayer = 2;
                targetLayerName = "Repository (L2)";
              } else if (
                rel.startsWith("core/fetch-utils") ||
                rel.startsWith("providers/") ||
                rel.startsWith("features/sync/github-api")
              ) {
                targetLayer = 3;
                targetLayerName = "Network (L3)";
              } else if (
                rel.startsWith("core/session-usecases") ||
                rel.startsWith("core/autofill-usecases") ||
                rel.startsWith("core/vault-repository-usecase") ||
                rel.startsWith("core/app-init") ||
                rel.startsWith("core/messaging") ||
                rel.startsWith("core/messaging-contracts") ||
                rel.startsWith("core/alarms") || rel.startsWith("core/idle") ||
                rel.startsWith("core/ui-service") ||
                rel.startsWith("core/runtime")
              ) {
                targetLayer = 4;
                targetLayerName = "Orchestrator (L4)";
              } else if (
                rel.startsWith("features/") || rel.startsWith("components/") ||
                rel.startsWith("styles/") || rel.startsWith("icons/") ||
                rel.startsWith("core/")
              ) {
                targetLayer = 5;
                targetLayerName = "UI (L5)";
              } else if (rel.startsWith("extension/")) {
                targetLayer = 6;
                targetLayerName = "App (L6)";
              }
            }

            const normalizedFile = filename.replace(/\\/g, "/");
            const isServiceWorker =
              normalizedFile.includes("/apps/extension/src/extension/") &&
              !normalizedFile.includes("autofill-content-script");
            if (isServiceWorker && targetLayer === 5) {
              context.report({
                node,
                message:
                  `Layer Violation: Background Worker script must NOT import UI layer components/stores ('${importPath}').`,
              });
              return;
            }

            if (targetLayer > 0 && fileLayer < targetLayer) {
              context.report({
                node,
                message:
                  `Layer Violation: Lower layer ${fileLayerName} is importing directly from higher layer ${targetLayerName} ('${importPath}'). Lower layers MUST NOT depend on higher layers.`,
              });
            }
          },
        };
      },
    },

    // Luật 10: Cấm re-export (Import symbol/hàm nào thì cấm export lại symbol/hàm đó)
    "no-re-export": {
      create(context: LintContext) {
        const importedSymbols = new Set<string>();

        return {
          Program(node: LintNode & { body?: LintNode[] }) {
            if (!node.body || !Array.isArray(node.body)) return;

            for (const statement of node.body) {
              if (statement.type === "ImportDeclaration") {
                const specifiers = Reflect.get(statement, "specifiers");
                if (Array.isArray(specifiers)) {
                  for (const spec of specifiers) {
                    if (spec && typeof spec === "object") {
                      const local = Reflect.get(spec, "local");
                      const imported = Reflect.get(spec, "imported");
                      if (
                        local && typeof local === "object" && "name" in local &&
                        typeof local.name === "string"
                      ) {
                        importedSymbols.add(local.name);
                      } else if (
                        imported && typeof imported === "object" &&
                        "name" in imported && typeof imported.name === "string"
                      ) {
                        importedSymbols.add(imported.name);
                      }
                    }
                  }
                }
              }
            }
          },

          ExportAllDeclaration(
            node: LintNode & { source?: { value?: string } },
          ) {
            const normalizedFile = context.filename
              ? context.filename.replace(/\\/g, "/")
              : "";
            if (
              normalizedFile.endsWith("/mod.ts") ||
              normalizedFile.endsWith("/index.ts")
            ) {
              return;
            }
            context.report({
              node,
              message:
                `Re-exporting all symbols from '${node.source?.value}' is forbidden. Import and use symbols directly from their authoritative source.`,
            });
          },

          ExportNamedDeclaration(
            node: LintNode & {
              source?: { value?: string };
              specifiers?: Array<{
                local?: { name?: string };
                exported?: { name?: string };
              }>;
              declaration?: LintNode & {
                declarations?: Array<{
                  id?: { name?: string };
                  init?: { type?: string; name?: string };
                }>;
              };
            },
          ) {
            const normalizedFile = context.filename
              ? context.filename.replace(/\\/g, "/")
              : "";
            if (
              normalizedFile.endsWith("/mod.ts") ||
              normalizedFile.endsWith("/index.ts")
            ) {
              return;
            }

            if (node.source) {
              context.report({
                node,
                message:
                  `Direct re-exporting from '${node.source.value}' is forbidden. Import and use symbols directly from their source layer.`,
              });
              return;
            }

            if (node.specifiers && Array.isArray(node.specifiers)) {
              for (const spec of node.specifiers) {
                const localName = spec.local?.name || spec.exported?.name;
                if (localName && importedSymbols.has(localName)) {
                  context.report({
                    node,
                    message:
                      `Re-exporting imported symbol '${localName}' is forbidden. Import '${localName}' directly from its original source layer.`,
                  });
                }
              }
            }

            if (
              node.declaration &&
              node.declaration.type === "VariableDeclaration" &&
              node.declaration.declarations
            ) {
              for (const decl of node.declaration.declarations) {
                if (
                  decl.init &&
                  decl.init.type === "Identifier" &&
                  decl.init.name &&
                  importedSymbols.has(decl.init.name)
                ) {
                  context.report({
                    node,
                    message:
                      `Re-exporting imported symbol '${decl.init.name}' via alias '${decl.id?.name}' is forbidden.`,
                  });
                }
              }
            }
          },
        };
      },
    },

    // =========================================================================
    // 5 LUẬT ĐỘC LẬP DÀNH RIÊNG CHO 5 TẦNG KIẾN TRÚC (5 DEDICATED LAYER RULES)
    // =========================================================================

    // 1. Rule Tầng Domain (Layer 1): Thuần túy logic toán/crypto, cấm fetch, storage, UI
    "domain-pureness": {
      create(context: LintContext): Record<string, (node: LintNode) => void> {
        const rawFile = context.filename
          ? context.filename.replace(/\\/g, "/")
          : "";
        if (!rawFile.includes("/packages/domain/")) return {};

        return {
          JSXElement(node: LintNode) {
            context.report({
              node,
              message:
                `[Domain Rule] Rendering JSX elements is strictly forbidden in Domain layer ('${rawFile}').`,
            });
          },
          CallExpression(
            node: LintNode & { callee?: { type?: string; name?: string } },
          ) {
            if (
              node.callee?.type === "Identifier" && node.callee.name === "fetch"
            ) {
              context.report({
                node,
                message:
                  `[Domain Rule] Direct 'fetch()' calls are strictly forbidden in Domain layer. Delegate HTTP requests to Network layer.`,
              });
            }
          },
          MemberExpression(
            node: LintNode & { object?: { type?: string; name?: string } },
          ) {
            if (
              node.object?.type === "Identifier" &&
              (node.object.name === "localStorage" ||
                node.object.name === "sessionStorage")
            ) {
              context.report({
                node,
                message:
                  `[Domain Rule] Accessing Web Storage '${node.object.name}' directly is forbidden in Domain layer. Delegate to Repository layer.`,
              });
            }
          },
        };
      },
    },

    // 2. Rule Tầng Repository (Layer 2): Đọc/ghi storage & schema, cấm fetch trực tiếp & UI
    "repository-boundary": {
      create(context: LintContext): Record<string, (node: LintNode) => void> {
        const rawFile = context.filename
          ? context.filename.replace(/\\/g, "/")
          : "";
        if (!rawFile.includes("/packages/repository/")) return {};

        return {
          JSXElement(node: LintNode) {
            context.report({
              node,
              message:
                `[Repository Rule] Rendering JSX elements is strictly forbidden in Repository layer.`,
            });
          },
          CallExpression(
            node: LintNode & { callee?: { type?: string; name?: string } },
          ) {
            if (
              node.callee?.type === "Identifier" && node.callee.name === "fetch"
            ) {
              context.report({
                node,
                message:
                  `[Repository Rule] Direct 'fetch()' calls are forbidden in Repository layer. Use Network layer ('packages/network') instead.`,
              });
            }
          },
        };
      },
    },

    // 3. Rule Tầng Network (Layer 3): Xử lý HTTP API/OAuth, cấm thao tác storage & UI
    "network-purity": {
      create(context: LintContext): Record<string, (node: LintNode) => void> {
        const rawFile = context.filename
          ? context.filename.replace(/\\/g, "/")
          : "";
        if (!rawFile.includes("/packages/network/")) return {};

        return {
          JSXElement(node: LintNode) {
            context.report({
              node,
              message:
                `[Network Rule] Rendering JSX elements is strictly forbidden in Network layer.`,
            });
          },
          MemberExpression(
            node: LintNode & { object?: { type?: string; name?: string } },
          ) {
            if (
              node.object?.type === "Identifier" &&
              (node.object.name === "localStorage" ||
                node.object.name === "sessionStorage")
            ) {
              context.report({
                node,
                message:
                  `[Network Rule] Direct access to Web Storage '${node.object.name}' is forbidden in Network layer. Return response payload to Orchestrator.`,
              });
            }
          },
        };
      },
    },

    // 4. Rule Tầng Orchestrator (Layer 4): Điều phối use-cases, cấm JSX & cấm storage thô
    "orchestrator-boundary": {
      create(context: LintContext): Record<string, (node: LintNode) => void> {
        const rawFile = context.filename
          ? context.filename.replace(/\\/g, "/")
          : "";
        if (!rawFile.includes("/packages/orchestrator/")) return {};

        return {
          JSXElement(node: LintNode) {
            context.report({
              node,
              message:
                `[Orchestrator Rule] Rendering JSX components is strictly forbidden in Orchestrator layer.`,
            });
          },
          MemberExpression(
            node: LintNode & { object?: { type?: string; name?: string } },
          ) {
            if (
              node.object?.type === "Identifier" &&
              (node.object.name === "localStorage" ||
                node.object.name === "sessionStorage")
            ) {
              context.report({
                node,
                message:
                  `[Orchestrator Rule] Direct access to raw Web Storage '${node.object.name}' is forbidden. Use Repository layer abstractions instead.`,
              });
            }
          },
        };
      },
    },

    // 5. Rule Tầng UI (Layer 5): Giao diện & Event, cấm gọi trực tiếp chrome.storage thô
    "ui-boundary": {
      create(context: LintContext): Record<string, (node: LintNode) => void> {
        const rawFile = context.filename
          ? context.filename.replace(/\\/g, "/")
          : "";
        if (!rawFile.includes("/packages/ui/")) return {};

        return {
          MemberExpression(
            node: LintNode & {
              object?: {
                type?: string;
                name?: string;
                object?: { name?: string };
              };
              property?: { name?: string };
            },
          ) {
            if (
              node.object?.name === "chrome" &&
              node.property?.name === "storage"
            ) {
              context.report({
                node,
                message:
                  `[UI Rule] Direct access to 'chrome.storage' is forbidden in UI layer. Delegate data storage operations to Repository/Orchestrator layer.`,
              });
            }
          },
        };
      },
    },
  },
};

export default customRulesPlugin;
