import { type Component, Show } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import Button from "./Button.tsx";
import { t } from "@/shared/i18n.ts";

export const ConfirmModal: Component = () => {
  const boxClass = () => {
    const base = "confirm-modal-box";
    const type = store.confirmModal.type || "info";
    return `${base} type-${type}`;
  };

  return (
    <Show when={store.confirmModal.isOpen}>
      <div class="confirm-modal-backdrop">
        <div class={boxClass()}>
          <h4 class="confirm-modal-title">
            {store.confirmModal.title || t("confirm_title")}
          </h4>
          <p
            class="confirm-modal-message"
            innerHTML={store.confirmModal.message}
          />
          <div class="confirm-modal-actions">
            <Button
              variant="secondary"
              onClick={() => storeActions.resolveConfirm(false)}
            >
              {t("btn_cancel")}
            </Button>
            <Button
              variant={store.confirmModal.type === "danger"
                ? "danger"
                : "primary"}
              onClick={() => storeActions.resolveConfirm(true)}
            >
              {t("confirm_title")}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ConfirmModal;
