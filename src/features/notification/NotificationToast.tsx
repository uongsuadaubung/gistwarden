import { createSignal, onCleanup, onMount } from "solid-js";
import { t } from "@/core/i18n.ts";
import { MSG_SAVE_CREDENTIAL_ACTION } from "@/core/constants.ts";

export interface NotificationPayload {
  actionType: "add" | "update";
  domain: string;
  username: string;
  password: string;
  itemId?: string;
}

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
      try {
        chrome.runtime.sendMessage({
          type: MSG_SAVE_CREDENTIAL_ACTION,
          choice: userChoice,
          payload: props.payload,
        });
      } catch (_err) {
        // Ignore extension context errors
      }
    });
  };

  const userDisplay = () => props.payload.username || props.payload.domain;

  const headerTitle = () =>
    props.payload.actionType === "add"
      ? t("notification_save_title")
      : t("notification_update_title");

  const actionPromptPrefix = () =>
    props.payload.actionType === "add"
      ? t("notification_save_prompt_prefix")
      : t("notification_update_prompt_prefix");

  const actionPromptSuffix = () =>
    props.payload.actionType === "add"
      ? t("notification_save_prompt_suffix")
      : t("notification_update_prompt_suffix");

  const confirmBtnText = () =>
    props.payload.actionType === "add"
      ? t("notification_btn_save")
      : t("notification_btn_update");

  return (
    <>
      <style>
        {`
        :host {
          all: initial;
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          width: 340px !important;
          max-width: calc(100vw - 40px) !important;
          z-index: 2147483647 !important;
          pointer-events: auto !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box !important;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        .toast-card {
          pointer-events: auto;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-left: 4px solid #3b82f6;
          border-radius: 12px;
          box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.45), 0 4px 10px -2px rgba(0, 0, 0, 0.25);
          padding: 16px;
          padding-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: gw-toast-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
        }

        .toast-card.closing {
          animation: gw-toast-slide-out 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes gw-toast-slide {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes gw-toast-slide-out {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(40px) scale(0.95);
          }
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .header-title {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
        }

        .close-btn {
          pointer-events: auto !important;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 22px;
          cursor: pointer !important;
          line-height: 1;
          padding: 2px 6px;
          border-radius: 4px;
          transition: color 0.15s ease, background-color 0.15s ease;
          user-select: none;
          -webkit-user-select: none;
          z-index: 10;
        }

        .close-btn:hover {
          color: #f1f5f9;
          background-color: rgba(255, 255, 255, 0.08);
        }

        .body-content {
          font-size: 14px;
          line-height: 1.5;
          color: #e2e8f0;
          word-break: break-word;
        }

        .user-highlight {
          font-weight: 700;
          color: #60a5fa;
        }

        .domain-subtext {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 2px;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }

        .btn:active {
          transform: scale(0.97);
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
          width: 100%;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
          transform-origin: left center;
          animation: gw-progress 5s linear forwards;
        }

        @keyframes gw-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}
      </style>
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
          <span>{actionPromptPrefix()}</span>
          <span class="user-highlight">{userDisplay()}</span>
          <span>{actionPromptSuffix()}</span>
          {props.payload.domain && (
            <div class="domain-subtext">{props.payload.domain}</div>
          )}
        </div>
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
        <div class="progress-bar" />
      </div>
    </>
  );
}
