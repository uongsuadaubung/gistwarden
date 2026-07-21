/**
 * Utility functions for interacting with the Chrome extension runtime.
 * Provides safe fallbacks for environments outside the extension.
 */

export function hasRuntime(): boolean {
  return typeof chrome !== "undefined" && !!chrome.runtime;
}

/**
 * Get the fully qualified URL for a resource path inside the extension.
 * Falls back to returning the path as-is if chrome.runtime is unavailable.
 */
export function getAssetUrl(path: string): string {
  if (!hasRuntime() || !chrome.runtime.getURL) {
    return path;
  }
  return chrome.runtime.getURL(path);
}

/**
 * Get the application version from the extension manifest.
 * Falls back to "1.0.0" if unavailable.
 */
export function getAppVersion(): string {
  if (!hasRuntime() || !chrome.runtime.getManifest) {
    return "1.0.0";
  }
  return chrome.runtime.getManifest().version || "1.0.0";
}

/**
 * Get the extension ID.
 * Falls back to an empty string if unavailable.
 */
export function getExtensionId(): string {
  if (!hasRuntime()) {
    return "";
  }
  return chrome.runtime.id || "";
}
