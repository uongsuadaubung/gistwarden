import {
  APP_NAME,
  MSG_FIDO2_CREDENTIAL_CREATION_REQUEST,
  MSG_FIDO2_CREDENTIAL_GET_REQUEST,
} from "@/core/constants.ts";

(function () {
  // Prevent duplicate injection
  if (`__${APP_NAME.toLowerCase()}_fido2_injected` in window) return;
  Object.defineProperty(window, `__${APP_NAME.toLowerCase()}_fido2_injected`, {
    value: true,
    writable: true,
  });

  // Polyfill platform authenticator support so relying parties know they can request platform authenticators
  if (window.PublicKeyCredential) {
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      () => Promise.resolve(true);
  }

  // Read nonce from script element's dataset safely
  const currentScript = document.currentScript;
  let nonce = "";
  if (currentScript instanceof HTMLScriptElement) {
    nonce = currentScript.dataset.nonce || "";
  }

  interface Fido2Response {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      attestationObject?: string;
      authenticatorData?: string;
      signature?: string;
      userHandle?: string | null;
      authData?: string;
      publicKey?: string;
      publicKeyAlgorithm?: number;
    };
  }

  const originalCredentials = {
    create: navigator.credentials.create.bind(navigator.credentials),
    get: navigator.credentials.get.bind(navigator.credentials),
  };

  // Base64URL to ArrayBuffer helper
  function base64UrlToBuffer(str: string): ArrayBuffer {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (base64.length % 4) {
      case 0:
        break;
      case 2:
        base64 += "==";
        break;
      case 3:
        base64 += "=";
        break;
      default:
        console.error("Illegal base64url string!");
        return new ArrayBuffer(0);
    }
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  // Buffer to Base64URL helper
  function bufferToBase64Url(buffer: BufferSource): string {
    const bytes = ArrayBuffer.isView(buffer)
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Request manager to map messages
  const pendingRequests = new Map<
    string,
    { resolve: (val: Fido2Response) => void; reject: (err: Error) => void }
  >();

  // Listen to postMessage from content script
  window.addEventListener("message", (event) => {
    if (
      event.source !== window || !event.data ||
      event.data.source !== `${APP_NAME.toLowerCase()}-content-script` ||
      event.data.nonce !== nonce
    ) {
      return;
    }

    const { requestId, success, result, error } = event.data;
    const pending = pendingRequests.get(requestId);
    if (!pending) return;

    pendingRequests.delete(requestId);

    if (success) {
      pending.resolve(result);
    } else {
      pending.reject(
        new DOMException(error || "Request failed", "NotAllowedError"),
      );
    }
  });

  // Send request to content script with nonce
  function sendToContentScript(
    type: string,
    data: unknown,
  ): Promise<Fido2Response> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2);
      pendingRequests.set(requestId, { resolve, reject });

      window.postMessage(
        {
          source: `${APP_NAME.toLowerCase()}-page-script`,
          nonce,
          requestId,
          type,
          data,
        },
        "*",
      );
    });
  }

  // Override create (Registration)
  navigator.credentials.create = async function (
    options?: CredentialCreationOptions,
  ): Promise<Credential | null> {
    if (!options || !options.publicKey) {
      return originalCredentials.create(options);
    }

    console.debug(`[${APP_NAME}] Intercepted credentials.create`);

    // Serialize options for background script
    const serializedOptions = {
      rp: options.publicKey.rp,
      user: {
        ...options.publicKey.user,
        id: bufferToBase64Url(options.publicKey.user.id),
      },
      challenge: bufferToBase64Url(options.publicKey.challenge),
      pubKeyCredParams: options.publicKey.pubKeyCredParams,
      excludeCredentials: options.publicKey.excludeCredentials?.map((cred) => ({
        type: cred.type,
        id: bufferToBase64Url(cred.id),
      })),
      authenticatorSelection: options.publicKey.authenticatorSelection,
      timeout: options.publicKey.timeout,
      attestation: options.publicKey.attestation,
    };

    try {
      const response = await sendToContentScript(
        MSG_FIDO2_CREDENTIAL_CREATION_REQUEST,
        serializedOptions,
      );

      // Reconstruct PublicKeyCredential response by creating plain object first to avoid getter collision
      const credential = {
        id: response.id,
        rawId: base64UrlToBuffer(response.rawId),
        type: "public-key" as const,
        authenticatorAttachment: "platform",
        response: {
          clientDataJSON: base64UrlToBuffer(response.response.clientDataJSON),
          attestationObject: base64UrlToBuffer(
            response.response.attestationObject || "",
          ),
          getAuthenticatorData: () =>
            base64UrlToBuffer(response.response.authData || ""),
          getPublicKey: () =>
            base64UrlToBuffer(response.response.publicKey || ""),
          getPublicKeyAlgorithm: () =>
            response.response.publicKeyAlgorithm || -7,
          getTransports: () => ["internal"],
        },
        getClientExtensionResults: () => ({}),
        toJSON: () => ({
          id: response.id,
          rawId: response.rawId,
          type: "public-key",
          response: {
            clientDataJSON: response.response.clientDataJSON,
            attestationObject: response.response.attestationObject,
            transports: ["internal"],
          },
          authenticatorAttachment: "platform",
          clientExtensionResults: {},
        }),
      };

      // Set prototype after properties are written to the instance
      Object.setPrototypeOf(
        credential.response,
        AuthenticatorAttestationResponse.prototype,
      );
      Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

      return credential;
    } catch (err) {
      if (err instanceof Error && err.message === "fallback") {
        return originalCredentials.create(options);
      }
      return Promise.reject(err);
    }
  };

  // Override get (Assertion)
  navigator.credentials.get = async function (
    options?: CredentialRequestOptions,
  ): Promise<Credential | null> {
    if (!options || !options.publicKey) {
      return originalCredentials.get(options);
    }

    if (options.mediation === "conditional") {
      // Fallback to browser native for conditional autofill
      // since Gistwarden currently only supports modal prompt UI
      return originalCredentials.get(options);
    }

    console.debug(`[${APP_NAME}] Intercepted credentials.get`);

    const serializedOptions = {
      challenge: bufferToBase64Url(options.publicKey.challenge),
      rpId: options.publicKey.rpId,
      allowCredentials: options.publicKey.allowCredentials?.map((cred) => ({
        type: cred.type,
        id: bufferToBase64Url(cred.id),
      })),
      userVerification: options.publicKey.userVerification,
      timeout: options.publicKey.timeout,
    };

    try {
      const response = await sendToContentScript(
        MSG_FIDO2_CREDENTIAL_GET_REQUEST,
        serializedOptions,
      );

      // Reconstruct PublicKeyCredential response by creating plain object first to avoid getter collision
      const credential = {
        id: response.id,
        rawId: base64UrlToBuffer(response.rawId),
        type: "public-key" as const,
        authenticatorAttachment: "platform",
        response: {
          clientDataJSON: base64UrlToBuffer(response.response.clientDataJSON),
          authenticatorData: base64UrlToBuffer(
            response.response.authenticatorData || "",
          ),
          signature: base64UrlToBuffer(response.response.signature || ""),
          userHandle: response.response.userHandle
            ? base64UrlToBuffer(response.response.userHandle)
            : null,
        },
        getClientExtensionResults: () => ({}),
        toJSON: () => ({
          id: response.id,
          rawId: response.rawId,
          type: "public-key",
          response: {
            clientDataJSON: response.response.clientDataJSON,
            authenticatorData: response.response.authenticatorData,
            signature: response.response.signature,
            userHandle: response.response.userHandle || null,
          },
          authenticatorAttachment: "platform",
          clientExtensionResults: {},
        }),
      };

      // Set prototype after properties are written to the instance
      Object.setPrototypeOf(
        credential.response,
        AuthenticatorAssertionResponse.prototype,
      );
      Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

      return credential;
    } catch (err) {
      if (err instanceof Error && err.message === "fallback") {
        return originalCredentials.get(options);
      }
      return Promise.reject(err);
    }
  };
})();
