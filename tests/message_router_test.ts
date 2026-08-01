import { assertEquals, test } from "./assert.ts";
import { z } from "zod";
import { MessageRouter } from "../apps/extension/src/extension/message-router.ts";
import { defineRoute } from "@gistwarden/orchestrator";

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

  router.register(
    "TEST_MSG",
    TestMsgSchema,
    (payload: z.infer<typeof TestMsgSchema>) => {
      return { success: true, echoedDomain: payload.domain };
    },
  );

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

  router.register("INTERNAL_MSG", {
    schema: InternalMsgSchema,
    internalOnly: true,
    handler: () => {
      return { success: true };
    },
  });

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
