import { z } from "zod";
import { ok, type Result } from "neverthrow";
import {
  APP_NAME,
  LOCAL_STORAGE_KEY_THEME,
  MSG_USER_ACTIVITY,
  safeJsonParse,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  SESSION_KEY_SESSION_INITIALIZED,
  STORE_KEY_IS_LOCKED,
  STORE_KEY_VIEW,
  SupportLanguage,
  type TranslationKey,
  View,
} from "@gistwarden/domain";
import {
  getGithubToken,
  getLocalItem,
  getSessionItem,
  getSessionItems,
  hasSessionStorage,
  isRecord,
  isSessionUnlocked,
  resetAccountSettings,
  setSessionItem,
} from "@gistwarden/repository";
import {
  downloadFromGistRoute,
  getSessionKey,
  notifyBackground,
  sendBackgroundMessage,
} from "@gistwarden/orchestrator";
import { setLanguage, type VaultItem } from "@gistwarden/domain";
import {
  accountStore,
  applyVaultPayloadToStore,
  loadAllStores,
  setAccountStore,
  setSettingsStore,
  settingsStore,
  setUiStore,
} from "./store.ts";
import { GistPayloadSchema } from "@gistwarden/repository";
import { decryptGistVault, logout } from "../features/auth/auth-service.ts";

async function handleBrowserRestartCleanup(
  vaultTimeoutAction: string,
): Promise<void> {
  if (!hasSessionStorage()) {
    return;
  }
  const sessionInitRes = await getSessionItem(
    SESSION_KEY_SESSION_INITIALIZED,
  );
  const sessionInitialized = sessionInitRes.isOk()
    ? sessionInitRes.value
    : null;
  if (!sessionInitialized) {
    if (vaultTimeoutAction === "logout") {
      console.debug(
        `[Store] Phát hiện khởi động lại trình duyệt và hành động là logout. Đang đăng xuất...`,
      );
      await resetAccountSettings();
    }
    await setSessionItem(SESSION_KEY_SESSION_INITIALIZED, true);
  }
}

export async function loadAndApplyTheme(): Promise<"dark" | "light"> {
  const themeRes = await getLocalItem(LOCAL_STORAGE_KEY_THEME);
  const themeVal = themeRes.isOk() ? themeRes.value : null;
  const finalTheme = themeVal === "light" ? "light" : "dark";
  if (finalTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  return finalTheme;
}

async function fetchEncryptedVaultContent(): Promise<
  Result<string | null, TranslationKey>
> {
  const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
  if (typeof cachedVal === "string" && cachedVal) {
    return ok(cachedVal);
  }

  const sendResult = await sendBackgroundMessage(downloadFromGistRoute);
  if (
    sendResult.isOk() &&
    isRecord(sendResult.value) &&
    sendResult.value.success &&
    typeof sendResult.value.content === "string"
  ) {
    const content = sendResult.value.content;
    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, content);
    return ok(content);
  }

  return ok(null);
}

async function resolveSavedViewAndItem(
  items: VaultItem[],
  isFido2Prompt: boolean,
  params: URLSearchParams,
): Promise<{ targetView: View; selectedItem?: VaultItem }> {
  let targetView = isFido2Prompt ? View.Fido2Prompt : View.Vault;
  let selectedItem: VaultItem | undefined = undefined;

  const itemId = params.get("itemId");
  if (itemId && !isFido2Prompt) {
    const foundItem = items.find((i) => i.id === itemId);
    if (foundItem) {
      selectedItem = foundItem;
      targetView = View.ItemDetail;
    }
  } else if (!isFido2Prompt) {
    const sessionDataRes = await getSessionItems([
      SESSION_KEY_LAST_VIEW,
      SESSION_KEY_LAST_SELECTED_ITEM_ID,
    ]);
    const sessionData = sessionDataRes.isOk() ? sessionDataRes.value : {};
    const savedView = sessionData[SESSION_KEY_LAST_VIEW];
    const savedItemId = sessionData[SESSION_KEY_LAST_SELECTED_ITEM_ID];

    const ViewSchema = z.nativeEnum(View);
    const viewParsed = ViewSchema.safeParse(savedView);
    if (viewParsed.success) {
      const viewVal = viewParsed.data;
      if (viewVal !== View.Login && viewVal !== View.Welcome) {
        targetView = viewVal;
      }
    }

    if (typeof savedItemId === "string") {
      const foundItem = items.find((i) => i.id === savedItemId);
      if (foundItem) {
        selectedItem = foundItem;
      } else {
        if (targetView === View.ItemDetail || targetView === View.ItemEdit) {
          targetView = View.Vault;
        }
      }
    }
  }

  return { targetView, selectedItem };
}

async function loadAndDecryptVault(
  key: CryptoKey,
  isFido2Prompt: boolean,
  params: URLSearchParams,
): Promise<void> {
  const handleInitError = (errVal: TranslationKey) => {
    console.error("[Store] Decryption on load failed:", errVal);
    setAccountStore(STORE_KEY_IS_LOCKED, true);
    if (!isFido2Prompt) setUiStore(STORE_KEY_VIEW, View.Login);
  };

  const contentRes = await fetchEncryptedVaultContent();
  if (contentRes.isErr()) {
    handleInitError(contentRes.error);
    return;
  }

  const content = contentRes.value;
  if (!content) {
    setAccountStore("isLocked", false);
    setUiStore("view", isFido2Prompt ? View.Fido2Prompt : View.Vault);
    notifyBackground({ type: MSG_USER_ACTIVITY });
    return;
  }

  const decryptVaultRes = await decryptGistVault(content, key);
  if (decryptVaultRes.isErr()) {
    handleInitError(decryptVaultRes.error);
    return;
  }

  const { folders, items, trash } = decryptVaultRes.value;
  const { targetView, selectedItem } = await resolveSavedViewAndItem(
    items,
    isFido2Prompt,
    params,
  );

  applyVaultPayloadToStore({
    folders: folders || [],
    items: items || [],
    trash: trash || [],
  });
  setAccountStore("isLocked", false);
  setUiStore({
    view: targetView,
    selectedItem: selectedItem || null,
  });
  notifyBackground({ type: MSG_USER_ACTIVITY });
}

function applyInitialView(
  githubConfigured: boolean,
  welcomeAccepted: boolean,
  isFido2Prompt: boolean,
): void {
  setAccountStore(STORE_KEY_IS_LOCKED, true);
  if (!isFido2Prompt) {
    if (!githubConfigured && !welcomeAccepted) {
      setUiStore(STORE_KEY_VIEW, View.Welcome);
    } else {
      setUiStore(STORE_KEY_VIEW, View.Login);
    }
  }
}

export async function init(): Promise<void> {
  console.log(`[Store] Initializing ${APP_NAME} Stores...`);

  await loadAllStores();
  await handleBrowserRestartCleanup(settingsStore.vaultTimeoutAction);

  const key = await getSessionKey();
  const sessionUnlockedVal = await isSessionUnlocked();
  const currentTheme = await loadAndApplyTheme();

  setSettingsStore({ theme: currentTheme });

  const decryptedToken = await getGithubToken();
  const githubConfigured = !!accountStore.gistId ||
    !!decryptedToken || !!accountStore.githubToken;

  setAccountStore({
    githubToken: decryptedToken,
    githubConfigured,
    sessionUnlocked: sessionUnlockedVal,
  });

  setLanguage(
    settingsStore.language === "vi" ? SupportLanguage.Vi : SupportLanguage.En,
  );

  const params = new URLSearchParams(window.location.search);
  const isFido2Prompt = params.get("mode") === "fido2-prompt";

  if (isFido2Prompt) {
    setUiStore(STORE_KEY_VIEW, View.Fido2Prompt);
  }

  if (decryptedToken && key && accountStore.masterPasswordConfig.salt) {
    await loadAndDecryptVault(key, isFido2Prompt, params);
  } else {
    if (accountStore.gistId && accountStore.masterPasswordConfig.salt) {
      const sendResult = await sendBackgroundMessage(
        downloadFromGistRoute,
      );
      if (
        sendResult.isOk() &&
        isRecord(sendResult.value) &&
        sendResult.value.success &&
        typeof sendResult.value.content === "string"
      ) {
        const content = sendResult.value.content;
        const payloadJsonRes = safeJsonParse(content);
        if (payloadJsonRes.isOk()) {
          const payloadResult = GistPayloadSchema.safeParse(
            payloadJsonRes.value,
          );

          if (payloadResult.success) {
            const payload = payloadResult.data;
            if (
              payload.salt && accountStore.masterPasswordConfig.salt &&
              payload.salt !== accountStore.masterPasswordConfig.salt
            ) {
              console.warn(
                "[Store] Salt mismatch detected during init prefetch (Master Password changed on another device). Auto logging out...",
              );
              await logout();
              setAccountStore("isLoaded", true);
              setSettingsStore("isLoaded", true);
              return;
            }
            await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, content);
          }
        }
      }
    }
    applyInitialView(
      githubConfigured,
      settingsStore.welcomeAccepted,
      isFido2Prompt,
    );
  }

  setAccountStore("isLoaded", true);
  setSettingsStore("isLoaded", true);
}
