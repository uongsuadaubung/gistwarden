import {
  asFido2CredentialId,
  asRpId,
  asVaultItemId,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import {
  findMatchingFido2Accounts,
  findMatchingFido2Credentials,
} from "../packages/ui/src/features/passkey/fido2-service.ts";
import { assert, assertEquals, test } from "./assert.ts";

const mockVaultItems: VaultItem[] = [
  {
    id: asVaultItemId("1"),
    type: VaultItemType.Login,
    name: "GitHub",
    favorite: false,
    reprompt: 0,
    fields: [],
    revisionDate: "",
    creationDate: "",
    login: {
      username: "testuser",
      password: "123",
      uris: [{ uri: "https://github.com" }],
      fido2Credentials: [
        {
          credentialId: asFido2CredentialId("cred1"),
          keyType: "public-key",
          keyAlgorithm: "ES256",
          keyCurve: "P-256",
          keyValue: "pub1",
          rpId: asRpId("github.com"),
          counter: 0,
        },
      ],
    },
  },
  {
    id: asVaultItemId("2"),

    type: VaultItemType.Login,
    name: "example.com",
    favorite: false,
    reprompt: 0,
    fields: [],
    revisionDate: "",
    creationDate: "",
    login: {
      username: "user2",
      password: "123",
      uris: [], // No URIs defined
    },
  },
];

test("fido2-service: findMatchingFido2Accounts matches by URI", () => {
  const matches = findMatchingFido2Accounts(
    mockVaultItems,
    asRpId("github.com"),
    "https://github.com",
  );
  assertEquals(matches.length, 1);
  assert(matches[0]);
  assertEquals(matches[0].name, "GitHub");
});

test("fido2-service: findMatchingFido2Accounts ignores items without matching URI", () => {
  const matches = findMatchingFido2Accounts(
    mockVaultItems,
    asRpId("example.com"),
    "https://example.com",
  );
  // Item 2 has name "example.com" but no URIs -> must return 0 matches
  assertEquals(matches.length, 0);
});

test("fido2-service: findMatchingFido2Credentials matches rpId", () => {
  const creds = findMatchingFido2Credentials(
    mockVaultItems,
    asRpId("github.com"),
    "https://github.com",
  );
  assertEquals(creds.length, 1);
  assert(creds[0]);
  assertEquals(creds[0].credential.credentialId, "cred1");
});

test("fido2-service: rejects cross-origin phishing attempt in findMatchingFido2Accounts & findMatchingFido2Credentials", () => {
  // Website evil.com tries to request credentials for github.com
  const accounts = findMatchingFido2Accounts(
    mockVaultItems,
    asRpId("github.com"),
    "https://evil.com",
  );
  assertEquals(accounts.length, 0);

  const creds = findMatchingFido2Credentials(
    mockVaultItems,
    asRpId("github.com"),
    "https://evil.com",
  );
  assertEquals(creds.length, 0);
});
