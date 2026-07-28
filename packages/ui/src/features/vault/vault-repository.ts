import { SESSION_KEY_ENCRYPTED_VAULT } from "@/core/constants.ts";
import { decryptData } from "@gistwarden/domain";
import { getSessionKey } from "@gistwarden/orchestrator";
import { safeJsonParse } from "@/core/json-utils.ts";
import { getSessionItem } from "@/core/storage.ts";
import { EncryptedPayloadSchema } from "@gistwarden/repository";
import {
  type VaultItem,
  VaultListSchema,
  VaultPayloadSchema,
} from "@gistwarden/domain";

export interface DecryptedVaultData {
  items: VaultItem[];
  key: CryptoKey;
  salt: string;
}

export async function getDecryptedVaultItems(): Promise<
  DecryptedVaultData | null
> {
  const key = await getSessionKey();
  if (!key) return null;

  const rawVaultRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const rawVault = rawVaultRes.isOk() ? rawVaultRes.value : null;
  if (typeof rawVault !== "string" || !rawVault) {
    return { items: [], key, salt: "" };
  }

  const parsePayloadRes = safeJsonParse(rawVault);
  if (parsePayloadRes.isErr()) return { items: [], key, salt: "" };

  const payloadParse = EncryptedPayloadSchema.safeParse(parsePayloadRes.value);
  if (
    !payloadParse.success || !payloadParse.data.ciphertext ||
    !payloadParse.data.iv
  ) {
    return { items: [], key, salt: "" };
  }

  const { ciphertext, iv, salt } = payloadParse.data;
  const decryptRes = await decryptData(ciphertext, iv, key);
  if (decryptRes.isErr()) return { items: [], key, salt: salt || "" };

  const parseItemsRes = safeJsonParse(decryptRes.value);
  if (parseItemsRes.isErr()) return { items: [], key, salt: salt || "" };

  let items: VaultItem[] = [];
  const rawVal = parseItemsRes.value;
  if (Array.isArray(rawVal)) {
    const validateRes = VaultListSchema.safeParse(rawVal);
    if (!validateRes.success) return { items: [], key, salt: salt || "" };
    items = validateRes.data;
  } else {
    const validateRes = VaultPayloadSchema.safeParse(rawVal);
    if (!validateRes.success) return { items: [], key, salt: salt || "" };
    items = validateRes.data.items;
  }

  return { items, key, salt: salt || "" };
}
