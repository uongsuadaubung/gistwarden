import { isRecord } from "@gistwarden/domain";
import { defineRoute } from "@gistwarden/orchestrator";
import { z } from "zod";
import { registerAutofillRoutes } from "../apps/extension/src/extension/handlers/autofill-handlers.ts";
import {
  createCommand,
  MessageRouter,
} from "../apps/extension/src/extension/message-router.ts";
import { assertEquals, test } from "./assert.ts";

// Setup global mock for chrome.runtime in test environment
Object.defineProperty(globalThis, "chrome", {
  value: {
    runtime: {
      getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
    },
  },
  writable: true,
  configurable: true,
});

test("MessageRouter - route registration and payload validation", async () => {
  const router = new MessageRouter();

  const TestMsgSchema = z.object({
    type: z.literal("TEST_MSG"),
    domain: z.string().min(1),
  });

  const testRoute = defineRoute({
    type: "TEST_MSG",
    payloadSchema: TestMsgSchema,
    responseSchema: z.object({
      success: z.boolean(),
      echoedDomain: z.string(),
    }),
  });

  router.register(testRoute, (payload: z.infer<typeof TestMsgSchema>) => {
    return { success: true, echoedDomain: payload.domain };
  });

  assertEquals(router.hasRoute("TEST_MSG"), true);
  assertEquals(router.hasRoute("UNKNOWN_MSG"), false);

  // 1. Valid payload
  const mockSender: chrome.runtime.MessageSender = {
    url: "chrome-extension://test-extension-id/popup.html",
  };
  const res1 = await router.handleMessage(
    { type: "TEST_MSG", domain: "example.com" },
    mockSender,
  );
  assertEquals(res1.handled, true);
  assertEquals(res1.response, { success: true, echoedDomain: "example.com" });

  // 2. Invalid payload (missing domain)
  const res2 = await router.handleMessage({ type: "TEST_MSG" }, mockSender);
  assertEquals(res2.handled, true);
  assertEquals(res2.response, {
    success: false,
    error: "Invalid message payload",
  });

  // 3. Unregistered message type
  const res3 = await router.handleMessage({ type: "UNKNOWN" }, mockSender);
  assertEquals(res3.handled, false);
});

test("MessageRouter - defineRoute contract registration", async () => {
  const router = new MessageRouter();

  const testContractRoute = defineRoute({
    type: "CONTRACT_MSG",
    payloadSchema: z.object({
      type: z.literal("CONTRACT_MSG"),
      query: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      count: z.number(),
    }),
    internalOnly: true,
  });

  router.register(testContractRoute, (payload: { query: string }) => {
    return { success: true, count: payload.query.length };
  });

  assertEquals(router.hasRoute("CONTRACT_MSG"), true);

  const internalSender: chrome.runtime.MessageSender = {
    url: "chrome-extension://test-extension-id/popup.html",
  };
  const res = await router.handleMessage(
    { type: "CONTRACT_MSG", query: "hello" },
    internalSender,
  );
  assertEquals(res.handled, true);
  assertEquals(res.response, { success: true, count: 5 });
});

test("MessageRouter - internalOnly authorization check", async () => {
  const router = new MessageRouter();

  const InternalMsgSchema = z.object({
    type: z.literal("INTERNAL_MSG"),
  });

  router.registerCommand(
    createCommand({
      type: "INTERNAL_MSG",
      schema: InternalMsgSchema,
      internalOnly: true,
      execute: () => {
        return { success: true };
      },
    }),
  );

  // External sender (content script on webpage)
  const externalSender: chrome.runtime.MessageSender = {
    url: "https://google.com/login",
  };
  const res = await router.handleMessage(
    { type: "INTERNAL_MSG" },
    externalSender,
  );
  assertEquals(res.handled, true);
  assertEquals(res.response, {
    success: false,
    error: "Unauthorized sender context",
  });

  // Authorized internal sender (extension page)
  const internalSender: chrome.runtime.MessageSender = {
    url: "chrome-extension://test-extension-id/popup.html",
  };
  const resAuth = await router.handleMessage(
    { type: "INTERNAL_MSG" },
    internalSender,
  );
  assertEquals(resAuth.handled, true);
  assertEquals(resAuth.response, { success: true });
});

test("MessageRouter - Autofill domain spoofing protection", async () => {
  const router = new MessageRouter();
  router.use(registerAutofillRoutes);

  // 1. External sender attempting to spoof domain (sender is evil.com, requesting google.com)
  const attackerSender: chrome.runtime.MessageSender = {
    url: "https://evil.com/phishing",
  };
  const spoofRes = await router.handleMessage(
    { type: "CHECK_AUTOFILL_SUGGESTION", domain: "google.com" },
    attackerSender,
  );
  assertEquals(spoofRes.handled, true);
  assertEquals(spoofRes.response, {
    success: false,
    reason: "invalid_domain",
  });

  // 2. External sender with empty or missing domain
  const emptyRes = await router.handleMessage(
    { type: "CHECK_AUTOFILL_SUGGESTION" },
    attackerSender,
  );
  assertEquals(emptyRes.handled, true);
  assertEquals(emptyRes.response, {
    success: false,
    reason: "invalid_domain",
  });

  // 3. External sender with legitimate matching domain
  const legitSender: chrome.runtime.MessageSender = {
    url: "https://login.example.com/auth",
  };
  const legitRes = await router.handleMessage(
    { type: "CHECK_AUTOFILL_SUGGESTION", domain: "example.com" },
    legitSender,
  );
  assertEquals(legitRes.handled, true);
  if (isRecord(legitRes.response)) {
    assertEquals(legitRes.response.reason !== "invalid_domain", true);
  }
});
