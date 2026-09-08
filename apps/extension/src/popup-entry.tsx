import { View } from "@gistwarden/domain";
import {
  accountStore,
  getViewPath,
  init,
  initHashHistory,
  lock,
  navigate,
  reloadVaultItems,
  resetAccountStore,
  resetUiStore,
  settingsStore,
  uiStore,
} from "@gistwarden/ui";
import { type Component, Match, onMount, Show, Switch } from "solid-js";
import { Dynamic, render } from "solid-js/web";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar.tsx";
import ConfirmModal from "@/components/ui/ConfirmModal.tsx";
import RepromptModal from "@/components/ui/RepromptModal.tsx";
import { RouteTransition } from "@/components/ui/RouteTransition.tsx";
import {
  MSG_USER_ACTIVITY,
  MSG_VAULT_ITEMS_UPDATED,
  MSG_VAULT_LOCKED,
  MSG_VAULT_LOGGED_OUT,
} from "@/core/constants.ts";
import { t } from "@/core/i18n.ts";
import { notifyBackground, onExtensionMessage } from "@/core/messaging.ts";
import { isRecord } from "@/core/storage.ts";
import AccountSecurity from "@/features/auth/AccountSecurity.tsx";
import ChangeMasterPassword from "@/features/auth/ChangeMasterPassword.tsx";
import LockScreen from "@/features/auth/LockScreen.tsx";
import Login from "@/features/auth/Login.tsx";
import Generator from "@/features/generator/Generator.tsx";
import PasswordHistory from "@/features/generator/PasswordHistory.tsx";
import Fido2Prompt from "@/features/passkey/Fido2Prompt.tsx";
import ReportDataBreach from "@/features/reports/ReportDataBreach.tsx";
import ReportExposed from "@/features/reports/ReportExposed.tsx";
import ReportInactive2FA from "@/features/reports/ReportInactive2FA.tsx";
import ReportReused from "@/features/reports/ReportReused.tsx";
import Reports from "@/features/reports/Reports.tsx";
import ReportUnsecure from "@/features/reports/ReportUnsecure.tsx";
import ReportWeak from "@/features/reports/ReportWeak.tsx";
import Guide from "@/features/guide/Guide.tsx";
import About from "@/features/settings/About.tsx";
import Appearance from "@/features/settings/Appearance.tsx";
import AutofillOptions from "@/features/settings/AutofillOptions.tsx";
import Language from "@/features/settings/Language.tsx";
import Settings from "@/features/settings/Settings.tsx";
import Theme from "@/features/settings/Theme.tsx";
import Troubleshooting from "@/features/settings/Troubleshooting.tsx";
import ExportAccounts from "@/features/sync/ExportAccounts.tsx";
import GoogleMigrationPage from "@/features/sync/GoogleMigrationPage.tsx";
import ImportAccounts from "@/features/sync/ImportAccounts.tsx";
import Folders from "@/features/vault/Folders.tsx";
import ItemDetail from "@/features/vault/ItemDetail.tsx";
import ItemEdit from "@/features/vault/ItemEdit.tsx";
import Trash from "@/features/vault/Trash.tsx";
import Vault from "@/features/vault/Vault.tsx";
import VaultOptions from "@/features/vault/VaultOptions.tsx";
import Welcome from "@/features/welcome/Welcome.tsx";
import {
  GeneratorIcon,
  ReportsIcon,
  SettingsIcon,
  SyncIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";

const VIEW_COMPONENTS: Record<View, Component> = {
  [View.Vault]: Vault,
  [View.ItemDetail]: ItemDetail,
  [View.ItemEdit]: ItemEdit,
  [View.Generator]: Generator,
  [View.PasswordHistory]: PasswordHistory,
  [View.Reports]: Reports,
  [View.ReportExposed]: ReportExposed,
  [View.ReportReused]: ReportReused,
  [View.ReportWeak]: ReportWeak,
  [View.ReportUnsecure]: ReportUnsecure,
  [View.ReportInactive2FA]: ReportInactive2FA,
  [View.ReportDataBreach]: ReportDataBreach,
  [View.Settings]: Settings,
  [View.Appearance]: Appearance,
  [View.Language]: Language,
  [View.Theme]: Theme,
  [View.AccountSecurity]: AccountSecurity,
  [View.ChangeMasterPassword]: ChangeMasterPassword,
  [View.VaultOptions]: VaultOptions,
  [View.ImportAccounts]: ImportAccounts,
  [View.GoogleAuthTool]: GoogleMigrationPage,
  [View.ExportAccounts]: ExportAccounts,
  [View.Folders]: Folders,
  [View.Trash]: Trash,
  [View.AutofillOptions]: AutofillOptions,
  [View.About]: About,
  [View.Troubleshooting]: Troubleshooting,
  [View.Guide]: Vault,
  [View.Login]: Login,
  [View.Welcome]: Welcome,
  [View.Fido2Prompt]: Fido2Prompt,
};

const isResponsiveMode = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  return mode === "tab" || mode === "fido2-prompt";
};

const VaultCardContent: Component = () => (
  <div class="app-container">
    <div class="flex-1 overflow-hidden pos-relative">
      <RouteTransition currentPath={getViewPath(uiStore.view)}>
        <Dynamic component={VIEW_COMPONENTS[uiStore.view] || Vault} />
      </RouteTransition>
    </div>

    {/* Bottom Nav Bar */}
    <Show
      when={[View.Vault, View.Generator, View.Reports, View.Settings].includes(
        uiStore.view,
      )}
    >
      <nav class="app-nav">
        <div
          class={`nav-item ${uiStore.view === View.Vault ? "active" : ""}`}
          onClick={() => navigate(View.Vault)}
        >
          <VaultIcon />
          <span>{t("nav_vault")}</span>
        </div>
        <div
          class={`nav-item ${uiStore.view === View.Generator ? "active" : ""}`}
          onClick={() => navigate(View.Generator)}
        >
          <GeneratorIcon />
          <span>{t("nav_generator")}</span>
        </div>
        <div
          class={`nav-item ${uiStore.view === View.Reports ? "active" : ""}`}
          onClick={() => navigate(View.Reports)}
        >
          <ReportsIcon />
          <span>{t("nav_reports")}</span>
        </div>
        <div
          class={`nav-item ${
            uiStore.view === View.Settings || uiStore.view === View.VaultOptions
              ? "active"
              : ""
          }`}
          onClick={() => navigate(View.Settings)}
        >
          <SettingsIcon />
          <span>{t("nav_settings")}</span>
        </div>
      </nav>
    </Show>
  </div>
);

const MainLayout: Component = () => {
  return (
    <div class="app-root-wrapper">
      <Switch>
        {/* Loading initial store state */}
        <Match when={!accountStore.isLoaded || !settingsStore.isLoaded}>
          <div class="app-loading-container flex-center h-100" />
        </Match>

        {/* FIDO2/Passkey Prompt Window */}
        <Match when={uiStore.view === View.Fido2Prompt}>
          <Fido2Prompt />
        </Match>

        {/* Regular vault locking/login */}
        <Match when={accountStore.isLocked && uiStore.view !== View.Guide}>
          <div class="auth-layout-container">
            <Switch>
              <Match when={uiStore.view === View.Welcome}>
                <Welcome />
              </Match>
              <Match when={accountStore.vaultConfigured}>
                <LockScreen />
              </Match>
              <Match when={true}>
                <Login />
              </Match>
            </Switch>
          </div>
        </Match>

        {/* Main Application Shell when unlocked or viewing Guide */}
        <Match when={true}>
          <Show
            when={isResponsiveMode()}
            fallback={
              <Show
                when={uiStore.view === View.Guide}
                fallback={<VaultCardContent />}
              >
                <div class="guide-viewport-container">
                  <Guide />
                </div>
              </Show>
            }
          >
            <div class="app-layout-wrapper">
              <DesktopSidebar />
              <main class="app-main-viewport">
                <Show
                  when={uiStore.view === View.Guide}
                  fallback={
                    <div class="app-centered-card">
                      <VaultCardContent />
                    </div>
                  }
                >
                  <div class="guide-viewport-container">
                    <Guide />
                  </div>
                </Show>
              </main>
            </div>
          </Show>
        </Match>
      </Switch>

      {/* Reusable Toast Notification */}
      <Show when={uiStore.toastMessage}>
        <div class={`toast-notification ${uiStore.toastType}`}>
          {uiStore.toastMessage}
        </div>
      </Show>

      {/* Reusable Confirmation Modal */}
      <ConfirmModal />

      {/* Master Password Reprompt Modal */}
      <RepromptModal />

      {/* Global Loading Overlay */}
      <Show when={uiStore.globalLoading}>
        <div class="global-loading-overlay">
          <div class="global-loading-content">
            <SyncIcon class="spinning" />
            <div class="global-loading-text">
              {uiStore.globalLoadingText || t("dialog_loading")}
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

const App: Component = () => {
  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "tab" || mode === "fido2-prompt") {
      document.documentElement.classList.add("mode-responsive");
      initHashHistory();
    }
    await init();

    onExtensionMessage((message) => {
      if (!isRecord(message)) return;
      if (message.type === MSG_VAULT_LOCKED) {
        console.debug("[Popup] Received VAULT_LOCKED message from background");
        lock();
      } else if (message.type === MSG_VAULT_LOGGED_OUT) {
        console.debug(
          "[Popup] Received VAULT_LOGGED_OUT message from background",
        );
        resetAccountStore();
        resetUiStore();
      } else if (message.type === MSG_VAULT_ITEMS_UPDATED) {
        console.debug(
          "[Popup] Received VAULT_ITEMS_UPDATED message from background",
        );
        reloadVaultItems();
      }
    });

    let activityThrottleTimer: number | null = null;
    const resetTimeout = () => {
      if (activityThrottleTimer !== null) return;
      activityThrottleTimer = window.setTimeout(() => {
        activityThrottleTimer = null;
      }, 2000);
      notifyBackground({ type: MSG_USER_ACTIVITY });
    };

    resetTimeout();
    window.addEventListener("click", resetTimeout);
    window.addEventListener("keydown", resetTimeout);
  });

  return (
    <Show
      when={accountStore.isLoaded && settingsStore.isLoaded}
      fallback={
        <div class="loading-screen">
          <div class="text-center">
            <SyncIcon class="spinning loading-icon" />
            <div class="font-sz-13">{t("app_loading")}</div>
          </div>
        </div>
      }
    >
      <MainLayout />
    </Show>
  );
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
