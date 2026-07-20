import { type Component } from "solid-js";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import {
  setGlobalLoading,
  showToast,
  syncTimeOffset,
} from "@/core/ui-service.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { ChevronRightIcon, SyncIcon } from "@/icons/svg/index.ts";

export const Troubleshooting: Component = () => {
  const handleBack = () => {
    navigate(View.About);
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
              setGlobalLoading(
                true,
                t("settings_sync_time_loading"),
              );
              const res = await syncTimeOffset();
              setGlobalLoading(false);
              if (res.success) {
                showToast(
                  t("settings_sync_time_success"),
                  "success",
                );
              } else {
                showToast(t("settings_sync_time_error"), "error");
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
