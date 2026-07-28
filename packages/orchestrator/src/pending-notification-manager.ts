import { isRecord } from "@gistwarden/repository";

export interface PendingTabNotification {
  payload: unknown;
  timestamp: number;
}

export interface GlobalPendingNotification {
  payload: unknown;
  timestamp: number;
  domain: string;
}

function isPendingTabNotification(
  val: unknown,
): val is PendingTabNotification {
  return isRecord(val) && "payload" in val && typeof val.timestamp === "number";
}

function isGlobalPendingNotification(
  val: unknown,
): val is GlobalPendingNotification {
  return (
    isRecord(val) &&
    "payload" in val &&
    typeof val.timestamp === "number" &&
    typeof val.domain === "string"
  );
}

const STORAGE_KEY_TAB_NOTIFS = "pending_tab_notifications";
const STORAGE_KEY_GLOBAL_NOTIF = "pending_global_notification";
const STORAGE_KEY_FIDO2_RESULT = "pending_fido2_result";

export class PendingNotificationManager {
  private pendingFido2Callback: ((response: unknown) => void) | null = null;
  private pendingTabNotifications = new Map<number, PendingTabNotification>();
  private lastGlobalPendingNotification: GlobalPendingNotification | null =
    null;

  public async clearFido2Result(): Promise<void> {
    this.pendingFido2Callback = null;
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      await chrome.storage.session.remove(STORAGE_KEY_FIDO2_RESULT);
    }
  }

  public setFido2Callback(
    callback: ((response: unknown) => void) | null,
  ): void {
    this.pendingFido2Callback = callback;
  }

  public resolveFido2Callback(response: unknown): boolean {
    let resolved = false;
    if (this.pendingFido2Callback) {
      this.pendingFido2Callback(response);
      this.pendingFido2Callback = null;
      resolved = true;
      if (
        typeof chrome !== "undefined" && chrome.storage &&
        chrome.storage.session
      ) {
        chrome.storage.session.remove(STORAGE_KEY_FIDO2_RESULT);
      }
    } else {
      this.persistFido2Result(response);
    }
    return resolved;
  }

  public async setTabNotification(
    tabId: number,
    notification: PendingTabNotification,
  ): Promise<void> {
    this.pendingTabNotifications.set(tabId, notification);
    await this.persistTabNotifications();
  }

  public async getTabNotification(
    tabId: number,
  ): Promise<PendingTabNotification | undefined> {
    await this.loadTabNotifications();
    return this.pendingTabNotifications.get(tabId);
  }

  public async deleteTabNotification(tabId: number): Promise<void> {
    this.pendingTabNotifications.delete(tabId);
    await this.persistTabNotifications();
  }

  public async setGlobalNotification(
    notification: GlobalPendingNotification | null,
  ): Promise<void> {
    this.lastGlobalPendingNotification = notification;
    await this.persistGlobalNotification();
  }

  public async getGlobalNotification(): Promise<
    GlobalPendingNotification | null
  > {
    await this.loadGlobalNotification();
    return this.lastGlobalPendingNotification;
  }

  public async consumeGlobalNotification(): Promise<
    GlobalPendingNotification | null
  > {
    const notif = await this.getGlobalNotification();
    await this.setGlobalNotification(null);
    return notif;
  }

  public async clearAll(): Promise<void> {
    this.pendingTabNotifications.clear();
    this.lastGlobalPendingNotification = null;
    this.pendingFido2Callback = null;
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      await chrome.storage.session.remove([
        STORAGE_KEY_TAB_NOTIFS,
        STORAGE_KEY_GLOBAL_NOTIF,
        STORAGE_KEY_FIDO2_RESULT,
      ]);
    }
  }

  private async persistFido2Result(response: unknown): Promise<void> {
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      await chrome.storage.session.set({
        [STORAGE_KEY_FIDO2_RESULT]: response,
      });
    }
  }

  private async checkAndFlushFido2Result(): Promise<void> {
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      const res = await chrome.storage.session.get(STORAGE_KEY_FIDO2_RESULT);
      if (res && STORAGE_KEY_FIDO2_RESULT in res && this.pendingFido2Callback) {
        const storedResult = res[STORAGE_KEY_FIDO2_RESULT];
        await chrome.storage.session.remove(STORAGE_KEY_FIDO2_RESULT);
        if (this.pendingFido2Callback) {
          const cb = this.pendingFido2Callback;
          this.pendingFido2Callback = null;
          cb(storedResult);
        }
      }
    }
  }

  private async persistTabNotifications(): Promise<void> {
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      const obj = Object.fromEntries(this.pendingTabNotifications.entries());
      await chrome.storage.session.set({ [STORAGE_KEY_TAB_NOTIFS]: obj });
    }
  }

  private async loadTabNotifications(): Promise<void> {
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      const res = await chrome.storage.session.get(STORAGE_KEY_TAB_NOTIFS);
      if (isRecord(res) && isRecord(res[STORAGE_KEY_TAB_NOTIFS])) {
        const entries = Object.entries(res[STORAGE_KEY_TAB_NOTIFS]);
        for (const [key, val] of entries) {
          const tabId = parseInt(key, 10);
          if (!isNaN(tabId) && isPendingTabNotification(val)) {
            this.pendingTabNotifications.set(tabId, val);
          }
        }
      }
    }
  }

  private async persistGlobalNotification(): Promise<void> {
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      await chrome.storage.session.set({
        [STORAGE_KEY_GLOBAL_NOTIF]: this.lastGlobalPendingNotification,
      });
    }
  }

  private async loadGlobalNotification(): Promise<void> {
    if (
      typeof chrome !== "undefined" && chrome.storage && chrome.storage.session
    ) {
      const res = await chrome.storage.session.get(STORAGE_KEY_GLOBAL_NOTIF);
      if (
        isRecord(res) &&
        isGlobalPendingNotification(res[STORAGE_KEY_GLOBAL_NOTIF])
      ) {
        this.lastGlobalPendingNotification = res[STORAGE_KEY_GLOBAL_NOTIF];
      }
    }
  }
}

export const pendingNotificationManager = new PendingNotificationManager();
