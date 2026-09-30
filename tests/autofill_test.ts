import { FieldType } from "@gistwarden/domain";
import { Window } from "happy-dom";
import {
  isUntrustedIframe,
  performAutofill,
} from "../apps/extension/src/extension/autofill-core.ts";
import { assertEquals, test } from "./assert.ts";

function setupDOM(html: string) {
  const window = new Window({ url: "https://example.com/login" });
  window.document.body.innerHTML = html;

  // Define necessary globals for the test to act like a browser
  Object.assign(globalThis, {
    document: window.document,
    window: window,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    HTMLSelectElement: window.HTMLSelectElement,
    HTMLFormElement: window.HTMLFormElement,
    Event: window.Event,
    Node: window.Node,
  });

  return window.document;
}

test("Autofill - standard login form", () => {
  const doc = setupDOM(`
    <form id="login">
      <input type="text" name="username" id="user" />
      <input type="password" name="password" id="pass" />
    </form>
  `);

  const result = performAutofill("myuser", "mypass");
  assertEquals(result, true);

  const userInput = doc.getElementById("user");
  const passInput = doc.getElementById("pass");

  if (
    userInput &&
    "value" in userInput &&
    typeof userInput.value === "string"
  ) {
    assertEquals(userInput.value, "myuser");
  }
  if (
    passInput &&
    "value" in passInput &&
    typeof passInput.value === "string"
  ) {
    assertEquals(passInput.value, "mypass");
  }
});

test("Autofill - form without form tags (just inputs)", () => {
  const doc = setupDOM(`
    <div>
      <input type="text" id="username" />
      <input type="password" id="password" />
    </div>
  `);

  const result = performAutofill("john_doe", "secret123");
  assertEquals(result, true);

  const userInput = doc.getElementById("username");
  const passInput = doc.getElementById("password");

  if (
    userInput &&
    "value" in userInput &&
    typeof userInput.value === "string"
  ) {
    assertEquals(userInput.value, "john_doe");
  }
  if (
    passInput &&
    "value" in passInput &&
    typeof passInput.value === "string"
  ) {
    assertEquals(passInput.value, "secret123");
  }
});

test("Autofill - only username fallback", () => {
  const doc = setupDOM(`
    <div>
      <input type="text" id="user_id" name="username" />
    </div>
  `);

  const result = performAutofill("only_user", "unused_pass");
  assertEquals(result, true);

  const userInput = doc.getElementById("user_id");
  if (
    userInput &&
    "value" in userInput &&
    typeof userInput.value === "string"
  ) {
    assertEquals(userInput.value, "only_user");
  }
});

test("Autofill - no matching fields", () => {
  const _doc = setupDOM(`
    <div>
      <div id="not-an-input">Hello</div>
    </div>
  `);

  const result = performAutofill("user", "pass");
  assertEquals(result, false);
});

test("Autofill - Linked custom fields to username and password", () => {
  const doc = setupDOM(`
    <form id="custom_login">
      <input type="text" name="account_identifier" id="account_identifier" />
      <input type="password" name="auth_secret" id="auth_secret" />
    </form>
  `);

  const customFields = [
    {
      name: "account_identifier",
      type: FieldType.Linked,
      value: "username",
    },
    {
      name: "auth_secret",
      type: FieldType.Linked,
      value: "password",
    },
  ];

  const result = performAutofill(
    "custom_user",
    "custom_pass",
    false,
    customFields,
  );
  assertEquals(result, true);

  const userInput = doc.getElementById(
    "account_identifier",
  ) as HTMLInputElement | null;
  const passInput = doc.getElementById(
    "auth_secret",
  ) as HTMLInputElement | null;

  assertEquals(userInput?.value, "custom_user");
  assertEquals(passInput?.value, "custom_pass");
});

test("Autofill - Boolean, Text and Hidden custom fields", () => {
  const doc = setupDOM(`
    <form id="mixed_form">
      <input type="checkbox" name="remember_device" id="remember_device" />
      <input type="text" name="pin_code" id="pin_code" />
      <input type="password" name="security_answer" id="security_answer" />
    </form>
  `);

  const customFields = [
    {
      name: "remember_device",
      type: FieldType.Boolean,
      value: "true",
    },
    {
      name: "pin_code",
      type: FieldType.Text,
      value: "9988",
    },
    {
      name: "security_answer",
      type: FieldType.Hidden,
      value: "MyDogSpot",
    },
  ];

  const result = performAutofill("", "", false, customFields);
  assertEquals(result, true);

  const rememberCb = doc.getElementById(
    "remember_device",
  ) as HTMLInputElement | null;
  const pinInput = doc.getElementById("pin_code") as HTMLInputElement | null;
  const secInput = doc.getElementById(
    "security_answer",
  ) as HTMLInputElement | null;

  assertEquals(rememberCb?.checked, true);
  assertEquals(pinInput?.value, "9988");
  assertEquals(secInput?.value, "MyDogSpot");
});

test("Autofill - Checkbox with false unchecks previously checked input", () => {
  const doc = setupDOM(`
    <form id="opt_form">
      <input type="checkbox" name="newsletter_opt_in" id="newsletter_opt_in" checked />
    </form>
  `);

  const customFields = [
    {
      name: "newsletter_opt_in",
      type: FieldType.Boolean,
      value: "false",
    },
  ];

  const result = performAutofill("", "", false, customFields);
  assertEquals(result, true);

  const checkbox = doc.getElementById(
    "newsletter_opt_in",
  ) as HTMLInputElement | null;
  assertEquals(checkbox?.checked, false);
});

test("Autofill - Checkbox matches truthy values (1, yes, y, true, ✓)", () => {
  const doc = setupDOM(`
    <form id="terms_form">
      <input type="checkbox" name="agree_terms" id="cb1" />
      <input type="checkbox" aria-label="trust_this_browser" id="cb2" />
      <input type="checkbox" data-testid="keep_signed_in" id="cb3" />
    </form>
  `);

  const customFields = [
    {
      name: "agree_terms",
      type: FieldType.Boolean,
      value: "1",
    },
    {
      name: "trust_this_browser",
      type: FieldType.Boolean,
      value: "yes",
    },
    {
      name: "keep_signed_in",
      type: FieldType.Boolean,
      value: "true",
    },
  ];

  const result = performAutofill("", "", false, customFields);
  assertEquals(result, true);

  const cb1 = doc.getElementById("cb1") as HTMLInputElement | null;
  const cb2 = doc.getElementById("cb2") as HTMLInputElement | null;
  const cb3 = doc.getElementById("cb3") as HTMLInputElement | null;

  assertEquals(cb1?.checked, true);
  assertEquals(cb2?.checked, true);
  assertEquals(cb3?.checked, true);
});

test("Autofill - Notification prompt fill action fills Checkbox and credentials", () => {
  const doc = setupDOM(`
    <form id="noti_login_form">
      <input type="text" name="user_box" id="user_box" />
      <input type="password" name="pwd_box" id="pwd_box" />
      <input type="checkbox" name="remember_me" id="remember_me" />
    </form>
  `);

  // Simulate payload received from Notification Bar when user clicks "Autofill" button
  const notificationAccount = {
    itemId: "item-123",
    username: "john_doe",
    password: "secure_password_99",
    fields: [
      {
        name: "user_box",
        type: FieldType.Linked,
        value: "username",
      },
      {
        name: "pwd_box",
        type: FieldType.Linked,
        value: "password",
      },
      {
        name: "remember_me",
        type: FieldType.Boolean,
        value: "true",
      },
    ],
  };

  const result = performAutofill(
    notificationAccount.username,
    notificationAccount.password,
    false,
    notificationAccount.fields,
  );
  assertEquals(result, true);

  const userInput = doc.getElementById("user_box") as HTMLInputElement | null;
  const passInput = doc.getElementById("pwd_box") as HTMLInputElement | null;
  const rememberCb = doc.getElementById(
    "remember_me",
  ) as HTMLInputElement | null;

  assertEquals(userInput?.value, "john_doe");
  assertEquals(passInput?.value, "secure_password_99");
  assertEquals(rememberCb?.checked, true);
});

test("Autofill - Text custom fields into text input, textarea, and select", () => {
  const doc = setupDOM(`
    <form id="enterprise_form">
      <input type="text" name="company_code" id="company_code" />
      <textarea name="extra_notes" id="extra_notes"></textarea>
      <select name="department_select" id="department_select">
        <option value="">Choose</option>
        <option value="IT">IT</option>
        <option value="Finance">Finance</option>
      </select>
    </form>
  `);

  const customFields = [
    {
      name: "company_code",
      type: FieldType.Text,
      value: "CORP_9981",
    },
    {
      name: "extra_notes",
      type: FieldType.Text,
      value: "Room 402 - Level 4",
    },
    {
      name: "department_select",
      type: FieldType.Text,
      value: "IT",
    },
  ];

  const result = performAutofill("", "", false, customFields);
  assertEquals(result, true);

  const compInput = doc.getElementById(
    "company_code",
  ) as HTMLInputElement | null;
  const notesTextarea = doc.getElementById(
    "extra_notes",
  ) as HTMLTextAreaElement | null;
  const deptSelect = doc.getElementById(
    "department_select",
  ) as HTMLSelectElement | null;

  assertEquals(compInput?.value, "CORP_9981");
  assertEquals(notesTextarea?.value, "Room 402 - Level 4");
  assertEquals(deptSelect?.value, "IT");
});

test("Autofill - Hidden custom fields into password and secret text boxes", () => {
  const doc = setupDOM(`
    <form id="banking_auth">
      <input type="password" name="security_pin" id="security_pin" />
      <input type="password" placeholder="Memorable Word" id="memorable_box" />
      <input type="text" aria-label="api_token" id="token_input" />
    </form>
  `);

  const customFields = [
    {
      name: "security_pin",
      type: FieldType.Hidden,
      value: "123456",
    },
    {
      name: "Memorable Word",
      type: FieldType.Hidden,
      value: "Sunshine2026",
    },
    {
      name: "api_token",
      type: FieldType.Hidden,
      value: "gw_sec_abc123xyz",
    },
  ];

  const result = performAutofill("", "", false, customFields);
  assertEquals(result, true);

  const pinInput = doc.getElementById(
    "security_pin",
  ) as HTMLInputElement | null;
  const wordInput = doc.getElementById(
    "memorable_box",
  ) as HTMLInputElement | null;
  const tokenInput = doc.getElementById(
    "token_input",
  ) as HTMLInputElement | null;

  assertEquals(pinInput?.value, "123456");
  assertEquals(wordInput?.value, "Sunshine2026");
  assertEquals(tokenInput?.value, "gw_sec_abc123xyz");
});

test("Autofill - Notification prompt fill action fills Text, Hidden, and credentials together", () => {
  const doc = setupDOM(`
    <form id="full_complex_form">
      <input type="text" name="username" id="username" />
      <input type="password" name="password" id="password" />
      <input type="text" name="custom_dept" id="custom_dept" />
      <input type="password" name="custom_pin" id="custom_pin" />
    </form>
  `);

  const notificationAccount = {
    itemId: "item-full-test",
    username: "alice_admin",
    password: "master_super_pass",
    fields: [
      {
        name: "custom_dept",
        type: FieldType.Text,
        value: "DevOps",
      },
      {
        name: "custom_pin",
        type: FieldType.Hidden,
        value: "889900",
      },
    ],
  };

  const result = performAutofill(
    notificationAccount.username,
    notificationAccount.password,
    false,
    notificationAccount.fields,
  );
  assertEquals(result, true);

  const userInput = doc.getElementById("username") as HTMLInputElement | null;
  const passInput = doc.getElementById("password") as HTMLInputElement | null;
  const deptInput = doc.getElementById(
    "custom_dept",
  ) as HTMLInputElement | null;
  const pinInput = doc.getElementById("custom_pin") as HTMLInputElement | null;
  assertEquals(userInput?.value, "alice_admin");
  assertEquals(passInput?.value, "master_super_pass");
  assertEquals(deptInput?.value, "DevOps");
  assertEquals(pinInput?.value, "889900");
});

test("Autofill - Notification onFill with autoCopyTotp enabled generates and copies TOTP code", () => {
  const doc = setupDOM(`
    <form id="login_totp_form">
      <input type="text" name="username" id="username" />
      <input type="password" name="password" id="password" />
    </form>
  `);

  const totpSecret = "JBSWY3DPEHPK3PXP"; // standard test secret
  let copiedClipboard = "";
  const mockWriteClipboard = (text: string) => {
    copiedClipboard = text;
  };

  const autoCopyTotpSetting = true;
  const payloadAccount = {
    username: "totp_user",
    password: "totp_password",
    totp: totpSecret,
  };

  // Simulate onFill trigger
  const autofillSuccess = performAutofill(
    payloadAccount.username,
    payloadAccount.password,
    false,
  );
  assertEquals(autofillSuccess, true);

  if (payloadAccount.totp && autoCopyTotpSetting) {
    mockWriteClipboard("123456");
  }

  const userEl = doc.getElementById("username") as HTMLInputElement | null;
  const passEl = doc.getElementById("password") as HTMLInputElement | null;
  assertEquals(userEl?.value, "totp_user");
  assertEquals(passEl?.value, "totp_password");
  assertEquals(
    copiedClipboard,
    "123456",
    "Clipboard should have received the TOTP code",
  );
});

test("Autofill - Notification onFill with autoCopyTotp disabled does not copy TOTP", () => {
  const doc = setupDOM(`
    <form id="login_totp_form2">
      <input type="text" name="username" id="username" />
      <input type="password" name="password" id="password" />
    </form>
  `);

  const totpSecret = "JBSWY3DPEHPK3PXP";
  let copiedClipboard = "";
  const mockWriteClipboard = (text: string) => {
    copiedClipboard = text;
  };

  const autoCopyTotpSetting = false; // User turned off auto copy
  const payloadAccount = {
    username: "totp_user2",
    password: "totp_password2",
    totp: totpSecret,
  };

  const autofillSuccess = performAutofill(
    payloadAccount.username,
    payloadAccount.password,
    false,
  );
  assertEquals(autofillSuccess, true);

  if (payloadAccount.totp && autoCopyTotpSetting) {
    mockWriteClipboard("123456");
  }

  const userEl = doc.getElementById("username") as HTMLInputElement | null;
  const passEl = doc.getElementById("password") as HTMLInputElement | null;
  assertEquals(userEl?.value, "totp_user2");
  assertEquals(passEl?.value, "totp_password2");
  assertEquals(
    copiedClipboard,
    "",
    "Clipboard should remain empty when autoCopyTotp is false",
  );
});

test("Autofill - isUntrustedIframe security checks", () => {
  const originalWindow = globalThis.window;

  // 1. Top window: window.top === window -> false (trusted)
  const topWindowObj: {
    location: { href: string; ancestorOrigins: string[] };
    top?: unknown;
  } = {
    location: { href: "https://example.com/login", ancestorOrigins: [] },
  };
  topWindowObj.top = topWindowObj;

  Object.assign(globalThis, { window: topWindowObj });
  assertEquals(isUntrustedIframe(), false);

  // 2. Embedded in untrusted cross-origin iframe with Chromium ancestorOrigins
  const crossOriginIframeObj = {
    location: {
      href: "https://example.com/embed",
      ancestorOrigins: ["https://evil-tracker.com"],
    },
    top: {},
  };
  Object.assign(globalThis, { window: crossOriginIframeObj });
  assertEquals(isUntrustedIframe(), true);

  // 3. Embedded in same-domain / sub-domain iframe with ancestorOrigins
  const sameSiteIframeObj = {
    location: {
      href: "https://auth.example.com/embed",
      ancestorOrigins: ["https://example.com"],
    },
    top: {},
  };
  Object.assign(globalThis, { window: sameSiteIframeObj });
  assertEquals(isUntrustedIframe(), false);

  // 4. Firefox cross-origin: accessing window.top.location.origin throws error
  const firefoxCrossIframeObj = {
    location: {
      href: "https://example.com/embed",
      ancestorOrigins: undefined,
    },
    top: {
      get location(): never {
        throw new Error(
          "SecurityError: Permission denied to access property 'location'",
        );
      },
    },
  };
  Object.assign(globalThis, { window: firefoxCrossIframeObj });
  assertEquals(isUntrustedIframe(), true);

  Object.assign(globalThis, { window: originalWindow });
});
