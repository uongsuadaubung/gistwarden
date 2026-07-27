import { APP_NAME } from "@/core/constants.ts";
import {
  fido2CredentialCreationRoute,
  fido2CredentialGetRoute,
} from "@/features/passkey/fido2-schemas.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import { z } from "zod";

const Fido2ResponseSchema = z.object({
  success: z.boolean().catch(false),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

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
  // Only handle messages coming from our own page script with correct token
  if (
    event.source !== window || !event.data ||
    event.data.source !== `${APP_NAME.toLowerCase()}-page-script` ||
    event.data.token !== fido2Token
  ) {
    return;
  }

  const { requestId, type, data } = event.data;
  if (
    type !== fido2CredentialCreationRoute.type &&
    type !== fido2CredentialGetRoute.type
  ) {
    return;
  }

  // Send request to background script
  const sendResult = type === fido2CredentialCreationRoute.type
    ? await sendBackgroundMessage(fido2CredentialCreationRoute, { data })
    : await sendBackgroundMessage(fido2CredentialGetRoute, { data });

  if (sendResult.isOk()) {
    const response = sendResult.value;

    const targetOrigin = window.location.origin !== "null"
      ? window.location.origin
      : "*";

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
    const targetOrigin = window.location.origin !== "null"
      ? window.location.origin
      : "*";

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
