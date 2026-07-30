import { render } from "solid-js/web";
import {
  type NotificationPayload,
  NotificationToast,
} from "@/features/notification/NotificationToast.tsx";
import { attachNotificationStyles } from "@/features/notification/notification-toast.styles.ts";

export type { NotificationPayload };

export class NotificationBarManager {
  private notificationHost: HTMLElement | null = null;
  private disposeSolid: (() => void) | null = null;
  private currentShowingPayload: NotificationPayload | null = null;
  private isPageUnloading = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.isPageUnloading = true;
      });
      window.addEventListener("pagehide", () => {
        this.isPageUnloading = true;
      });
    }
  }

  public isUnloading(): boolean {
    return this.isPageUnloading;
  }

  public removeNotificationBar(): void {
    if (this.disposeSolid) {
      this.disposeSolid();
      this.disposeSolid = null;
    }
    if (this.notificationHost && this.notificationHost.parentNode) {
      this.notificationHost.parentNode.removeChild(this.notificationHost);
      this.notificationHost = null;
    }
    this.currentShowingPayload = null;
  }

  public showNotificationBar(payload: NotificationPayload): void {
    if (this.isPageUnloading) return;

    if (
      this.notificationHost &&
      this.notificationHost.parentNode &&
      this.currentShowingPayload &&
      this.currentShowingPayload.actionType === payload.actionType &&
      this.currentShowingPayload.domain === payload.domain &&
      this.currentShowingPayload.username === payload.username &&
      this.currentShowingPayload.password === payload.password
    ) {
      return;
    }

    this.removeNotificationBar();
    this.currentShowingPayload = payload;

    const host = document.createElement("div");
    host.id = "gistwarden-notification-host";
    host.style.position = "fixed";
    host.style.top = "20px";
    host.style.right = "20px";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "auto";
    host.style.display = "block";
    host.style.width = "auto";
    host.style.height = "auto";

    const shadow = host.attachShadow({ mode: "closed" });
    attachNotificationStyles(shadow);

    this.disposeSolid = render(
      () => (
        <NotificationToast
          payload={payload}
          onClose={() => this.removeNotificationBar()}
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
    this.notificationHost = host;
  }
}

export const notificationBarManager = new NotificationBarManager();

export function removeNotificationBar(): void {
  notificationBarManager.removeNotificationBar();
}

export function showNotificationBar(payload: NotificationPayload): void {
  notificationBarManager.showNotificationBar(payload);
}
