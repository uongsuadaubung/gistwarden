import { type Component } from "solid-js";
import { storeActions, View } from "@/shared/store.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import { ChevronRightIcon, SyncIcon } from "@/icons/svg/index.ts";

export const Troubleshooting: Component = () => {
  const handleBack = () => {
    storeActions.navigate(View.About);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_troubleshooting_label")}
          onBack={handleBack}
        />

        <div class="card card-list mt-16">
          {/* Sync Time */}
          <div
            class="setting-row"
            onClick={async () => {
              storeActions.setGlobalLoading(
                true,
                t("settings_sync_time_loading"),
              );
              const res = await storeActions.syncTimeOffset();
              storeActions.setGlobalLoading(false);
              if (res.success) {
                storeActions.showToast(
                  t("settings_sync_time_success"),
                  "success",
                );
              } else {
                storeActions.showToast(t("settings_sync_time_error"), "error");
              }
            }}
          >
            <div class="setting-row-left">
              <SyncIcon />
              <div>
                <div class="setting-label">
                  {t("settings_sync_time_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_sync_time_sub")}
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

export default Troubleshooting;
