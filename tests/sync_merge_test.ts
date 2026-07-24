import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mergeVaultItems } from "@/features/sync/sync-merge.ts";
import {
  type CardVaultItem,
  type IdentityVaultItem,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type SshKeyVaultItem,
  type VaultItem,
  VaultItemType,
} from "@/core/types.ts";

const createMockLogin = (
  id: string,
  name: string,
  creationDate: string,
  revisionDate: string,
): LoginVaultItem => ({
  id,
  type: VaultItemType.Login,
  name,
  notes: "Note",
  favorite: true,
  reprompt: 0,
  fields: [],
  creationDate,
  revisionDate,
  login: {
    username: "user@example.com",
    password: "password123",
    totp: "JBSWY3DPEHPK3PXP",
    uris: [{ uri: "https://example.com" }],
    fido2Credentials: [],
  },
});

const createMockSecureNote = (
  id: string,
  name: string,
  creationDate: string,
  revisionDate: string,
): SecureNoteVaultItem => ({
  id,
  type: VaultItemType.SecureNote,
  name,
  notes: "Secret Note Content",
  favorite: false,
  reprompt: 1,
  fields: [],
  creationDate,
  revisionDate,
});

const createMockCard = (
  id: string,
  name: string,
  creationDate: string,
  revisionDate: string,
): CardVaultItem => ({
  id,
  type: VaultItemType.Card,
  name,
  notes: "Credit Card Notes",
  favorite: false,
  reprompt: 0,
  fields: [],
  creationDate,
  revisionDate,
  card: {
    cardholderName: "John Doe",
    brand: "Visa",
    number: "4111222233334444",
    expMonth: "12",
    expYear: "2028",
    code: "123",
  },
});

const createMockIdentity = (
  id: string,
  name: string,
  creationDate: string,
  revisionDate: string,
): IdentityVaultItem => ({
  id,
  type: VaultItemType.Identity,
  name,
  notes: "Personal Identity Profile",
  favorite: false,
  reprompt: 0,
  fields: [],
  creationDate,
  revisionDate,
  identity: {
    title: "Mr",
    firstName: "John",
    middleName: "D",
    lastName: "Doe",
    username: "johndoe",
    company: "Acme Corp",
    ssn: "000-00-0000",
    passportNumber: "P123456",
    licenseNumber: "DL98765",
    email: "john@example.com",
    phone: "+123456789",
    address1: "123 Main St",
    address2: "",
    address3: "",
    city: "Metropolis",
    state: "NY",
    postalCode: "10001",
    country: "USA",
  },
});

const createMockSshKey = (
  id: string,
  name: string,
  creationDate: string,
  revisionDate: string,
): SshKeyVaultItem => ({
  id,
  type: VaultItemType.SshKey,
  name,
  notes: "Production SSH Key",
  favorite: true,
  reprompt: 0,
  fields: [],
  creationDate,
  revisionDate,
  sshKey: {
    privateKey:
      "-----BEGIN OPENSSH PRIVATE KEY-----\ntest\n-----END OPENSSH PRIVATE KEY-----",
    publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...",
    keyFingerprint: "SHA256:abc123def456",
  },
});

Deno.test("Vault Merge - Login item revision conflict resolution", () => {
  const localLogin = createMockLogin(
    "login-1",
    "Login Local Edit",
    "2026-07-24T10:00:00.000Z",
    "2026-07-24T12:00:00.000Z",
  );
  const remoteLogin = createMockLogin(
    "login-1",
    "Login Remote Old",
    "2026-07-24T10:00:00.000Z",
    "2026-07-24T11:00:00.000Z",
  );

  const merged = mergeVaultItems([localLogin], [remoteLogin], 1000);
  assertEquals(merged.length, 1);
  assertEquals(merged[0].name, "Login Local Edit");
});

Deno.test("Vault Merge - SecureNote item remote revision takes precedence when newer", () => {
  const localNote = createMockSecureNote(
    "note-1",
    "Old Local Note",
    "2026-07-24T10:00:00.000Z",
    "2026-07-24T11:00:00.000Z",
  );
  const remoteNote = createMockSecureNote(
    "note-1",
    "New Remote Note",
    "2026-07-24T10:00:00.000Z",
    "2026-07-24T12:00:00.000Z",
  );

  const merged = mergeVaultItems([localNote], [remoteNote], 1000);
  assertEquals(merged.length, 1);
  assertEquals(merged[0].name, "New Remote Note");
});

Deno.test("Vault Merge - Card item created on local after lastSync is retained", () => {
  const lastSyncTime = new Date("2026-07-24T10:00:00.000Z").getTime();
  const localCard = createMockCard(
    "card-1",
    "New Visa Card",
    "2026-07-24T10:30:00.000Z",
    "2026-07-24T10:30:00.000Z",
  );

  const merged = mergeVaultItems([localCard], [], lastSyncTime);
  assertEquals(merged.length, 1);
  assertEquals(merged[0].id, "card-1");
  assertEquals(merged[0].type, VaultItemType.Card);
});

Deno.test("Vault Merge - Identity item created on local before lastSync and missing on remote is dropped", () => {
  const lastSyncTime = new Date("2026-07-24T12:00:00.000Z").getTime();
  const localIdentity = createMockIdentity(
    "identity-1",
    "Deleted Identity Profile",
    "2026-07-24T10:00:00.000Z",
    "2026-07-24T10:00:00.000Z",
  );

  const merged = mergeVaultItems([localIdentity], [], lastSyncTime);
  assertEquals(merged.length, 0);
});

Deno.test("Vault Merge - SshKey item created on remote is automatically added", () => {
  const lastSyncTime = new Date("2026-07-24T10:00:00.000Z").getTime();
  const remoteSshKey = createMockSshKey(
    "ssh-1",
    "Remote Server Key",
    "2026-07-24T11:00:00.000Z",
    "2026-07-24T11:00:00.000Z",
  );

  const merged = mergeVaultItems([], [remoteSshKey], lastSyncTime);
  assertEquals(merged.length, 1);
  assertEquals(merged[0].id, "ssh-1");
  assertEquals(merged[0].type, VaultItemType.SshKey);
});

Deno.test("Vault Merge - Mixed collection of all 5 Vault item types", () => {
  const lastSyncTime = new Date("2026-07-24T10:00:00.000Z").getTime();

  const localLogin = createMockLogin(
    "id-login",
    "Login Local Newer",
    "2026-07-24T08:00:00.000Z",
    "2026-07-24T12:00:00.000Z",
  );
  const remoteLogin = createMockLogin(
    "id-login",
    "Login Remote Older",
    "2026-07-24T08:00:00.000Z",
    "2026-07-24T09:00:00.000Z",
  );

  const localNote = createMockSecureNote(
    "id-note",
    "Note Local Older",
    "2026-07-24T08:00:00.000Z",
    "2026-07-24T09:00:00.000Z",
  );
  const remoteNote = createMockSecureNote(
    "id-note",
    "Note Remote Newer",
    "2026-07-24T08:00:00.000Z",
    "2026-07-24T11:00:00.000Z",
  );

  const localCardNew = createMockCard(
    "id-card",
    "New Local Card",
    "2026-07-24T10:30:00.000Z",
    "2026-07-24T10:30:00.000Z",
  );

  const localIdentityDeletedOnRemote = createMockIdentity(
    "id-identity",
    "Deleted Identity",
    "2026-07-24T08:00:00.000Z",
    "2026-07-24T08:00:00.000Z",
  );

  const remoteSshKeyNew = createMockSshKey(
    "id-ssh",
    "New Remote SSH Key",
    "2026-07-24T11:30:00.000Z",
    "2026-07-24T11:30:00.000Z",
  );

  const localItems: VaultItem[] = [
    localLogin,
    localNote,
    localCardNew,
    localIdentityDeletedOnRemote,
  ];
  const remoteItems: VaultItem[] = [remoteLogin, remoteNote, remoteSshKeyNew];

  const merged = mergeVaultItems(localItems, remoteItems, lastSyncTime);

  assertEquals(merged.length, 4); // Login, Note, Card, SSH Key (Identity was dropped)

  const itemMap = new Map(merged.map((i) => [i.id, i]));
  assertEquals(itemMap.get("id-login")?.name, "Login Local Newer");
  assertEquals(itemMap.get("id-note")?.name, "Note Remote Newer");
  assertEquals(itemMap.get("id-card")?.name, "New Local Card");
  assertEquals(itemMap.get("id-ssh")?.name, "New Remote SSH Key");
  assertEquals(itemMap.has("id-identity"), false);
});
