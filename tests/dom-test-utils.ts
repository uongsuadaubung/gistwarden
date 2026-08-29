import { handleInMemoryMessage } from "@gistwarden/orchestrator";
import userEvent from "@testing-library/user-event";

export function mockChromeExtensionEnvironment(): void {
  const localStore = new Map<string, unknown>();
  const sessionStore = new Map<string, unknown>();

  const storageMock = (store: Map<string, unknown>) => ({
    get: async (keys?: string | string[] | Record<string, unknown> | null) => {
      if (!keys) {
        return Object.fromEntries(store.entries());
      }
      if (typeof keys === "string") {
        return { [keys]: store.get(keys) };
      }
      if (Array.isArray(keys)) {
        const res: Record<string, unknown> = {};
        for (const k of keys) {
          res[k] = store.get(k);
        }
        return res;
      }
      const res: Record<string, unknown> = { ...keys };
      for (const k of Object.keys(keys)) {
        if (store.has(k)) {
          res[k] = store.get(k);
        }
      }
      return res;
    },
    set: async (items: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(items)) {
        store.set(k, v);
      }
    },
    remove: async (keys: string | string[]) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) {
        store.delete(k);
      }
    },
    clear: async () => {
      store.clear();
    },
  });

  const chromeMock = {
    runtime: {
      id: "mock-extension-id",
      getURL: (path: string) => `chrome-extension://mock-extension-id/${path}`,
      sendMessage: async (message: unknown) => {
        return await handleInMemoryMessage(message);
      },
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
      },
      lastError: null,
    },
    storage: {
      local: storageMock(localStore),
      session: storageMock(sessionStore),
    },
    tabs: {
      query: async () => [{ id: 1, url: "https://example.com" }],
      sendMessage: async () => ({ success: true }),
      create: async (props: { url: string }) => ({ id: 2, url: props.url }),
    },
  };

  Object.assign(globalThis, {
    chrome: chromeMock,
  });
}

/**
 * Creates user-event instance for realistic user interactions.
 */
export const user = userEvent.setup();

/**
 * Finds an element by selector or throws.
 */
export function findElement<T extends HTMLElement>(
  selector: string,
  container: ParentNode = document,
): T {
  const el = container.querySelector<T>(selector);
  if (!el) {
    throw new Error(`[DOM Test] Element not found for selector: "${selector}"`);
  }
  return el;
}

/**
 * Clicks an element simulating user click, executing SolidJS event handler cleanly.
 */
export async function clickElement(el: HTMLElement): Promise<void> {
  // If element is a submit button in a form, trigger form submission
  if (el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit") {
    const form = el.closest("form");
    if (form) {
      const handler = (form as unknown as Record<string, unknown>).$$submit;
      if (typeof handler === "function") {
        handler({
          currentTarget: form,
          target: form,
          preventDefault: () => {},
          stopPropagation: () => {},
        });
        await flushMicrotasks(60);
        return;
      }
      const onsubmitHandler = (form as unknown as Record<string, unknown>)
        .onsubmit;
      if (typeof onsubmitHandler === "function") {
        const syntheticEvt = {
          currentTarget: form,
          target: form,
          preventDefault: () => {},
          stopPropagation: () => {},
        };
        (onsubmitHandler as (e: unknown) => void)(syntheticEvt);
        await flushMicrotasks(60);
        return;
      }
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
        await flushMicrotasks(60);
        return;
      }
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await flushMicrotasks(60);
      return;
    }
  }

  let curr: Element | null = el;
  while (curr && curr !== document.body) {
    const handler = (curr as unknown as Record<string, unknown>).$$click;
    if (typeof handler === "function") {
      const syntheticEvt = {
        currentTarget: curr,
        target: el,
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      (handler as (e: unknown) => void)(syntheticEvt);
      await flushMicrotasks(60);
      return;
    }
    curr = curr.parentElement;
  }
  await user.click(el);
  await flushMicrotasks(60);
}

/**
 * Helper to select an option from custom SolidJS <Select> component.
 */
export async function selectOption(
  selectContainerOrSelector: string | HTMLElement,
  targetValue: string,
): Promise<void> {
  const container =
    typeof selectContainerOrSelector === "string"
      ? findElement<HTMLElement>(selectContainerOrSelector)
      : selectContainerOrSelector;

  // Click the select control button to open dropdown
  const control = findElement<HTMLButtonElement>(".select-control", container);
  await clickElement(control);
  await flushMicrotasks(40);

  // Find dropdown option matching target value
  await waitForDOM(
    () => container.querySelector(".select-dropdown-item") !== null,
    "Select dropdown did not open",
  );

  const items = Array.from(
    container.querySelectorAll<HTMLElement>(".select-dropdown-item"),
  );
  const targetLower = targetValue.toLowerCase().replace(/_/g, " ");
  const targetItem = items.find((item) => {
    const text = item.textContent?.toLowerCase() || "";
    const dataVal = item.getAttribute("data-value")?.toLowerCase() || "";
    return (
      text.includes(targetLower) ||
      text.includes(targetValue.toLowerCase()) ||
      dataVal === targetValue.toLowerCase() ||
      targetLower
        .split(" ")
        .some((token) => token.length > 2 && text.includes(token))
    );
  });

  if (!targetItem) {
    throw new Error(
      `[DOM Test] Option matching "${targetValue}" not found in select dropdown`,
    );
  }

  await clickElement(targetItem);
  await flushMicrotasks(40);
}

/**
 * Helper to flush microtasks and async render cycles in SolidJS.
 */
export async function flushMicrotasks(delayMs = 30): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Waits until a DOM condition becomes true, polling every few milliseconds.
 */
export async function waitForDOM(
  predicate: () => boolean,
  errorMessage = "Timeout waiting for DOM condition",
  timeoutMs = 8000,
  intervalMs = 20,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  console.log(
    "[DEBUG DOM snapshot on failure]:",
    document.body.innerHTML.slice(0, 1500),
  );
  throw new Error(`[DOM Test] ${errorMessage} (exceeded ${timeoutMs}ms)`);
}
