import { type Component } from "solid-js";
import { Header } from "@/components/ui/Header.tsx";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { openTab } from "@/core/tabs.ts";
import { getAssetUrl } from "@/core/runtime.ts";

import {
  AutofillIcon,
  ChevronRightIcon,
  InfoIcon,
  PaletteIcon,
  QuestionIcon,
  ShieldIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";

export const Settings: Component = () => {
  return (
    <div class="app-container">
      <Header title={t("settings_header")} />
      <div class="app-body pb-24">
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

          {/* Autofill Options */}
          <div
            class="setting-row"
            onClick={() => navigate(View.AutofillOptions)}
          >
            <div class="setting-row-left">
              <AutofillIcon />
              <div>
                <div class="setting-label">
                  {t("settings_autofill_options_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_autofill_options_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
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
