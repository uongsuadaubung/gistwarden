import { createSignal } from "solid-js";
import { View } from "@gistwarden/domain";

const pathToViewMap = new Map<string, View>([
  ["/login", View.Login],
  ["/welcome", View.Welcome],
  ["/vault", View.Vault],
  ["/vault/detail", View.ItemDetail],
  ["/vault/edit", View.ItemEdit],
  ["/generator", View.Generator],
  ["/settings", View.Settings],
  ["/settings/language", View.Language],
  ["/settings/theme", View.Theme],
  ["/settings/appearance", View.Appearance],
  ["/settings/about", View.About],
  ["/settings/troubleshooting", View.Troubleshooting],
  ["/vault-options", View.VaultOptions],
  ["/import", View.ImportAccounts],
  ["/export", View.ExportAccounts],
  ["/fido2-prompt", View.Fido2Prompt],
  ["/settings/security", View.AccountSecurity],
  ["/settings/change-password", View.ChangeMasterPassword],
  ["/settings/autofill", View.AutofillOptions],
  ["/generator/history", View.PasswordHistory],
  ["/vault/trash", View.Trash],
  ["/vault/folders", View.Folders],
  ["/reports", View.Reports],
  ["/reports/exposed", View.ReportExposed],
  ["/reports/reused", View.ReportReused],
  ["/reports/weak", View.ReportWeak],
  ["/reports/unsecure", View.ReportUnsecure],
  ["/reports/inactive-2fa", View.ReportInactive2FA],
  ["/reports/databreach", View.ReportDataBreach],
]);

const viewToPathMap = new Map<View, string>([
  [View.Login, "/login"],
  [View.Welcome, "/welcome"],
  [View.Vault, "/vault"],
  [View.ItemDetail, "/vault/detail"],
  [View.ItemEdit, "/vault/edit"],
  [View.Generator, "/generator"],
  [View.Settings, "/settings"],
  [View.Language, "/settings/language"],
  [View.Theme, "/settings/theme"],
  [View.Appearance, "/settings/appearance"],
  [View.About, "/settings/about"],
  [View.Troubleshooting, "/settings/troubleshooting"],
  [View.VaultOptions, "/vault-options"],
  [View.ImportAccounts, "/import"],
  [View.ExportAccounts, "/export"],
  [View.Fido2Prompt, "/fido2-prompt"],
  [View.AccountSecurity, "/settings/security"],
  [View.ChangeMasterPassword, "/settings/change-password"],
  [View.AutofillOptions, "/settings/autofill"],
  [View.PasswordHistory, "/generator/history"],
  [View.Trash, "/vault/trash"],
  [View.Folders, "/vault/folders"],
  [View.Reports, "/reports"],
  [View.ReportExposed, "/reports/exposed"],
  [View.ReportReused, "/reports/reused"],
  [View.ReportWeak, "/reports/weak"],
  [View.ReportUnsecure, "/reports/unsecure"],
  [View.ReportInactive2FA, "/reports/inactive-2fa"],
  [View.ReportDataBreach, "/reports/databreach"],
]);

export const pathDepths = new Map<string, number>([
  ["/login", 0],
  ["/welcome", 0],
  ["/vault", 1],
  ["/generator", 2],
  ["/reports", 3],
  ["/vault/detail", 2],
  ["/settings", 4],
  ["/vault/edit", 3],
  ["/generator/history", 3],
  ["/vault-options", 4],
  ["/settings/appearance", 4],
  ["/settings/about", 4],
  ["/settings/security", 4],
  ["/settings/autofill", 4],
  ["/settings/troubleshooting", 5],
  ["/settings/language", 5],
  ["/settings/theme", 5],
  ["/settings/change-password", 5],
  ["/import", 5],
  ["/export", 5],
  ["/fido2-prompt", 5],
  ["/vault/trash", 5],
  ["/vault/folders", 5],
  ["/reports/exposed", 4],
  ["/reports/reused", 4],
  ["/reports/weak", 4],
  ["/reports/unsecure", 4],
  ["/reports/inactive-2fa", 4],
  ["/reports/databreach", 4],
]);

export function getViewPath(view: View): string {
  return viewToPathMap.get(view) ?? "/vault";
}

export function getPathView(path: string): View {
  return pathToViewMap.get(path) ?? View.Vault;
}

export function getPathDepth(path: string): number {
  return pathDepths.get(path) ?? 1;
}

export type TransitionMode = "slide-forward" | "slide-backward" | "fade";

const [transitionName, setTransitionName] = createSignal<TransitionMode>(
  "fade",
);

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
