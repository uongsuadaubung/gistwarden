import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { JSDOM } from "jsdom";
import { performAutofill } from "@/extension/autofill-core.ts";

function setupDOM(html: string) {
  const dom = new JSDOM(html);
  
  // Define necessary globals for the test to act like a browser
  Object.assign(globalThis, {
    document: dom.window.document,
    window: dom.window,
    HTMLInputElement: dom.window.HTMLInputElement,
    Event: dom.window.Event,
    Node: dom.window.Node,
  });
  
  return dom;
}

Deno.test("Autofill - standard login form", () => {
  setupDOM(`
    <form id="login-form">
      <input type="text" id="username" name="username" />
      <input type="password" id="password" name="password" />
    </form>
  `);

  const success = performAutofill("testuser", "testpass");
  assertEquals(success, true);
  const userField = document.getElementById("username");
  const passField = document.getElementById("password");
  
  if (userField instanceof HTMLInputElement && passField instanceof HTMLInputElement) {
    assertEquals(userField.value, "testuser");
    assertEquals(passField.value, "testpass");
  } else {
    throw new Error("Fields are not HTMLInputElement");
  }
});

Deno.test("Autofill - form without form tags (just inputs)", () => {
  setupDOM(`
    <div>
      <input type="text" id="user" />
      <br/>
      <input type="password" id="pass" />
    </div>
  `);

  const success = performAutofill("myuser", "mypass");
  assertEquals(success, true);
  const userField = document.getElementById("user");
  const passField = document.getElementById("pass");
  
  if (userField instanceof HTMLInputElement && passField instanceof HTMLInputElement) {
    assertEquals(userField.value, "myuser");
    assertEquals(passField.value, "mypass");
  } else {
    throw new Error("Fields are not HTMLInputElement");
  }
});

Deno.test("Autofill - only username fallback", () => {
  // Sometimes login flows are split (username first, then next page password)
  setupDOM(`
    <div>
      <input type="text" id="loginId" name="login" />
    </div>
  `);

  const success = performAutofill("splituser", "");
  assertEquals(success, true);
  const loginField = document.getElementById("loginId");
  if (loginField instanceof HTMLInputElement) {
    assertEquals(loginField.value, "splituser");
  } else {
    throw new Error("Field is not HTMLInputElement");
  }
});

Deno.test("Autofill - no matching fields", () => {
  setupDOM(`
    <div>
      <input type="text" id="search" name="q" />
    </div>
  `);

  const success = performAutofill("testuser", "testpass");
  assertEquals(success, false); // No password field and no keyword match in text input
});
