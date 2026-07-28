import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { JSDOM } from "jsdom";
import { performAutofill } from "../apps/extension/src/extension/autofill-core.ts";

function setupDOM(html: string) {
  const dom = new JSDOM(html, { url: "https://example.com/login" });

  // Define necessary globals for the test to act like a browser
  Object.assign(globalThis, {
    document: dom.window.document,
    window: dom.window,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLFormElement: dom.window.HTMLFormElement,
    Event: dom.window.Event,
    Node: dom.window.Node,
  });

  return dom.window.document;
}

Deno.test("Autofill - standard login form", () => {
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

  if (userInput instanceof HTMLInputElement) {
    assertEquals(userInput.value, "myuser");
  }
  if (passInput instanceof HTMLInputElement) {
    assertEquals(passInput.value, "mypass");
  }
});

Deno.test("Autofill - form without form tags (just inputs)", () => {
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

  if (userInput instanceof HTMLInputElement) {
    assertEquals(userInput.value, "john_doe");
  }
  if (passInput instanceof HTMLInputElement) {
    assertEquals(passInput.value, "secret123");
  }
});

Deno.test("Autofill - only username fallback", () => {
  const doc = setupDOM(`
    <div>
      <input type="text" id="user_id" name="username" />
    </div>
  `);

  const result = performAutofill("only_user", "unused_pass");
  assertEquals(result, true);

  const userInput = doc.getElementById("user_id");
  if (userInput instanceof HTMLInputElement) {
    assertEquals(userInput.value, "only_user");
  }
});

Deno.test("Autofill - no matching fields", () => {
  const _doc = setupDOM(`
    <div>
      <input type="checkbox" id="check" />
      <button id="btn">Click</button>
    </div>
  `);

  const result = performAutofill("user", "pass");
  assertEquals(result, false);
});
