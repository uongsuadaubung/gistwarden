import { type Component, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { t } from "@gistwarden/domain";
import { uiStore } from "../../core/store.ts";
import { resolveConfirm } from "../../core/ui-service.ts";
import Button from "./Button.tsx";

export const ConfirmModal: Component = () => {
  const boxClass = () => {
    const base = "confirm-modal-box";
    const type = uiStore.confirmModal.type || "info";
    return `${base} type-${type}`;
  };

  return (
    <Show when={uiStore.confirmModal.isOpen}>
      <Portal>
        <div class="confirm-modal-backdrop">
          <div class={boxClass()}>
            <h4 class="confirm-modal-title">
              {uiStore.confirmModal.title || t("confirm_title")}
            </h4>
            <p
              class="confirm-modal-message"
              innerHTML={uiStore.confirmModal.message}
            />
            <div class="confirm-modal-actions">
              <Button
                variant="secondary"
                onClick={() => resolveConfirm(false)}
              >
                {t("btn_cancel")}
              </Button>
              <Button
                variant={uiStore.confirmModal.type === "danger"
                  ? "danger"
                  : "primary"}
                onClick={() => resolveConfirm(true)}
              >
                {t("btn_confirm")}
              </Button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default ConfirmModal;
