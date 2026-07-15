(function () {
  // Prevent duplicate injection
  if ("__gistwarden_fido2_injected" in window) return;
  Object.defineProperty(window, "__gistwarden_fido2_injected", {
    value: true,
    writable: true,
  });

  interface Fido2Response {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      attestationObject?: string;
      authenticatorData?: string;
      signature?: string;
      userHandle?: string | null;
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
      case 0: break;
      case 2: base64 += "=="; break;
      case 3: base64 += "="; break;
      default: throw new Error("Illegal base64url string!");
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
  function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
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
  const pendingRequests = new Map<string, { resolve: (val: Fido2Response) => void; reject: (err: Error) => void }>();

  // Listen to postMessage from content script
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.source !== "gistwarden-content-script") {
      return;
    }

    const { requestId, success, result, error } = event.data;
    const pending = pendingRequests.get(requestId);
    if (!pending) return;

    pendingRequests.delete(requestId);

    if (success) {
      pending.resolve(result);
    } else {
      pending.reject(new DOMException(error || "Request failed", "NotAllowedError"));
    }
  });

  function sendToContentScript(type: string, data: unknown): Promise<Fido2Response> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2);
      pendingRequests.set(requestId, { resolve, reject });

      window.postMessage(
        {
          source: "gistwarden-page-script",
          requestId,
          type,
          data,
        },
        "*"
      );
    });
  }

  // Override create (Registration)
  navigator.credentials.create = async function (options?: CredentialCreationOptions): Promise<Credential | null> {
    if (!options || !options.publicKey) {
      return originalCredentials.create(options);
    }

    console.debug("[Gistwarden] Intercepted credentials.create");

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
      const response = await sendToContentScript("FIDO2_CREDENTIAL_CREATION_REQUEST", serializedOptions);
      
      // Reconstruct PublicKeyCredential response by creating plain object first to avoid getter collision
      const credential = {
        id: response.id,
        rawId: base64UrlToBuffer(response.rawId),
        type: "public-key" as const,
        authenticatorAttachment: "platform",
        response: {
          clientDataJSON: base64UrlToBuffer(response.response.clientDataJSON),
          attestationObject: base64UrlToBuffer(response.response.attestationObject || ""),
          getTransports: () => ["internal"],
        },
        getClientExtensionResults: () => ({}),
      };

      // Set prototype after properties are written to the instance
      Object.setPrototypeOf(credential.response, AuthenticatorAttestationResponse.prototype);
      Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

      return credential;
    } catch (err) {
      if (err instanceof Error && err.message === "fallback") {
        return originalCredentials.create(options);
      }
      throw err;
    }
  };

  // Override get (Assertion)
  navigator.credentials.get = async function (options?: CredentialRequestOptions): Promise<Credential | null> {
    if (!options || !options.publicKey) {
      return originalCredentials.get(options);
    }

    console.debug("[Gistwarden] Intercepted credentials.get");

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
      const response = await sendToContentScript("FIDO2_CREDENTIAL_GET_REQUEST", serializedOptions);

      // Reconstruct PublicKeyCredential response by creating plain object first to avoid getter collision
      const credential = {
        id: response.id,
        rawId: base64UrlToBuffer(response.rawId),
        type: "public-key" as const,
        authenticatorAttachment: "platform",
        response: {
          clientDataJSON: base64UrlToBuffer(response.response.clientDataJSON),
          authenticatorData: base64UrlToBuffer(response.response.authenticatorData || ""),
          signature: base64UrlToBuffer(response.response.signature || ""),
          userHandle: response.response.userHandle ? base64UrlToBuffer(response.response.userHandle) : null,
        },
        getClientExtensionResults: () => ({}),
      };

      // Set prototype after properties are written to the instance
      Object.setPrototypeOf(credential.response, AuthenticatorAssertionResponse.prototype);
      Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

      return credential;
    } catch (err) {
      if (err instanceof Error && err.message === "fallback") {
        return originalCredentials.get(options);
      }
      throw err;
    }
  };
})();
