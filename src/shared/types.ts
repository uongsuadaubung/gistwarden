export enum View {
  Login = "Login",
  Vault = "Vault",
  ItemDetail = "ItemDetail",
  ItemEdit = "ItemEdit",
  Generator = "Generator",
  Settings = "Settings",
  Fido2Prompt = "Fido2Prompt",
}

export interface LoginUri {
  uri: string;
}

export interface Fido2Credential {
  credentialId: string;
  keyType: string;
  keyAlgorithm: string;
  keyCurve: string;
  keyValue: string; // Private key (encrypted in Gist, raw decrypted in-memory)
  rpId: string;
  userHandle?: string | null;
  userName?: string | null;
  counter: number;
  rpName?: string | null;
  userDisplayName?: string | null;
  discoverable?: boolean;
  creationDate?: string;
}

export interface VaultField {
  type: number; // 0: Text, 1: Hidden, 2: Boolean, 3: Linked
  name: string;
  value: string;
}

export enum VaultItemType {
  Login = 1,
  SecureNote = 2,
}

export interface BaseVaultItem {
  id: string; // UUID
  name: string;
  notes?: string;
  favorite?: boolean;
  fields?: VaultField[];
  creationDate?: string;
  revisionDate?: string;
}

export interface LoginVaultItem extends BaseVaultItem {
  type: VaultItemType.Login;
  login?: {
    username?: string;
    password?: string;
    totp?: string; // Secret key for TOTP
    uris?: LoginUri[];
    fido2Credentials?: Fido2Credential[];
  };
}

export interface SecureNoteVaultItem extends BaseVaultItem {
  type: VaultItemType.SecureNote;
}

export type VaultItem = LoginVaultItem | SecureNoteVaultItem;
