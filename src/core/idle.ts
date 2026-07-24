/**
 * Safe wrapper functions for chrome.idle API for non-extension / testing environments.
 */

export function hasIdle(): boolean {
  return typeof chrome !== "undefined" && !!chrome.idle;
}

export type IdleStateChangedHandler = (
  newState: "active" | "idle" | "locked",
) => void;

/**
 * Register a listener for chrome.idle.onStateChanged with safety checks for non-extension environments.
 * Returns an unbind function to remove the listener.
 */
export function onIdleStateChanged(
  handler: IdleStateChangedHandler,
): () => void {
  if (!hasIdle() || !chrome.idle?.onStateChanged) {
    return () => {};
  }

  chrome.idle.onStateChanged.addListener(handler);
  return () => {
    chrome.idle.onStateChanged.removeListener(handler);
  };
}
