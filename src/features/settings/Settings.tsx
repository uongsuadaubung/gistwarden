import { type Component, createSignal, Show } from "solid-js";
import { Header } from "@/components/ui/Header.tsx";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { store } from "@/core/store.ts";
import { openTab } from "@/core/tabs.ts";
import { getAssetUrl } from "@/core/runtime.ts";

import { clearVault } from "@/features/vault/vault-service.ts";
import {
  confirm,
  requestReprompt,
  setGlobalLoading,
  showToast,
} from "@/core/ui-service.ts";
import {
  ChevronRightIcon,
  InfoIcon,
  PaletteIcon,
  QuestionIcon,
  ShieldIcon,
  TrashIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";

export const Settings: Component = () => {
  const [error, setError] = createSignal("");

  const handleClearVault = async () => {
    if (
      !(await confirm(
        t("settings_clear_vault"),
        t("settings_clear_vault_msg"),
        "danger",
      ))
    ) {
      return;
    }
    if (
      !(await confirm(
        t("settings_clear_vault_confirm_title"),
        t("settings_clear_vault_confirm_msg"),
        "danger",
      ))
    ) {
      return;
    }

    const verified = await requestReprompt();
    if (!verified) {
      return;
    }

    setGlobalLoading(true);
    setError("");
    const res = await clearVault();
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(
        t("settings_clear_vault_success"),
        "success",
      );
    } else {
      setError(t(res.error));
    }
  };

  return (
    <div class="app-container">
      <Header title={t("settings_header")} />
      <div class="app-body pb-24">
        <Show when={error()}>
          <div class="alert alert-danger mb-16">{error()}</div>
        </Show>

        {/* Group 2: Security, Data & Appearance */}
        <div class="card card-list">
          {/* Appearance Settings */}
          <div
            class="setting-row"
            onClick={() => navigate(View.Appearance)}
          >
            <div class="setting-row-left">
              <PaletteIcon />
              <div>
                <div class="setting-label">
                  {t("settings_appearance_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_appearance_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Account Security */}
          <div
            class="setting-row"
            onClick={() => navigate(View.AccountSecurity)}
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
            onClick={() => navigate(View.VaultOptions)}
          >
            <div class="setting-row-left">
              <VaultIcon />
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

          {/* Clear Vault */}
          <Show when={store.vaultItems.length > 0}>
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
          </Show>
        </div>

        {/* Group 1: General & Personalization */}
        <div class="card card-list">
          {/* User Guide */}
          <div
            class="setting-row"
            onClick={() => openTab(getAssetUrl("guide.html"))}
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

          {/* About */}
          <div
            class="setting-row"
            onClick={() => navigate(View.About)}
          >
            <div class="setting-row-left">
              <InfoIcon />
              <div>
                <div class="setting-label">
                  {t("settings_about_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_about_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
