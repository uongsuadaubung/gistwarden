import { createConsola } from "consola";

const baseLogger = createConsola({
  level: 3,
});

export const logger = {
  crypto: baseLogger.withTag("Crypto"),
  storage: baseLogger.withTag("Storage"),
  network: baseLogger.withTag("Network"),
  messaging: baseLogger.withTag("Messaging"),
  auth: baseLogger.withTag("Auth"),
  vault: baseLogger.withTag("Vault"),
  fido2: baseLogger.withTag("Fido2"),
  app: baseLogger.withTag("App"),
};
