import { createStore } from "solid-js/store";
import { ThemeMode, View } from "@/core/types.ts";
import {
  type ConfirmType,
  type GithubUser,
  type ThemeModeType,
  type ToastType,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import type { VaultItem } from "@/features/vault/vault-schemas.ts";

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
  salt: string;
  cachedGithubUser: GithubUser | null;
  lastSync: number;

  isLoaded: boolean;
  isLocked: boolean;
  sessionUnlocked: boolean;
  vaultItems: VaultItem[];

  // PIN settings
  pinUnlockEnabled: boolean;
  pinUnlockValue: string;
  pinUnlockIv: string;
  pinUnlockSalt: string;
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
  salt: "",
  cachedGithubUser: null,
  lastSync: 0,
  isLocked: true,
  sessionUnlocked: false,
  vaultItems: [],
  pinUnlockEnabled: false,
  pinUnlockValue: "",
  pinUnlockIv: "",
  pinUnlockSalt: "",
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
