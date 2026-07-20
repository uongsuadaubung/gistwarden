export const POPUP_WIDTH = 480;
export const POPUP_HEIGHT = 600;
export const POPOUT_HEIGHT = 660;
export const FIDO2_PROMPT_HEIGHT = 650;
export const APP_NAME = "Gistwarden";
export const OAUTH_CLIENT_ID = "Ov23liRxwWqLXD5AOkNW";
export const OAUTH_WORKER_URL = "https://gistwarden.uongsuadaubung.workers.dev";
export const FIREFOX_ADDON_SLUG = "gistwarden";

// Chrome Session Storage Keys
export const SESSION_KEY_DERIVED_KEY = "derivedKey";
export const SESSION_KEY_VERIFICATION_IV = "verificationIv";
export const SESSION_KEY_VERIFICATION_CIPHERTEXT = "verificationCiphertext";
export const SESSION_KEY_SESSION_UNLOCKED = "sessionUnlocked";
export const SESSION_KEY_ENCRYPTED_VAULT = "encryptedVault";
export const SESSION_KEY_LAST_VIEW = "lastView";
export const SESSION_KEY_LAST_SELECTED_ITEM_ID = "lastSelectedItemId";
export const SESSION_KEY_GITHUB_TOKEN = "githubToken";
export const SESSION_KEY_PENDING_GITHUB_TOKEN = "pendingGithubToken";
export const SESSION_KEY_SESSION_INITIALIZED = "session_initialized";
export const SESSION_KEY_PENDING_FIDO2_REQUEST = "pending_fido2_request";

// IPC Message Types
export const MSG_START_GITHUB_OAUTH = "START_GITHUB_OAUTH";
export const MSG_GET_PENDING_FIDO2_REQUEST = "GET_PENDING_FIDO2_REQUEST";
export const MSG_RESOLVE_FIDO2_REQUEST = "RESOLVE_FIDO2_REQUEST";
export const MSG_REJECT_FIDO2_REQUEST = "REJECT_FIDO2_REQUEST";
export const MSG_UPLOAD_TO_GIST = "UPLOAD_TO_GIST";
export const MSG_DELETE_GIST = "DELETE_GIST";
export const MSG_DOWNLOAD_FROM_GIST = "DOWNLOAD_FROM_GIST";
export const MSG_RESET_TIMEOUT = "RESET_TIMEOUT";
export const MSG_VALIDATE_TOKEN = "VALIDATE_TOKEN";
export const MSG_VAULT_LOCKED = "VAULT_LOCKED";
export const MSG_VAULT_LOGGED_OUT = "VAULT_LOGGED_OUT";
export const MSG_FIDO2_CREDENTIAL_CREATION_REQUEST =
  "FIDO2_CREDENTIAL_CREATION_REQUEST";
export const MSG_FIDO2_CREDENTIAL_GET_REQUEST = "FIDO2_CREDENTIAL_GET_REQUEST";
export const MSG_AUTOFILL_CREDENTIALS = "AUTOFILL_CREDENTIALS";
export const MSG_FIDO2_HEARTBEAT = "FIDO2_HEARTBEAT";

// Browser Session Storage Keys
export const SESSION_KEY_VAULT_SEARCH_QUERY = "vault_search_query";
export const SESSION_KEY_SHOW_FILTER_PANEL = "showFilterPanel";
export const SESSION_KEY_SELECTED_FILTER_TYPE = "selectedFilterType";

// Browser Local Storage Keys
export const LOCAL_STORAGE_KEY_THEME = "gistwarden_theme";

// SolidJS Store Keys
export const STORE_KEY_TOAST_MESSAGE = "toastMessage";
export const STORE_KEY_TOAST_TYPE = "toastType";
export const STORE_KEY_GLOBAL_LOADING = "globalLoading";
export const STORE_KEY_GLOBAL_LOADING_TEXT = "globalLoadingText";
export const STORE_KEY_THEME = "theme";
export const STORE_KEY_VIEW = "view";
export const STORE_KEY_IS_LOCKED = "isLocked";
export const STORE_KEY_VAULT_ITEMS = "vaultItems";
export const STORE_KEY_SELECTED_ITEM = "selectedItem";
export const STORE_KEY_SALT = "salt";
export const STORE_KEY_LAST_SYNC = "lastSync";
export const STORE_KEY_IS_LOADED = "isLoaded";
export const STORE_KEY_SYNCING = "syncing";
export const STORE_KEY_SYNC_ERROR = "syncError";
export const STORE_KEY_CONFIRM_MODAL = "confirmModal";
export const STORE_KEY_REPROMPT_MODAL = "repromptModal";
export const STORE_KEY_LANGUAGE = "language";
export const STORE_KEY_TIME_OFFSET = "timeOffset";

// Alarm Names
export const ALARM_NAME_VAULT_TIMEOUT = "vaultTimeout";
