import { assertEquals, test } from "./assert.ts";
import { Window } from "happy-dom";
import { performAutofill } from "../apps/extension/src/extension/autofill-core.ts";

function setupDOM(html: string) {
  const window = new Window({ url: "https://example.com/login" });
  window.document.body.innerHTML = html;

  // Define necessary globals for the test to act like a browser
  Object.assign(globalThis, {
    document: window.document,
    window: window,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
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
    userInput && "value" in userInput && typeof userInput.value === "string"
  ) {
    assertEquals(userInput.value, "myuser");
  }
  if (
    passInput && "value" in passInput && typeof passInput.value === "string"
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
    userInput && "value" in userInput && typeof userInput.value === "string"
  ) {
    assertEquals(userInput.value, "john_doe");
  }
  if (
    passInput && "value" in passInput && typeof passInput.value === "string"
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
    userInput && "value" in userInput && typeof userInput.value === "string"
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
