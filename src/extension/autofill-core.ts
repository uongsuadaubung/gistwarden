// Helper to fill input field matching React/Angular state detection
export function setInputValue(element: HTMLInputElement, value: string) {
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

export function performAutofill(username?: string, password?: string): boolean {
  let filledAny = false;

  // Find all password fields on the page
  const passwordFields = document.querySelectorAll('input[type="password"]');

  if (passwordFields.length > 0) {
    for (let i = 0; i < passwordFields.length; i++) {
      const passwordField = passwordFields[i];
      if (!(passwordField instanceof HTMLInputElement)) continue;

      const form = passwordField.closest("form");
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
        }
        break;
      }
    }
  }

  return filledAny;
}
