export const notificationToastCss = `
:host {
  all: initial;
  display: block !important;
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

.select-label {
  margin-bottom: 4px;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.accounts-list::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.accounts-list::-webkit-scrollbar-track {
  background: transparent;
}

.accounts-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.accounts-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.account-item:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  max-width: 200px;
}

.account-name-sub {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-user {
  font-weight: 600;
  font-size: 13px;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-fill-small {
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-fill-small:hover {
  background: #3b82f6;
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

.progress-bar.paused {
  animation-play-state: paused;
}

@keyframes gw-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
`;

export function attachNotificationStyles(shadow: ShadowRoot): void {
  if (typeof CSSStyleSheet !== "undefined" && "adoptedStyleSheets" in shadow) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(notificationToastCss);
    shadow.adoptedStyleSheets = [sheet];
  } else {
    const styleEl = document.createElement("style");
    styleEl.textContent = notificationToastCss;
    shadow.appendChild(styleEl);
  }
}
