import { beforeAll, describe, expect, test } from "bun:test";
import {
  asVaultItemId,
  createDefaultVaultItem,
  VaultItemType,
  type VaultPayload,
} from "@gistwarden/domain";
import {
  createItemUseCase,
  saveItemUseCase,
  updateItemUseCase,
} from "@gistwarden/orchestrator";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  updateAccountSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { setupTestDOM } from "./test-helpers.ts";

// Mock helper to generate dummy crypto key
async function createMockKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

describe("Vault CRUD Use Cases (createItemUseCase & updateItemUseCase)", () => {
  const salt = "test_salt_123";
  const mode: VaultMode = "local_storage";

  beforeAll(async () => {
    setupTestDOM("local_storage");
    await updateAccountSettings(
      {
        masterPasswordConfig: {
          ...DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
          salt: "test_salt_123",
        },
      },
      "local_storage",
    );
  });

  test("createItemUseCase adds new item when item has pre-assigned UUID from template", async () => {
    const key = await createMockKey();
    const initialPayload: VaultPayload = {
      folders: [],
      items: [],
      trash: [],
    };

    // Simulate UI creating a default template item with a generated UUID
    const templateItem = createDefaultVaultItem({
      type: VaultItemType.Login,
      name: "GitHub Login",
      login: {
        username: "user@example.com",
        password: "password123",
        uris: [{ uri: "https://github.com" }],
      },
    });

    const createRes = await createItemUseCase(
      initialPayload,
      key,
      salt,
      mode,
      templateItem,
    );

    expect(createRes.isOk()).toBe(true);
    if (createRes.isOk()) {
      const payload = createRes.value;
      expect(payload.items.length).toBe(1);
      expect(payload.items[0]?.name).toBe("GitHub Login");
      expect(payload.items[0]?.id).toBe(templateItem.id);
      expect(payload.items[0]?.type).toBe(VaultItemType.Login);
    }
  });

  test("createItemUseCase adds new item when item has no ID", async () => {
    const key = await createMockKey();
    const initialPayload: VaultPayload = {
      folders: [],
      items: [],
      trash: [],
    };

    const rawItem = {
      type: VaultItemType.SecureNote,
      name: "Secret Note",
      notes: "Top secret content",
    };

    const createRes = await createItemUseCase(
      initialPayload,
      key,
      salt,
      mode,
      rawItem,
    );

    expect(createRes.isOk()).toBe(true);
    if (createRes.isOk()) {
      const payload = createRes.value;
      expect(payload.items.length).toBe(1);
      expect(payload.items[0]?.name).toBe("Secret Note");
      expect(payload.items[0]?.id).toBeDefined();
      expect(payload.items[0]?.type).toBe(VaultItemType.SecureNote);
    }
  });

  test("updateItemUseCase updates existing item by ID and preserves other items", async () => {
    const key = await createMockKey();
    const existingLogin = createDefaultVaultItem({
      id: asVaultItemId("item_1"),
      type: VaultItemType.Login,
      name: "Original Name",
      login: {
        username: "user@test.com",
        password: "oldPassword",
      },
    });

    const existingNote = createDefaultVaultItem({
      id: asVaultItemId("item_2"),
      type: VaultItemType.SecureNote,
      name: "Untouched Note",
    });

    const initialPayload: VaultPayload = {
      folders: [],
      items: [existingLogin, existingNote],
      trash: [],
    };

    const updateRes = await updateItemUseCase(
      initialPayload,
      key,
      salt,
      mode,
      asVaultItemId("item_1"),
      {
        name: "Updated Name",
        login: {
          username: "user@test.com",
          password: "newPassword999",
        },
      },
    );

    expect(updateRes.isOk()).toBe(true);
    if (updateRes.isOk()) {
      const payload = updateRes.value;
      expect(payload.items.length).toBe(2);
      const updated = payload.items.find((i) => i.id === "item_1");
      const untouched = payload.items.find((i) => i.id === "item_2");

      expect(updated?.name).toBe("Updated Name");
      expect(untouched?.name).toBe("Untouched Note");
    }
  });

  test("saveItemUseCase delegates to create when ID is not present in payload", async () => {
    const key = await createMockKey();
    const initialPayload: VaultPayload = {
      folders: [],
      items: [],
      trash: [],
    };

    // Item has ID, but ID does not exist in items array
    const newItemWithId = createDefaultVaultItem({
      id: asVaultItemId("new_generated_uuid"),
      type: VaultItemType.Card,
      name: "Visa Card",
    });

    const saveRes = await saveItemUseCase(
      initialPayload,
      key,
      salt,
      mode,
      newItemWithId,
    );

    expect(saveRes.isOk()).toBe(true);
    if (saveRes.isOk()) {
      const payload = saveRes.value;
      expect(payload.items.length).toBe(1);
      expect(payload.items[0]?.name).toBe("Visa Card");
      expect(payload.items[0]?.id).toBe(asVaultItemId("new_generated_uuid"));
    }
  });
});
