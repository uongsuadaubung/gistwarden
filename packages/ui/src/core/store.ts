import { createStore } from "solid-js/store";
import { computeHmac, ThemeMode, View } from "@gistwarden/domain";
import {
  type ConfirmType,
  DEFAULT_GITHUB_CONFIG,
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
  getAccountSettings,
  getExtensionSettings,
  type GithubConfig,
  type MasterPasswordSecurityConfig,
  type PinUnlockConfig,
  type ThemeModeType,
  type ToastType,
  updateAccountSettings,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@gistwarden/repository";
import type { TrashVaultItem, VaultItem } from "@gistwarden/domain";

export interface ExtensionSettingsStore {
  language: "en" | "vi";
  welcomeAccepted: boolean;
  theme: ThemeModeType;
  requireMasterPasswordOnRestart: boolean;
  vaultTimeout: VaultTimeoutValue;
  vaultTimeoutAction: VaultTimeoutAction;
  timeOffset: number;
  autoSubmitOnAutofill: boolean;
  showAutofillSuggestionsOnFocus: boolean;
  enablePageAnimations: boolean;
  isLoaded: boolean;
}

export interface AccountStore {
  githubToken: string;
  githubConfigured: boolean;
  gistId: string;
  lastSync: number;

  isLoaded: boolean;
  isLocked: boolean;
  sessionUnlocked: boolean;
  vaultItems: VaultItem[];
  trashItems: TrashVaultItem[];

  // Config groups
  githubConfig: GithubConfig;
  pinConfig: PinUnlockConfig;
  masterPasswordConfig: MasterPasswordSecurityConfig;
}

export interface UiSessionStore {
  view: View;
  selectedItem: VaultItem | null;

  syncing: boolean;
  syncError: string;

  // Global Toast States
  toastMessage: string;
  toastType: ToastType;

  // Confirmation & Reprompt Modal States
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    resolve: ((value: boolean) => void) | null;
  };
  repromptModal: {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
  };

  transitionClass: string;
  globalLoading: boolean;
  globalLoadingText: string;
}

export const initialExtensionSettings: Omit<
  ExtensionSettingsStore,
  "isLoaded"
> = {
  language: "en",
  welcomeAccepted: false,
  theme: ThemeMode.Dark,
  requireMasterPasswordOnRestart: true,
  vaultTimeout: "onSystemLock",
  vaultTimeoutAction: "lock",
  timeOffset: 0,
  autoSubmitOnAutofill: true,
  showAutofillSuggestionsOnFocus: true,
  enablePageAnimations: true,
};

export const initialAccountState: Omit<AccountStore, "isLoaded"> = {
  githubToken: "",
  githubConfigured: false,
  gistId: "",
  lastSync: 0,
  isLocked: true,
  sessionUnlocked: false,
  vaultItems: [],
  trashItems: [],
  githubConfig: DEFAULT_GITHUB_CONFIG,
  pinConfig: DEFAULT_PIN_CONFIG,
  masterPasswordConfig: DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
};

export const initialUiState: UiSessionStore = {
  view: View.Login,
  selectedItem: null,
  syncing: false,
  syncError: "",
  toastMessage: "",
  toastType: "success",
  confirmModal: {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    resolve: null,
  },
  repromptModal: {
    isOpen: false,
    resolve: null,
  },
  transitionClass: "",
  globalLoading: false,
  globalLoadingText: "",
};

export const [settingsStore, setSettingsStore] = createStore<
  ExtensionSettingsStore
>({
  ...initialExtensionSettings,
  isLoaded: false,
});

export const [accountStore, setAccountStore] = createStore<AccountStore>({
  ...initialAccountState,
  isLoaded: false,
});

export const [uiStore, setUiStore] = createStore<UiSessionStore>({
  ...initialUiState,
});

export function resetAccountStore(): void {
  setAccountStore({
    ...initialAccountState,
    isLoaded: true,
  });
}

export function resetUiStore(): void {
  setUiStore({
    ...initialUiState,
  });
}

export async function loadAllStores(): Promise<void> {
  const extRes = await getExtensionSettings();
  if (extRes.isOk()) {
    setSettingsStore({
      ...extRes.value,
    });
  } else {
    setSettingsStore({
      ...initialExtensionSettings,
    });
  }

  const accRes = await getAccountSettings();
  if (accRes.isOk()) {
    const acc = accRes.value;
    const githubConfig = acc.githubConfig || DEFAULT_GITHUB_CONFIG;
    let pinConfig = acc.pinConfig;
    if (pinConfig.enabled) {
      const macRes = await computeHmac(
        String(pinConfig.failedAttempts),
        pinConfig.salt,
      );
      const expectedMac = macRes.isOk() ? macRes.value : "";
      if (
        !pinConfig.failedMac ||
        pinConfig.failedMac !== expectedMac ||
        pinConfig.failedAttempts >= 3
      ) {
        pinConfig = DEFAULT_PIN_CONFIG;
        await updateAccountSettings({ pinConfig });
      }
    }

    let masterPasswordConfig = acc.masterPasswordConfig ||
      DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG;
    const secSalt = masterPasswordConfig.salt || "master_password_hmac_secret";
    if (
      masterPasswordConfig.failedAttempts > 0 ||
      masterPasswordConfig.lockoutUntil > 0
    ) {
      const macRes = await computeHmac(
        `${masterPasswordConfig.failedAttempts}:${masterPasswordConfig.lockoutUntil}`,
        secSalt,
      );
      const expectedMac = macRes.isOk() ? macRes.value : "";
      if (
        !masterPasswordConfig.failedMac ||
        masterPasswordConfig.failedMac !== expectedMac
      ) {
        masterPasswordConfig = DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG;
        await updateAccountSettings({ masterPasswordConfig });
      }
    }

    setAccountStore({
      gistId: githubConfig.gistId,
      githubConfig,
      lastSync: acc.lastSync,
      pinConfig,
      masterPasswordConfig,
      githubConfigured: !!githubConfig.gistId && !!masterPasswordConfig.salt,
    });
  } else {
    setAccountStore({
      ...initialAccountState,
    });
  }
}
