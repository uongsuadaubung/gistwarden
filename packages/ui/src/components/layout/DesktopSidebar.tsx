import { View } from "@gistwarden/domain";
import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { navigate } from "@/core/navigation.ts";
import { getAppVersion } from "@/core/runtime.ts";
import { accountStore, uiStore } from "@/core/store.ts";
import { lock } from "@/features/auth/auth-service.ts";
import { syncVault } from "@/features/sync/sync-service.ts";
import {
  AppIcon,
  GeneratorIcon,
  InfoIcon,
  LockIcon,
  ReportsIcon,
  SettingsIcon,
  SyncIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";

export const DesktopSidebar: Component = () => {
  const isVaultActive = () =>
    [View.Vault, View.ItemDetail, View.ItemEdit].includes(uiStore.view);
  const isGeneratorActive = () =>
    [View.Generator, View.PasswordHistory].includes(uiStore.view);
  const isReportsActive = () =>
    [
      View.Reports,
      View.ReportExposed,
      View.ReportReused,
      View.ReportWeak,
      View.ReportUnsecure,
      View.ReportInactive2FA,
      View.ReportDataBreach,
    ].includes(uiStore.view);
  const isSettingsActive = () =>
    [
      View.Settings,
      View.Appearance,
      View.Language,
      View.Theme,
      View.AccountSecurity,
      View.ChangeMasterPassword,
      View.VaultOptions,
      View.ImportAccounts,
      View.GoogleAuthTool,
      View.ExportAccounts,
      View.Folders,
      View.Trash,
      View.AutofillOptions,
      View.About,
      View.Troubleshooting,
    ].includes(uiStore.view);
  const isGuideActive = () => uiStore.view === View.Guide;

  const handleSyncClick = async () => {
    if (uiStore.syncing) return;
    await syncVault();
  };

  const handleLockClick = async () => {
    await lock();
  };

  return (
    <aside class="desktop-sidebar">
      {/* Brand Header */}
      <div class="sidebar-header" onClick={() => navigate(View.Vault)}>
        <div class="sidebar-logo">
          <AppIcon width="28" height="28" />
        </div>
        <div class="sidebar-brand-info">
          <span class="sidebar-brand-title">Gistwarden</span>
          <span class="sidebar-brand-version">v{getAppVersion()}</span>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav class="sidebar-nav">
        <button
          type="button"
          class={`sidebar-nav-item ${isVaultActive() ? "active" : ""}`}
          onClick={() => navigate(View.Vault)}
        >
          <VaultIcon size={18} />
          <span>{t("nav_vault")}</span>
        </button>

        <button
          type="button"
          class={`sidebar-nav-item ${isGeneratorActive() ? "active" : ""}`}
          onClick={() => navigate(View.Generator)}
        >
          <GeneratorIcon size={18} />
          <span>{t("nav_generator")}</span>
        </button>

        <button
          type="button"
          class={`sidebar-nav-item ${isReportsActive() ? "active" : ""}`}
          onClick={() => navigate(View.Reports)}
        >
          <ReportsIcon size={18} />
          <span>{t("nav_reports")}</span>
        </button>

        <button
          type="button"
          class={`sidebar-nav-item ${isSettingsActive() ? "active" : ""}`}
          onClick={() => navigate(View.Settings)}
        >
          <SettingsIcon size={18} />
          <span>{t("nav_settings")}</span>
        </button>

        <button
          type="button"
          class={`sidebar-nav-item ${isGuideActive() ? "active" : ""}`}
          onClick={() => navigate(View.Guide)}
        >
          <InfoIcon size={18} />
          <span>{t("settings_user_guide")}</span>
        </button>
      </nav>

      {/* Footer / Utility Actions */}
      <div class="sidebar-footer">
        {/* Sync Status Button */}
        <button
          type="button"
          class="sidebar-action-btn sync-btn"
          onClick={handleSyncClick}
          disabled={uiStore.syncing}
          title={t("vault_btn_sync")}
        >
          <SyncIcon size={16} class={uiStore.syncing ? "spinning" : ""} />
          <span class="action-text">
            {uiStore.syncing ? t("vault_syncing") : t("vault_btn_sync")}
          </span>
        </button>

        {/* Lock Vault Button */}
        <button
          type="button"
          class="sidebar-action-btn lock-btn"
          onClick={handleLockClick}
          title={t("vault_lock_title")}
        >
          <LockIcon size={16} />
          <span class="action-text">{t("vault_lock_title")}</span>
        </button>
      </div>
    </aside>
  );
};
