import { plugin } from "bun";
import { SolidPlugin } from "bun-plugin-solid";
import { Window } from "happy-dom";

plugin(SolidPlugin());

const window = new Window({
  url: "chrome-extension://mock-extension-id/popup.html",
  width: 400,
  height: 600,
});

// Assign complete browser DOM environment from Happy-DOM to globalThis
Object.assign(globalThis, {
  window,
  document: window.document,
  sessionStorage: window.sessionStorage,
  localStorage: window.localStorage,
  navigator: window.navigator,
  location: window.location,
  history: window.history,
  CustomEvent: window.CustomEvent,
  Event: window.Event,
  MouseEvent: window.MouseEvent,
  KeyboardEvent: window.KeyboardEvent,
  PointerEvent: window.PointerEvent || window.MouseEvent,
  FocusEvent: window.FocusEvent || window.Event,
  InputEvent: window.InputEvent || window.Event,
  Node: window.Node,
  Element: window.Element,
  HTMLElement: window.HTMLElement,
  HTMLHeadElement: window.HTMLHeadElement,
  HTMLBodyElement: window.HTMLBodyElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLSpanElement: window.HTMLSpanElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLButtonElement: window.HTMLButtonElement,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLFormElement: window.HTMLFormElement,
  HTMLAnchorElement: window.HTMLAnchorElement,
  SVGElement: window.SVGElement,
  DOMParser: window.DOMParser,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
});
