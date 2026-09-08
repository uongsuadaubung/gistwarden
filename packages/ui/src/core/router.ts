import { View } from "@gistwarden/domain";
import { createSignal } from "solid-js";

const pathToViewMap = new Map<string, View>([
  // Auth & Onboarding
  ["/login", View.Login],
  ["/welcome", View.Welcome],
  ["/fido2-prompt", View.Fido2Prompt],

  // Vault Items
  ["/vault", View.Vault],
  ["/vault/detail", View.ItemDetail],
  ["/vault/edit", View.ItemEdit],

  // Generator
  ["/generator", View.Generator],
  ["/generator/history", View.PasswordHistory],

  // Reports
  ["/reports", View.Reports],
  ["/reports/exposed", View.ReportExposed],
  ["/reports/reused", View.ReportReused],
  ["/reports/weak", View.ReportWeak],
  ["/reports/unsecure", View.ReportUnsecure],
  ["/reports/inactive-2fa", View.ReportInactive2FA],
  ["/reports/databreach", View.ReportDataBreach],

  // Settings Root
  ["/settings", View.Settings],

  // Settings -> Vault Options
  ["/settings/vault-options", View.VaultOptions],
  ["/settings/vault-options/import", View.ImportAccounts],
  ["/settings/vault-options/google-auth", View.GoogleAuthTool],
  ["/settings/vault-options/export", View.ExportAccounts],
  ["/settings/vault-options/folders", View.Folders],
  ["/settings/vault-options/trash", View.Trash],

  // Settings -> Appearance
  ["/settings/appearance", View.Appearance],
  ["/settings/appearance/language", View.Language],
  ["/settings/appearance/theme", View.Theme],

  // Settings -> Security
  ["/settings/security", View.AccountSecurity],
  ["/settings/security/change-password", View.ChangeMasterPassword],

  // Settings -> Autofill & About
  ["/settings/autofill", View.AutofillOptions],
  ["/settings/about", View.About],
  ["/settings/about/troubleshooting", View.Troubleshooting],
  ["/guide", View.Guide],
]);

const viewToPathMap = new Map<View, string>(
  Array.from(pathToViewMap.entries()).map(([path, view]) => [view, path]),
);

export function normalizeHashRoute(rawRoute: string): string {
  let clean = rawRoute.trim();
  if (clean.startsWith("#")) {
    clean = clean.substring(1).trim();
  }
  const qIdx = clean.indexOf("?");
  if (qIdx !== -1) {
    clean = clean.substring(0, qIdx);
  }
  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }
  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

export function getViewHash(view: View): string {
  const path = getViewPath(view);
  return `#${path}`;
}

export function getViewPath(view: View): string {
  return viewToPathMap.get(view) ?? "/vault";
}

export function getPathView(pathOrHash: string): View {
  const normalized = normalizeHashRoute(pathOrHash);
  if (normalized.startsWith("/guide")) {
    return View.Guide;
  }
  return pathToViewMap.get(normalized) ?? View.Vault;
}

const parentViewMap = new Map<View, View>([
  // Vault
  [View.ItemDetail, View.Vault],
  [View.ItemEdit, View.Vault],

  // Generator
  [View.PasswordHistory, View.Generator],

  // Reports
  [View.ReportExposed, View.Reports],
  [View.ReportReused, View.Reports],
  [View.ReportWeak, View.Reports],
  [View.ReportUnsecure, View.Reports],
  [View.ReportInactive2FA, View.Reports],
  [View.ReportDataBreach, View.Reports],

  // Settings
  [View.Appearance, View.Settings],
  [View.AccountSecurity, View.Settings],
  [View.VaultOptions, View.Settings],
  [View.AutofillOptions, View.Settings],
  [View.About, View.Settings],

  // Sub-settings
  [View.Language, View.Appearance],
  [View.Theme, View.Appearance],
  [View.ChangeMasterPassword, View.AccountSecurity],
  [View.ImportAccounts, View.VaultOptions],
  [View.GoogleAuthTool, View.VaultOptions],
  [View.ExportAccounts, View.VaultOptions],
  [View.Folders, View.VaultOptions],
  [View.Trash, View.VaultOptions],
  [View.Troubleshooting, View.About],
]);

export function getParentView(view: View): View {
  return parentViewMap.get(view) ?? View.Vault;
}

const baseRouteDepths: Record<string, number> = {
  "/login": 0,
  "/welcome": 0,
  "/vault": 1,
  "/generator": 2,
  "/reports": 3,
  "/settings": 4,
  "/fido2-prompt": 5,
};

export function getPathDepth(pathOrHash: string): number {
  const path = normalizeHashRoute(pathOrHash);
  const depth = baseRouteDepths[path];
  if (depth !== undefined) {
    return depth;
  }

  const segments = path.split("/").filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return 0;
  }

  const rootPath = `/${segments[0]}`;
  const baseDepth = baseRouteDepths[rootPath] ?? 5;
  return baseDepth + (segments.length - 1);
}

export const pathDepths = {
  get(path: string): number {
    return getPathDepth(path);
  },
};

export type TransitionMode = "slide-forward" | "slide-backward" | "fade";

const [transitionName, setTransitionName] =
  createSignal<TransitionMode>("fade");

export { setTransitionName, transitionName };

export function calculateTransition(
  oldPath: string,
  newPath: string,
): TransitionMode {
  const oldDepth = getPathDepth(oldPath);
  const newDepth = getPathDepth(newPath);

  if (newDepth > oldDepth) {
    return "slide-forward";
  } else if (newDepth < oldDepth) {
    return "slide-backward";
  }
  return "fade";
}
