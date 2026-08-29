import {
  APP_NAME,
  asGistId,
  asGitHubAccessToken,
  asVaultItemId,
  createDefaultVaultItem,
  SESSION_KEY_PENDING_SYNC_TOKEN,
  sessionManager,
  type VaultItem,
  type VaultItemId,
  VaultItemType,
  View,
} from "@gistwarden/domain";
import {
  addFolderUseCase,
  clearDerivedKey,
  createItemUseCase,
  deleteFolderUseCase,
  deleteGistRoute,
  deleteLocalVaultRoute,
  deleteVaultItemsUseCase,
  downloadVaultRoute,
  executeVaultMutationUseCase,
  getSessionKey,
  getSyncProvider,
  initializeWebRoutes,
  purgeTrashItemUseCase,
  registerInMemoryRoute,
  renameFolderUseCase,
  restoreVaultItemUseCase,
  updateItemUseCase,
  uploadToGistRoute,
  vaultSecurityContext,
} from "@gistwarden/orchestrator";
import {
  DEFAULT_SYNC_CONFIG,
  getLocalVaultPayload,
  removeLocalVaultPayload,
  setLocalVaultPayload,
  setSessionItem,
  updateAccountSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { Window } from "happy-dom";
import {
  accountStore,
  resetAccountStore,
  resetUiStore,
  setAccountStore,
  setSettingsStore,
  uiStore,
} from "../packages/ui/src/core/store.ts";
import {
  createNewVault,
  lock,
  logout,
  resetMasterPasswordSecurity,
  syncVaultStatus,
  unlock,
  verifyMasterPassword,
} from "../packages/ui/src/features/auth/auth-service.ts";
import { changeMasterPassword } from "../packages/ui/src/features/auth/master-password-service.ts";
import {
  setPinUnlock,
  unlockWithPin,
} from "../packages/ui/src/features/auth/pin-service.ts";
import { setupGithub } from "../packages/ui/src/features/sync/github-auth.ts";
import { assert, assertEquals } from "./assert.ts";

export function setupTestDOM(mode: VaultMode = "local_storage"): Window {
  const window = new Window({ url: "https://localhost" });
  Object.assign(globalThis, {
    document: window.document,
    window: window,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLFormElement: window.HTMLFormElement,
    Event: window.Event,
    Node: window.Node,
  });
  sessionManager.clearKey();
  void clearDerivedKey();
  resetAccountStore();
  resetUiStore();
  setSettingsStore("vaultMode", mode);
  initializeWebRoutes();
  return window;
}

/**
 * Single Authoritative Master E2E Simulation Runner
 * Runs the full 16-step unbroken lifecycle for both Local Storage and Cloud Gist modes.
 */
export async function runMasterVaultE2EFlow(mode: VaultMode): Promise<void> {
  setupTestDOM(mode);

  let storedPayload = "";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method?.toUpperCase() || "GET";

    if (url.startsWith("https://gist.githubusercontent.com")) {
      return new Response(storedPayload, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.startsWith("https://api.github.com")) {
      if (url.endsWith("/user")) {
        return new Response(
          JSON.stringify({
            login: "testuser",
            avatar_url: "https://github.com/testuser.png",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      const gistDesc = `${APP_NAME.toLowerCase()}_vault`;
      const gistFileName = `${APP_NAME.toLowerCase()}.json`;

      if (url.includes("/gists")) {
        if (method === "GET") {
          if (!storedPayload) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (url.includes("/gists/mock_gist_id")) {
            return new Response(
              JSON.stringify({
                id: "mock_gist_id",
                description: gistDesc,
                updated_at: new Date().toISOString(),
                files: {
                  [gistFileName]: {
                    content: storedPayload,
                    raw_url: `https://gist.githubusercontent.com/raw/mock_gist_id/${gistFileName}`,
                  },
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }
          return new Response(
            JSON.stringify([
              {
                id: "mock_gist_id",
                description: gistDesc,
                updated_at: new Date().toISOString(),
                files: {
                  [gistFileName]: {
                    content: storedPayload,
                    raw_url: `https://gist.githubusercontent.com/raw/mock_gist_id/${gistFileName}`,
                  },
                },
              },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (method === "POST" || method === "PATCH") {
          const body = typeof init?.body === "string" ? init.body : "";
          if (body) {
            try {
              const parsed = JSON.parse(body);
              if (parsed.files?.[gistFileName]?.content) {
                storedPayload = parsed.files[gistFileName].content;
              }
            } catch {
              storedPayload = body;
            }
          }
          return new Response(
            JSON.stringify({
              id: "mock_gist_id",
              updated_at: new Date().toISOString(),
              files: {
                [gistFileName]: {
                  content: storedPayload,
                  raw_url: `https://gist.githubusercontent.com/raw/mock_gist_id/${gistFileName}`,
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (method === "DELETE") {
          storedPayload = "";
          return new Response(null, { status: 204 });
        }
      }
    }

    if (url.startsWith("http://localhost:3000")) {
      if (url.endsWith("/vault")) {
        if (method === "GET") {
          if (!storedPayload) {
            return new Response(JSON.stringify({ error: "Not Found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(storedPayload, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (method === "POST") {
          const body = typeof init?.body === "string" ? init.body : "";
          storedPayload = body;
          return new Response(JSON.stringify({ status: "success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (method === "DELETE") {
          storedPayload = "";
          return new Response(null, { status: 200 });
        }
      }
      if (url.endsWith("/user")) {
        return new Response(JSON.stringify({ username: "testuser" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return originalFetch
      ? originalFetch(input, init)
      : new Response(null, { status: 404 });
  }) as typeof fetch;

  // Register in-memory background routes for upload, download, and delete
  registerInMemoryRoute(uploadToGistRoute, async (payload) => {
    if (payload && typeof payload.content === "string") {
      storedPayload = payload.content;
      if (mode === "local_storage") {
        await setLocalVaultPayload(payload.content);
      }
    }
    return { success: true };
  });

  registerInMemoryRoute(downloadVaultRoute, async () => {
    if (mode === "local_storage") {
      const localRes = await getLocalVaultPayload();
      const content =
        localRes.isOk() && localRes.value ? localRes.value : storedPayload;
      return { success: true, content };
    }
    return { success: true, content: storedPayload };
  });

  registerInMemoryRoute(deleteLocalVaultRoute, async () => {
    storedPayload = "";
    await removeLocalVaultPayload();
    return { success: true };
  });

  registerInMemoryRoute(deleteGistRoute, async () => {
    storedPayload = "";
    return { success: true };
  });

  const provider = getSyncProvider(mode);
  const oldMasterPassword = "MasterPassword123!";
  const newMasterPassword = "NewMasterPassword456!";
  const initialPinCode = "123456";
  const updatedPinCode = "654321";
  const githubToken = "ghp_test_token_123456789";
  const gistId = "gist_test_id_abcdef";
  const serverUrl = "http://localhost:3000";
  const selfHostedToken = "self_hosted_test_jwt_token_987654321";

  if (mode === "github_gist") {
    setAccountStore("syncToken", asGitHubAccessToken(githubToken));
    setAccountStore("syncConfig", {
      ...accountStore.syncConfig,
      gistId: asGistId(gistId),
    });
  } else if (mode === "self_hosted_server") {
    setAccountStore("syncToken", asGitHubAccessToken(selfHostedToken));
    setAccountStore("syncConfig", {
      ...accountStore.syncConfig,
      serverUrl,
      username: "testuser",
    });
  }

  // Step 1: Initial state & View Decision Check (Must show MasterPasswordCreate, NOT Login)
  assertEquals(accountStore.vaultConfigured, false);
  assertEquals(accountStore.isLocked, true);
  assertEquals(await getSessionKey(), null);

  const initialStatus = await provider.checkVaultStatus({
    token:
      mode === "github_gist"
        ? asGitHubAccessToken(githubToken)
        : mode === "self_hosted_server"
          ? asGitHubAccessToken(selfHostedToken)
          : undefined,
    gistId: mode === "github_gist" ? asGistId(gistId) : undefined,
    serverUrl: mode === "self_hosted_server" ? serverUrl : undefined,
    hasStoredSalt: Boolean(accountStore.masterPasswordConfig.salt),
  });
  assertEquals(initialStatus.status, "new");

  // Step 2: Register New Vault (Tạo Mật Khẩu Master Ban Đầu)
  const createResult = await createNewVault(oldMasterPassword);
  assert(
    createResult.isOk(),
    `Vault creation failed: ${createResult.isErr() ? createResult.error : ""}`,
  );

  // 4-Layer Assertions on Unlocked State
  assertEquals(accountStore.vaultConfigured, true);
  assertEquals(accountStore.isLocked, false);
  assertEquals(uiStore.view, View.Vault);
  assert((await getSessionKey()) instanceof CryptoKey);

  if (mode === "github_gist") {
    assert(Boolean(accountStore.syncConfig.syncTokenEncrypted));
    assert(Boolean(accountStore.syncConfig.syncTokenIv));
  }

  const salt = accountStore.masterPasswordConfig.salt;
  const key = (await vaultSecurityContext.getKey())!;

  // Step 3: FOLDER LIFECYCLE - Add Folder 1 ("Công Việc") & Folder 2 ("Cá Nhân")
  const folder1Res = await addFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    "Công Việc & Tài Chính",
  );
  assert(folder1Res.isOk(), "Add folder 1 failed");
  setAccountStore("folders", folder1Res.value.payload.folders);
  const workFolderId = folder1Res.value.newFolder.id;

  const folder2Res = await addFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    "Cá Nhân & Gia Đình",
  );
  assert(folder2Res.isOk(), "Add folder 2 failed");
  setAccountStore("folders", folder2Res.value.payload.folders);
  const personalFolderId = folder2Res.value.newFolder.id;

  assertEquals(accountStore.folders.length, 2);

  // RENAME FOLDER 2 ("Cá Nhân VIP")
  const renameFolderRes = await renameFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    personalFolderId,
    "Cá Nhân VIP",
  );
  assert(renameFolderRes.isOk(), "Rename folder 2 failed");
  setAccountStore("folders", renameFolderRes.value.folders);
  assertEquals(accountStore.folders[1]?.name, "Cá Nhân VIP");

  // Step 4: Create ALL 5 Vault Item Types assigned to initial folders
  const loginItem = createDefaultVaultItem({
    id: asVaultItemId("item_login_1"),
    type: VaultItemType.Login,
    name: "Tài khoản GitHub Công Ty",
    notes: "Tài khoản dev chính",
    folderId: workFolderId,
    favorite: true,
    login: {
      username: "dev_user@company.com",
      password: "SuperSecretPassword123!",
      totp: "JBSWY3DPEHPK3PXP",
      uris: [{ uri: "https://github.com/company", match: 1 }],
      fido2Credentials: [],
    },
  });

  const noteItem = createDefaultVaultItem({
    id: asVaultItemId("item_note_1"),
    type: VaultItemType.SecureNote,
    name: "Mã Phục Hồi Server VIP",
    notes: "Recovery keys: AAAA-BBBB-CCCC-DDDD",
    folderId: personalFolderId,
    favorite: false,
  });

  const cardItem = createDefaultVaultItem({
    id: asVaultItemId("item_card_1"),
    type: VaultItemType.Card,
    name: "Thẻ Visa Bán Hàng",
    notes: "Thẻ thanh toán server",
    folderId: workFolderId,
    favorite: true,
    card: {
      cardholderName: "NGUYEN VAN A",
      brand: "Visa",
      number: "4111222233334444",
      expMonth: "12",
      expYear: "2028",
      code: "999",
    },
  });

  const identityItem = createDefaultVaultItem({
    id: asVaultItemId("item_identity_1"),
    type: VaultItemType.Identity,
    name: "Hồ Sơ Cá Nhân Doanh Nghiệp",
    notes: "Thông tin pháp lý công ty",
    folderId: personalFolderId,
    favorite: false,
    identity: {
      title: "Ông",
      firstName: "Văn A",
      middleName: "",
      lastName: "Nguyễn",
      username: "van_a_corp",
      company: "Gistwarden Corp",
      ssn: "0123456789",
      passportNumber: "B1234567",
      licenseNumber: "",
      email: "ceo@company.com",
      phone: "0901234567",
      address1: "123 Đường Lớn, Phường 1",
      address2: "",
      address3: "",
      city: "TP Hồ Chí Minh",
      state: "",
      postalCode: "",
      country: "VN",
    },
  });

  const sshKeyItem = createDefaultVaultItem({
    id: asVaultItemId("item_ssh_1"),
    type: VaultItemType.SshKey,
    name: "Khóa SSH Production Cluster",
    notes: "Key truy cập root server",
    folderId: null,
    favorite: true,
    sshKey: {
      publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... dev@server",
      privateKey:
        "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAA...\n-----END OPENSSH PRIVATE KEY-----",
      keyFingerprint: "SHA256:abcd1234efgh5678",
    },
  });

  // Step 4: Create ALL 5 Vault Item Types assigned to initial folders via createItemUseCase
  let currentPayload = {
    folders: accountStore.folders,
    items: accountStore.vaultItems,
    trash: accountStore.trashItems,
  };

  for (const item of [
    loginItem,
    noteItem,
    cardItem,
    identityItem,
    sshKeyItem,
  ]) {
    const createRes = await createItemUseCase(
      currentPayload,
      key,
      salt,
      mode,
      item,
    );
    assert(createRes.isOk(), `Creating item ${item.name} failed`);
    currentPayload = createRes.value;
  }

  setAccountStore("vaultItems", currentPayload.items);
  assertEquals(accountStore.vaultItems.length, 5);

  // Step 5: Edit Vault Items & MOVE ITEMS BETWEEN FOLDERS via updateItemUseCase
  const updatedLoginPassword = "UpdatedNewPassword999!";
  const updatedNoteText = "Recovery keys updated: XXXX-YYYY-ZZZZ";
  const updatedCardCvv = "888";
  const updatedIdentityPhone = "0987654321";
  const updatedSshFingerprint = "SHA256:updated9999ffff";

  const editPatches: Array<{ id: VaultItemId; patch: Partial<VaultItem> }> = [
    {
      id: loginItem.id,
      patch: {
        folderId: personalFolderId,
        login: {
          username: "dev_user@company.com",
          password: updatedLoginPassword,
          totp: "JBSWY3DPEHPK3PXP",
          uris: [{ uri: "https://github.com/company", match: 1 }],
          fido2Credentials: [],
        },
      },
    },
    {
      id: noteItem.id,
      patch: {
        notes: updatedNoteText,
      },
    },
    {
      id: cardItem.id,
      patch: {
        card: {
          cardholderName: "NGUYEN VAN A",
          brand: "Visa",
          number: "4111222233334444",
          expMonth: "12",
          expYear: "2028",
          code: updatedCardCvv,
        },
      },
    },
    {
      id: identityItem.id,
      patch: {
        identity: {
          title: "Ông",
          firstName: "Văn A",
          middleName: "",
          lastName: "Nguyễn",
          username: "van_a_corp",
          company: "Gistwarden Corp",
          ssn: "0123456789",
          passportNumber: "B1234567",
          licenseNumber: "",
          email: "ceo@company.com",
          phone: updatedIdentityPhone,
          address1: "123 Đường Lớn, Phường 1",
          address2: "",
          address3: "",
          city: "TP Hồ Chí Minh",
          state: "",
          postalCode: "",
          country: "VN",
        },
      },
    },
    {
      id: sshKeyItem.id,
      patch: {
        folderId: workFolderId,
        sshKey: {
          publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... dev_key",
          privateKey:
            "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAA...\n-----END OPENSSH PRIVATE KEY-----",
          keyFingerprint: updatedSshFingerprint,
        },
      },
    },
  ];

  for (const { id, patch } of editPatches) {
    const editRes = await updateItemUseCase(
      currentPayload,
      key,
      salt,
      mode,
      id,
      patch,
    );
    assert(editRes.isOk(), `Updating item ${id} failed`);
    currentPayload = editRes.value;
  }

  setAccountStore("vaultItems", currentPayload.items);

  // Verify item folder movements
  const movedLogin = accountStore.vaultItems.find(
    (i) => i.type === VaultItemType.Login,
  );
  assertEquals(movedLogin?.folderId, personalFolderId);

  const movedSsh = accountStore.vaultItems.find(
    (i) => i.type === VaultItemType.SshKey,
  );
  assertEquals(movedSsh?.folderId, workFolderId);

  // DELETE WORK FOLDER -> Items inside Work Folder (Card, SshKey) have folderId reset to null
  const deleteWorkFolderRes = await deleteFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    workFolderId,
  );
  assert(deleteWorkFolderRes.isOk(), "Delete work folder failed");
  setAccountStore("folders", deleteWorkFolderRes.value.folders);
  setAccountStore("vaultItems", deleteWorkFolderRes.value.items);

  assertEquals(accountStore.folders.length, 1);
  assertEquals(accountStore.folders[0]?.id, personalFolderId);

  const cardPostDeleteFolder = accountStore.vaultItems.find(
    (i) => i.type === VaultItemType.Card,
  );
  assertEquals(cardPostDeleteFolder?.folderId, null);

  // Step 6: Soft Delete, Restore & Permanent Delete (Trash Lifecycle)
  const trashSshRes = await deleteVaultItemsUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    [sshKeyItem.id],
  );
  assert(trashSshRes.isOk(), "Trash SSH key failed");
  setAccountStore("vaultItems", trashSshRes.value.items);
  setAccountStore("trashItems", trashSshRes.value.trash);
  assertEquals(accountStore.vaultItems.length, 4);

  const restoreSshRes = await restoreVaultItemUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    sshKeyItem.id,
  );
  assert(restoreSshRes.isOk(), "Restore SSH key failed");
  setAccountStore("vaultItems", restoreSshRes.value.items);
  setAccountStore("trashItems", restoreSshRes.value.trash);
  assertEquals(accountStore.vaultItems.length, 5);

  const trashNoteRes = await deleteVaultItemsUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    key,
    salt,
    mode,
    [noteItem.id],
  );
  assert(trashNoteRes.isOk(), "Trash note failed");

  const purgeNoteRes = await purgeTrashItemUseCase(
    {
      folders: trashNoteRes.value.folders,
      items: trashNoteRes.value.items,
      trash: trashNoteRes.value.trash,
    },
    key,
    salt,
    mode,
    noteItem.id,
  );
  assert(purgeNoteRes.isOk(), "Purge note failed");
  setAccountStore("vaultItems", purgeNoteRes.value.items);
  setAccountStore("trashItems", purgeNoteRes.value.trash);
  assertEquals(accountStore.vaultItems.length, 4);

  // Step 7: Lock Session & View Decision Check
  await lock();
  assertEquals(accountStore.isLocked, true);
  assertEquals(uiStore.view, View.Login);
  assertEquals(await getSessionKey(), null);

  const _lockedStatus = await provider.checkVaultStatus({
    token:
      mode === "github_gist"
        ? asGitHubAccessToken(githubToken)
        : mode === "self_hosted_server"
          ? asGitHubAccessToken(selfHostedToken)
          : undefined,
    gistId: mode === "github_gist" ? asGistId(gistId) : undefined,
    serverUrl: mode === "self_hosted_server" ? serverUrl : undefined,
    hasStoredSalt: Boolean(accountStore.masterPasswordConfig.salt),
  });
  // Standalone Master Password verification test (Check correct & wrong MP without modifying session)
  const standaloneValidCheck = await verifyMasterPassword(oldMasterPassword);
  assert(
    standaloneValidCheck.isOk() && standaloneValidCheck.value === true,
    `[${mode}] verifyMasterPassword with correct password failed: ${standaloneValidCheck.isErr() ? standaloneValidCheck.error : "unknown"}`,
  );

  const standaloneInvalidCheck = await verifyMasterPassword("WrongPassword!");
  assert(
    standaloneInvalidCheck.isErr(),
    `[${mode}] verifyMasterPassword with wrong password should return error`,
  );

  // Step 8: Unlock attempt with WRONG Master Password & Security Cooldown Check
  const wrongPassResult = await unlock("WrongPassword!");
  assert(
    wrongPassResult.isErr(),
    `[${mode}] Step 8: Expected wrong password attempt to fail`,
  );
  assertEquals(
    wrongPassResult.error,
    "login_error_wrong_mp",
    `[${mode}] Step 8: Expected login_error_wrong_mp, got ${wrongPassResult.isErr() ? wrongPassResult.error : "success"}`,
  );

  await resetMasterPasswordSecurity(accountStore.masterPasswordConfig.salt);

  // Step 9: Unlock attempt with CORRECT Master Password
  const correctPassResult = await unlock(oldMasterPassword);
  assert(
    correctPassResult.isOk(),
    `[${mode}] Step 9: Unlock with correct MP failed: ${correctPassResult.isErr() ? correctPassResult.error : "unknown"}`,
  );
  assertEquals(accountStore.isLocked, false);

  // Step 10: Set PIN Code & Test WRONG PIN 3 TIMES AUTO-WIPE SCENARIO
  const setPinResult = await setPinUnlock(initialPinCode, false);
  assert(
    setPinResult.isOk(),
    `[${mode}] Step 10: Set PIN failed: ${setPinResult.isErr() ? setPinResult.error : "unknown"}`,
  );
  assertEquals(accountStore.pinConfig.enabled, true);

  await lock();
  assertEquals(accountStore.isLocked, true);

  // Attempt 1 Wrong PIN (2 attempts left)
  const wrongPin1Res = await unlockWithPin("000000");
  assert(wrongPin1Res.isErr());
  assertEquals(wrongPin1Res.error, "login_error_wrong_pin_2_left");
  assertEquals(accountStore.pinConfig.enabled, true);

  // Attempt 2 Wrong PIN (1 attempt left)
  const wrongPin2Res = await unlockWithPin("000000");
  assert(wrongPin2Res.isErr());
  assertEquals(wrongPin2Res.error, "login_error_wrong_pin_1_left");
  assertEquals(accountStore.pinConfig.enabled, true);

  // Attempt 3 Wrong PIN (3/3 MAX ATTEMPTS REACHED -> PIN AUTO WIPED & DISABLED)
  const wrongPin3Res = await unlockWithPin("000000");
  assert(wrongPin3Res.isErr());
  assertEquals(wrongPin3Res.error, "login_error_pin_max_attempts_reached");

  // ASSERT PIN HAS BEEN CLEARED/DISABLED FROM STORE
  assertEquals(accountStore.pinConfig.enabled, false);
  assertEquals(accountStore.isLocked, true);

  // Unlock with Master Password after PIN wipe
  const postPinWipeUnlockRes = await unlock(oldMasterPassword);
  assert(
    postPinWipeUnlockRes.isOk(),
    `[${mode}] Step 10: Master Password unlock after PIN wipe failed: ${postPinWipeUnlockRes.isErr() ? postPinWipeUnlockRes.error : "unknown"}`,
  );
  assertEquals(accountStore.isLocked, false);

  // Step 11: Re-enable & Change PIN Code
  const reEnablePinResult = await setPinUnlock(updatedPinCode, false);
  assert(
    reEnablePinResult.isOk(),
    `[${mode}] Step 11: Re-enable PIN failed: ${reEnablePinResult.isErr() ? reEnablePinResult.error : "unknown"}`,
  );
  assertEquals(accountStore.pinConfig.enabled, true);

  await lock();
  assertEquals(accountStore.isLocked, true);

  const newPinUnlockRes = await unlockWithPin(updatedPinCode);
  assert(
    newPinUnlockRes.isOk(),
    `[${mode}] Step 11: New PIN unlock failed: ${newPinUnlockRes.isErr() ? newPinUnlockRes.error : "unknown"}`,
  );
  assertEquals(accountStore.isLocked, false);

  // Step 12: Change Master Password (Đổi Mật Khẩu Master từ Old sang New)
  const changeResult = await changeMasterPassword(
    oldMasterPassword,
    newMasterPassword,
  );
  assert(
    changeResult.isOk(),
    `[${mode}] Step 12: Change MP failed: ${changeResult.isErr() ? changeResult.error : "unknown"}`,
  );

  // Step 13: Lock & Attempt Unlock with OLD Master Password vs NEW Master Password
  await lock();
  assertEquals(accountStore.isLocked, true);

  const oldPassUnlockResult = await unlock(oldMasterPassword);
  assert(
    oldPassUnlockResult.isErr(),
    `[${mode}] Step 13: Expected unlock with old password to fail`,
  );

  await resetMasterPasswordSecurity(accountStore.masterPasswordConfig.salt);

  const newPassUnlockResult = await unlock(newMasterPassword);
  assert(
    newPassUnlockResult.isOk(),
    `[${mode}] Step 13: Unlock with new password failed: ${newPassUnlockResult.isErr() ? newPassUnlockResult.error : "unknown"}`,
  );
  assertEquals(accountStore.isLocked, false);

  // Step 14: Logout
  await logout();
  assertEquals(accountStore.vaultConfigured, false);
  assertEquals(accountStore.isLocked, true);

  // Step 15: Re-login after Logout & VERIFY INTERMEDIATE VAULT STATE
  setSettingsStore("vaultMode", mode);
  if (mode === "github_gist") {
    await setupGithub(githubToken);
  } else if (mode === "self_hosted_server") {
    const updatedSyncConfig = {
      ...DEFAULT_SYNC_CONFIG,
      serverUrl,
      username: "admin",
    };
    await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, selfHostedToken);
    await updateAccountSettings(
      { syncConfig: updatedSyncConfig },
      "self_hosted_server",
    );
    setAccountStore("syncConfig", updatedSyncConfig);
    setAccountStore("syncToken", selfHostedToken);
  }
  await syncVaultStatus(mode);

  const reloginResult = await unlock(newMasterPassword);
  assert(
    reloginResult.isOk(),
    `[${mode}] Step 15: Re-login failed: ${reloginResult.isErr() ? reloginResult.error : "unknown"}`,
  );
  assertEquals(accountStore.vaultConfigured, true);
  assertEquals(accountStore.isLocked, false);

  assertEquals(accountStore.vaultItems.length, 4);
  assertEquals(accountStore.folders.length, 1);
  assertEquals(accountStore.folders[0]?.name, "Cá Nhân VIP");

  // Step 16: ULTIMATE FINAL STEP - DELETE VAULT (PURGE ENTIRE VAULT & ACCOUNT RESET)
  storedPayload = "";
  if (mode === "local_storage") {
    await removeLocalVaultPayload();
  }
  await logout();

  // ASSERT TRUE FINAL STATE - VAULT IS FULLY WIPED & RESET TO INITIAL "NEW" STATE
  assertEquals(accountStore.vaultConfigured, false);
  assertEquals(accountStore.isLocked, true);
  assertEquals(await getSessionKey(), null);

  const finalStatusAfterPurge = await provider.checkVaultStatus({
    token:
      mode === "github_gist"
        ? asGitHubAccessToken(githubToken)
        : mode === "self_hosted_server"
          ? asGitHubAccessToken(selfHostedToken)
          : undefined,
    gistId: mode === "github_gist" ? asGistId(gistId) : undefined,
    serverUrl: mode === "self_hosted_server" ? serverUrl : undefined,
    hasStoredSalt: Boolean(accountStore.masterPasswordConfig.salt),
  });
  assertEquals(finalStatusAfterPurge.status, "new"); // Renders MasterPasswordCreate screen!
}
