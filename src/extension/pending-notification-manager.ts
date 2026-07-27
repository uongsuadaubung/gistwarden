export interface PendingTabNotification {
  payload: unknown;
  timestamp: number;
}

export interface GlobalPendingNotification {
  payload: unknown;
  timestamp: number;
  domain: string;
}

export class PendingNotificationManager {
  private pendingFido2Callback: ((response: unknown) => void) | null = null;
  private pendingTabNotifications = new Map<number, PendingTabNotification>();
  private lastGlobalPendingNotification: GlobalPendingNotification | null =
    null;

  public setFido2Callback(
    callback: ((response: unknown) => void) | null,
  ): void {
    this.pendingFido2Callback = callback;
  }

  public resolveFido2Callback(response: unknown): boolean {
    if (this.pendingFido2Callback) {
      this.pendingFido2Callback(response);
      this.pendingFido2Callback = null;
      return true;
    }
    return false;
  }

  public setTabNotification(
    tabId: number,
    notification: PendingTabNotification,
  ): void {
    this.pendingTabNotifications.set(tabId, notification);
  }

  public getTabNotification(tabId: number): PendingTabNotification | undefined {
    return this.pendingTabNotifications.get(tabId);
  }

  public deleteTabNotification(tabId: number): void {
    this.pendingTabNotifications.delete(tabId);
  }

  public setGlobalNotification(
    notification: GlobalPendingNotification | null,
  ): void {
    this.lastGlobalPendingNotification = notification;
  }

  public getGlobalNotification(): GlobalPendingNotification | null {
    return this.lastGlobalPendingNotification;
  }

  public consumeGlobalNotification(): GlobalPendingNotification | null {
    const notif = this.lastGlobalPendingNotification;
    this.lastGlobalPendingNotification = null;
    return notif;
  }

  public clearAll(): void {
    this.pendingTabNotifications.clear();
    this.lastGlobalPendingNotification = null;
    this.pendingFido2Callback = null;
  }
}

export const pendingNotificationManager = new PendingNotificationManager();
