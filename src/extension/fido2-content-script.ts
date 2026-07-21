import { APP_NAME } from "@/core/constants.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";
import { z } from "zod";
import { Result } from "neverthrow";

const Fido2ResponseSchema = z.object({
  success: z.boolean().catch(false),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

// Inject fido2-page-script.js into the main page context
const fido2Nonce = crypto.randomUUID();

const injectScript = () => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("fido2-page-script.js");
  script.dataset.nonce = fido2Nonce;
  script.onload = () => {
    script.remove();
  };
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(script);
  }
};

Result.fromThrowable(
  injectScript,
  (err) =>
    console.error(`[${APP_NAME}] Failed to inject FIDO2 page script:`, err),
)();

// Forward messages between main-world (page-script) and extension-world (background)
window.addEventListener("message", async (event) => {
  // Only handle messages coming from our own page script with correct nonce
  if (
    event.source !== window || !event.data ||
    event.data.source !== `${APP_NAME.toLowerCase()}-page-script` ||
    event.data.nonce !== fido2Nonce
  ) {
    return;
  }

  const { requestId, type, data } = event.data;

  // Send request to background script
  const sendResult = await sendMessageToBackground({ type, data });
  if (sendResult.isOk()) {
    const response = sendResult.value;

    // Forward the response back to page script
    const parsed = Fido2ResponseSchema.safeParse(response);
    const resData = parsed.success
      ? parsed.data
      : { success: false, result: undefined, error: undefined };

    window.postMessage(
      {
        source: `${APP_NAME.toLowerCase()}-content-script`,
        nonce: fido2Nonce,
        requestId,
        success: resData.success,
        result: resData.result,
        error: resData.error,
      },
      "*",
    );
  } else {
    window.postMessage(
      {
        source: `${APP_NAME.toLowerCase()}-content-script`,
        nonce: fido2Nonce,
        requestId,
        success: false,
        error: sendResult.error,
      },
      "*",
    );
  }
});
