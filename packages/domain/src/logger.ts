function createTagLogger(tag: string) {
  return {
    debug: (...args: unknown[]) => console.debug(`[${tag}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${tag}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${tag}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${tag}]`, ...args),
  };
}

export const logger = {
  crypto: createTagLogger("Crypto"),
  storage: createTagLogger("Storage"),
  network: createTagLogger("Network"),
  messaging: createTagLogger("Messaging"),
  auth: createTagLogger("Auth"),
  vault: createTagLogger("Vault"),
  fido2: createTagLogger("Fido2"),
  app: createTagLogger("App"),
};
