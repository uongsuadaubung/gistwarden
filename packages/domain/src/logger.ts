function createTagLogger(tag: string) {
  const prefix = `[Gistwarden] [${tag}]`;
  return {
    log: (...args: unknown[]) => console.log(prefix, ...args),
    info: (...args: unknown[]) => console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
    debug: (...args: unknown[]) => console.debug(prefix, ...args),
    trace: (...args: unknown[]) => console.trace(prefix, ...args),
    withTag: (subTag: string) => createTagLogger(`${tag}:${subTag}`),
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
