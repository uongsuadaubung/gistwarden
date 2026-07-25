import { type Component, createSignal, onMount, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { accountStore, settingsStore } from "@/core/store.ts";
import { init } from "@/features/auth/auth-service.ts";
import { updateLanguage } from "@/core/ui-service.ts";
import Button from "@/components/ui/Button.tsx";
import Select from "@/components/ui/Select.tsx";
import GeneralTab from "@/features/guide/components/GeneralTab.tsx";
import GistTab from "@/features/guide/components/GistTab.tsx";
import SecurityTab from "@/features/guide/components/SecurityTab.tsx";
import PasskeyTab from "@/features/guide/components/PasskeyTab.tsx";
import ImportExportTab from "@/features/guide/components/ImportExportTab.tsx";
import FaqTab from "@/features/guide/components/FaqTab.tsx";
import TotpTab from "@/features/guide/components/TotpTab.tsx";
import PrivacyTab from "@/features/guide/components/PrivacyTab.tsx";

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
];

export const Guide: Component = () => {
  const GuideTab = {
    General: "general",
    Gist: "gist",
    Security: "security",
    Passkey: "passkey",
    Totp: "totp",
    ImportExport: "import_export",
    Faq: "faq",
    Privacy: "privacy",
  } as const;

  type GuideTab = typeof GuideTab[keyof typeof GuideTab];

  const [activeTab, setActiveTab] = createSignal<GuideTab>(GuideTab.General);

  onMount(async () => {
    // Add native guide body class for layout
    document.body.classList.add("guide-body-native");
    await init();
  });

  const handleLangChange = (val: "en" | "vi") => {
    updateLanguage(val);
  };

  const handleOpenGist = () => {
    if (accountStore.gistId) {
      window.open(`https://gist.github.com/${accountStore.gistId}`, "_blank");
    } else {
      window.open("https://gist.github.com/", "_blank");
    }
  };

  return (
    <Show when={accountStore.isLoaded && settingsStore.isLoaded}>
      <div class="guide-wrapper">
        {/* Top Navigation Bar */}
        <header class="guide-header">
          <div class="logo-area">
            <img
              src="icons/icon-48.png"
              alt={`${APP_NAME} Logo`}
              class="logo"
            />
            <div class="brand">
              <h1>{APP_NAME}</h1>
              <span class="badge">v1.0.0</span>
            </div>
          </div>

          <div class="header-controls">
            {/* Quick Language Switcher */}
            <div class="lang-selector">
              <span>🌐</span>
              <Select
                value={settingsStore.language}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  if (val === "en" || val === "vi") {
                    handleLangChange(val);
                  }
                }}
                options={LANG_OPTIONS}
              />
            </div>

            <Button
              variant="secondary"
              onClick={handleOpenGist}
            >
              🚀 {t("settings_open_gist_title")}
            </Button>
          </div>
        </header>

        {/* Main Body */}
        <div class="guide-body">
          {/* Sidebar */}
          <nav class="guide-sidebar">
            <div class="sidebar-title">{t("settings_header")}</div>
            <ul class="nav-list">
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.General ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.General)}
                >
                  📌 {t("guide_tab_general")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.Gist ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.Gist)}
                >
                  🐙 {t("guide_tab_gist")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.Security ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.Security)}
                >
                  🛡️ {t("guide_tab_security")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.Passkey ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.Passkey)}
                >
                  🔑 {t("guide_tab_passkey")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.Totp ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.Totp)}
                >
                  ⏱️ {t("guide_tab_totp")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.ImportExport ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.ImportExport)}
                >
                  📦 {t("guide_tab_import_export")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.Faq ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.Faq)}
                >
                  ❓ {t("guide_tab_faq")}
                </a>
              </li>
              <li>
                <a
                  class={`nav-link ${
                    activeTab() === GuideTab.Privacy ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(GuideTab.Privacy)}
                >
                  🔒 {t("guide_tab_privacy")}
                </a>
              </li>
            </ul>
          </nav>

          {/* Main Content Pane */}
          <main class="guide-content">
            <Show when={activeTab() === GuideTab.General}>
              <GeneralTab />
            </Show>
            <Show when={activeTab() === GuideTab.Gist}>
              <GistTab />
            </Show>
            <Show when={activeTab() === GuideTab.Security}>
              <SecurityTab />
            </Show>
            <Show when={activeTab() === GuideTab.Passkey}>
              <PasskeyTab />
            </Show>
            <Show when={activeTab() === GuideTab.Totp}>
              <TotpTab />
            </Show>
            <Show when={activeTab() === GuideTab.ImportExport}>
              <ImportExportTab />
            </Show>
            <Show when={activeTab() === GuideTab.Faq}>
              <FaqTab />
            </Show>
            <Show when={activeTab() === GuideTab.Privacy}>
              <PrivacyTab />
            </Show>
          </main>
        </div>
      </div>
    </Show>
  );
};

export default Guide;
