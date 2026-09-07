import { t } from "./i18n.ts";
import { assertNever } from "./types.ts";
import {
  asFolderId,
  asVaultItemId,
  type BaseVaultItem,
  type CardDetails,
  type CardVaultItem,
  CustomFieldTypeSchema,
  type FolderId,
  type IdentityDetails,
  type IdentityVaultItem,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type SshKeyDetails,
  type SshKeyVaultItem,
  type VaultField,
  type VaultItem,
  type VaultItemId,
  VaultItemSchema,
} from "./vault-schemas.ts";
import { CustomFieldType, VaultItemType } from "./vault-types.ts";

export function mapCustomFields(
  fields?: Array<{
    name?: string | null;
    value?: string | null;
    type?: number | null;
    linkedId?: number | null;
  }> | null,
): VaultField[] {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.map((f) => {
    const parsed = CustomFieldTypeSchema.safeParse(f.type);
    const rawLinkedId = f.linkedId;
    const linkedId =
      typeof rawLinkedId === "number" && !Number.isNaN(rawLinkedId)
        ? rawLinkedId
        : undefined;
    return {
      name: (f.name ?? "").trim(),
      value: (f.value ?? "").trim(),
      type: parsed.success ? parsed.data : CustomFieldType.Text,
      linkedId,
    };
  });
}

export interface CreateBaseVaultItemInput {
  id?: VaultItemId | string;
  folderId?: FolderId | string | null;
  name?: string | null;
  notes?: string | null;
  favorite?: boolean | null;
  reprompt?: number | null;
  fields?: Array<{
    name?: string | null;
    value?: string | null;
    type?: number | null;
    linkedId?: number | null;
  }> | null;
  creationDate?: string | null;
  revisionDate?: string | null;
  fallbackName?: string;
}

export function createBaseVaultItem(
  input: CreateBaseVaultItemInput,
): BaseVaultItem {
  const now = new Date().toISOString();
  const rawId = input.id !== undefined ? input.id : crypto.randomUUID();
  const rawFolderId = input.folderId !== undefined ? input.folderId : null;
  return {
    id: asVaultItemId(rawId),
    folderId: rawFolderId != null ? asFolderId(rawFolderId) : rawFolderId,
    name: (input.name ?? "").trim() || (input.fallbackName ?? ""),
    notes: (input.notes ?? "").trim(),
    favorite: !!input.favorite,
    reprompt: input.reprompt ?? 0,
    fields: mapCustomFields(input.fields),
    creationDate: input.creationDate || now,
    revisionDate: input.revisionDate || now,
  };
}

function isVaultItemType(val: number): val is VaultItemType {
  return (
    val === VaultItemType.Login ||
    val === VaultItemType.Card ||
    val === VaultItemType.Identity ||
    val === VaultItemType.SecureNote ||
    val === VaultItemType.SshKey
  );
}

export function getVaultItemFallbackName(
  type?: VaultItemType | number | string | null,
): string {
  const numType = Number(type);
  if (!isVaultItemType(numType)) {
    return t("fallback_name_default");
  }

  const itemType: VaultItemType = numType;
  switch (itemType) {
    case VaultItemType.Login:
      return t("fallback_name_login");
    case VaultItemType.SecureNote:
      return t("fallback_name_note");
    case VaultItemType.Card:
      return t("fallback_name_card");
    case VaultItemType.Identity:
      return t("fallback_name_identity");
    case VaultItemType.SshKey:
      return t("fallback_name_ssh_key");
    default:
      return assertNever(itemType);
  }
}

export interface VaultItemCreationMap {
  [VaultItemType.Login]: Partial<NonNullable<LoginVaultItem["login"]>>;
  [VaultItemType.Card]: Partial<CardDetails>;
  [VaultItemType.Identity]: Partial<IdentityDetails>;
  [VaultItemType.SecureNote]: Record<string, never> | undefined;
  [VaultItemType.SshKey]: Partial<SshKeyDetails>;
}

function isVaultPayload<T extends object>(val: unknown): val is T {
  return typeof val === "object" && val !== null;
}

export function createVaultItem(
  type: VaultItemType.Login,
  baseInput: CreateBaseVaultItemInput,
  payload?: VaultItemCreationMap[VaultItemType.Login],
): LoginVaultItem;
export function createVaultItem(
  type: VaultItemType.Card,
  baseInput: CreateBaseVaultItemInput,
  payload?: VaultItemCreationMap[VaultItemType.Card],
): CardVaultItem;
export function createVaultItem(
  type: VaultItemType.Identity,
  baseInput: CreateBaseVaultItemInput,
  payload?: VaultItemCreationMap[VaultItemType.Identity],
): IdentityVaultItem;
export function createVaultItem(
  type: VaultItemType.SecureNote,
  baseInput: CreateBaseVaultItemInput,
  payload?: VaultItemCreationMap[VaultItemType.SecureNote],
): SecureNoteVaultItem;
export function createVaultItem(
  type: VaultItemType.SshKey,
  baseInput: CreateBaseVaultItemInput,
  payload?: VaultItemCreationMap[VaultItemType.SshKey],
): SshKeyVaultItem;
export function createVaultItem<K extends VaultItemType>(
  type: K,
  baseInput: CreateBaseVaultItemInput,
  payload?: VaultItemCreationMap[K],
): Extract<VaultItem, { type: K }>;
export function createVaultItem(
  type: VaultItemType,
  baseInput: CreateBaseVaultItemInput,
  payload?: unknown,
): VaultItem;
export function createVaultItem(
  type: VaultItemType,
  baseInput: CreateBaseVaultItemInput,
  payload?: unknown,
): VaultItem {
  const base = createBaseVaultItem(baseInput);
  const targetType = isVaultItemType(type) ? type : VaultItemType.Login;
  const payloadKey = VAULT_ITEM_TYPE_KEY_MAP[targetType];
  const payloadData = isVaultPayload(payload) ? payload : {};

  const rawObj: Record<string, unknown> = {
    ...base,
    type: targetType,
    ...(payloadKey ? { [payloadKey]: payloadData } : {}),
  };

  const parsed = VaultItemSchema.safeParse(rawObj);
  if (parsed.success) {
    return parsed.data;
  }

  const fallbackObj: Record<string, unknown> = {
    ...base,
    type: targetType,
    ...(payloadKey ? { [payloadKey]: {} } : {}),
  };
  const fallbackParsed = VaultItemSchema.safeParse(fallbackObj);
  if (fallbackParsed.success) {
    return fallbackParsed.data;
  }

  return {
    ...base,
    type: VaultItemType.Login,
    login: {
      username: "",
      password: "",
      totp: "",
      uris: [],
      fido2Credentials: [],
    },
  };
}

function getSubPayload(item: unknown, key: string): unknown {
  if (item && typeof item === "object") {
    return Reflect.get(item, key);
  }
  return undefined;
}

const VAULT_ITEM_TYPE_KEY_MAP: Record<VaultItemType, string> = {
  [VaultItemType.Login]: "login",
  [VaultItemType.Card]: "card",
  [VaultItemType.Identity]: "identity",
  [VaultItemType.SecureNote]: "secureNote",
  [VaultItemType.SshKey]: "sshKey",
};

export function mergeVaultItem(
  existing: VaultItem,
  patch: Partial<VaultItem>,
): VaultItem {
  const now = new Date().toISOString();
  const targetType =
    patch.type !== undefined ? Number(patch.type) : Number(existing.type);

  const baseItem: Record<string, unknown> = {
    id: existing.id,
    folderId: patch.folderId !== undefined ? patch.folderId : existing.folderId,
    type: targetType,
    name: patch.name !== undefined ? patch.name : existing.name,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
    favorite: patch.favorite !== undefined ? patch.favorite : existing.favorite,
    reprompt:
      patch.reprompt !== undefined
        ? patch.reprompt
        : existing.reprompt !== undefined
          ? existing.reprompt
          : 0,
    fields: patch.fields !== undefined ? patch.fields : existing.fields,
    creationDate: existing.creationDate,
    revisionDate: now,
  };

  if (isVaultItemType(targetType)) {
    const payloadKey = VAULT_ITEM_TYPE_KEY_MAP[targetType];
    const patchPayload = getSubPayload(patch, payloadKey);
    const existingPayload = getSubPayload(existing, payloadKey);

    if (
      existingPayload &&
      typeof existingPayload === "object" &&
      patchPayload &&
      typeof patchPayload === "object"
    ) {
      baseItem[payloadKey] = {
        ...existingPayload,
        ...patchPayload,
      };
    } else {
      baseItem[payloadKey] = patchPayload ?? existingPayload ?? {};
    }
  }

  const parsed = VaultItemSchema.safeParse(baseItem);
  if (parsed.success) {
    return parsed.data;
  }
  return existing;
}

export function createDefaultVaultItem(patch: Partial<VaultItem>): VaultItem {
  const numType = Number(patch.type);
  const targetType: VaultItemType = isVaultItemType(numType)
    ? numType
    : VaultItemType.Login;

  const baseInput: CreateBaseVaultItemInput = {
    id: patch.id,
    folderId: patch.folderId,
    name: patch.name || getVaultItemFallbackName(targetType),
    notes: patch.notes,
    favorite: patch.favorite,
    reprompt: patch.reprompt,
    fields: patch.fields,
    creationDate: patch.creationDate,
    revisionDate: patch.revisionDate,
  };

  const payloadKey = VAULT_ITEM_TYPE_KEY_MAP[targetType];
  const payload = payloadKey ? getSubPayload(patch, payloadKey) : undefined;

  return createVaultItem(targetType, baseInput, payload);
}
