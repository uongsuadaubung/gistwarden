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
              const isInline = val && (
                val.type === "Literal" ||
                val.type === "StringLiteral" ||
                (val.type === "JSXExpressionContainer" &&
                  val.expression &&
                  val.expression.type === "ObjectExpression")
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
  },
};

export default customRulesPlugin;
