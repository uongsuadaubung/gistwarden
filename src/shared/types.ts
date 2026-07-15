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

export interface VaultItem {
  id: string; // UUID
  type: number; // 1 = Login, 2 = SecureNote, etc. We support Login mainly
  name: string;
  notes?: string;
  favorite?: boolean;
  fields?: VaultField[];
  login?: {
    username?: string;
    password?: string;
    totp?: string; // Secret key for TOTP
    uris?: LoginUri[];
    fido2Credentials?: Fido2Credential[];
  };
  creationDate?: string;
  revisionDate?: string;
}
