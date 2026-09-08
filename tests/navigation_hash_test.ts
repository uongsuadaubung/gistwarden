import { View } from "@gistwarden/domain";
import {
  calculateTransition,
  getParentView,
  getPathDepth,
  getPathView,
  getViewHash,
  getViewPath,
  normalizeHashRoute,
} from "../packages/ui/src/core/router.ts";
import { NavigationManager } from "../packages/ui/src/core/navigation.ts";
import { assert, assertEquals, test } from "./assert.ts";

test("Hash Routing - normalizeHashRoute extracts clean path from hash and query params", () => {
  assertEquals(normalizeHashRoute("#/vault"), "/vault");
  assertEquals(normalizeHashRoute("#/reports/weak"), "/reports/weak");
  assertEquals(
    normalizeHashRoute("#/settings/appearance/theme"),
    "/settings/appearance/theme",
  );
  assertEquals(
    normalizeHashRoute("#/vault/detail?itemId=item-12345"),
    "/vault/detail",
  );
  assertEquals(normalizeHashRoute("#settings/autofill"), "/settings/autofill");
  assertEquals(normalizeHashRoute("/generator"), "/generator");
  assertEquals(normalizeHashRoute(""), "/");
});

test("Hash Routing - getPathView resolves correct View enum from hash", () => {
  assertEquals(getPathView("#/vault"), View.Vault);
  assertEquals(getPathView("#/vault/detail?itemId=abc"), View.ItemDetail);
  assertEquals(getPathView("#/generator"), View.Generator);
  assertEquals(getPathView("#/generator/history"), View.PasswordHistory);
  assertEquals(getPathView("#/reports"), View.Reports);
  assertEquals(getPathView("#/reports/weak"), View.ReportWeak);
  assertEquals(getPathView("#/reports/databreach"), View.ReportDataBreach);
  assertEquals(getPathView("#/settings"), View.Settings);
  assertEquals(getPathView("#/settings/appearance"), View.Appearance);
  assertEquals(getPathView("#/settings/appearance/theme"), View.Theme);
  assertEquals(getPathView("#/settings/appearance/language"), View.Language);
  assertEquals(getPathView("#/settings/security"), View.AccountSecurity);
  assertEquals(
    getPathView("#/settings/vault-options/import"),
    View.ImportAccounts,
  );
  assertEquals(getPathView("#/guide/getting-started/overview"), View.Guide);
  assertEquals(getPathView("#/guide/getting-started/github-gist"), View.Guide);
  assertEquals(getPathView("#/guide/getting-started/local-vault"), View.Guide);
  assertEquals(
    getPathView("#/guide/vault-management/custom-fields"),
    View.Guide,
  );
  assertEquals(
    getPathView("#/guide/passkey-auth/totp-authenticator"),
    View.Guide,
  );
  assertEquals(getPathView("#/guide"), View.Guide);
  // Unknown falls back to Vault
  assertEquals(getPathView("#/non-existent-route"), View.Vault);
});

test("Hash Routing - getViewHash generates valid hash for GitHub Pages", () => {
  assertEquals(getViewHash(View.Vault), "#/vault");
  assertEquals(getViewHash(View.Generator), "#/generator");
  assertEquals(getViewHash(View.Reports), "#/reports");
  assertEquals(getViewHash(View.Settings), "#/settings");
  assertEquals(getViewHash(View.Appearance), "#/settings/appearance");
  assertEquals(getViewHash(View.Theme), "#/settings/appearance/theme");
  assertEquals(getViewHash(View.ReportWeak), "#/reports/weak");
});

test("Hash Routing - getParentView identifies correct ancestor view for back fallback", () => {
  assertEquals(getParentView(View.ItemDetail), View.Vault);
  assertEquals(getParentView(View.ItemEdit), View.Vault);
  assertEquals(getParentView(View.PasswordHistory), View.Generator);
  assertEquals(getParentView(View.ReportWeak), View.Reports);
  assertEquals(getParentView(View.ReportDataBreach), View.Reports);
  assertEquals(getParentView(View.Appearance), View.Settings);
  assertEquals(getParentView(View.Theme), View.Appearance);
  assertEquals(getParentView(View.Language), View.Appearance);
  assertEquals(getParentView(View.ChangeMasterPassword), View.AccountSecurity);
  assertEquals(getParentView(View.ImportAccounts), View.VaultOptions);
  assertEquals(getParentView(View.Troubleshooting), View.About);
});

test("Hash Routing - getPathDepth & calculateTransition compute animation direction", () => {
  const vaultDepth = getPathDepth("#/vault");
  const settingsDepth = getPathDepth("#/settings");
  const appearanceDepth = getPathDepth("#/settings/appearance");
  const themeDepth = getPathDepth("#/settings/appearance/theme");

  assert(
    appearanceDepth > settingsDepth,
    "Appearance must be deeper than Settings",
  );
  assert(themeDepth > appearanceDepth, "Theme must be deeper than Appearance");

  assertEquals(
    calculateTransition("#/settings", "#/settings/appearance"),
    "slide-forward",
  );
  assertEquals(
    calculateTransition("#/settings/appearance", "#/settings"),
    "slide-backward",
  );
  assertEquals(calculateTransition("#/vault", "#/vault"), "fade");
});

test("Hash Routing - NavigationManager maintains navigation stack for goBack", () => {
  const manager = new NavigationManager();

  assertEquals(manager.canGoBack(), false);

  manager.pushView(View.Vault);
  assertEquals(manager.canGoBack(), false); // only 1 view in stack

  manager.pushView(View.Reports);
  assertEquals(manager.canGoBack(), true); // 2 views in stack

  manager.pushView(View.ItemEdit);
  assertEquals(manager.canGoBack(), true); // 3 views in stack

  const popped = manager.popView();
  assertEquals(popped, View.ItemEdit);
  assertEquals(manager.canGoBack(), true);

  manager.popView(); // pops View.Reports
  assertEquals(manager.canGoBack(), false); // only View.Vault left
});
