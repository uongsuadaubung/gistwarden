import { createEffect, createSignal, type JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";

export interface BaseSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: JSX.Element;
  children:
    | JSX.Element
    | ((triggerClose: (action?: () => void) => void) => JSX.Element);
  usePortal?: boolean;
  panelClass?: string;
}

export function BaseSlideModal(props: BaseSlideModalProps): JSX.Element {
  const [isClosing, setIsClosing] = createSignal(false);

  createEffect(() => {
    if (props.isOpen) {
      setIsClosing(false);
    }
  });

  const triggerClose = (action?: () => void): void => {
    if (isClosing()) return;
    setIsClosing(true);
    setTimeout(() => {
      if (action) {
        action();
      }
      props.onClose();
    }, 250);
  };

  const modalContent = (): JSX.Element => (
    <div
      class={`modal-overlay bottom-slide ${isClosing() ? "is-closing" : ""}`}
      onClick={() => triggerClose()}
    >
      <div
        class={`modal-slide-panel ${props.panelClass || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Show when={props.title}>
          <div class="modal-panel-header">
            <div class="modal-panel-title">{props.title}</div>
            <button
              type="button"
              class="modal-close-btn font-sz-16 font-w-600"
              onClick={() => triggerClose()}
            >
              ✕
            </button>
          </div>
        </Show>
        {typeof props.children === "function"
          ? props.children(triggerClose)
          : props.children}
      </div>
    </div>
  );

  return (
    <Show when={props.isOpen}>
      <Show when={props.usePortal} fallback={modalContent()}>
        <Portal>{modalContent()}</Portal>
      </Show>
    </Show>
  );
}

export default BaseSlideModal;
