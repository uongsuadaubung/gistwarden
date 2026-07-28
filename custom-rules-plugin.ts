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
                rel.startsWith("core/session-signal") ||
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
                rel.startsWith("core/app-init") ||
                rel.startsWith("core/messaging") ||
                rel.startsWith("core/messaging-contracts") ||
                rel.startsWith("core/alarms") || rel.startsWith("core/idle") ||
                rel.startsWith("core/ui-service") ||
                rel.startsWith("core/runtime") ||
                rel.startsWith("features/vault/autofill-usecase")
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
  },
};

export default customRulesPlugin;
