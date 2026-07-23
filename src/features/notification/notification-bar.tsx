import { render } from "solid-js/web";
import {
  type NotificationPayload,
  NotificationToast,
} from "@/features/notification/NotificationToast.tsx";

export type { NotificationPayload };

let notificationHost: HTMLElement | null = null;
let disposeSolid: (() => void) | null = null;
let currentShowingPayload: NotificationPayload | null = null;
let isPageUnloading = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    isPageUnloading = true;
  });
  window.addEventListener("pagehide", () => {
    isPageUnloading = true;
  });
}

export function removeNotificationBar(): void {
  if (disposeSolid) {
    disposeSolid();
    disposeSolid = null;
  }
  if (notificationHost && notificationHost.parentNode) {
    notificationHost.parentNode.removeChild(notificationHost);
    notificationHost = null;
  }
  currentShowingPayload = null;
}

export function showNotificationBar(payload: NotificationPayload): void {
  if (isPageUnloading) return;

  if (
    notificationHost &&
    notificationHost.parentNode &&
    currentShowingPayload &&
    currentShowingPayload.actionType === payload.actionType &&
    currentShowingPayload.domain === payload.domain &&
    currentShowingPayload.username === payload.username &&
    currentShowingPayload.password === payload.password
  ) {
    return;
  }

  removeNotificationBar();
  currentShowingPayload = payload;

  const host = document.createElement("div");
  host.id = "gistwarden-notification-host";
  host.style.position = "fixed";
  host.style.top = "20px";
  host.style.right = "20px";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "auto";

  const shadow = host.attachShadow({ mode: "closed" });

  disposeSolid = render(
    () => (
      <NotificationToast
        payload={payload}
        onClose={() => removeNotificationBar()}
      />
    ),
    shadow,
  );

  const targetParent = document.documentElement || document.body;
  if (targetParent) {
    targetParent.appendChild(host);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      (document.documentElement || document.body)?.appendChild(host);
    });
  }
  notificationHost = host;
}
