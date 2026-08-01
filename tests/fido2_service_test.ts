import { assertEquals, test } from "./assert.ts";
import {
  findMatchingFido2Accounts,
  findMatchingFido2Credentials,
} from "../packages/ui/src/features/passkey/fido2-service.ts";
import { type VaultItem, VaultItemType } from "@gistwarden/domain";

const mockVaultItems: VaultItem[] = [
  {
    id: "1",
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
          credentialId: "cred1",
          keyType: "public-key",
          keyAlgorithm: "ES256",
          keyCurve: "P-256",
          keyValue: "pub1",
          rpId: "github.com",
          counter: 0,
        },
      ],
    },
  },
  {
    id: "2",
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
    "github.com",
    "https://github.com",
  );
  assertEquals(matches.length, 1);
  assertEquals(matches[0].name, "GitHub");
});

test("fido2-service: findMatchingFido2Accounts ignores items without matching URI", () => {
  const matches = findMatchingFido2Accounts(
    mockVaultItems,
    "example.com",
    "https://example.com",
  );
  // Item 2 has name "example.com" but no URIs -> must return 0 matches
  assertEquals(matches.length, 0);
});

test("fido2-service: findMatchingFido2Credentials matches rpId", () => {
  const creds = findMatchingFido2Credentials(mockVaultItems, "github.com");
  assertEquals(creds.length, 1);
  assertEquals(creds[0].credential.credentialId, "cred1");
});
