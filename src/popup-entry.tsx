import { render } from "solid-js/web";
import {
  type Component,
  type JSX,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { store } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { init, lock, logout } from "@/features/auth/auth-service.ts";
import { navigate } from "@/core/navigation.ts";
import {
  GeneratorIcon,
  SettingsIcon,
  SyncIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";
import {
  MSG_RESET_TIMEOUT,
  MSG_VAULT_LOCKED,
  MSG_VAULT_LOGGED_OUT,
} from "@/core/constants.ts";
import { notifyBackground } from "@/core/messaging.ts";

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
import ConfirmModal from "@/components/ui/ConfirmModal.tsx";
import RepromptModal from "@/components/ui/RepromptModal.tsx";
import { t } from "@/core/i18n.ts";

const TransitionView: Component<{ when: boolean; children: JSX.Element }> = (
  props,
) => {
  return (
    <Show when={props.when}>
      <div class={`${store.transitionClass} h-100 w-100`}>
        {props.children}
      </div>
    </Show>
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

    // Listen for background lock events
    if (
      typeof chrome !== "undefined" && chrome.runtime &&
      chrome.runtime.onMessage
    ) {
      chrome.runtime.onMessage.addListener((message: { type: string }) => {
        if (message.type === MSG_VAULT_LOCKED) {
          console.debug(
            "[Popup] Received VAULT_LOCKED message from background",
          );
          lock();
        } else if (message.type === MSG_VAULT_LOGGED_OUT) {
          console.debug(
            "[Popup] Received VAULT_LOGGED_OUT message from background",
          );
          logout();
        }
      });
    }

    // Reset inactivity timeout on user interaction
    const resetTimeout = () => {
      notifyBackground({ type: MSG_RESET_TIMEOUT });
    };

    resetTimeout();
    window.addEventListener("click", resetTimeout);
    window.addEventListener("keydown", resetTimeout);
  });

  return (
    <Show
      when={store.isLoaded}
      fallback={
        <div class="loading-screen">
          <div class="text-center">
            <SyncIcon class="spinning loading-icon" />
            <div class="font-sz-13">{t("app_loading")}</div>
          </div>
        </div>
      }
    >
      <div class="app-root-wrapper">
        <Switch>
          {/* FIDO2/Passkey Prompt Window */}
          <Match when={store.view === View.Fido2Prompt}>
            <Fido2Prompt />
          </Match>

          {/* Regular vault locking/login */}
          <Match when={store.isLocked}>
            <Switch>
              <Match when={store.view === View.Welcome}>
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
                <TransitionView when={store.view === View.Vault}>
                  <Vault />
                </TransitionView>
                <TransitionView when={store.view === View.ItemDetail}>
                  <ItemDetail />
                </TransitionView>
                <TransitionView when={store.view === View.ItemEdit}>
                  <ItemEdit />
                </TransitionView>
                <TransitionView when={store.view === View.Generator}>
                  <Generator />
                </TransitionView>
                <TransitionView when={store.view === View.Settings}>
                  <Settings />
                </TransitionView>
                <TransitionView when={store.view === View.VaultOptions}>
                  <VaultOptions />
                </TransitionView>
                <TransitionView when={store.view === View.ImportAccounts}>
                  <ImportAccounts />
                </TransitionView>
                <TransitionView when={store.view === View.ExportAccounts}>
                  <ExportAccounts />
                </TransitionView>
                <TransitionView when={store.view === View.Language}>
                  <Language />
                </TransitionView>
                <TransitionView when={store.view === View.Theme}>
                  <Theme />
                </TransitionView>
                <TransitionView when={store.view === View.Appearance}>
                  <Appearance />
                </TransitionView>
                <TransitionView when={store.view === View.About}>
                  <About />
                </TransitionView>
                <TransitionView when={store.view === View.Troubleshooting}>
                  <Troubleshooting />
                </TransitionView>
                <TransitionView when={store.view === View.AccountSecurity}>
                  <AccountSecurity />
                </TransitionView>
                <TransitionView when={store.view === View.ChangeMasterPassword}>
                  <ChangeMasterPassword />
                </TransitionView>
              </div>

              {/* Bottom Nav Bar (hidden when viewing/editing details) */}
              <Show
                when={[
                  View.Vault,
                  View.Generator,
                  View.Settings,
                ].includes(store.view)}
              >
                <nav class="app-nav">
                  <div
                    class={`nav-item ${
                      store.view === View.Vault ? "active" : ""
                    }`}
                    onClick={() => navigate(View.Vault)}
                  >
                    <VaultIcon />
                    <span>{t("nav_vault")}</span>
                  </div>
                  <div
                    class={`nav-item ${
                      store.view === View.Generator ? "active" : ""
                    }`}
                    onClick={() => navigate(View.Generator)}
                  >
                    <GeneratorIcon />
                    <span>{t("nav_generator")}</span>
                  </div>
                  <div
                    class={`nav-item ${
                      store.view === View.Settings ||
                        store.view === View.VaultOptions
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
        <Show when={store.toastMessage}>
          <div class={`toast-notification ${store.toastType}`}>
            {store.toastMessage}
          </div>
        </Show>

        {/* Reusable Confirmation Modal */}
        <ConfirmModal />

        {/* Master Password Reprompt Modal */}
        <RepromptModal />

        {/* Global Loading Overlay */}
        <Show when={store.globalLoading}>
          <div class="global-loading-overlay">
            <div class="global-loading-content">
              <SyncIcon class="spinning" />
              <div class="global-loading-text">
                {store.globalLoadingText || t("dialog_loading")}
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
