use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_ast::visit::{walk, Visit};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};
use oxc_syntax::scope::ScopeFlags;
use rayon::prelude::*;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::Instant;
use walkdir::WalkDir;

struct LintIssue {
    file_path: String,
    line: usize,
    column: usize,
    rule_id: &'static str,
    message: String,
}

fn get_layer_number_and_name(normalized_path: &str) -> (u8, &'static str) {
    if normalized_path.contains("/packages/domain/") {
        (1, "Domain (L1)")
    } else if normalized_path.contains("/packages/repository/") {
        (2, "Repository (L2)")
    } else if normalized_path.contains("/packages/network/") {
        (3, "Network (L3)")
    } else if normalized_path.contains("/packages/orchestrator/") {
        (4, "Orchestrator (L4)")
    } else if normalized_path.contains("/packages/ui/") {
        (5, "UI (L5)")
    } else if normalized_path.contains("/apps/") {
        (6, "App (L6)")
    } else {
        (0, "Unknown")
    }
}

fn get_target_layer_from_import(import_path: &str) -> (u8, &'static str) {
    if import_path.starts_with("@gistwarden/domain") || import_path.contains("/packages/domain/") {
        (1, "Domain (L1)")
    } else if import_path.starts_with("@gistwarden/repository") || import_path.contains("/packages/repository/") {
        (2, "Repository (L2)")
    } else if import_path.starts_with("@gistwarden/network") || import_path.contains("/packages/network/") {
        (3, "Network (L3)")
    } else if import_path.starts_with("@gistwarden/orchestrator") || import_path.contains("/packages/orchestrator/") {
        (4, "Orchestrator (L4)")
    } else if import_path.starts_with("@gistwarden/ui") || import_path.contains("/packages/ui/") {
        (5, "UI (L5)")
    } else if import_path.starts_with("@gistwarden/extension")
        || import_path.starts_with("@gistwarden/web")
        || import_path.contains("/apps/")
    {
        (6, "App (L6)")
    } else if let Some(rel) = import_path.strip_prefix("@/") {
        if rel.starts_with("core/crypto")
            || rel.starts_with("core/totp-utils")
            || rel.starts_with("core/session-manager")
            || rel.starts_with("core/types")
            || rel.starts_with("core/constants")
            || rel.starts_with("core/generator-utils")
            || rel.starts_with("core/domain-utils")
            || rel.starts_with("core/cbor-utils")
            || rel.starts_with("core/wordlist")
            || rel.starts_with("core/csv-parser")
            || rel.starts_with("core/json-utils")
            || rel.starts_with("core/i18n")
            || rel.starts_with("core/locales")
            || rel.starts_with("core/logger")
        {
            (1, "Domain (L1)")
        } else if rel.starts_with("core/storage") || rel.starts_with("core/storage-schemas") {
            (2, "Repository (L2)")
        } else if rel.starts_with("core/fetch-utils")
            || rel.starts_with("providers/")
            || rel.starts_with("features/sync/github-api")
        {
            (3, "Network (L3)")
        } else if rel.starts_with("core/session-usecases")
            || rel.starts_with("core/autofill-usecases")
            || rel.starts_with("core/vault-repository-usecase")
            || rel.starts_with("core/app-init")
            || rel.starts_with("core/messaging")
            || rel.starts_with("core/messaging-contracts")
            || rel.starts_with("core/alarms")
            || rel.starts_with("core/idle")
            || rel.starts_with("core/ui-service")
            || rel.starts_with("core/runtime")
        {
            (4, "Orchestrator (L4)")
        } else if rel.starts_with("features/")
            || rel.starts_with("components/")
            || rel.starts_with("styles/")
            || rel.starts_with("icons/")
            || rel.starts_with("core/")
        {
            (5, "UI (L5)")
        } else if rel.starts_with("extension/") {
            (6, "App (L6)")
        } else {
            (0, "External")
        }
    } else {
        (0, "External")
    }
}

fn get_line_column(source_text: &str, byte_offset: u32) -> (usize, usize) {
    let offset = (byte_offset as usize).min(source_text.len());
    let slice = &source_text.as_bytes()[..offset];
    let line = slice.iter().filter(|&&b| b == b'\n').count() + 1;
    let last_newline = slice.iter().rposition(|&b| b == b'\n').map_or(0, |pos| pos + 1);
    let column = offset.saturating_sub(last_newline) + 1;
    (line, column)
}

struct AstLinterVisitor<'a> {
    file_path: &'a str,
    normalized_path: String,
    file_layer: u8,
    file_layer_name: &'static str,
    source_text: &'a str,
    has_seen_non_import: bool,
    issues: Vec<LintIssue>,
}

impl<'a> AstLinterVisitor<'a> {
    fn add_issue(&mut self, span: Span, rule_id: &'static str, message: String) {
        let (line, column) = get_line_column(self.source_text, span.start);
        self.issues.push(LintIssue {
            file_path: self.file_path.to_string(),
            line,
            column,
            rule_id,
            message,
        });
    }
}

impl<'a> Visit<'a> for AstLinterVisitor<'a> {
    fn visit_statement(&mut self, stmt: &Statement<'a>) {
        if !matches!(stmt, Statement::ImportDeclaration(_)) {
            self.has_seen_non_import = true;
        }
        walk::walk_statement(self, stmt);
    }

    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        if self.has_seen_non_import {
            self.add_issue(
                decl.span,
                "imports-first",
                "All 'import' statements must be placed at the very top of the file before any other code statements.".to_string(),
            );
        }

        let import_path = decl.source.value.as_str();

        if self.normalized_path.contains("/src/")
            && !self.normalized_path.contains("/packages/")
            && !self.normalized_path.starts_with("packages/")
            && (import_path.starts_with("./") || import_path.starts_with("../"))
        {
            self.add_issue(
                decl.span,
                "use-alias-import",
                format!("Do not use relative import path '{}'. Use '@/' path alias instead inside 'src/' directory.", import_path),
            );
        }

        let (target_layer, target_layer_name) = get_target_layer_from_import(import_path);
        let is_service_worker = self.normalized_path.contains("/apps/extension/src/extension/")
            && !self.normalized_path.contains("autofill-content-script");

        if is_service_worker && target_layer == 5 {
            self.add_issue(
                decl.span,
                "strict-layer-boundaries",
                format!("Layer Violation: Background Worker script must NOT import UI layer components/stores ('{}').", import_path),
            );
        } else if self.file_layer == 3 && target_layer == 2 {
            self.add_issue(
                decl.span,
                "strict-layer-boundaries",
                format!("Layer Violation: Network Layer (L3) must NOT import Repository Layer (L2) directly ('{}').", import_path),
            );
        } else if target_layer > 0 && self.file_layer > 0 && self.file_layer < target_layer {
            self.add_issue(
                decl.span,
                "strict-layer-boundaries",
                format!("Layer Violation: '{}' is forbidden from importing higher layer '{}' ('{}').", self.file_layer_name, target_layer_name, import_path),
            );
        }

        walk::walk_import_declaration(self, decl);
    }

    fn visit_ts_as_expression(&mut self, expr: &TSAsExpression<'a>) {
        let is_as_const = matches!(
            &expr.type_annotation,
            TSType::TSTypeReference(r) if r.type_name.to_string() == "const"
        );

        if !is_as_const {
            self.add_issue(
                expr.span,
                "no-as-assertion",
                "Do not use 'as' type assertions. Use proper type guards, schema parsing, or type narrowing instead.".to_string(),
            );
        }
        walk::walk_ts_as_expression(self, expr);
    }

    fn visit_ts_any_keyword(&mut self, kw: &TSAnyKeyword) {
        self.add_issue(
            kw.span,
            "no-explicit-any",
            "Do not use 'any' type. Use explicit types or 'unknown' with type guards.".to_string(),
        );
    }

    fn visit_function(&mut self, func: &Function<'a>, flags: ScopeFlags) {
        if func.params.items.len() > 4 {
            self.add_issue(
                func.span,
                "max-params",
                format!("Function has too many parameters ({}/4). Please refactor it using an Options Object.", func.params.items.len()),
            );
        }
        walk::walk_function(self, func, flags);
    }

    fn visit_jsx_element(&mut self, elem: &JSXElement<'a>) {
        if self.file_layer == 1 {
            self.add_issue(
                elem.span,
                "domain-pureness",
                format!("[Domain Rule] Rendering JSX elements is strictly forbidden in Domain layer ('{}').", self.normalized_path),
            );
        } else if self.file_layer == 2 {
            self.add_issue(
                elem.span,
                "repository-boundary",
                "[Repository Rule] Rendering JSX elements is strictly forbidden in Repository layer.".to_string(),
            );
        } else if self.file_layer == 3 {
            self.add_issue(
                elem.span,
                "network-purity",
                "[Network Rule] Rendering JSX elements is strictly forbidden in Network layer.".to_string(),
            );
        } else if self.file_layer == 4 {
            self.add_issue(
                elem.span,
                "orchestrator-boundary",
                "[Orchestrator Rule] Rendering JSX components is strictly forbidden in Orchestrator layer.".to_string(),
            );
        }
        walk::walk_jsx_element(self, elem);
    }

    fn visit_throw_statement(&mut self, stmt: &ThrowStatement<'a>) {
        if self.normalized_path.contains("/src/") || self.normalized_path.contains("\\src\\") {
            self.add_issue(
                stmt.span,
                "no-throw",
                "Do not use 'throw' inside 'src/' directory. Use Result from 'neverthrow' for flat error handling.".to_string(),
            );
        }
        walk::walk_throw_statement(self, stmt);
    }

    fn visit_call_expression(&mut self, expr: &CallExpression<'a>) {
        if let Expression::Identifier(ident) = &expr.callee
            && ident.name == "fetch" {
                if self.file_layer == 1 {
                    self.add_issue(
                        expr.span,
                        "domain-pureness",
                        "[Domain Rule] Direct 'fetch()' calls are strictly forbidden in Domain layer. Delegate HTTP requests to Network layer.".to_string(),
                    );
                } else if self.file_layer == 2 {
                    self.add_issue(
                        expr.span,
                        "repository-boundary",
                        "[Repository Rule] Direct 'fetch()' calls are forbidden in Repository layer. Use Network layer ('packages/network') instead.".to_string(),
                    );
                }
            }
        walk::walk_call_expression(self, expr);
    }

    fn visit_member_expression(&mut self, expr: &MemberExpression<'a>) {
        let object_name = match expr.object() {
            Expression::Identifier(ident) => ident.name.as_str(),
            _ => "",
        };

        if object_name == "localStorage" || object_name == "sessionStorage" {
            if self.file_layer == 1 {
                self.add_issue(
                    expr.span(),
                    "domain-pureness",
                    "[Domain Rule] Accessing Web Storage directly is forbidden in Domain layer. Delegate to Repository layer.".to_string(),
                );
            } else if self.file_layer == 3 {
                self.add_issue(
                    expr.span(),
                    "network-purity",
                    "[Network Rule] Direct access to Web Storage is forbidden in Network layer. Return response payload to Orchestrator.".to_string(),
                );
            } else if self.file_layer == 4 {
                self.add_issue(
                    expr.span(),
                    "orchestrator-boundary",
                    "[Orchestrator Rule] Direct access to raw Web Storage is forbidden. Use Repository layer abstractions instead.".to_string(),
                );
            }
        }

        if self.file_layer == 5 && object_name == "chrome"
            && let Some(prop) = expr.static_property_name()
                && prop == "storage" {
                    self.add_issue(
                        expr.span(),
                        "ui-boundary",
                        "[UI Rule] Direct access to 'chrome.storage' is forbidden in UI layer. Delegate data storage operations to Repository/Orchestrator layer.".to_string(),
                    );
                }

        walk::walk_member_expression(self, expr);
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        if let BindingPatternKind::BindingIdentifier(_) = &decl.id.kind {
        } else if let BindingPatternKind::ObjectPattern(_) = &decl.id.kind
            && let Some(Expression::Identifier(ident)) = &decl.init
                && ident.name == "props" {
                    self.add_issue(
                        decl.span,
                        "no-props-destructuring",
                        "Do not destructure 'props' in SolidJS as it breaks reactivity. Access properties directly (e.g., props.title) or use 'splitProps'.".to_string(),
                    );
                }
        walk::walk_variable_declarator(self, decl);
    }

    fn visit_jsx_attribute(&mut self, attr: &JSXAttribute<'a>) {
        if self.normalized_path.ends_with(".tsx")
            && let JSXAttributeName::Identifier(ident) = &attr.name
                && ident.name == "style"
                    && let Some(JSXAttributeValue::ExpressionContainer(_)) = &attr.value {
                        self.add_issue(
                            attr.span,
                            "no-inline-style",
                            "Do not use inline 'style' object/string. Move styles to SCSS/CSS files instead.".to_string(),
                        );
                    }
        walk::walk_jsx_attribute(self, attr);
    }
}

fn lint_file_ast(file_path: &str) -> Vec<LintIssue> {
    let mut issues = Vec::new();
    let normalized_path = file_path.replace('\\', "/");

    if normalized_path.contains("/wasm/generated/") {
        return issues;
    }

    let source_text = match fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(_) => return issues,
    };

    // Rule 1: Check comments for @ts-ignore and @ts-expect-error
    if !normalized_path.contains("custom_linter") && !normalized_path.contains("gistwarden-cli") {
        for (idx, line_text) in source_text.lines().enumerate() {
            let line_num = idx + 1;
            if let Some(col) = line_text.find("@ts-ignore") {
                issues.push(LintIssue {
                    file_path: file_path.to_string(),
                    line: line_num,
                    column: col + 1,
                    rule_id: "no-ts-ignore",
                    message: "Do not use @ts-ignore. This is strictly forbidden by project rules.".to_string(),
                });
            }
            if let Some(col) = line_text.find("@ts-expect-error") {
                issues.push(LintIssue {
                    file_path: file_path.to_string(),
                    line: line_num,
                    column: col + 1,
                    rule_id: "no-ts-ignore",
                    message: "Do not use @ts-expect-error. This is strictly forbidden by project rules.".to_string(),
                });
            }
        }
    }

    let (file_layer, file_layer_name) = get_layer_number_and_name(&normalized_path);
    let allocator = Allocator::default();
    let path = PathBuf::from(file_path);
    let source_type = SourceType::from_path(&path).unwrap_or_default();

    let parser_ret = Parser::new(&allocator, &source_text, source_type).parse();

    let mut visitor = AstLinterVisitor {
        file_path,
        normalized_path,
        file_layer,
        file_layer_name,
        source_text: &source_text,
        has_seen_non_import: false,
        issues,
    };

    visitor.visit_program(&parser_ret.program);
    visitor.issues
}

fn collect_ts_files(root_dir: &str) -> Vec<PathBuf> {
    WalkDir::new(root_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.path().to_path_buf())
        .filter(|p| {
            let s = p.to_string_lossy();
            (s.ends_with(".ts") || s.ends_with(".tsx"))
                && !s.ends_with(".d.ts")
                && !s.contains("node_modules")
                && !s.contains("dist")
                && !s.contains(".git")
                && !s.contains("scratch")
                && !s.contains("wasm")
        })
        .collect()
}

fn main() {
    let start_time = Instant::now();
    println!("⚡ [OXC AST Linter] Running High-Performance TypeScript AST Linter...");

    let root_dirs = vec!["packages", "apps"];
    let mut files = Vec::new();

    for dir in root_dirs {
        files.extend(collect_ts_files(dir));
    }

    let all_issues: Vec<LintIssue> = files
        .par_iter()
        .flat_map(|path| lint_file_ast(&path.to_string_lossy()))
        .collect();

    let duration = start_time.elapsed();

    if !all_issues.is_empty() {
        eprintln!("\n❌ Found {} lint issue(s):\n", all_issues.len());

        let mut issues_by_file: HashMap<String, Vec<&LintIssue>> = HashMap::new();
        for issue in &all_issues {
            issues_by_file
                .entry(issue.file_path.clone())
                .or_default()
                .push(issue);
        }

        for (file, issues) in issues_by_file {
            eprintln!("📄 {}:", file);
            for issue in issues {
                eprintln!(
                    "  - L{}:{} [{}] {}",
                    issue.line, issue.column, issue.rule_id, issue.message
                );
            }
        }
        eprintln!("\n💥 Linting failed!");
        std::process::exit(1);
    } else {
        println!(
            "✓ OXC AST Lint passed clean across {} file(s) in {:.2?}.",
            files.len(),
            duration
        );
    }
}
