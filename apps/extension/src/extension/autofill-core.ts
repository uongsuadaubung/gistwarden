import {
  CustomFieldType,
  LoginLinkedId,
  type VaultField,
} from "@gistwarden/domain";
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

// Helper to fill checkbox matching React/Angular/Vue state detection
export function setCheckboxValue(
  element: HTMLInputElement,
  checked: boolean,
): void {
  element.focus();

  // React 15/16+ tracker workaround for checkbox
  const nativeCheckedSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "checked",
  )?.set;

  if (nativeCheckedSetter) {
    nativeCheckedSetter.call(element, checked);
  } else {
    element.checked = checked;
  }

  // Dispatch events to trigger JS Framework change detection
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.blur();
}

const TRUTHY_BOOLEAN_SET = new Set(["true", "1", "yes", "y", "✓"]);

interface AutofillCredentialContext {
  username?: string;
  password?: string;
  totp?: string;
}

const LINKED_PROPERTY_EXTRACTORS: Record<
  string | number,
  (ctx: AutofillCredentialContext) => string | undefined
> = {
  [LoginLinkedId.Username]: (ctx) => ctx.username,
  username: (ctx) => ctx.username,
  [LoginLinkedId.Password]: (ctx) => ctx.password,
  password: (ctx) => ctx.password,
  [LoginLinkedId.Totp]: (ctx) => ctx.totp,
  totp: (ctx) => ctx.totp,
};

function resolveLinkedFieldValue(
  field: VaultField,
  ctx: AutofillCredentialContext,
): string {
  const linkedId = field.linkedId;
  if (linkedId) {
    const extractor = LINKED_PROPERTY_EXTRACTORS[linkedId];
    if (extractor) {
      return extractor(ctx) || "";
    }
  }
  const linkedTarget = (field.value || "").toLowerCase().trim();
  if (linkedTarget) {
    const extractor = LINKED_PROPERTY_EXTRACTORS[linkedTarget];
    if (extractor) {
      return extractor(ctx) || "";
    }
  }
  return field.value || "";
}

const FIELD_VALUE_RESOLVERS: Record<
  CustomFieldType,
  (field: VaultField, ctx: AutofillCredentialContext) => string
> = {
  [CustomFieldType.Text]: (field) => field.value || "",
  [CustomFieldType.Hidden]: (field) => field.value || "",
  [CustomFieldType.Boolean]: (field) =>
    TRUTHY_BOOLEAN_SET.has((field.value || "").toLowerCase().trim())
      ? "true"
      : "false",
  [CustomFieldType.Linked]: (field, ctx) => resolveLinkedFieldValue(field, ctx),
  [CustomFieldType.Divider]: () => "",
};

function autofillCustomFields(
  customFields?: readonly VaultField[],
  username?: string,
  password?: string,
  totp?: string,
): { filledAny: boolean; filledElements: Set<Element> } {
  const filledElements = new Set<Element>();
  let filledAny = false;

  if (!customFields || customFields.length === 0) {
    return { filledAny, filledElements };
  }

  const allInputs = Array.from(
    document.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select"),
  );

  const credContext: AutofillCredentialContext = { username, password, totp };

  for (const field of customFields) {
    if (!field.name?.trim()) continue;
    if (field.type === CustomFieldType.Divider) continue;

    const fieldNameLower = field.name.trim().toLowerCase();

    // Determine value to fill using strategy lookup
    const resolver =
      FIELD_VALUE_RESOLVERS[field.type] ??
      FIELD_VALUE_RESOLVERS[CustomFieldType.Text];
    const valueToFill = resolver(field, credContext);

    // Find candidate DOM elements matching field.name
    for (const el of allInputs) {
      if (filledElements.has(el)) continue;

      const id = (el.id || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      const placeholder =
        "placeholder" in el ? (el.placeholder || "").toLowerCase() : "";
      const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
      const dataTest = (el.getAttribute("data-test") || "").toLowerCase();
      const dataTestId = (el.getAttribute("data-testid") || "").toLowerCase();

      const isMatch =
        id === fieldNameLower ||
        name === fieldNameLower ||
        placeholder === fieldNameLower ||
        ariaLabel === fieldNameLower ||
        dataTest === fieldNameLower ||
        dataTestId === fieldNameLower;

      if (isMatch) {
        if (el instanceof HTMLInputElement) {
          if (el.type === "checkbox" || el.type === "radio") {
            const shouldCheck = TRUTHY_BOOLEAN_SET.has(
              String(valueToFill).toLowerCase().trim(),
            );
            setCheckboxValue(el, shouldCheck);
            filledElements.add(el);
            filledAny = true;
          } else {
            setInputValue(el, valueToFill);
            filledElements.add(el);
            filledAny = true;
          }
        } else if (
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.value = valueToFill;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filledElements.add(el);
          filledAny = true;
        }
      }
    }
  }

  return { filledAny, filledElements };
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

// ----------------------------------------------------
// Chain of Responsibility: Submit Button & Form Submitter
// ----------------------------------------------------

interface SubmitHandler {
  setNext(handler: SubmitHandler): SubmitHandler;
  handle(container: ParentNode): boolean;
}

abstract class AbstractSubmitHandler implements SubmitHandler {
  private nextHandler?: SubmitHandler;

  setNext(handler: SubmitHandler): SubmitHandler {
    this.nextHandler = handler;
    return handler;
  }

  handle(container: ParentNode): boolean {
    if (this.nextHandler) {
      return this.nextHandler.handle(container);
    }
    return false;
  }
}

class ExplicitSubmitTypeHandler extends AbstractSubmitHandler {
  override handle(container: ParentNode): boolean {
    const submitElements = container.querySelectorAll<HTMLElement>(
      'button[type="submit"], input[type="submit"]',
    );
    if (submitElements.length > 0) {
      const firstSubmit = submitElements[0];
      if (firstSubmit) {
        firstSubmit.click();
        return true;
      }
    }
    return super.handle(container);
  }
}

class KeywordCandidateButtonHandler extends AbstractSubmitHandler {
  override handle(container: ParentNode): boolean {
    const candidateButtons = container.querySelectorAll<HTMLElement>(
      'button, [type="button"], a.btn, .btn, [role="button"]',
    );
    for (let i = 0; i < candidateButtons.length; i++) {
      const btn = candidateButtons[i];
      if (!btn) continue;
      const btnText = (
        btn.innerText ||
        btn.getAttribute("value") ||
        btn.id ||
        btn.className ||
        ""
      ).toLowerCase();
      if (isLoginKeywordMatch(btnText)) {
        btn.click();
        return true;
      }
    }
    return super.handle(container);
  }
}

function submitElementFoundAndClicked(container: ParentNode): boolean {
  const chain = new ExplicitSubmitTypeHandler();
  chain.setNext(new KeywordCandidateButtonHandler());
  return chain.handle(container);
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

// ----------------------------------------------------
// Chain of Responsibility: Username Field Extractor
// ----------------------------------------------------

interface UsernameExtractor {
  extract(
    passwordField: HTMLInputElement,
    form: HTMLFormElement | null,
  ): HTMLInputElement | null;
}

class FormPrecedingUsernameExtractor implements UsernameExtractor {
  extract(
    passwordField: HTMLInputElement,
    form: HTMLFormElement | null,
  ): HTMLInputElement | null {
    if (!form) return null;
    const textInputs = form.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input:not([type])',
    );
    let matchedInput: HTMLInputElement | null = null;
    for (let j = 0; j < textInputs.length; j++) {
      const input = textInputs[j];
      if (!(input instanceof HTMLInputElement)) continue;
      if (input === passwordField) continue;

      const type = input.type.toLowerCase();
      if (
        type !== "text" &&
        type !== "email" &&
        type !== "tel" &&
        input.hasAttribute("type")
      ) {
        continue;
      }

      const position = input.compareDocumentPosition(passwordField);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        matchedInput = input;
      }
    }
    return matchedInput;
  }
}

class DomPrecedingUsernameExtractor implements UsernameExtractor {
  extract(
    passwordField: HTMLInputElement,
    _form?: HTMLFormElement | null,
  ): HTMLInputElement | null {
    const allInputs = Array.from(document.querySelectorAll("input"));
    const passIndex = allInputs.indexOf(passwordField);
    if (passIndex > 0) {
      for (let j = passIndex - 1; j >= 0; j--) {
        const input = allInputs[j];
        if (input instanceof HTMLInputElement) {
          const type = input.type.toLowerCase();
          if (
            type === "text" ||
            type === "email" ||
            type === "tel" ||
            !input.hasAttribute("type")
          ) {
            return input;
          }
        }
      }
    }
    return null;
  }
}

function findUsernameInputForPassword(
  passwordField: HTMLInputElement,
  form: HTMLFormElement | null,
): HTMLInputElement | null {
  const formExtractor = new FormPrecedingUsernameExtractor();
  const formResult = formExtractor.extract(passwordField, form);
  if (formResult) return formResult;

  const domExtractor = new DomPrecedingUsernameExtractor();
  return domExtractor.extract(passwordField, form);
}

export function performAutofill(
  username?: string,
  password?: string,
  autoSubmit: boolean = false,
  customFields?: readonly VaultField[],
  totp?: string,
): boolean {
  let filledAny = false;
  let targetForm: HTMLFormElement | null = null;
  let targetInput: HTMLInputElement | null = null;

  // 1. Fill custom fields (including Linked fields) first!
  const customResult = autofillCustomFields(
    customFields,
    username,
    password,
    totp,
  );
  if (customResult.filledAny) {
    filledAny = true;
  }
  const filledElements = customResult.filledElements;

  // 2. Find all password fields on the page
  const passwordFields = document.querySelectorAll('input[type="password"]');

  if (passwordFields.length > 0) {
    for (let i = 0; i < passwordFields.length; i++) {
      const passwordField = passwordFields[i];
      if (!(passwordField instanceof HTMLInputElement)) continue;

      const form = passwordField.closest("form");
      if (!targetForm && form) targetForm = form;
      if (!targetInput) targetInput = passwordField;

      const usernameField = findUsernameInputForPassword(passwordField, form);

      // Fill values (if not already filled by custom fields)
      if (password && passwordField && !filledElements.has(passwordField)) {
        setInputValue(passwordField, password);
        filledAny = true;
      }
      if (username && usernameField && !filledElements.has(usernameField)) {
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
      if (filledElements.has(input)) continue;

      const name = (input.name || "").toLowerCase();
      const id = (input.id || "").toLowerCase();
      if (
        name.includes("username") ||
        name.includes("login") ||
        id.includes("username") ||
        id.includes("login")
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
    if (input?.value && input.value.trim().length > 0) {
      chosenPasswordInput = input;
      break;
    }
  }

  if (!chosenPasswordInput) {
    return null;
  }

  const parentForm = chosenPasswordInput.closest("form");
  const usernameInput = findUsernameInputForPassword(
    chosenPasswordInput,
    parentForm,
  );

  const currentUrl = window.location.href;
  const domain = getBaseDomain(currentUrl);

  return {
    domain,
    url: currentUrl,
    username: usernameInput?.value ? usernameInput.value.trim() : "",
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
  document.addEventListener(
    "submit",
    (evt: Event) => {
      const targetForm =
        evt.target instanceof HTMLFormElement ? evt.target : null;
      triggerSubmission(targetForm);
    },
    true,
  );

  // Global click event listener for submit buttons
  document.addEventListener(
    "click",
    (evt: MouseEvent) => {
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
    },
    true,
  );

  // Global keyup event listener for Enter / Space on submit buttons or inputs
  document.addEventListener(
    "keyup",
    (evt: KeyboardEvent) => {
      if (!evt.isTrusted) return;
      if (evt.key === "Enter") {
        const target = evt.target instanceof HTMLElement ? evt.target : null;
        if (!target) return;
        const parentForm = target.closest("form");
        triggerSubmission(parentForm);
      }
    },
    true,
  );
}

export function isSearchOrFilterInput(input: HTMLInputElement): boolean {
  const type = (input.type || "").toLowerCase();
  if (type === "search") return true;

  const role = (input.getAttribute("role") || "").toLowerCase();
  if (role === "searchbox") return true;

  const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase();
  if (autocomplete === "search") return true;

  const searchKeywords = [
    "search",
    "filter",
    "query",
    "find",
    "filterable",
    "repo",
  ];

  const attrText = [
    input.id,
    input.name,
    input.placeholder,
    input.getAttribute("aria-label"),
    input.className,
    input.getAttribute("data-query-name"),
  ]
    .join(" ")
    .toLowerCase();

  return searchKeywords.some((kw) => attrText.includes(kw));
}

export function isCandidateLoginInput(input: HTMLInputElement): boolean {
  const type = (input.type || "").toLowerCase();

  if (type === "password") return true;

  if (
    type !== "text" &&
    type !== "email" &&
    type !== "tel" &&
    input.hasAttribute("type")
  ) {
    return false;
  }

  if (isSearchOrFilterInput(input)) {
    return false;
  }

  const form = input.closest("form");
  const hasPasswordInForm = form
    ? form.querySelector('input[type="password"]') !== null
    : false;
  if (hasPasswordInForm) return true;

  const hasPasswordOnPage =
    document.querySelector('input[type="password"]') !== null;

  const nameOrId = (
    input.name +
    " " +
    input.id +
    " " +
    (input.getAttribute("autocomplete") || "")
  ).toLowerCase();
  const isUsernameKeyword = ["username", "login", "email", "user"].some((kw) =>
    nameOrId.includes(kw),
  );

  return isUsernameKeyword || hasPasswordOnPage;
}

export function setupAutofillFocusMonitoring(
  onFocusInput: (target: HTMLInputElement) => void,
): void {
  const handleFocus = (evt: FocusEvent) => {
    if (!evt.isTrusted) return;
    const target = evt.target instanceof HTMLInputElement ? evt.target : null;
    if (!target) return;

    if (isCandidateLoginInput(target)) {
      onFocusInput(target);
    }
  };

  document.addEventListener("focusin", handleFocus, true);
}
