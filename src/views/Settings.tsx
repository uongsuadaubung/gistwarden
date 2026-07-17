import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import {
  ChevronRightIcon,
  GithubIcon,
  GlobeIcon,
  LockIcon,
  LogoutIcon,
  QuestionIcon,
  ShieldIcon,
  ThemeIcon,
  TrashIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";

export const Settings: Component = () => {
  const [error, setError] = createSignal("");
  const [_loading, setLoading] = createSignal(false);

  const handleLock = () => {
    storeActions.lock();
  };

  const handleLogout = async () => {
    if (
      await storeActions.confirm(
        t("settings_logout_title"),
        t("settings_logout_msg"),
        "warning",
      )
    ) {
      storeActions.logout();
    }
  };

  const handleClearVault = async () => {
    if (
      !(await storeActions.confirm(
        t("settings_clear_vault"),
        t("settings_clear_vault_msg"),
        "danger",
      ))
    ) {
      return;
    }
    if (
      !(await storeActions.confirm(
        t("settings_clear_vault_confirm_title"),
        t("settings_clear_vault_confirm_msg"),
        "danger",
      ))
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await storeActions.clearVault();
      if (res.success) {
        storeActions.showToast(
          t("settings_clear_vault_success"),
          "success",
        );
      } else {
        setError(res.error || t("settings_clear_vault_fail"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("settings_clear_vault_fail"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGist = () => {
    if (store.gistId) {
      window.open(`https://gist.github.com/${store.gistId}`, "_blank");
    }
  };

  return (
    <div class="app-container">
      <div class="app-body pb-24">
        <h3 class="mt-0 mb-16 font-sz-15 font-w-600">
          {t("settings_header")}
        </h3>

        <Show when={error()}>
          <div class="alert alert-danger mb-16">{error()}</div>
        </Show>

        {/* User profile */}
        <Show when={store.cachedGithubUser}>
          <div class="user-panel">
            <img
              class="avatar"
              src={store.cachedGithubUser?.avatar_url}
              alt="avatar"
            />
            <div class="user-info">
              <div
                class="username"
                onClick={handleOpenGist}
                title={t("settings_open_gist_title")}
              >
                @{store.cachedGithubUser?.login}
              </div>
            </div>
          </div>
        </Show>

        {/* Settings options list - Group 1: General & Personalization */}
        <div class="card card-list">
          {/* User Guide */}
          <div
            class="setting-row"
            onClick={() =>
              chrome.tabs.create({
                url: chrome.runtime.getURL("guide.html"),
              })}
          >
            <div class="setting-row-left">
              <QuestionIcon />
              <div>
                <div class="setting-label">
                  {t("settings_user_guide")}
                </div>
                <div class="setting-sub">
                  {t("settings_user_guide_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Language Settings */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.Language)}
          >
            <div class="setting-row-left">
              <GlobeIcon />
              <div>
                <div class="setting-label">
                  {t("settings_label_language")}
                </div>
                <div class="setting-sub">
                  {store.language === "vi" ? "Tiếng Việt" : "English"}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Theme Settings */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.Theme)}
          >
            <div class="setting-row-left">
              <ThemeIcon />
              <div>
                <div class="setting-label">
                  {t("settings_theme_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_theme_sub", {
                    theme: store.theme === "dark"
                      ? t("settings_theme_dark")
                      : t("settings_theme_light"),
                  })}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Homepage */}
          <div
            class="setting-row"
            onClick={() =>
              window.open(
                "https://github.com/uongsuadaubung/gistwarden",
                "_blank",
              )}
          >
            <div class="setting-row-left">
              <GithubIcon />
              <div>
                <div class="setting-label">
                  {t("settings_homepage")}
                </div>
                <div class="setting-sub">
                  {t("settings_homepage_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>

        {/* Group 2: Security & Data */}
        <div class="card card-list">
          {/* Account Security */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.AccountSecurity)}
          >
            <div class="setting-row-left">
              <ShieldIcon />
              <div>
                <div class="setting-label">
                  {t("settings_account_security")}
                </div>
                <div class="setting-sub">
                  {t("settings_account_security_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Vault Options */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.VaultOptions)}
          >
            <div class="setting-row-left">
              <ShieldIcon />
              <div>
                <div class="setting-label">
                  {t("settings_vault_options_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_vault_options_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Lock Vault */}
          <div class="setting-row" onClick={handleLock}>
            <div class="setting-row-left">
              <LockIcon />
              <div>
                <div class="setting-label">{t("vault_lock_title")}</div>
                <div class="setting-sub">{t("settings_lock_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Clear Vault */}
          <div class="setting-row" onClick={handleClearVault}>
            <div class="setting-row-left">
              <TrashIcon class="text-error" />
              <div>
                <div class="setting-label text-error">
                  {t("settings_clear_vault")}
                </div>
                <div class="setting-sub">
                  {t("settings_clear_vault_sub")}
                </div>
              </div>
            </div>
          </div>

          {/* Disconnect/Logout */}
          <div class="setting-row" onClick={handleLogout}>
            <div class="setting-row-left">
              <LogoutIcon class="text-error" />
              <div>
                <div class="setting-label text-error">
                  {t("settings_logout_title")}
                </div>
                <div class="setting-sub">
                  {t("settings_logout_sub")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
