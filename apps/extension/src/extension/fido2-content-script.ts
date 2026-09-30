import { isRecord } from "@gistwarden/domain";
import {
  fido2CredentialCreationRoute,
  fido2CredentialGetRoute,
} from "@gistwarden/orchestrator";
import { z } from "zod";
import { APP_NAME } from "@/core/constants.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";

const Fido2ResponseSchema = z.object({
  success: z.boolean().catch(false),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

const InboundPageMessageSchema = z.object({
  source: z.literal(`${APP_NAME.toLowerCase()}-page-script`),
  token: z.string().min(1),
  requestId: z.string().min(1),
  type: z.enum([
    fido2CredentialCreationRoute.type,
    fido2CredentialGetRoute.type,
  ]),
  data: z.unknown().optional(),
});

function sanitizeIpcPayload(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(sanitizeIpcPayload);
  }
  if (!isRecord(val)) {
    return val;
  }
  const clean: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(val)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    clean[key] = sanitizeIpcPayload(v);
  }
  return clean;
}

// Generate a single-use token to verify communication from page-script
const fido2Token = crypto.randomUUID();

if (document.documentElement) {
  document.documentElement.setAttribute(
    "data-gistwarden-fido2-token",
    fido2Token,
  );
}

// Forward messages between main-world (page-script) and extension-world (background)
window.addEventListener("message", async (event) => {
  if (event.source !== window || !event.data) {
    return;
  }

  const parseResult = InboundPageMessageSchema.safeParse(event.data);
  if (!parseResult.success || parseResult.data.token !== fido2Token) {
    return;
  }

  const { requestId, type, data } = parseResult.data;
  const sanitizedData = sanitizeIpcPayload(data);

  // Send request to background script with sanitized payload
  const sendResult =
    type === fido2CredentialCreationRoute.type
      ? await sendBackgroundMessage(fido2CredentialCreationRoute, {
          data: sanitizedData,
        })
      : await sendBackgroundMessage(fido2CredentialGetRoute, {
          data: sanitizedData,
        });

  if (sendResult.isOk()) {
    const response = sendResult.value;

    const targetOrigin =
      window.location.origin !== "null" ? window.location.origin : "*";

    // Forward the response back to page script
    const parsed = Fido2ResponseSchema.safeParse(response);
    const resData = parsed.success
      ? parsed.data
      : { success: false, result: undefined, error: undefined };

    window.postMessage(
      {
        source: `${APP_NAME.toLowerCase()}-content-script`,
        token: fido2Token,
        requestId,
        success: resData.success,
        result: resData.result,
        error: resData.error,
      },
      targetOrigin,
    );
  } else {
    const targetOrigin =
      window.location.origin !== "null" ? window.location.origin : "*";

    window.postMessage(
      {
        source: `${APP_NAME.toLowerCase()}-content-script`,
        token: fido2Token,
        requestId,
        success: false,
        error: sendResult.error,
      },
      targetOrigin,
    );
  }
});
