import type {
  CardVaultItem,
  IdentityVaultItem,
  LoginVaultItem,
  SecureNoteVaultItem,
  SshKeyVaultItem,
  VaultItem,
} from "@/features/vault/vault-schemas.ts";

export enum VaultItemType {
  Login = 1,
  SecureNote = 2,
  Card = 3,
  Identity = 4,
  SshKey = 5,
}

export enum CustomFieldType {
  Text = 0,
  Hidden = 1,
  Boolean = 2,
  Linked = 3,
  Divider = 10,
}

export const isLoginItem = (item: VaultItem): item is LoginVaultItem => {
  return Number(item.type) === VaultItemType.Login;
};

export const isSecureNoteItem = (
  item: VaultItem,
): item is SecureNoteVaultItem => {
  return Number(item.type) === VaultItemType.SecureNote;
};

export const isCardItem = (item: VaultItem): item is CardVaultItem => {
  return Number(item.type) === VaultItemType.Card;
};

export const isIdentityItem = (item: VaultItem): item is IdentityVaultItem => {
  return Number(item.type) === VaultItemType.Identity;
};

export const isSshKeyItem = (item: VaultItem): item is SshKeyVaultItem => {
  return Number(item.type) === VaultItemType.SshKey;
};
