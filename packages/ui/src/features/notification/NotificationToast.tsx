import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { MSG_SAVE_CREDENTIAL_ACTION } from "@/core/constants.ts";

import { notifyBackground } from "@/core/messaging.ts";
import {
  type AutofillMatchingAccount,
  type NotificationPayload,
} from "@gistwarden/domain";

interface NotificationToastProps {
  payload: NotificationPayload;
  onClose: () => void;
}

export function NotificationToast(props: NotificationToastProps) {
  let remainingTime = 5000;
  let startTime = Date.now();
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const [isPaused, setIsPaused] = createSignal(false);
  const [isClosing, setIsClosing] = createSignal(false);

  const currentSelectedAccount = (): AutofillMatchingAccount => {
    if (props.payload.actionType === "autofill") {
      const list = props.payload.accounts;
      if (list && list.length > 0) {
        return list[0];
      }
      return {
        itemId: props.payload.itemId || "",
        username: props.payload.username,
        password: props.payload.password,
        totp: props.payload.totp,
      };
    }
    return {
      itemId: props.payload.actionType === "update" ? props.payload.itemId : "",
      username: props.payload.username,
      password: props.payload.password,
    };
  };

  const triggerCloseWithAnimation = (actionFn?: () => void) => {
    if (isClosing()) return;
    setIsClosing(true);
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    setTimeout(() => {
      if (actionFn) actionFn();
      props.onClose();
    }, 200);
  };

  const startAutoDismiss = (ms: number) => {
    startTime = Date.now();
    timerId = setTimeout(() => {
      triggerCloseWithAnimation();
    }, ms);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleAction("dismiss");
    }
  };

  onMount(() => {
    startAutoDismiss(remainingTime);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
    }
  });

  onCleanup(() => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
    }
  });

  const handleMouseEnter = () => {
    if (isClosing()) return;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    remainingTime -= Date.now() - startTime;
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (isClosing()) return;
    setIsPaused(false);
    if (remainingTime > 0) {
      startAutoDismiss(remainingTime);
    } else {
      triggerCloseWithAnimation();
    }
  };

  const handleAction = (userChoice: "confirm" | "dismiss") => {
    triggerCloseWithAnimation(() => {
      if (props.payload.actionType === "autofill") {
        if (userChoice === "confirm") {
          props.payload.onFill?.(currentSelectedAccount());
        } else if (userChoice === "dismiss") {
          props.payload.onDismiss?.();
        }
        return;
      }
      notifyBackground({
        type: MSG_SAVE_CREDENTIAL_ACTION,
        choice: userChoice,
        payload: props.payload,
      });
    });
  };

  const handleFillAccount = (acc: AutofillMatchingAccount) => {
    triggerCloseWithAnimation(() => {
      if (props.payload.actionType === "autofill") {
        props.payload.onFill?.(acc);
      }
    });
  };

  const userDisplay = () => {
    if (props.payload.actionType === "autofill") {
      return currentSelectedAccount().username || props.payload.domain;
    }
    return props.payload.username || props.payload.domain;
  };

  const headerTitle = () => {
    if (props.payload.actionType === "autofill") {
      const count = props.payload.accounts?.length || 1;
      return count > 1
        ? `${t("notification_autofill_title")} (${count})`
        : t("notification_autofill_title");
    }
    return props.payload.actionType === "add"
      ? t("notification_save_title")
      : t("notification_update_title");
  };

  const actionPromptPrefix = () => {
    if (props.payload.actionType === "autofill") {
      return t("notification_autofill_prompt_prefix");
    }
    return props.payload.actionType === "add"
      ? t("notification_save_prompt_prefix")
      : t("notification_update_prompt_prefix");
  };

  const actionPromptSuffix = () => {
    if (props.payload.actionType === "autofill") {
      return t("notification_autofill_prompt_suffix");
    }
    return props.payload.actionType === "add"
      ? t("notification_save_prompt_suffix")
      : t("notification_update_prompt_suffix");
  };

  const confirmBtnText = () => {
    if (props.payload.actionType === "autofill") {
      return t("notification_btn_autofill");
    }
    return props.payload.actionType === "add"
      ? t("notification_btn_save")
      : t("notification_btn_update");
  };

  return (
    <div
      class={`toast-card ${isPaused() ? "paused" : ""} ${
        isClosing() ? "closing" : ""
      }`}
      role="alert"
      aria-live="polite"
      ref={(el) => {
        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mouseleave", handleMouseLeave);
      }}
    >
      <div class="header">
        <span class="header-title">{headerTitle()}</span>
        <button
          type="button"
          class="close-btn"
          ref={(el) => {
            el.addEventListener("click", (e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAction("dismiss");
            });
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div class="body-content">
        <Show
          when={props.payload.actionType === "autofill" &&
              props.payload.accounts &&
              props.payload.accounts.length > 1
            ? props.payload.accounts
            : null}
          fallback={
            <>
              <span>{actionPromptPrefix()}</span>
              <span class="user-highlight">{userDisplay()}</span>
              <span>{actionPromptSuffix()}</span>
            </>
          }
        >
          {(accountsList) => (
            <>
              <div class="select-label">
                <span>{actionPromptPrefix()}</span>
                <span class="user-highlight">{props.payload.domain}</span>
              </div>
              <div class="accounts-list">
                <For each={accountsList()}>
                  {(acc) => (
                    <div
                      class="account-item"
                      ref={(el) => {
                        el.addEventListener("click", (e) => {
                          e.stopPropagation();
                          handleFillAccount(acc);
                        });
                      }}
                    >
                      <div class="account-info">
                        <Show when={acc.name}>
                          <span class="account-name-sub">{acc.name}</span>
                        </Show>
                        <span class="account-user">
                          {acc.username || props.payload.domain}
                        </span>
                      </div>
                      <button type="button" class="btn-fill-small">
                        {t("notification_btn_autofill")}
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </>
          )}
        </Show>
        {props.payload.domain && (
          <div class="domain-subtext">{props.payload.domain}</div>
        )}
      </div>
      <Show
        when={!(props.payload.actionType === "autofill" &&
          props.payload.accounts &&
          props.payload.accounts.length > 1)}
      >
        <div class="actions">
          <button
            type="button"
            class="btn btn-primary"
            ref={(el) => {
              el.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleAction("confirm");
              });
            }}
          >
            {confirmBtnText()}
          </button>
        </div>
      </Show>
      <div class={`progress-bar ${isPaused() ? "paused" : ""}`} />
    </div>
  );
}
