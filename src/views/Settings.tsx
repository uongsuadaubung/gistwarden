import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  KeyIcon,
  LockIcon,
  LogoutIcon,
  ShieldIcon,
  ThemeIcon,
  TrashIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";

export const Settings: Component = () => {
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // Change password states
  const [isChangingPassword, setIsChangingPassword] = createSignal(false);
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");

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

  const handleChangePassword = async (e: Event) => {
    e.preventDefault();
    if (!currentPassword() || !newPassword() || !confirmPassword()) {
      setError(t("settings_error_fields_required"));
      return;
    }
    if (newPassword() !== confirmPassword()) {
      setError(t("settings_error_mp_mismatch"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await storeActions.changeMasterPassword(
        currentPassword(),
        newPassword(),
      );
      if (res.success) {
        storeActions.showToast(
          t("settings_mp_success"),
          "success",
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      } else {
        setError(res.error || t("settings_error_mp_fail"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("settings_error_mp_fail"));
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
      <div class="app-body">
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 15px; font-weight: 600;">
          {t("settings_header")}
        </h3>

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <Show
          when={isChangingPassword()}
          fallback={
            <>
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
                      style="cursor: pointer; color: var(--primary); text-decoration: underline;"
                      onClick={handleOpenGist}
                      title={t("settings_open_gist_title")}
                    >
                      @{store.cachedGithubUser?.login}
                    </div>
                  </div>
                </div>
              </Show>

              {/* Settings options list */}
              <div class="card card-list">
                {/* Language Settings */}
                <div class="setting-row" onClick={() => storeActions.navigate(View.Language)}>
                  <div class="setting-row-left">
                    <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: var(--text);">🌐</div>
                    <div class="setting-label" style="margin-left: 8px;">{t("settings_label_language")}</div>
                  </div>
                  <ChevronRightIcon />
                </div>

                {/* Theme Settings */}
                <div class="setting-row" onClick={() => storeActions.navigate(View.Theme)}>
                  <div class="setting-row-left">
                    <ThemeIcon />
                    <div>
                      <div class="setting-label">{t("settings_theme_label")}</div>
                      <div class="setting-sub">
                        {t("settings_theme_sub", { theme: store.theme === "dark" ? t("settings_theme_dark") : t("settings_theme_light") })}
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
                      <div class="setting-label">{t("settings_vault_options_label")}</div>
                      <div class="setting-sub">
                        {t("settings_vault_options_sub")}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon />
                </div>

                {/* Change Master Password */}
                <div
                  class="setting-row"
                  onClick={() => {
                    setIsChangingPassword(true);
                    setError("");
                  }}
                >
                  <div class="setting-row-left">
                    <KeyIcon />
                    <div>
                      <div class="setting-label">{t("settings_change_mp")}</div>
                      <div class="setting-sub">
                        {t("settings_change_mp_sub")}
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
                    <TrashIcon style="color: var(--error);" />
                    <div>
                      <div class="setting-label" style="color: var(--error);">
                        {t("settings_clear_vault")}
                      </div>
                      <div class="setting-sub">
                        {t("settings_clear_vault_sub")}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon style="color: var(--error);" />
                </div>

                {/* Disconnect/Logout */}
                <div class="setting-row" onClick={handleLogout}>
                  <div class="setting-row-left">
                    <LogoutIcon style="color: var(--error);" />
                    <div>
                      <div class="setting-label" style="color: var(--error);">
                        {t("settings_logout_title")}
                      </div>
                      <div class="setting-sub">
                        {t("settings_logout_sub")}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon style="color: var(--error);" />
                </div>
              </div>
            </>
          }
        >
          {/* Change Password Form View */}
          <div
            class="detail-header"
            style="margin-top: 6px; margin-bottom: 16px;"
          >
            <div
              class="back-btn"
              onClick={() => {
                setIsChangingPassword(false);
                setError("");
              }}
            >
              <ArrowLeftIcon />
            </div>
            <div class="detail-title">{t("settings_change_mp_title")}</div>
          </div>

          <form
            onSubmit={handleChangePassword}
            class="card card-no-margin"
          >
            <div class="form-group">
              <label for="current-pass">{t("settings_change_mp_current")}</label>
              <Input
                id="current-pass"
                type="password"
                value={currentPassword()}
                onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                placeholder={t("settings_change_mp_current") + "..."}
                disabled={loading()}
                required
              />
            </div>

            <div class="form-group">
              <label for="new-pass">{t("settings_change_mp_new")}</label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword()}
                onInput={(e) => setNewPassword(e.currentTarget.value)}
                placeholder={t("settings_change_mp_new") + "..."}
                disabled={loading()}
                required
              />
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label for="confirm-pass">{t("settings_change_mp_confirm")}</label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirmPassword()}
                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                placeholder={t("settings_change_mp_confirm") + "..."}
                disabled={loading()}
                required
              />
            </div>

            <div style="display: flex; gap: 8px;">
              <Button
                type="button"
                variant="secondary"
                block
                onClick={() => {
                  setIsChangingPassword(false);
                  setError("");
                }}
                disabled={loading()}
              >
                {t("btn_cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                block
                loading={loading()}
                loadingText={t("dialog_loading")}
              >
                {t("btn_save")}
              </Button>
            </div>
          </form>
        </Show>
      </div>
    </div>
  );
};
export default Settings;
