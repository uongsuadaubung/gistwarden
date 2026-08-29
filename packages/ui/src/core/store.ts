import type {
  Folder,
  GoogleMigrationPayload,
  TrashVaultItem,
  VaultItem,
  VaultPayload,
} from "@gistwarden/domain";
import { ThemeMode, View } from "@gistwarden/domain";
import {
  checkVaultConfiguredUseCase,
  validateSecurityConfigUseCase,
} from "@gistwarden/orchestrator";
import {
  type ConfirmType,
  DEFAULT_EXCLUDED_DOMAINS,
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
  DEFAULT_SYNC_CONFIG,
  getAccountSettings,
  getExtensionSettings,
  type MasterPasswordSecurityConfig,
  type PinUnlockConfig,
  type SyncConfig,
  type ThemeModeType,
  type ToastType,
  type VaultMode,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@gistwarden/repository";
import { createStore } from "solid-js/store";

export interface ExtensionSettingsStore {
  language: "en" | "vi";
  welcomeAccepted: boolean;
  theme: ThemeModeType;
  requireMasterPasswordOnRestart: boolean;
  vaultTimeout: VaultTimeoutValue;
  vaultTimeoutAction: VaultTimeoutAction;
  timeOffset: number;
  autoSubmitOnAutofill: boolean;
  autoCopyTotp: boolean;
  showAutofillSuggestionsOnFocus: boolean;
  enablePageAnimations: boolean;
  excludedDomains: readonly string[];
  vaultMode: VaultMode;
  isLoaded: boolean;
}

export interface AccountStore {
  syncToken: string;
  vaultConfigured: boolean;
  gistId: string;
  lastSync: number;

  isLoaded: boolean;
  isLocked: boolean;
  sessionUnlocked: boolean;
  hasUnlockedInSession: boolean;
  folders: Folder[];
  vaultItems: VaultItem[];
  trashItems: TrashVaultItem[];

  // Config groups
  syncConfig: SyncConfig;
  pinConfig: PinUnlockConfig;
  masterPasswordConfig: MasterPasswordSecurityConfig;
}

export interface UiSessionStore {
  view: View;
  selectedItem: VaultItem | null;
  pendingGoogleMigrationPayload: GoogleMigrationPayload | null;

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
    hideCancel?: boolean;
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
  vaultTimeout: "onRestart",
  vaultTimeoutAction: "lock",
  timeOffset: 0,
  autoSubmitOnAutofill: true,
  autoCopyTotp: true,
  showAutofillSuggestionsOnFocus: true,
  enablePageAnimations: true,
  excludedDomains: DEFAULT_EXCLUDED_DOMAINS,
  vaultMode: "github_gist",
};

export const initialAccountState: Omit<AccountStore, "isLoaded"> = {
  syncToken: "",
  vaultConfigured: false,
  gistId: "",
  lastSync: 0,
  isLocked: true,
  sessionUnlocked: false,
  hasUnlockedInSession: false,
  folders: [],
  vaultItems: [],
  trashItems: [],
  syncConfig: { ...DEFAULT_SYNC_CONFIG },
  pinConfig: { ...DEFAULT_PIN_CONFIG },
  masterPasswordConfig: { ...DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG },
};

export const initialUiState: UiSessionStore = {
  view: View.Login,
  selectedItem: null,
  pendingGoogleMigrationPayload: null,
  syncing: false,
  syncError: "",
  toastMessage: "",
  toastType: "success",
  confirmModal: {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    hideCancel: false,
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

export const [settingsStore, setSettingsStore] =
  createStore<ExtensionSettingsStore>({
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

export function applyVaultPayloadToStore(payload: VaultPayload): void {
  setAccountStore({
    folders: payload.folders || [],
    vaultItems: payload.items || [],
    trashItems: payload.trash || [],
  });
}

export function resetAccountStore(savedServerUrl?: string): void {
  setAccountStore({
    ...initialAccountState,
    syncConfig: {
      ...DEFAULT_SYNC_CONFIG,
      ...(savedServerUrl ? { serverUrl: savedServerUrl } : {}),
    },
    pinConfig: { ...DEFAULT_PIN_CONFIG },
    masterPasswordConfig: { ...DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG },
    isLoaded: true,
  });
}

export function resetUiStore(): void {
  setUiStore({
    ...initialUiState,
  });
}

export function resetSettingsStore(): void {
  setSettingsStore({
    ...initialExtensionSettings,
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

  const activeMode = settingsStore.vaultMode;
  const accRes = await getAccountSettings(activeMode);
  if (accRes.isOk()) {
    const acc = accRes.value;
    const _syncConfig = acc.syncConfig || DEFAULT_SYNC_CONFIG;
    const masterPasswordConfig =
      acc.masterPasswordConfig || DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG;
    const secSalt = masterPasswordConfig.salt || "master_password_hmac_secret";
    await validateSecurityConfigUseCase(activeMode, secSalt);
    const updatedAcc = (await getAccountSettings(activeMode)).unwrapOr(acc);

    const isConfigured = await checkVaultConfiguredUseCase(activeMode, acc);
    const activeSyncConfig = updatedAcc.syncConfig || DEFAULT_SYNC_CONFIG;

    setAccountStore({
      gistId: activeSyncConfig.gistId,
      syncConfig: activeSyncConfig,
      lastSync: updatedAcc.lastSync,
      pinConfig: updatedAcc.pinConfig,
      masterPasswordConfig: updatedAcc.masterPasswordConfig,
      vaultConfigured: isConfigured,
    });
  } else {
    setAccountStore({
      ...initialAccountState,
    });
  }
}
