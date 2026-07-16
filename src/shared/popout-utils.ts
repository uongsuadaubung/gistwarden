import { POPOUT_HEIGHT, POPUP_WIDTH } from "./constants.ts";
import { store } from "./store.ts";

export const isPopout = (): boolean => {
  return new URLSearchParams(window.location.search).get("mode") === "tab";
};

export const handlePopout = () => {
  if (typeof chrome !== "undefined" && chrome.windows) {
    chrome.windows.getLastFocused((parentWindow) => {
      let left: number | undefined;
      let top: number | undefined;

      if (parentWindow) {
        const offsetRight = 20;
        const offsetTop = 80;
        if (
          parentWindow.left !== undefined && parentWindow.width !== undefined
        ) {
          left = Math.round(
            parentWindow.left + parentWindow.width - POPUP_WIDTH -
              offsetRight,
          );
        }
        if (parentWindow.top !== undefined) {
          top = Math.round(parentWindow.top + offsetTop);
        }
      }

      let url = "popup.html?mode=tab";
      if (store.selectedItem) {
        url += `&itemId=${store.selectedItem.id}`;
      }

      chrome.windows.create({
        url: chrome.runtime.getURL(url),
        type: "popup",
        width: POPUP_WIDTH,
        height: POPOUT_HEIGHT,
        left,
        top,
      });
      window.close();
    });
  }
};
