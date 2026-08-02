import { render } from "solid-js/web";
import { initWasmAsync } from "@gistwarden/domain";
import {
  type Component,
  createEffect,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import {
  HashRouter,
  MemoryRouter,
  Route,
  type RouteSectionProps,
  useLocation,
  useNavigate,
} from "@solidjs/router";
import {
  accountStore,
  getViewPath,
  init,
  lock,
  navigate,
  reloadVaultItems,
  resetAccountStore,
  resetUiStore,
  setActiveNavigator,
  settingsStore,
  uiStore,
} from "@gistwarden/ui";
import { View } from "@gistwarden/domain";
import {
  GeneratorIcon,
  ReportsIcon,
  SettingsIcon,
  SyncIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";
import {
  MSG_USER_ACTIVITY,
  MSG_VAULT_ITEMS_UPDATED,
  MSG_VAULT_LOCKED,
  MSG_VAULT_LOGGED_OUT,
} from "@/core/constants.ts";
import { notifyBackground, onExtensionMessage } from "@/core/messaging.ts";
import { isRecord } from "@/core/storage.ts";
import { RouteTransition } from "@/components/ui/RouteTransition.tsx";

// Import Views
import Login from "@/features/auth/Login.tsx";
import Vault from "@/features/vault/Vault.tsx";
import ItemDetail from "@/features/vault/ItemDetail.tsx";
import ItemEdit from "@/features/vault/ItemEdit.tsx";
import Generator from "@/features/generator/Generator.tsx";
import Settings from "@/features/settings/Settings.tsx";
import VaultOptions from "@/features/vault/VaultOptions.tsx";
import ImportAccounts from "@/features/sync/ImportAccounts.tsx";
import ExportAccounts from "@/features/sync/ExportAccounts.tsx";
import Fido2Prompt from "@/features/passkey/Fido2Prompt.tsx";
import Language from "@/features/settings/Language.tsx";
import Theme from "@/features/settings/Theme.tsx";
import Appearance from "@/features/settings/Appearance.tsx";
import About from "@/features/settings/About.tsx";
import Troubleshooting from "@/features/settings/Troubleshooting.tsx";
import Welcome from "@/features/welcome/Welcome.tsx";
import AccountSecurity from "@/features/auth/AccountSecurity.tsx";
import ChangeMasterPassword from "@/features/auth/ChangeMasterPassword.tsx";
import AutofillOptions from "@/features/settings/AutofillOptions.tsx";
import PasswordHistory from "@/features/generator/PasswordHistory.tsx";
import Trash from "@/features/vault/Trash.tsx";
import Folders from "@/features/vault/Folders.tsx";
import Reports from "@/features/reports/Reports.tsx";
import ReportExposed from "@/features/reports/ReportExposed.tsx";
import ReportReused from "@/features/reports/ReportReused.tsx";
import ReportWeak from "@/features/reports/ReportWeak.tsx";
import ReportUnsecure from "@/features/reports/ReportUnsecure.tsx";
import ReportInactive2FA from "@/features/reports/ReportInactive2FA.tsx";
import ReportDataBreach from "@/features/reports/ReportDataBreach.tsx";
import ConfirmModal from "@/components/ui/ConfirmModal.tsx";
import RepromptModal from "@/components/ui/RepromptModal.tsx";
import { t } from "@/core/i18n.ts";

// Warm up WASM asynchronously on popup startup
initWasmAsync().catch(() => {});

const RouterSyncHandler: Component = () => {
  const nav = useNavigate();
  const location = useLocation();

  onMount(() => {
    setActiveNavigator((to, options) => {
      nav(to, options);
    });
  });

  createEffect(() => {
    const targetPath = getViewPath(uiStore.view);
    if (location.pathname !== targetPath) {
      nav(targetPath, { replace: true });
    }
  });

  return null;
};

const MainLayout: Component<RouteSectionProps> = (props) => {
  return (
    <>
      <RouterSyncHandler />
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
          <Match when={accountStore.isLocked}>
            <Switch>
              <Match when={uiStore.view === View.Welcome}>
                <Welcome />
              </Match>
              <Match when={true}>
                <Login />
              </Match>
            </Switch>
          </Match>

          {/* Main Application Shell when unlocked */}
          <Match when={true}>
            <div class="app-container">
              <div class="flex-1 overflow-hidden pos-relative">
                <RouteTransition>
                  {props.children}
                </RouteTransition>
              </div>

              {/* Bottom Nav Bar */}
              <Show
                when={[
                  View.Vault,
                  View.Generator,
                  View.Reports,
                  View.Settings,
                ].includes(uiStore.view)}
              >
                <nav class="app-nav">
                  <div
                    class={`nav-item ${
                      uiStore.view === View.Vault ? "active" : ""
                    }`}
                    onClick={() => navigate(View.Vault)}
                  >
                    <VaultIcon />
                    <span>{t("nav_vault")}</span>
                  </div>
                  <div
                    class={`nav-item ${
                      uiStore.view === View.Generator ? "active" : ""
                    }`}
                    onClick={() => navigate(View.Generator)}
                  >
                    <GeneratorIcon />
                    <span>{t("nav_generator")}</span>
                  </div>
                  <div
                    class={`nav-item ${
                      uiStore.view === View.Reports ? "active" : ""
                    }`}
                    onClick={() => navigate(View.Reports)}
                  >
                    <ReportsIcon />
                    <span>{t("nav_reports")}</span>
                  </div>
                  <div
                    class={`nav-item ${
                      uiStore.view === View.Settings ||
                        uiStore.view === View.VaultOptions
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
    </>
  );
};

const App: Component = () => {
  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "tab" || mode === "fido2-prompt") {
      document.documentElement.classList.add("mode-responsive");
    }
    await init();

    onExtensionMessage((message) => {
      if (!isRecord(message)) return;
      if (message.type === MSG_VAULT_LOCKED) {
        console.debug(
          "[Popup] Received VAULT_LOCKED message from background",
        );
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

  const isWebProtocol = typeof window !== "undefined" &&
    window.location.protocol.startsWith("http");

  const routesConfig: Array<{ view: View; component: Component }> = [
    { view: View.Vault, component: Vault },
    { view: View.ItemDetail, component: ItemDetail },
    { view: View.ItemEdit, component: ItemEdit },
    { view: View.Generator, component: Generator },
    { view: View.PasswordHistory, component: PasswordHistory },
    { view: View.Reports, component: Reports },
    { view: View.ReportExposed, component: ReportExposed },
    { view: View.ReportReused, component: ReportReused },
    { view: View.ReportWeak, component: ReportWeak },
    { view: View.ReportUnsecure, component: ReportUnsecure },
    { view: View.ReportInactive2FA, component: ReportInactive2FA },
    { view: View.ReportDataBreach, component: ReportDataBreach },
    { view: View.Settings, component: Settings },
    { view: View.Appearance, component: Appearance },
    { view: View.Language, component: Language },
    { view: View.Theme, component: Theme },
    { view: View.AccountSecurity, component: AccountSecurity },
    { view: View.ChangeMasterPassword, component: ChangeMasterPassword },
    { view: View.VaultOptions, component: VaultOptions },
    { view: View.ImportAccounts, component: ImportAccounts },
    { view: View.ExportAccounts, component: ExportAccounts },
    { view: View.Folders, component: Folders },
    { view: View.Trash, component: Trash },
    { view: View.AutofillOptions, component: AutofillOptions },
    { view: View.About, component: About },
    { view: View.Troubleshooting, component: Troubleshooting },
  ];

  const appRoutes = (
    <>
      <Route path="/" component={Vault} />
      <For each={routesConfig}>
        {(route) => (
          <Route path={getViewPath(route.view)} component={route.component} />
        )}
      </For>
      <Route path="*" component={Vault} />
    </>
  );

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
      <Show
        when={isWebProtocol}
        fallback={<MemoryRouter root={MainLayout}>{appRoutes}</MemoryRouter>}
      >
        <HashRouter root={MainLayout}>{appRoutes}</HashRouter>
      </Show>
    </Show>
  );
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
