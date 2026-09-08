import { init, updateLanguage } from "@gistwarden/ui";
import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import Button from "@/components/ui/Button.tsx";
import Select from "@/components/ui/Select.tsx";
import { APP_NAME } from "@/core/constants.ts";
import { onLanguageChange, t } from "@/core/i18n.ts";
import { getAppVersion, getAssetUrl } from "@/core/runtime.ts";
import { accountStore, settingsStore } from "@/core/store.ts";
import { GuideContentRenderer } from "@/features/guide/components/GuideContentRenderer.tsx";
import { GuideTreeSidebar } from "@/features/guide/components/GuideTreeSidebar.tsx";
import { useGuideRoute } from "@/features/guide/guide-router.ts";
import { ExternalLinkIcon, GlobeIcon } from "@/icons/svg/index.ts";

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
];

export const Guide: Component = () => {
  const { route, navigate } = useGuideRoute();
  const [langVersion, setLangVersion] = createSignal(0);

  onMount(async () => {
    document.body.classList.add("guide-body-native");
    if (!accountStore.isLoaded || !settingsStore.isLoaded) {
      await init();
    }
  });

  const cleanupLangListener = onLanguageChange(() => {
    setLangVersion((v) => v + 1);
  });

  onCleanup(() => {
    document.body.classList.remove("guide-body-native");
    cleanupLangListener();
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
      <For each={[langVersion()]}>
        {() => (
          <div class="guide-wrapper">
            {/* Top Header Bar */}
            <header class="guide-header">
              <div class="guide-header-left">
                <div class="logo-area">
                  <img
                    src={getAssetUrl("icons/icon-48.png")}
                    alt={`${APP_NAME} Logo`}
                    class="logo"
                  />
                  <div class="brand">
                    <h1>{APP_NAME}</h1>
                    <span class="badge">v{getAppVersion()}</span>
                  </div>
                </div>
              </div>

              <div class="header-controls">
                {/* Language Selector */}
                <div class="lang-selector">
                  <GlobeIcon size={14} />
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

                <Button variant="secondary" onClick={handleOpenGist}>
                  <ExternalLinkIcon size={14} /> {t("settings_open_gist_title")}
                </Button>
              </div>
            </header>

            {/* Main Guide Body */}
            <div class="guide-container">
              {/* Expandable Accordion Tree Sidebar */}
              <GuideTreeSidebar currentRoute={route()} onNavigate={navigate} />

              {/* Router Content Renderer */}
              <main class="guide-main-content">
                <GuideContentRenderer route={route()} />
              </main>
            </div>
          </div>
        )}
      </For>
    </Show>
  );
};

export default Guide;
