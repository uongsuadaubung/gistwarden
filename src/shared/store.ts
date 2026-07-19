import { createStore } from "solid-js/store";
import type { GithubUser } from "./storage.ts";
import {
  type ConfirmType,
  ThemeMode,
  type ThemeModeType,
  type ToastType,
  type VaultItem,
  type VaultTimeoutAction,
  View,
} from "./types.ts";

export interface AppStore {
  githubToken: string;
  githubConfigured: boolean;
  gistId: string;
  salt: string;
  cachedGithubUser: GithubUser | null;
  lastSync: number;
  language: "en" | "vi";
  welcomeAccepted: boolean;

  isLoaded: boolean;
  isLocked: boolean;
  view: View;
  vaultItems: VaultItem[];
  selectedItem: VaultItem | null;

  syncing: boolean;
  syncError: string;

  // Global Toast States
  toastMessage: string;
  toastType: ToastType;

  // Reusable Confirmation Modal States
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    resolve: ((value: boolean) => void) | null;
  };
  // Master Password Reprompt Modal States
  repromptModal: {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
  };
  transitionClass: string;
  theme: ThemeModeType;
  globalLoading: boolean;
  globalLoadingText: string;

  // PIN settings
  pinUnlockEnabled: boolean;
  pinUnlockValue: string;
  pinUnlockIv: string;
  pinUnlockSalt: string;
  requireMasterPasswordOnRestart: boolean;
  // Session timeout settings
  vaultTimeout: string;
  vaultTimeoutAction: VaultTimeoutAction;
  sessionUnlocked: boolean;
  timeOffset: number;
}

export const [store, setStore] = createStore<AppStore>({
  githubToken: "",
  githubConfigured: false,
  gistId: "",
  salt: "",
  cachedGithubUser: null,
  lastSync: 0,
  language: "en",
  welcomeAccepted: false,

  isLoaded: false,
  isLocked: true,
  view: View.Login,
  vaultItems: [],
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
  theme: ThemeMode.Dark,
  globalLoading: false,
  globalLoadingText: "",

  pinUnlockEnabled: false,
  pinUnlockValue: "",
  pinUnlockIv: "",
  pinUnlockSalt: "",
  requireMasterPasswordOnRestart: true,
  vaultTimeout: "onRestart",
  vaultTimeoutAction: "lock",
  sessionUnlocked: false,
  timeOffset: 0,
});
