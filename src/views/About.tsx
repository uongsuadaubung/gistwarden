import { type Component } from "solid-js";
import { storeActions, View } from "@/shared/store.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import {
  ChevronRightIcon,
  GithubIcon,
  HeartOutlineIcon,
  QuestionIcon,
} from "@/icons/svg/index.ts";
import { APP_NAME, FIREFOX_ADDON_SLUG } from "@/shared/constants.ts";

export const About: Component = () => {
  const handleBack = () => {
    storeActions.navigate(View.Settings);
  };

  const getAppVersion = () => {
    if (
      typeof chrome !== "undefined" && chrome.runtime &&
      chrome.runtime.getManifest
    ) {
      return chrome.runtime.getManifest().version || "1.0.0";
    }
    return "1.0.0";
  };

  const getRatingUrl = () => {
    const userAgent = navigator.userAgent;
    const isFirefox = userAgent.includes("Firefox");
    const isEdge = userAgent.includes("Edg/") || userAgent.includes("Edge");

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
      const extId = chrome.runtime.id;
      if (isFirefox) {
        // Liên kết trang Add-ons của Firefox (đánh giá hiển thị trực tiếp tại trang này)
        return `https://addons.mozilla.org/firefox/addon/${FIREFOX_ADDON_SLUG}/`;
      }
      if (isEdge) {
        // Liên kết cửa hàng Microsoft Edge Add-ons
        return `https://microsoftedge.microsoft.com/addons/detail/${extId}`;
      }
      // Liên kết đánh giá trên Chrome Web Store (Fallback / sau này)
      return `https://chromewebstore.google.com/detail/${extId}/reviews`;
    }

    // Liên kết dự phòng nếu chạy ở môi trường ngoài Extension
    if (isFirefox) {
      return "https://addons.mozilla.org/firefox/";
    }
    if (isEdge) {
      return "https://microsoftedge.microsoft.com/addons/";
    }
    return "https://chromewebstore.google.com/";
  };

  const handleRateClick = () => {
    window.open(getRatingUrl(), "_blank");
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_about_label")}
          onBack={handleBack}
        />

        {/* App Info Panel */}
        <div class="text-center py-24 mb-16">
          <div class="logo-container mb-12 d-flex justify-center align-center">
            <span class="font-sz-24 font-w-700 primary-color">{APP_NAME}</span>
          </div>
          <div class="text-muted font-sz-13">
            {t("settings_version", { ver: getAppVersion() })}
          </div>
        </div>

        <div class="card card-list">
          {/* Homepage / Github */}
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

          {/* Rate & Review */}
          <div
            class="setting-row"
            onClick={handleRateClick}
          >
            <div class="setting-row-left">
              <HeartOutlineIcon />
              <div>
                <div class="setting-label">
                  {t("settings_rate_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_rate_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Troubleshooting */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.Troubleshooting)}
          >
            <div class="setting-row-left">
              <QuestionIcon />
              <div>
                <div class="setting-label">
                  {t("settings_troubleshooting_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_troubleshooting_sub")}
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

export default About;
