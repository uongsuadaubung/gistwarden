import { getBaseDomain } from "@/core/domain-utils.ts";

export interface SubmittedCredentials {
  domain: string;
  url: string;
  username: string;
  password: string;
}

// Helper to fill input field matching React/Angular state detection
export function setInputValue(element: HTMLInputElement, value: string): void {
  element.focus();

  // React 15/16+ tracker workaround
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch events to trigger JS Framework change detection
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.blur();
}

const LOGIN_BUTTON_KEYWORDS = [
  "login",
  "log in",
  "sign in",
  "signin",
  "submit",
  "đăng nhập",
  "tiếp tục",
  "next",
  "continue",
];

function isLoginKeywordMatch(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return LOGIN_BUTTON_KEYWORDS.some((kw) => normalized.includes(kw));
}

function submitElementFoundAndClicked(container: ParentNode): boolean {
  // 1. Search type="submit" elements
  const submitElements = container.querySelectorAll<HTMLElement>(
    'button[type="submit"], input[type="submit"]',
  );
  if (submitElements.length > 0) {
    submitElements[0].click();
    return true;
  }

  // 2. Search candidate buttons with login keywords
  const candidateButtons = container.querySelectorAll<HTMLElement>(
    'button, [type="button"], a.btn, .btn, [role="button"]',
  );
  for (let i = 0; i < candidateButtons.length; i++) {
    const btn = candidateButtons[i];
    const btnText =
      (btn.innerText || btn.getAttribute("value") || btn.id || btn.className ||
        "").toLowerCase();
    if (isLoginKeywordMatch(btnText)) {
      btn.click();
      return true;
    }
  }

  return false;
}

export function autoSubmitLogin(
  targetForm?: HTMLFormElement | null,
  targetInput?: HTMLInputElement | null,
): void {
  // Strategy 1: Search within form if form exists
  if (targetForm) {
    if (submitElementFoundAndClicked(targetForm)) {
      return;
    }
    if (typeof targetForm.requestSubmit === "function") {
      targetForm.requestSubmit();
      return;
    }
    targetForm.submit();
    return;
  }

  // Strategy 2: Formless fields - traverse DOM tree upwards from targetInput
  let currentElement: HTMLElement | null = targetInput ?? null;
  while (currentElement && currentElement.tagName !== "HTML") {
    if (submitElementFoundAndClicked(currentElement)) {
      return;
    }
    const rootNode = currentElement.getRootNode();
    if (!currentElement.parentElement && rootNode instanceof ShadowRoot) {
      const host = rootNode.host;
      if (host instanceof HTMLElement) {
        currentElement = host;
        continue;
      }
    }
    currentElement = currentElement.parentElement;
  }

  // Fallback: Document search
  submitElementFoundAndClicked(document);
}

export function performAutofill(
  username?: string,
  password?: string,
  autoSubmit: boolean = false,
): boolean {
  let filledAny = false;
  let targetForm: HTMLFormElement | null = null;
  let targetInput: HTMLInputElement | null = null;

  // Find all password fields on the page
  const passwordFields = document.querySelectorAll('input[type="password"]');

  if (passwordFields.length > 0) {
    for (let i = 0; i < passwordFields.length; i++) {
      const passwordField = passwordFields[i];
      if (!(passwordField instanceof HTMLInputElement)) continue;

      const form = passwordField.closest("form");
      if (!targetForm && form) targetForm = form;
      if (!targetInput) targetInput = passwordField;

      let usernameField: HTMLInputElement | null = null;

      // 1. Search username input within the same form
      if (form) {
        const textInputs = form.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="tel"], input:not([type])',
        );

        // Find the text input situated before the password input
        for (let j = 0; j < textInputs.length; j++) {
          const input = textInputs[j];
          if (!(input instanceof HTMLInputElement)) continue;
          if (input === passwordField) continue;

          // Check basic input type
          const type = input.type.toLowerCase();
          if (
            type !== "text" && type !== "email" && type !== "tel" &&
            input.hasAttribute("type")
          ) {
            continue;
          }

          const position = input.compareDocumentPosition(passwordField);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            usernameField = input;
          }
        }
      }

      // 2. If no form or no username input in form, search in the whole DOM before password field
      if (!usernameField) {
        const allInputs = Array.from(document.querySelectorAll("input"));
        const passIndex = allInputs.indexOf(passwordField);
        if (passIndex > 0) {
          for (let j = passIndex - 1; j >= 0; j--) {
            const input = allInputs[j];
            if (input instanceof HTMLInputElement) {
              const type = input.type.toLowerCase();
              if (
                type === "text" || type === "email" || type === "tel" ||
                !input.hasAttribute("type")
              ) {
                usernameField = input;
                break;
              }
            }
          }
        }
      }

      // Fill values
      if (password && passwordField) {
        setInputValue(passwordField, password);
        filledAny = true;
      }
      if (username && usernameField) {
        setInputValue(usernameField, username);
        filledAny = true;
      }
    }
  } else {
    // 3. Fallback: No password input, search text/email input containing username or login keywords
    const textInputs = document.querySelectorAll(
      'input[type="text"], input[type="email"]',
    );
    for (let i = 0; i < textInputs.length; i++) {
      const input = textInputs[i];
      if (!(input instanceof HTMLInputElement)) continue;

      const name = (input.name || "").toLowerCase();
      const id = (input.id || "").toLowerCase();
      if (
        name.includes("username") || name.includes("login") ||
        id.includes("username") || id.includes("login")
      ) {
        if (username) {
          setInputValue(input, username);
          filledAny = true;
          if (!targetInput) targetInput = input;
          const form = input.closest("form");
          if (!targetForm && form) targetForm = form;
        }
        break;
      }
    }
  }

  if (autoSubmit && filledAny) {
    setTimeout(() => {
      autoSubmitLogin(targetForm, targetInput);
    }, 100);
  }

  return filledAny;
}

export function extractSubmittedCredentials(
  targetForm?: HTMLFormElement | null,
): SubmittedCredentials | null {
  const container: ParentNode = targetForm ?? document;
  const passwordInputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="password"]',
  );

  if (passwordInputs.length === 0) {
    return null;
  }

  let chosenPasswordInput: HTMLInputElement | null = null;
  for (let i = 0; i < passwordInputs.length; i++) {
    const input = passwordInputs[i];
    if (input.value && input.value.trim().length > 0) {
      chosenPasswordInput = input;
      break;
    }
  }

  if (!chosenPasswordInput) {
    return null;
  }

  let usernameInput: HTMLInputElement | null = null;
  const parentForm = chosenPasswordInput.closest("form");

  if (parentForm) {
    const candidateInputs = parentForm.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input[type="email"], input[type="tel"], input:not([type])',
    );
    for (let i = 0; i < candidateInputs.length; i++) {
      const input = candidateInputs[i];
      if (input === chosenPasswordInput) continue;
      const pos = input.compareDocumentPosition(chosenPasswordInput);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        if (input.value && input.value.trim().length > 0) {
          usernameInput = input;
        }
      }
    }
  }

  if (!usernameInput) {
    const allInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input"),
    );
    const passIdx = allInputs.indexOf(chosenPasswordInput);
    if (passIdx > 0) {
      for (let i = passIdx - 1; i >= 0; i--) {
        const input = allInputs[i];
        const type = input.type.toLowerCase();
        if (
          type === "text" || type === "email" || type === "tel" ||
          !input.hasAttribute("type")
        ) {
          if (input.value && input.value.trim().length > 0) {
            usernameInput = input;
            break;
          }
        }
      }
    }
  }

  const currentUrl = window.location.href;
  const domain = getBaseDomain(currentUrl);

  return {
    domain,
    url: currentUrl,
    username: usernameInput ? usernameInput.value.trim() : "",
    password: chosenPasswordInput.value,
  };
}

export function setupFormSubmitMonitoring(
  onSubmitted: (creds: SubmittedCredentials) => void,
): void {
  let lastSubmittedTime = 0;

  const triggerSubmission = (form?: HTMLFormElement | null) => {
    const now = Date.now();
    // Debounce duplicate submissions within 1000ms
    if (now - lastSubmittedTime < 1000) return;

    const creds = extractSubmittedCredentials(form);
    if (creds && creds.password.length > 0) {
      lastSubmittedTime = now;
      onSubmitted(creds);
    }
  };

  // Global submit event listener
  document.addEventListener("submit", (evt: Event) => {
    const targetForm = evt.target instanceof HTMLFormElement
      ? evt.target
      : null;
    triggerSubmission(targetForm);
  }, true);

  // Global click event listener for submit buttons
  document.addEventListener("click", (evt: MouseEvent) => {
    if (!evt.isTrusted) return;
    const target = evt.target instanceof HTMLElement ? evt.target : null;
    if (!target) return;
    const btn = target.closest<HTMLElement>(
      'button[type="submit"], input[type="submit"], button:not([type]), .btn-submit',
    );
    if (btn) {
      const parentForm = btn.closest("form");
      triggerSubmission(parentForm);
    }
  }, true);

  // Global keyup event listener for Enter / Space on submit buttons or inputs
  document.addEventListener("keyup", (evt: KeyboardEvent) => {
    if (!evt.isTrusted) return;
    if (evt.key === "Enter") {
      const target = evt.target instanceof HTMLElement ? evt.target : null;
      if (!target) return;
      const parentForm = target.closest("form");
      triggerSubmission(parentForm);
    }
  }, true);
}

export function setupAutofillFocusMonitoring(onFocusInput: () => void): void {
  const handleFocus = (evt: FocusEvent) => {
    if (!evt.isTrusted) return;
    const target = evt.target instanceof HTMLInputElement ? evt.target : null;
    if (!target) return;

    const type = target.type ? target.type.toLowerCase() : "text";
    if (type === "password" || type === "text" || type === "email") {
      onFocusInput();
    }
  };

  document.addEventListener("focusin", handleFocus, true);
}
