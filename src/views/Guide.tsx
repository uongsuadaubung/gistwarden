import { type Component, createSignal, onMount, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import { APP_NAME } from "@/shared/constants.ts";
import { store } from "@/shared/store.ts";
import { init } from "@/shared/auth-service.ts";
import { updateLanguage } from "@/shared/ui-service.ts";
import Button from "@/components/Button.tsx";
import Select from "@/components/Select.tsx";
import GeneralTab from "@/components/guide/GeneralTab.tsx";
import GistTab from "@/components/guide/GistTab.tsx";
import SecurityTab from "@/components/guide/SecurityTab.tsx";
import PasskeyTab from "@/components/guide/PasskeyTab.tsx";
import ImportExportTab from "@/components/guide/ImportExportTab.tsx";
import FaqTab from "@/components/guide/FaqTab.tsx";
import TotpTab from "@/components/guide/TotpTab.tsx";
import PrivacyTab from "@/components/guide/PrivacyTab.tsx";

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
    if (store.gistId) {
      window.open(`https://gist.github.com/${store.gistId}`, "_blank");
    } else {
      window.open("https://gist.github.com/", "_blank");
    }
  };

  return (
    <Show when={store.isLoaded}>
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
                value={store.language}
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
              onClick={() =>
                window.open(
                  "https://github.com/uongsuadaubung/gistwarden",
                  "_blank",
                )}
            >
              {t("guide_homepage_btn")}
            </Button>

            <Button variant="secondary" onClick={() => window.close()}>
              {t("guide_close_page")}
            </Button>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div class="guide-container">
          {/* Sidebar Navigation */}
          <aside class="guide-sidebar">
            <nav class="tabs-nav">
              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.General ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.General)}
              >
                <span class="tab-icon">📖</span>
                <span class="tab-label">{t("guide_tab_general")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.Gist ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.Gist)}
              >
                <span class="tab-icon">☁️</span>
                <span class="tab-label">{t("guide_tab_gist")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.Security ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.Security)}
              >
                <span class="tab-icon">🛡️</span>
                <span class="tab-label">{t("guide_tab_security")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.Passkey ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.Passkey)}
              >
                <span class="tab-icon">⚡</span>
                <span class="tab-label">{t("guide_tab_passkey")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.Totp ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.Totp)}
              >
                <span class="tab-icon">⏱️</span>
                <span class="tab-label">{t("guide_tab_totp")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.ImportExport ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.ImportExport)}
              >
                <span class="tab-icon">🔄</span>
                <span class="tab-label">{t("guide_tab_import_export")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.Faq ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.Faq)}
              >
                <span class="tab-icon">💡</span>
                <span class="tab-label">{t("guide_tab_faq")}</span>
              </button>

              <button
                class={`nav-tab ${
                  activeTab() === GuideTab.Privacy ? "active" : ""
                }`}
                onClick={() => setActiveTab(GuideTab.Privacy)}
              >
                <span class="tab-icon">🔒</span>
                <span class="tab-label">{t("guide_tab_privacy")}</span>
              </button>
            </nav>

            {/* Quick Action Card */}
            <div class="quick-action-card">
              <h3>GitHub Gist</h3>
              <p>{t("guide_quick_action_desc")}</p>
              <button
                onClick={handleOpenGist}
                class="game-btn w-100"
              >
                ☁️ {t("guide_open_github_btn")}
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main class="guide-main-content">
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
