import { APP_NAME } from "../constants.ts";

export default {
  APP_NAME,
  // Common buttons & notifications
  btn_save: "Save",
  btn_cancel: "Cancel",
  btn_delete: "Delete",
  btn_edit: "Edit",
  btn_create: "Create",
  btn_close: "Close",
  btn_copy: "Copy",
  btn_copied: "Copied!",
  btn_clear: "Clear",
  btn_confirm: "Confirm",
  confirm_title: "Confirmation",
  dialog_loading: "Processing...",
  toast_success: "Success!",
  toast_error: "An error occurred!",
  toast_pin_disabled: "PIN unlock disabled",
  toast_pin_set_success: "PIN set successfully!",
  toast_timeout_updated: "Timeout settings updated",
  confirm_disable_pin: "Are you sure you want to disable PIN unlock?",
  badge_status_locked: "{APP_NAME} (Locked)",
  badge_status_unlocked: "{APP_NAME} (Unlocked)",

  // Fallback Item Names
  fallback_name_default: "Untitled",
  fallback_name_login: "Untitled Login",
  fallback_name_note: "Untitled Note",
  fallback_name_card: "Untitled Card",
  fallback_name_identity: "Untitled Identity",
  fallback_name_ssh_key: "Untitled SSH Key",

  // Detailed Error Messages
  provider_error_missing_token: "Missing authentication access token.",
  provider_error_unauthorized: "Access token is missing, expired or invalid.",
  provider_error_not_found: "Vault dataset not found on provider server.",
  provider_error_network: "Network connection error to provider server.",
  provider_error_user_parse_failed: "Failed to authenticate user info.",
  provider_error_create_failed:
    "Failed to create a new Vault on provider server.",
  provider_error_file_missing: "Vault data file missing on provider server.",
  provider_error_parse_failed:
    "Vault data from server is invalid or corrupted.",
  provider_error_missing_id: "Missing data ID to process request.",
  vault_error_not_found: "Vault data not found.",
  sync_error_corrupted_payload:
    "Sync data is corrupted or cannot be decrypted.",
  sync_error_remote_password_changed:
    "Master password has been changed on another device. Please log in again.",
  sync_error_invalid_format: "Vault data format is invalid.",

  // Trash View
  trash_title: "Trash",
  trash_empty: "Trash is empty",
  trash_restore: "Restore",
  trash_purge: "Delete permanently",
  trash_purge_all: "Empty Trash",
  trash_confirm_purge_all: "Empty Trash Confirmation",
  trash_confirm_purge_all_msg:
    "Are you sure you want to permanently delete all items in the trash? This action cannot be undone.",
  trash_deleted_date: "Deleted",
  vault_options_trash_sub: "View and restore deleted items",

  tab_error_get_current: "Failed to query current browser tab.",
  tab_error_send_message: "Failed to send message to browser tab.",
  tab_error_capture: "Failed to capture browser tab.",
  tab_error_open: "Failed to open link in a new tab.",
  messaging_error_send_failed: "Failed to communicate with background process.",
  network_error_fetch_failed:
    "Network request failed. Please check internet connection.",
  network_error_http_status: "Server returned an HTTP error status.",
  network_error_read_failed: "Failed to read response data from server.",
  network_error_unauthorized:
    "Access token expired or unauthorized (401). System is logging out...",
  network_error_payload_too_large:
    "Vault payload size exceeds limit (413). Please reduce vault size.",
  network_error_rate_limit:
    "Server rate limit exceeded (429). Please try again later.",
  crypto_error_encrypt_failed: "Data encryption failed.",
  totp_error_invalid_secret: "Invalid TOTP secret key.",
  clipboard_copy_failed: "Failed to copy content to clipboard.",
  clipboard_access_denied: "Clipboard access was denied.",
  clipboard_read_failed: "Failed to read content from clipboard.",

  // Notification Toast Bar
  notification_save_title: "Save password suggestion",
  notification_update_title: "Update password suggestion",
  notification_save_prompt_prefix: "Would you like to save the password for ",
  notification_save_prompt_suffix: "?",
  notification_update_prompt_prefix:
    "Would you like to update the password for ",
  notification_update_prompt_suffix: "?",
  notification_btn_save: "Save Password",
  notification_btn_update: "Update",
  notification_autofill_title: "Autofill Suggestion",
  notification_autofill_prompt_prefix: "Autofill credentials for ",
  notification_autofill_prompt_suffix: "?",
  notification_btn_autofill: "Fill Now",

  // Login Page
  login_title_locked: "Vault is Locked",
  login_title_setup: "Configure GitHub Gist Cloud Storage",
  login_method_oauth: "Login with GitHub (OAuth)",
  login_method_pat: "Use Token (PAT)",
  login_pat_label: "GitHub Personal Access Token (PAT)",
  login_pat_help:
    "Token needs <strong>gist</strong> scope. The extension will create a secret Gist to store your encrypted vault.",
  login_oauth_help:
    "Connect securely to your GitHub account to sync your vault automatically via Cloudflare Worker Proxy.",
  login_btn_save_token: "Connect GitHub (PAT)",
  login_btn_oauth: "Sign in with GitHub",
  login_master_password: "Master Password",
  pwd_strength_very_weak: "Very Weak",
  pwd_strength_weak: "Weak",
  pwd_strength_fair: "Fair",
  pwd_strength_strong: "Strong",
  pwd_strength_very_strong: "Very Strong",
  login_placeholder_mp: "Enter your {login_master_password}...",
  login_btn_unlock: "Unlock",
  login_forgot_password: "Forgot {login_master_password}?",
  login_error_empty_pat: "GitHub token is empty.",
  login_error_empty_username: "Please enter username.",
  login_error_empty_password: "Please enter account password.",
  login_error_invalid_token: "Invalid token or connection error",
  login_error_oauth_no_token: "Did not receive access token from GitHub",
  login_error_oauth_fail: "OAuth Login failed",
  login_error_empty_mp: "Please enter {login_master_password}",
  login_error_wrong_mp: "{login_master_password} incorrect",
  caps_lock_on: "Caps Lock is on",
  login_error_changed_mp_hint:
    "If you recently changed your {login_master_password} on another device, you need to log out and log in again.",
  login_error_mp_cooldown:
    "Too many failed {login_master_password} attempts. Please try again later.",
  login_error_mp_tampered:
    "{login_master_password} security data has been tampered with. System logged out for protection.",
  login_forgot_password_title: "Forgot {login_master_password}",
  login_forgot_password_msg:
    "{APP_NAME} uses end-to-end encryption (Zero-Knowledge). The {login_master_password} is never sent or stored on any server, hence there is <strong class='text-error'>NO WAY</strong> to recover or reset it.<br/><br/>To start over, the system will <strong>LOG OUT</strong> and <strong>CLEAR LOCAL DATA</strong>.<br/><br/>If you want to continue using this GitHub account, the system will open the GitHub Gist page containing the old vault so you can <strong>BACK UP</strong> the data or <strong class='text-error'>MANUALLY DELETE</strong> this Gist on GitHub before logging in again.<br/><br/>Are you sure you want to log out and open the old Gist page?",
  login_local_forgot_password_title:
    "Forgot Local Vault {login_master_password}?",
  login_local_forgot_password_msg:
    "Local Vault encrypts data 100% locally on your device and holds no recovery key. If you forget your {login_master_password}, your current vault data <strong class='text-error'>CANNOT</strong> be decrypted or recovered.<br/><br/>To confirm wiping the locked vault and resetting, please type <strong class='text-error'>RESET</strong> in the box below:",
  login_local_reset_btn: "Wipe & Reset Vault",
  login_local_reset_placeholder: "Type RESET to confirm...",
  app_loading: "Loading {APP_NAME}...",
  login_or: "Or",
  login_error_password_mismatch: "Password confirmation does not match",
  login_enter_master_password: "Enter {login_master_password}",
  login_confirm_master_password: "Re-enter to confirm",
  login_btn_create_master_password: "Create {login_master_password}",
  login_checking_gist: "Checking data...",
  login_local_vault_must_read: "Important guidelines & warnings",
  login_local_vault_must_read_btn: "Must read",
  login_btn_access_local: "Access Local Vault",
  login_self_hosted_must_read: "Important guidelines & setup",
  login_self_hosted_must_read_btn: "Must read",

  // Vault Page
  vault_search_placeholder: "Search accounts...",
  vault_filter_title: "Filter",
  vault_filter_type: "Type",
  vault_filter_all_types: "All types",
  items_with_no_folder: "Items with no folder",
  vault_item_folder: "Folder",
  folder_new_title: "New folder",
  folder_edit_title: "Edit folder",
  folder_name_label: "Folder name",
  folder_name_placeholder: "Enter folder name...",
  folder_select_label: "Folder",
  folder_no_folder_option: "No folder",
  folder_error_empty_name: "Please enter a folder name",
  folder_error_duplicate_name: "A folder with this name already exists",
  folder_add_success: "Folder created successfully",
  folder_rename_success: "Folder renamed successfully",
  folder_delete_success: "Folder deleted successfully",
  folder_confirm_delete_title: "Delete folder",
  folder_confirm_delete_msg:
    "Are you sure you want to delete this folder? Items in this folder will not be deleted.",
  folder_management_title: "Folders",
  vault_options_folders_sub: "Create, edit, and organize folders",
  vault_empty_subtitle:
    "Your vault is empty. Click the + button below to add a new account.",
  vault_btn_sync: "Sync",
  vault_btn_add: "Add Item",
  vault_popout_title: "Open in separate window",
  vault_lock_title: "Lock vault",
  vault_suggested_items: "Suggested for this website",
  vault_all_items: "All Accounts",
  vault_section_cards: "Cards",
  vault_section_identities: "Identities",
  vault_search_results: "Search Results",
  vault_no_search_matches: "No matching accounts found",
  vault_menu_favorites: "Favorites",
  vault_item_login: "Login",
  vault_item_note: "Secure Note",
  vault_item_card: "Card",
  vault_item_identity: "Identity",
  vault_item_ssh_key: "SSH Key",
  vault_syncing: "Syncing...",
  vault_sync_error: "Sync Error",
  vault_no_username: "No username",
  vault_copy_notes: "Copy Secure Note",
  vault_copy_options: "Copy Options",
  vault_menu_unfavorite: "Remove from Favorites",
  vault_menu_more: "More options",
  vault_menu_select: "Select",
  vault_importing: "Importing vault data...",
  btn_clone: "Clone",
  vault_item_clone_suffix: "Copy",
  vault_btn_select_mode: "Select mode",
  vault_selected_count: "{count} selected",
  vault_select_all: "Select all",
  vault_deselect_all: "Deselect all",
  vault_btn_delete_selected: "Delete selected",
  vault_btn_move_to_folder: "Move to folder",
  vault_move_to_folder_modal_title: "Move selected items to folder",
  vault_move_to_folder_success: "Moved {count} item(s) to folder",
  vault_confirm_bulk_delete_title: "Confirm Deletion",
  vault_confirm_bulk_delete_msg:
    "Are you sure you want to delete {count} selected item(s)?",

  // Item Edit / Add Page
  edit_title_add_login: "Add Login",
  edit_title_edit_login: "Edit Login",
  edit_title_add_note: "Add Secure Note",
  edit_title_edit_note: "Edit Secure Note",
  edit_title_add_card: "Add Card",
  edit_title_edit_card: "Edit Card",
  edit_title_add_identity: "Add Identity",
  edit_title_edit_identity: "Edit Identity",
  edit_title_add_ssh_key: "Add SSH Key",
  edit_title_edit_ssh_key: "Edit SSH Key",
  edit_label_name: "Name",
  edit_placeholder_name: "e.g., Facebook, Google...",
  edit_label_username: "Username",
  edit_placeholder_username: "Username or email...",
  edit_label_password: "Password",
  edit_placeholder_password: "Account password...",
  edit_gen_btn_title: "Generate Password",
  edit_gen_random_password: "Random Password",
  edit_gen_passphrase: "Passphrase",
  edit_label_totp: "Authenticator Key (TOTP)",
  edit_placeholder_totp: "Paste secret key (Base32) or otpauth:// URI...",
  edit_label_website: "Website URI",
  edit_label_notes: "Notes",
  edit_placeholder_notes: "Enter notes here...",
  edit_label_reprompt: "Require master password re-prompt for this item",
  reprompt_modal_title: "Master password confirmation",
  reprompt_modal_desc:
    "This action is protected. To continue, please re-enter your master password to verify your identity.",
  reprompt_modal_label: "Master password",
  reprompt_modal_placeholder: "",
  reprompt_modal_confirm: "Ok",
  edit_section_additional_options: "Additional options",
  edit_section_item_details: "Item details",
  edit_label_fields: "Custom Fields",
  edit_field_type_text: "Text",
  edit_field_type_hidden: "Hidden",
  edit_field_type_boolean: "Checkbox",
  edit_field_type_linked: "Linked",
  edit_field_name_placeholder: "Field Name",
  edit_field_val_placeholder: "Field Value",
  edit_btn_add_field: "Add field",
  edit_btn_add_website: "Add website",
  edit_btn_delete_website: "Delete website",
  edit_error_empty_name: "Please enter a name",
  edit_confirm_delete_title: "Delete Item",
  edit_confirm_delete_msg:
    "Are you sure you want to delete '{name}'? This action cannot be undone.",
  edit_type_note: "Secure Note",
  edit_placeholder_name_note: "e.g., Recovery codes, config...",
  edit_placeholder_name_login: "e.g., Google, Facebook...",
  edit_field_modal_title_add: "Add Custom Field",
  edit_field_modal_title_edit: "Edit Custom Field",
  edit_field_modal_label_type: "Field Type",
  edit_field_type_divider: "Divider",
  edit_field_modal_placeholder_name: "e.g., device, pin, ip...",
  edit_field_modal_placeholder_divider: "e.g., CONFIG, APIS...",
  edit_field_error_empty_divider: "Please enter a divider group name",
  edit_field_error_empty_name: "Please enter a field name",
  edit_qr_success: "QR code successfully scanned and filled!",
  edit_qr_error_no_match:
    "No QR code found on the screen. Please ensure the QR code is visible on the web page behind the popup.",
  edit_qr_error_fail: "Failed to scan QR code",
  edit_confirm_delete_passkey_title: "Delete Passkey",
  edit_confirm_delete_passkey_msg:
    "Are you sure you want to delete this Passkey? This will unlink the Passkey login from this account.",
  edit_toast_updated_note: "Secure note updated!",
  edit_toast_updated_login: "Login account updated!",
  edit_toast_created_note: "Secure note created successfully!",
  edit_toast_created_login: "Login account created successfully!",
  edit_toast_created_card: "Card created successfully!",
  edit_toast_updated_card: "Card updated successfully!",
  edit_toast_updated_identity: "Identity updated!",
  edit_toast_created_identity: "Identity created successfully!",
  edit_toast_updated_ssh_key: "SSH Key updated!",
  edit_toast_created_ssh_key: "SSH Key created successfully!",

  // Item Detail Page
  detail_title_login: "Login Details",
  detail_title_note: "Secure Note Details",
  detail_title_card: "View Card",
  detail_title_identity: "Identity Details",
  detail_title_ssh_key: "View SSH key",
  detail_totp_copied: "TOTP code copied",
  detail_totp_error: "ERROR CODE",
  detail_copy_username: "Copy username",
  detail_copy_password: "Copy password",
  detail_copy_totp: "Copy TOTP code",
  detail_copy_card_number: "Copy card number",
  detail_copy_card_code: "Copy security code",
  detail_copied: "Copied!",
  detail_passkey_webauthn: "Passkey",
  detail_creation_date: "Created",
  detail_revision_date: "Modified",
  detail_card_expired_title: "Expired card",
  detail_card_expired_desc:
    "If you've renewed it, update the card's information",
  detail_card_cardholder: "Cardholder name",
  detail_card_number: "Number",
  detail_card_brand: "Brand",
  detail_card_expiration: "Expiration",
  detail_card_security_code: "Security code",
  detail_card_details_title: "{brand} details",
  detail_identity_personal_section: "Personal Details",
  detail_identity_identification_section: "Identification",
  detail_identity_contact_section: "Contact Info",
  detail_identity_title: "Title",
  detail_identity_first_name: "First name",
  detail_identity_middle_name: "Middle name",
  detail_identity_last_name: "Last name",
  detail_identity_username: "Username",
  detail_identity_company: "Company",
  detail_identity_ssn: "SSN",
  detail_identity_passport: "Passport number",
  detail_identity_license: "Driver's license",
  detail_identity_email: "Email",
  detail_identity_phone: "Phone",
  detail_identity_address: "Address",
  detail_identity_city: "City",
  detail_identity_state: "State",
  detail_identity_postal_code: "Postal code",
  detail_identity_country: "Country",
  detail_ssh_private_key: "Private key",
  detail_ssh_public_key: "Public key",
  detail_ssh_fingerprint: "Fingerprint",
  ssh_invalid_key:
    "Invalid SSH Private Key or format unsupported (requires unencrypted OpenSSH format)",
  storage_error: "Storage operation failed.",
  ssh_import_from_clipboard:
    "Paste unencrypted OpenSSH Private Key from clipboard",
  detail_copy_ssh_private_key: "Copy private key",
  detail_copy_ssh_public_key: "Copy public key",
  detail_copy_ssh_fingerprint: "Copy fingerprint",
  detail_item_history: "Item history",
  detail_section_login: "Login Credentials",
  detail_no_value: "None",
  detail_section_security: "Security & OTP",
  detail_totp_label: "Verification code (TOTP)",
  detail_section_autofill: "Auto-fill Options",
  detail_visit_website: "Visit website",

  // Settings Page
  settings_header: "Settings",
  settings_change_mp: "Change {login_master_password}",
  settings_export: "Export Vault (JSON)",
  settings_clear_vault: "Clear Vault",
  settings_logout: "Logout GitHub Account",
  settings_label_language: "Language / Ngôn ngữ",
  settings_lang_vi: "Tiếng Việt",
  settings_lang_en: "English",
  settings_last_sync: "Last Synced",
  settings_sync_never: "Never",
  settings_version: "Version: {ver}",
  settings_theme_label: "Theme",
  settings_theme_sub: "Current: {theme}",
  settings_appearance_label: "Appearance",
  settings_appearance_sub: "Language and theme settings",
  settings_about_label: "About",
  settings_about_sub: "Version and homepage information",
  settings_rate_label: "Rate & Review",
  settings_rate_sub: "Support us on the web store",
  settings_sync_time_label: "Sync Time",
  settings_sync_time_sub: "Synchronize clock with server for TOTP",
  settings_sync_time_loading: "Syncing time...",
  settings_sync_time_success: "Time synchronized successfully!",
  settings_sync_time_error:
    "Failed to synchronize time. Please check your internet connection.",
  settings_troubleshooting_label: "Troubleshooting",
  settings_troubleshooting_sub: "Fix sync and time issues",
  settings_theme_dark: "Dark",
  settings_theme_light: "Light",
  settings_vault_options_label: "Vault Options",
  settings_vault_options_sub: "Sync, import and export data",
  settings_enable_animations_label: "Page Animations",
  settings_enable_animations_sub:
    "Enable smooth slide animations when navigating pages",
  settings_autofill_options_label: "Autofill & Auto-submit",
  settings_autofill_options_sub:
    "Configure autofill suggestions and auto-submit",
  autofill_options_title: "Autofill Options",
  autofill_options_header: "Autofill & Auto-submit",
  show_autofill_suggestions_label: "Show autofill suggestions on input focus",
  show_autofill_suggestions_sub:
    "Automatically display credential suggestion popup when focusing on login input fields",
  auto_submit_on_autofill_label: "Auto-submit after autofill",
  auto_submit_on_autofill_sub:
    "Automatically submit form or click Login button after selecting an account from suggestions",
  auto_copy_totp_label: "Auto-copy TOTP to clipboard",
  auto_copy_totp_sub:
    "Automatically copy the 6-digit TOTP code to the clipboard when autofilling logins with 2FA",
  toast_totp_copied: "TOTP code copied to clipboard",
  autofill_excluded_domains_title: "Excluded Domains",
  autofill_excluded_domains_sub:
    "Never prompt to save passwords or display autofill suggestions on these websites",
  autofill_excluded_domain_placeholder: "e.g., domain.com",
  autofill_btn_add_domain: "Add",
  autofill_excluded_domain_default_tag: "Default",
  settings_account_security: "Account Security",
  settings_account_security_sub: "PIN unlock and session timeout options",
  account_security_title: "Account Security",
  unlock_options_header: "Unlock options",
  unlock_with_pin: "Unlock with PIN",
  require_master_password_on_restart:
    "Require master password on browser restart",
  timeout_label: "Timeout",
  timeout_action_label: "Timeout action",
  timeout_action_lock: "Lock",
  timeout_action_logout: "Log out",
  timeout_on_restart: "On browser restart",
  timeout_1min: "1 minute",
  timeout_5min: "5 minutes",
  timeout_15min: "15 minutes",
  timeout_30min: "30 minutes",
  timeout_1hr: "1 hour",
  timeout_4hr: "4 hours",
  set_pin_title: "Set PIN",
  set_pin_desc:
    "You can use this PIN to unlock {APP_NAME}. Your PIN will be reset if you ever fully log out of the application.",
  set_pin_label: "PIN",
  set_pin_error_length: "PIN must be at least 4 characters.",
  login_unlock_with_pin: "Unlock with PIN",
  login_unlock_with_mp: "Unlock with {login_master_password}",
  login_pin_placeholder: "Enter your PIN...",
  login_error_wrong_pin: "Incorrect PIN.",
  login_error_wrong_pin_2_left: "Incorrect PIN. 2 attempts remaining.",
  login_error_wrong_pin_1_left: "Incorrect PIN. 1 attempt remaining!",
  login_error_pin_max_attempts_reached:
    "Incorrect PIN entered 3 times. PIN unlock has been disabled, please use your {login_master_password}.",
  login_error_pin_tampered:
    "PIN security data tampered. PIN unlock has been disabled, please use your {login_master_password}.",
  settings_change_mp_title: "Change {login_master_password}",
  vault_options_group_sync_import: "Sync & Data Transfer",
  vault_options_group_management: "Storage & Management",
  vault_options_group_danger: "Danger Zone",
  settings_change_mp_sub: "Re-encrypt vault with a new master password",
  settings_clear_vault_sub: "Permanently delete all vault data",
  settings_open_gist_title: "Open storage Gist on GitHub",
  settings_change_mp_current: "Current {login_master_password}",
  settings_change_mp_new: "New {login_master_password}",
  settings_change_mp_confirm: "Confirm New {login_master_password}",
  settings_error_mp_wrong_current:
    "Current {login_master_password} is incorrect",
  settings_error_mp_empty_new: "New {login_master_password} cannot be empty",
  settings_error_mp_mismatch: "Password confirmation does not match",
  settings_error_mp_fail: "Failed to change password",
  settings_error_fields_required: "Please fill in all fields",
  settings_mp_success: "{login_master_password} changed successfully!",
  settings_export_success: "Backup file downloaded!",
  settings_clear_vault_confirm_title: "Confirm Permanent Deletion",
  clear_vault_confirm_prompt_msg:
    "This action will PERMANENTLY DELETE all items, folders, and data in the vault. This action <strong class='text-error'>CANNOT BE UNDONE</strong>.<br/><br/>To confirm permanently deleting the vault, please type <strong class='text-error'>DELETE</strong> in the box below:",
  clear_vault_confirm_placeholder: "Type DELETE to confirm...",
  settings_clear_vault_success: "All vault accounts deleted successfully!",
  settings_logout_title: "Logout",
  settings_logout_msg:
    "Are you sure you want to disconnect your account? This will remove all local configurations.",
  vault_sync_success: "Vault synced successfully!",
  vault_import_success:
    "Successfully imported {count} accounts! The vault has been updated successfully.",
  vault_import_error_invalid: "Invalid file format or validation failed",
  vault_options_sync_manual: "Manual Sync",
  vault_options_import: "Import Data",
  vault_options_import_sub: "Import passwords from browsers or backups",
  vault_options_export: "Export Data",
  vault_options_export_sub: "Export passwords to CSV or backup JSON file",
  settings_import_accounts_title: "Import Data",
  import_option_browser: "Import from Browser (CSV)",
  import_option_browser_sub: "Supports auto-detecting Chrome, Edge, Firefox...",
  import_option_bitwarden_csv: "Bitwarden (CSV)",
  import_option_bitwarden_csv_sub:
    "Import credentials exported from Bitwarden as CSV",
  import_option_json: "{APP_NAME} / Bitwarden (JSON)",
  import_option_json_sub: "Import backup file as JSON",
  import_error_browser_invalid:
    "CSV file is missing mandatory columns: url, username, password.",
  import_error_bitwarden_invalid:
    "Column headers do not match Bitwarden CSV format.",
  vault_import_csv_error_fail: "Error importing browser or Bitwarden CSV file.",
  settings_export_accounts_title: "Export Data",
  export_option_browser: "Export to Browser (CSV)",
  export_option_browser_sub:
    "CSV file compatible with Google Chrome, Microsoft Edge...",
  export_option_bitwarden_csv: "Bitwarden (CSV)",
  export_option_bitwarden_csv_sub:
    "CSV file compatible for importing into Bitwarden",
  export_option_json: "{APP_NAME} / Bitwarden (JSON)",
  export_option_json_sub: "Export unencrypted backup JSON file",

  // Password Generator View
  gen_label_length: "Length",
  gen_opt_avoid_ambiguous: "Avoid ambiguous characters (O, 0, l, 1)",
  gen_error_charset_empty: "Choose at least one character type!",
  gen_error_invalid_words_count: "Number of words must be between 3 and 20!",
  gen_btn_generate: "Generate Password",
  gen_tab_password: "Password",
  gen_tab_passphrase: "Passphrase",
  gen_options_title: "Options",
  gen_include_title: "Include",
  gen_min_numbers: "Minimum numbers",
  gen_min_specials: "Minimum special",
  gen_error_min_exceeds_length: "Min options exceed length!",
  gen_label_num_words: "Number of words",
  gen_label_word_separator: "Word separator",
  gen_opt_capitalize: "Capitalize",
  gen_opt_include_number: "Include number",
  gen_passphrase_hint:
    "Value must be between 3 and 20. Use 6 words or more to generate a strong passphrase.",
  gen_btn_password_history: "Password History",
  history_title: "Password History",
  history_empty: "No copied password history yet.",
  history_clear_btn: "Clear History",
  history_confirm_clear_msg:
    "Are you sure you want to clear all password history?",
  history_copied_toast: "Password copied!",

  // FIDO2 Prompt View
  fido2_error_no_request: "No pending authentication requests found.",
  fido2_error_load_failed: "Failed to load authentication request",
  fido2_error_create_failed: "Failed to create Passkey",
  fido2_error_assert_failed: "Passkey authentication failed",
  fido2_register_title: "Register New Passkey",
  fido2_register_subtitle_new:
    "App <strong>{rp}</strong> wants to save a Passkey for account <strong>{user}</strong>. {APP_NAME} will create a new account to store this Passkey.",
  fido2_register_subtitle_choose:
    "Select account to store Passkey for <strong>{user}</strong>:",
  fido2_register_new_account: "Create new account",
  fido2_register_new_account_sub: "Save as a separate account",
  fido2_btn_save: "Save Passkey",
  fido2_assert_title: "Login Request",
  fido2_assert_subtitle:
    "Select a saved Passkey account for <strong>{rp}</strong> to log in:",
  fido2_assert_btn_confirm: "Confirm Login",
  fido2_assert_no_match:
    "No matching Passkey found for domain <strong>{rp}</strong> in your vault.",
  fido2_vault_locked_title: "Vault is Locked",
  fido2_vault_locked_subtitle:
    "Unlock {APP_NAME} with {login_master_password} to continue Passkey authentication.",
  fido2_not_logged_in_title: "Not Logged In",
  fido2_not_logged_in_subtitle:
    "Please open the extension and log in to {APP_NAME} before using Passkeys.",
  fido2_register_choose_passkey_action:
    "This account already has a Passkey. What would you like to do?",
  fido2_register_choose_passkey_overwrite:
    "This account has multiple Passkeys. Select a Passkey to overwrite, or add new:",
  fido2_register_passkey_info: "Passkey #{index} (Created: {date})",
  fido2_register_option_overwrite: "Overwrite existing Passkey",
  fido2_register_option_add: "Add new Passkey",
  fido2_register_option_add_sub:
    "Save as an additional Passkey in this account",

  // Navigation tabs
  nav_vault: "Vault",
  nav_generator: "Generator",
  nav_reports: "Reports",
  nav_settings: "Settings",

  // Reports Feature
  reports_title: "Reports",
  reports_subtitle:
    "Identify and close security gaps in your online accounts by reviewing the reports below.",
  report_exposed_title: "Exposed passwords",
  report_exposed_desc:
    "Passwords exposed in a data breach are easy targets for attackers. Change these passwords to prevent potential break-ins.",
  report_exposed_btn_check: "Check Exposed Passwords",
  report_exposed_clean_msg:
    "Great news! No exposed passwords were found in your vault.",
  report_exposed_found_msg:
    "Warning: {count} exposed password(s) found in data breaches!",
  report_reused_title: "Reused passwords",
  report_reused_desc:
    "Reusing passwords makes it easier for attackers to break into multiple accounts. Change these passwords so that each is unique.",
  report_reused_group_title: "Password Group #{index} ({count} accounts)",
  report_reused_clean_msg:
    "Excellent! No reused passwords were found in your vault.",
  report_weak_title: "Weak passwords",
  report_weak_desc:
    "Weak passwords can be easily guessed by attackers. Change these passwords to strong ones using the password generator.",
  report_weak_clean_msg:
    "Awesome! All passwords in your vault meet strong security standards.",
  report_unsecure_title: "Unsecure websites",
  report_unsecure_desc:
    "URLs starting with http:// don't use the best available encryption. Change login URIs to https:// for safer browsing.",
  report_unsecure_btn_upgrade: "Upgrade to HTTPS",
  report_unsecure_clean_msg: "Nice! All website URLs use secure HTTPS.",
  report_inactive_2fa_title: "Inactive two-step login",
  report_inactive_2fa_desc:
    "Two-step login adds a layer of protection to your accounts. Set up TOTP or Passkey for these accounts.",
  report_inactive_2fa_clean_msg:
    "Great job! All login items have 2FA or Passkey configured.",
  report_databreach_title: "Data breach",
  report_databreach_desc:
    "Breached accounts can expose your personal information. Enter your email below to check for known data breaches via XposedOrNot.",
  report_databreach_placeholder: "Enter email address to check...",
  report_databreach_btn_check: "Check Email Breach",
  report_databreach_clean_msg:
    "Good news! This email address was not found in any indexed data breaches.",
  report_databreach_found_title:
    "Warning: Email address '{email}' was exposed in the following data breach(es):",
  report_error_rate_limit:
    "Rate limit reached. Please wait a moment and try again.",
  report_error_network: "Network error while checking breach data.",
  report_error_server: "Server error while checking breach data.",
  report_no_username: "(No username)",
  report_no_uri: "(No URI)",
  report_score_label: "Score {score}/5",
  report_weak_btn_upgrade: "Upgrade Password",
  report_reused_btn_change: "Change Password",
  report_inactive_2fa_btn_setup: "Setup 2FA",
  report_databreach_btn_checking: "Checking...",
  report_scanning_progress: "Scanning ({progress}%)...",
  report_exposed_times: "Exposed {count} times",
  report_export_btn: "Export HTML",
  report_export_title: "Exposed Passwords Security Report - {APP_NAME}",
  report_export_heading: "Exposed Passwords Security Report",
  report_export_meta:
    "Generated by {APP_NAME} via Have I Been Pwned (HIBP) API",
  report_export_summary:
    "Warning: Found {count} account(s) with exposed passwords! Change these passwords immediately.",
  report_export_col_account: "Account Name",
  report_export_col_username: "Username / Email",
  report_export_col_exposure: "Breach Exposure",
  report_export_footer:
    "{APP_NAME} Vault Security Audit • Protected via k-Anonymity SHA-1 Hash Matching",

  // Guide Page
  settings_user_guide: "User Guide",
  settings_user_guide_sub:
    "Learn how to use, security architecture, and FIDO2 Passkeys",
  settings_homepage: "Project Homepage",
  settings_homepage_sub:
    "Visit GitHub repository for bug reports and suggestions",
  guide_search_placeholder: "Search guide topics...",
  guide_search_no_results: "No matching guide topics found",

  // New Guide Tree Navigation
  guide_nav_getting_started: "Getting Started & Setup",
  guide_nav_vault_management: "Vault Management",
  guide_nav_passkey_auth: "Passkeys & 2FA Auth",
  guide_nav_autofill_tools: "Autofill & Tools",
  guide_nav_sync_data: "Cloud Sync & Data",
  guide_nav_reports_settings: "Reports & Settings",

  guide_item_overview: "Overview & E2EE Encryption",
  guide_item_master_password: "{login_master_password} & PBKDF2",
  guide_item_github_gist: "GitHub Token & Gist Setup",
  guide_item_self_hosted_server: "{login_provider_self_hosted} Setup",
  guide_item_local_vault: "Local Vault & Security Warnings",
  guide_item_auto_lock: "Vault Lock & Auto-Lock Timer",

  guide_start_self_hosted_lead:
    "{login_provider_self_hosted} Provider allows you to build or run your own personal server (VPS, Docker, Cloudflare Workers, NAS Synology...) to store and synchronize your encrypted vault safely.",
  guide_start_self_hosted_step1_title: "1. Enter Server Base URL",
  guide_start_self_hosted_step1_desc:
    "Enter your server URL (or use the ready-to-use free Cloudflare Worker server at: https://gistwarden.uongsuadaubung.workers.dev). {APP_NAME} will connect directly to your server endpoints.",
  guide_start_self_hosted_step2_title: "2. Register or Login Server Account",
  guide_start_self_hosted_step2_desc:
    "Switch to Register tab to create a new server account (POST /auth/register) or Login (POST /auth/login) to receive your Access Token.",
  guide_start_self_hosted_step3_title:
    "3. Initialize or Unlock Vault with {login_master_password}",
  guide_start_self_hosted_step3_desc:
    "After obtaining Access Token, the client calls GET /vault. HTTP 200 (Existing Vault) -> Enter {login_master_password} to Unlock; HTTP 404 (New Vault) -> Set a new {login_master_password}.",
  guide_start_self_hosted_step4_title:
    "4. Automatic End-to-End Encrypted Sync (E2EE)",
  guide_start_self_hosted_step4_desc:
    "All vault modifications are encrypted locally using your {login_master_password} before being transmitted to POST /vault. Your server cannot read your plaintext passwords.",
  guide_start_self_hosted_note_title: "Important E2EE Security Note",
  guide_start_self_hosted_note_desc:
    "The Server Account Password is only used to authenticate API requests with your server. The {login_master_password} derives the AES-256-GCM encryption key and is NEVER sent to the server.",
  guide_self_hosted_cors_title:
    "Mandatory CORS Configuration for Web Version (GitHub Pages)",
  guide_self_hosted_cors_desc:
    "When accessing {APP_NAME} Web (https://uongsuadaubung.github.io), your Self-Hosted server MUST enable CORS (Access-Control-Allow-Origin: https://uongsuadaubung.github.io or *) and handle HTTP OPTIONS Preflight requests.",
  guide_start_self_hosted_app_title: "Connection Steps in {APP_NAME} App",
  guide_start_self_hosted_app_desc:
    "On {APP_NAME} Login/Initialization screen, select {login_provider_self_hosted} tab, enter Base URL, Register/Login, and begin syncing.",

  login_provider_select_label: "Vault Storage Provider",
  login_provider_github_gist: "Cloud Vault (GitHub Gist)",
  login_provider_local: "Local Storage (Local Vault)",
  login_provider_self_hosted: "Self-Hosted Server",
  login_self_hosted_server_url: "Server Base URL",
  login_self_hosted_username: "Username",
  login_self_hosted_password: "Account Password",
  login_self_hosted_btn_login: "Sign In to Server",
  login_self_hosted_btn_register: "Register Account",
  login_self_hosted_tab_login: "Sign In",
  login_self_hosted_tab_register: "Sign Up",
  login_self_hosted_forgot_password: "Forgot password?",
  login_self_hosted_forgot_password_title: "Recover Password",
  login_self_hosted_forgot_password_msg:
    "Please contact the Administrator of this host server for assistance in recovering your account password.",
  login_self_hosted_forgot_mp_title:
    "Forgot Self-Hosted {login_master_password}",
  login_self_hosted_forgot_mp_msg:
    "{APP_NAME} uses end-to-end (Zero-Knowledge) encryption. The {login_master_password} is never stored on the server and <strong class='text-error'>CANNOT BE RECOVERED</strong>.<br/><br/>If you forgot your {login_master_password}, you can <strong>Log Out</strong> or <strong>contact the Administrator (Admin)</strong> of this host server to delete the stored vault file, allowing you to create a new vault with this same account.",

  // Server Config Modal
  server_config_modal_title: "{login_provider_self_hosted} Configuration",
  server_config_btn_test: "Test Connection",
  server_config_btn_save: "Save Configuration",
  server_config_test_success: "Server connection successful!",
  server_config_test_failed: "Cannot connect to server.",
  server_config_current_server: "Server:",
  server_config_not_set: "(Not Configured)",
  server_config_error_url_required: "Please enter server URL address.",
  self_hosted_error_user_exists: "Username already exists on server.",
  self_hosted_error_invalid_credentials: "Invalid server username or password.",
  self_hosted_error_network:
    "Connection error to Self-Hosted server. Please check the URL.",
  self_hosted_error_username_too_short:
    "Server username must be at least 2 characters.",
  self_hosted_error_username_too_long:
    "Server username must not exceed 64 characters.",
  self_hosted_error_password_too_short:
    "Server password must be at least 6 characters.",
  self_hosted_error_missing_fields:
    "Please enter both server username and password.",

  guide_self_hosted_why_title: "Why Are These REST APIs Needed?",
  guide_self_hosted_why_desc:
    "The {login_provider_self_hosted} API is designed with 6 standardized REST endpoints, empowering users to host their own private infrastructure (Private Cloud/VPS) independently of GitHub. All vault contents are end-to-end encrypted (E2EE) using AES-256-GCM on the client before being sent to the server.",
  guide_self_hosted_public_server_title: "Free Ready-to-Use Cloudflare Server",
  guide_self_hosted_public_server_desc:
    "If you do not want to use GitHub Gist or Local Vault and don't have the resources to host your own server, you can directly use the official server provided at https://gistwarden.uongsuadaubung.workers.dev. Thanks to End-to-End Encryption (E2EE), your vault data is fully encrypted with your Master Password locally before reaching the server, ensuring absolute privacy.",
  guide_self_hosted_matrix_title:
    "1-to-1 API Feature Comparison Matrix vs GitHub API",
  guide_self_hosted_matrix_col_action: "App Operation",
  guide_self_hosted_matrix_col_github: "GitHub Gist API Flow",
  guide_self_hosted_matrix_col_self_hosted:
    "{login_provider_self_hosted} API Flow",
  guide_self_hosted_matrix_col_purpose: "Role & Necessity",

  guide_self_hosted_row1_action: "Register Account",
  guide_self_hosted_row1_github: "Create account on GitHub.com",
  guide_self_hosted_row1_self_hosted: "POST /auth/register",
  guide_self_hosted_row1_purpose:
    "Creates a new user account on your private server.",

  guide_self_hosted_row2_action: "Server Login",
  guide_self_hosted_row2_github: "GitHub OAuth / Token",
  guide_self_hosted_row2_self_hosted: "POST /auth/login",
  guide_self_hosted_row2_purpose:
    "Authenticates server credentials & issues Bearer Access Token.",

  guide_self_hosted_row3_action: "Validate Token",
  guide_self_hosted_row3_github: "GET /user",
  guide_self_hosted_row3_self_hosted: "GET /user",
  guide_self_hosted_row3_purpose:
    "Validates active Access Token and returns user profile.",

  guide_self_hosted_row4_action: "Check Vault Status",
  guide_self_hosted_row4_github: "GET /gists (200 OK / 404 Not Found)",
  guide_self_hosted_row4_self_hosted: "GET /vault (200 OK / 404 Not Found)",
  guide_self_hosted_row4_purpose:
    "Client relies on HTTP 200/404 to display Unlock or {login_master_password} setup screen.",

  guide_self_hosted_row5_action: "Save / Update Vault",
  guide_self_hosted_row5_github: "POST / PATCH /gists",
  guide_self_hosted_row5_self_hosted: "POST /vault",
  guide_self_hosted_row5_purpose:
    "Uploads latest client E2EE encrypted vault backup to server.",

  guide_self_hosted_row6_action: "Delete Vault",
  guide_self_hosted_row6_github: "DELETE /gists/{id}",
  guide_self_hosted_row6_self_hosted: "DELETE /vault",
  guide_self_hosted_row6_purpose:
    "Purges remote vault data from server upon account reset.",

  swagger_explorer_title: "{APP_NAME} Self-Hosted REST API Explorer",
  swagger_base_url_label: "Base URL",
  swagger_collapse: "Collapse",
  swagger_expand: "Details",
  swagger_request_body_title: "Request Body Example (JSON)",
  swagger_responses_title: "Responses & HTTP Status Codes",

  swagger_ep_register_summary: "Register new server account",
  swagger_ep_register_desc:
    "Create a new user account on the Self-Host server and receive an Access Token.",
  swagger_res_201_title: "200 OK — Account Created",
  swagger_res_201_desc:
    "Returns accessToken for subsequent authenticated API calls.",
  swagger_res_400_title: "400 Bad Request — Invalid Data",
  swagger_res_400_desc: "Missing username or password is too short.",
  swagger_res_409_title: "409 Conflict — Username Taken",
  swagger_res_409_desc: "Username is already registered on the server.",

  swagger_ep_login_summary: "Server Account Login & Get Access Token",
  swagger_ep_login_desc:
    "Authenticate existing server user account and issue Bearer Access Token.",
  swagger_res_200_login_title: "200 OK — Login Successful",
  swagger_res_200_login_desc: "Returns valid accessToken.",
  swagger_res_401_login_title: "401 Unauthorized — Invalid Credentials",
  swagger_res_401_login_desc: "Wrong username or password.",

  swagger_ep_user_summary: "Validate Access Token & Get User Profile",
  swagger_ep_user_desc:
    "Validates access token and returns user account profile (Username, Avatar).",

  swagger_ep_get_vault_summary:
    "Read Encrypted Vault, Validate Token & Check Status",
  swagger_ep_get_vault_desc:
    "Fetch encrypted vault payload. Returns HTTP 200 if vault exists, 404 if new account.",
  swagger_res_200_get_vault_title: "200 OK — Existing Vault Found",
  swagger_res_200_get_vault_desc:
    "Client reads ciphertext content, extracts salt, and shows Unlock screen.",
  swagger_res_401_token_title: "401 Unauthorized — Invalid Token",
  swagger_res_401_token_desc: "Token is invalid or has been revoked.",
  swagger_res_404_title: "404 Not Found — New Vault Account",
  swagger_res_404_desc:
    "Client flags account as New Vault and displays {login_master_password} setup screen.",

  swagger_ep_post_vault_summary: "Save / Update Encrypted Vault Payload",
  swagger_ep_post_vault_desc:
    "Overwrite latest client-encrypted vault backup payload onto server.",
  swagger_res_200_post_vault_title: "200 OK — Sync Successful",
  swagger_res_200_post_vault_desc: "Successfully saved vault ciphertext.",
  swagger_res_401_expired_title: "401 Unauthorized — Token Expired",
  swagger_res_401_expired_desc: "Re-login to your server account.",
  swagger_res_413_title: "413 Payload Too Large — Vault Size Exceeded",
  swagger_res_413_desc:
    "Vault ciphertext exceeds server size limit (e.g., > 10MB).",

  swagger_ep_delete_vault_summary: "Delete Vault from Server",
  swagger_ep_delete_vault_desc:
    "Remove user's vault file/record permanently from server.",
  swagger_res_200_delete_vault_title: "200 OK / 204 No Content — Deleted",
  swagger_res_200_delete_vault_desc: "Server has removed the vault data.",
  swagger_res_401_unauthorized_title: "401 Unauthorized — Access Denied",
  swagger_res_401_unauthorized_desc: "Invalid access token.",

  guide_start_local_lead:
    "Local Vault allows you to store your passwords encrypted on your device without linking to any cloud accounts.",
  guide_start_local_warn_title: "Important Warnings when using Local Vault",
  guide_start_local_warn_desc:
    "Local Vault is stored strictly on this device. Uninstalling the extension or clearing browser storage will permanently wipe your vault data. Please export regular manual backups!",
  guide_start_local_passkey_warn_title:
    "WARNING: Do NOT reuse the same FIDO2 Passkey between Local Vault and Sync Vault",
  guide_start_local_passkey_warn_desc:
    "FIDO2 Passkeys work completely fine on a single device's Local Vault. However, do NOT share or copy the exact same Passkey between a Local Vault and a Cloud Sync Vault across multiple devices. Signature Counter mismatches between unsynced vaults will trigger server security flags and BLOCK your Passkey login. Recommendation: If you use multiple devices, register separate Passkeys directly on each device!",
  guide_start_local_card1_title: "1. Pure Local Encrypted Storage",
  guide_start_local_card1_desc:
    "Your vault payload is encrypted using AES-256-GCM and stored only in browser storage. No data is ever sent to remote servers or external storage services.",
  guide_start_local_card2_title: "2. Risk of Data Loss",
  guide_start_local_card2_desc:
    "Because there is no cloud backup, clearing browser data or resetting the extension will permanently remove your vault. Unrecoverable if deleted!",
  guide_start_local_card3_title: "3. Regular Manual Backups",
  guide_start_local_card3_desc:
    "Always go to {settings_header} → {settings_vault_options_label} → {vault_options_export} to save an encrypted JSON or CSV backup to a safe folder or external drive.",
  guide_start_local_card4_title: "4. Independent per Device",
  guide_start_local_card4_desc:
    "Each device running Local Vault has its own isolated vault and settings. Changes made on Device A will not reflect on Device B.",
  guide_start_local_card5_title: "5. Passkey Signature Counter Mismatch Risk",
  guide_start_local_card5_desc:
    "Each Passkey uses an internal Signature Counter verified by the server. If you authenticate with synced Passkeys across multiple devices and the counter gets out of sync (decremented or mismatched), the server will flag a cloned authenticator attack and BLOCK your login immediately. Recommendation: Register a separate Passkey directly on each device.",

  guide_item_logins: "Login Accounts & Domain Matching",
  guide_item_secure_notes: "Secure Notes",
  guide_item_cards_identities: "Payment Cards & Identities",
  guide_item_ssh_keys: "SSH Keys (OpenSSH)",
  guide_item_custom_fields: "Custom Fields",
  guide_item_folders_trash: "Folders & Trash Management",

  guide_item_passkey_concept: "What is a Passkey (FIDO2)?",
  guide_item_passkey_register: "Register New Passkey",
  guide_item_passkey_login: "Login With Passkey",
  guide_item_totp_authenticator: "2FA Codes (TOTP RFC 6238)",
  guide_item_google_migration: "Import from Google Authenticator",

  guide_item_autofill_usage: "Autofill & Auto-Submit",
  guide_item_password_generator: "Password & Passphrase Generator",
  guide_item_password_history: "Generated Password History",

  guide_item_gist_sync: "Two-Way Cloud Sync (LWW)",
  guide_item_import_csv: "Import Data from CSV File",
  guide_item_import_json: "Import Vault JSON Backup File",
  guide_item_export_csv: "Export Data to CSV File",
  guide_item_export_json: "Export Vault JSON Backup File",

  guide_item_security_reports: "Security & HIBP Breach Reports",
  guide_item_appearance_lang: "Appearance & Language",
  guide_item_faq_troubleshooting: "FAQ & Troubleshooting",

  guide_app_lead: "Customize Light/Dark Mode themes and application languages.",
  guide_app_theme_title: "Appearance Theme",
  guide_app_theme_desc:
    "Seamlessly switch between Dark and Light themes with balanced Bitwarden color palettes.",
  guide_app_lang_title: "Multilingual Support (English / Vietnamese)",
  guide_app_lang_desc:
    "100% supported interface and user guides in both English and Vietnamese.",

  guide_report_lead:
    "Check overall vault health and scan for breached passwords (HIBP).",
  guide_report_step1_title: "Exposed Passwords Report",
  guide_report_step1_desc:
    "Scan all vault passwords using HIBP k-Anonymity (first 5 SHA-1 hash chars). Your raw password never leaves your browser, yet accurately identifies if any password appeared in major data breaches.",
  guide_report_step2_title: "Reused Passwords Report",
  guide_report_step2_desc:
    "Detect accounts using identical passwords across multiple websites. Reusing passwords creates chain-reaction risks when a single service gets breached.",
  guide_report_step3_title: "Weak Passwords Report",
  guide_report_step3_desc:
    "Evaluate password strength based on length, character diversity (uppercase, lowercase, numbers, symbols), and detect easily guessable patterns.",
  guide_report_step4_title: "Unsecured HTTP Websites Report",
  guide_report_step4_desc:
    "Alert on website URIs stored in your vault that still use unencrypted http:// protocols instead of secure https://.",
  guide_report_step5_title: "Inactive 2FA Accounts Report",
  guide_report_step5_desc:
    "List important accounts (financial, email, social media) that lack two-factor TOTP configuration so you can promptly add 2FA protection.",

  // Vault Management Guides
  guide_vm_logins_lead:
    "Manage web login accounts, URIs, smart domain matching options, and item security.",
  guide_vm_logins_card1_title: "Detailed Domain Match Modes & Use Cases",
  guide_vm_logins_card1_item1:
    "Base Domain (Default): Matches all subdomains. Example: Saving 'https://github.com' suggests credentials on 'gist.github.com', 'education.github.com', and 'login.github.com'. Recommended for 90% of standard web services.",
  guide_vm_logins_card1_item2:
    "Host / Exact Host: Matches the exact hostname only. Example: Saving 'https://mail.google.com' offers autofill on 'mail.google.com' ONLY, NOT on 'drive.google.com' or 'calendar.google.com'.",
  guide_vm_logins_card1_item3:
    "Exact / Full URL: Matches exact characters including Port and Path. Example: Saving 'https://192.168.1.1:8080/admin/login' matches only this admin login URL, NOT '/user/login'. Ideal for Routers, NAS servers, or internal admin portals.",
  guide_vm_logins_card1_item4:
    "RegEx Pattern: Matches via flexible Regular Expressions. Example: Pattern '^https:\\/\\/(dev|staging)\\.company\\.com' offers autofill on both 'dev.company.com' and 'staging.company.com', while skipping 'prod.company.com'. Great for Developers & SysAdmins.",
  guide_vm_logins_card1_item5:
    "Never: Never offers or displays autofill suggestions for this item on any site (prevents malicious scripts from auto-capturing credentials). Ideal for high-risk accounts where manual copy/paste is preferred.",
  guide_vm_logins_card2_title: "Multiple URIs Support",
  guide_vm_logins_card2_desc:
    "Each login item allows storing multiple URIs with distinct match options.",
  guide_vm_logins_card3_title: "{login_master_password} Re-prompt",
  guide_vm_logins_card3_desc:
    "Enable this protection for sensitive financial or high-risk accounts. Every time you view, edit, or copy the password, {APP_NAME} will require re-entering your {login_master_password} to verify identity.",
  guide_vm_logins_card4_title: "Item Password Revision History",
  guide_vm_logins_card4_desc:
    "Whenever you update an item's password, {APP_NAME} automatically saves previous passwords into the item's revision history. Open item details ➔ click 'Password History' to view or restore previous passwords anytime.",

  guide_vm_notes_lead:
    "Securely store private text, account recovery codes, software keys, or sensitive notes.",
  guide_vm_notes_card_title: "Secure Note Privacy",
  guide_vm_notes_card_desc:
    "All text in Secure Notes is encrypted directly on your device before syncing. You can also turn on {login_master_password} Reprompt when opening.",

  guide_vm_cards_lead:
    "Store credit card details and personal identity information for 1-click form autofill and payments.",
  guide_vm_cards_card1_title: "Credit Cards",
  guide_vm_cards_card1_desc:
    "Store card number, CVV code, expiration date, and cardholder name under full encryption.",
  guide_vm_cards_card2_title: "Identities",
  guide_vm_cards_card2_desc:
    "Store full name, phone number, address, and ID/passport details for instant checkout autofill.",

  guide_vm_ssh_lead:
    "Manage SSH Public/Private Key pairs used for secure remote server access.",
  guide_vm_ssh_card_title: "Professional SSH Key Management",
  guide_vm_ssh_card_desc:
    "Store OpenSSH/PEM private keys along with Key Fingerprint and Passphrases.",

  guide_vm_fields_lead:
    "Extend vault item fields with flexible custom data types to accurately autofill any complex login forms.",
  guide_vm_fields_card_title: "4 Custom Field Types",
  guide_vm_fields_item1: "Text: Store standard static string values.",
  guide_vm_fields_item2: "Hidden: Obfuscated sensitive text.",
  guide_vm_fields_item3: "Checkbox: Boolean toggle state (True/False).",
  guide_vm_fields_item4:
    "Linked: Dynamically referenced from Username/Password/2FA.",
  guide_vm_fields_type_text_title: "1. Text Fields",
  guide_vm_fields_type_text_desc:
    "Store static text information such as Customer ID, Organization/Tenant Name, Company Domain, or Account Number. When autofilling, the extension fills this string into matching input fields.",
  guide_vm_fields_type_hidden_title: "2. Hidden Fields",
  guide_vm_fields_type_hidden_desc:
    "Store sensitive strings requiring obfuscation such as secondary PIN codes, security answers, or secret tokens. Values are masked as dots (••••) on the UI and filled securely into login forms.",
  guide_vm_fields_type_checkbox_title: "3. Checkbox Fields",
  guide_vm_fields_type_checkbox_desc:
    "Store boolean Toggle state (True/False). During autofill, the extension automatically checks or unchecks checkboxes on the webpage (e.g. 'Remember me', 'Trusted device', 'I agree to terms').",
  guide_vm_fields_type_linked_title: "4. Linked Fields",
  guide_vm_fields_type_linked_desc:
    "Dedicated solution for websites with non-standard input attributes (e.g. id='txt_user_code', name='auth_secret'). Dynamically extracts values directly from the item's Username, Password, or live 2FA TOTP code.",
  guide_vm_fields_linked_guide_title: "How to Use Linked Fields",
  guide_vm_fields_linked_step1_title: "Step 1: Inspect the Web Input Name/ID",
  guide_vm_fields_linked_step1_desc:
    "Right-click the input field on the website and select 'Inspect'. Identify the input's 'id', 'name', 'placeholder', or 'aria-label' attribute (e.g. 'login_username' or 'member_pwd').",
  guide_vm_fields_linked_step2_title:
    "Step 2: Add a Linked Field in Your Vault",
  guide_vm_fields_linked_step2_desc:
    "Open the Vault item → click 'Add Custom Field' → select 'Linked' as Field Type. Enter the Field Name matching the attribute from Step 1 → Select Linked Value as 'Username', 'Password', or '2FA Authenticator (TOTP)'.",
  guide_vm_fields_linked_step3_title: "Step 3: Autofill with 100% Accuracy",
  guide_vm_fields_linked_step3_desc:
    "When visiting the website and clicking Autofill (or using notification prompts / hotkeys), Gistwarden automatically maps and fills the exact credential values into those fields.",
  guide_vm_fields_matching_title: "Autofill Matching Rules",
  guide_vm_fields_matching_desc:
    "Gistwarden's Autofill engine matches Field Names (case-insensitive) in order of priority: 1. 'id' attribute → 2. 'name' attribute → 3. 'placeholder' attribute → 4. 'aria-label' attribute or associated '<label>'.",

  guide_vm_folders_lead:
    "Organize item data with Folders and safely manage deleted items in Trash.",
  guide_vm_folders_sec1_title: "1. Folder Creation & Management",
  guide_vm_folders_step1_title: "Create New Folders",
  guide_vm_folders_step1_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_vault_options_label} → {folder_management_title}. Enter folder name and click Save.",
  guide_vm_folders_step2_title: "Assign Items to Folders",
  guide_vm_folders_step2_desc:
    "When Adding or Editing a vault item, select the folder in the 'Folder' dropdown. Alternatively, select multiple items in the Vault list and click 'Move to Folder'.",
  guide_vm_folders_step3_title: "Edit or Delete Folders",
  guide_vm_folders_step3_desc:
    "In the Folder list, click Edit to rename or Trash icon to remove a folder (Note: Deleting a folder does not delete the items inside).",
  guide_vm_trash_sec2_title: "2. Trash Management & Recovery",
  guide_vm_trash_step1_title: "Moving Items to Trash",
  guide_vm_trash_step1_desc:
    "Deleting an item moves it safely to the Trash instead of removing it permanently, preventing accidental loss.",
  guide_vm_trash_step2_title: "Accessing Trash & Restoring Items",
  guide_vm_trash_step2_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_vault_options_label} → {trash_title}. Click 'Restore' next to an item to put it back into your active Vault.",
  guide_vm_trash_step3_title: "Permanent Deletion (Purge)",
  guide_vm_trash_step3_desc:
    "Click 'Purge' on individual items or 'Empty Trash' to permanently erase data from device and GitHub Gist. Note: Purged items cannot be recovered.",

  // Getting Started Guides
  guide_start_ov_lead:
    "{APP_NAME} is a Zero-Knowledge encrypted personal password vault solution, automatically syncing to your private personal cloud via GitHub Gist.",
  guide_start_ov_card1_title: "Zero-Knowledge Encryption Security",
  guide_start_ov_card1_desc:
    "All vault data is encrypted directly on your device before transmission or storage. Absolutely no one (including developers or cloud storage providers) can read your data without your {login_master_password}.",
  guide_start_ov_card2_title: "Private Personal Cloud Sync",
  guide_start_ov_card2_desc:
    "Instead of sending data to third-party servers, {APP_NAME} syncs data directly into a Private Gist on your personal GitHub account.",
  guide_start_ov_card3_title: "Passwordless Login (Passkeys)",
  guide_start_ov_card3_desc:
    "Support storing and logging in with Passkeys (FIDO2 / WebAuthn) using biometrics or device PIN, eliminating password leaks.",

  guide_start_mp_lead:
    "The {login_master_password} is the sole key used to decrypt and protect your entire vault data.",
  guide_start_mp_step1_title: "1. {login_master_password} Role",
  guide_start_mp_step1_desc:
    "The {login_master_password} unlocks your vault and acts as the root key encrypting all items. Make it strong and memorable.",
  guide_start_mp_step2_title: "2. No {login_master_password} Storage Principle",
  guide_start_mp_step2_desc:
    "{APP_NAME} adheres to Zero-Knowledge: the app never stores or sends your {login_master_password} anywhere. If forgotten, data cannot be recovered.",
  guide_start_mp_step3_title: "3. How to Change {login_master_password}",
  guide_start_mp_step3_desc:
    "Change your {login_master_password} anytime in {settings_header} → {settings_account_security} → {settings_change_mp}. Re-encrypts your entire vault with the new key.",

  guide_start_lock_lead:
    "Automatically lock vault data when inactive or on browser restart.",
  guide_start_lock_step1_title: "1. Open Account Security Settings",
  guide_start_lock_step1_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_account_security}.",
  guide_start_lock_step2_title: "2. Customize Vault Timeout",
  guide_start_lock_step2_desc:
    "Choose timeout duration: On Restart, 1 minute, 5 minutes, 15 minutes, 30 minutes, 1 hour, or 4 hours.",
  guide_start_lock_step3_title: "3. Choose Timeout Action",
  guide_start_lock_step3_lock:
    "Lock: Clears decryption keys from RAM. Requires {login_master_password} or PIN to unlock.",
  guide_start_lock_step3_logout:
    "Log out: Clears session state and requires logging in again.",
  guide_start_lock_step4_title:
    "4. PIN Unlock & {login_master_password} Requirements",
  guide_start_lock_step4_desc:
    "Enable Unlock with PIN for smooth access. Check Require {login_master_password} on Restart for maximum security.",

  guide_start_pin_title: "Configure & Use PIN Quick Unlock",
  guide_start_pin_lead:
    "PIN code allows unlocking your vault quickly with a short numeric code without re-typing a long {login_master_password} every time.",
  guide_start_pin_step1_title: "1. Turn on Unlock with PIN option",
  guide_start_pin_step1_desc:
    "Open {APP_NAME} ➔ go to {settings_header} ➔ {settings_account_security}. Check the 'Unlock with PIN' option.",
  guide_start_pin_step2_title: "2. Set up your new PIN code (Minimum 4 digits)",
  guide_start_pin_step2_desc:
    "A PIN setup dialog will appear. Enter your preferred PIN (at least 4 digits) and click Confirm to save.",
  guide_start_pin_step3_title: "3. Quick unlock with PIN when vault locks",
  guide_start_pin_step3_desc:
    "When the vault is locked due to timeout, simply type your PIN code and click Unlock. Encryption keys will be restored smoothly without typing your full {login_master_password}.",
  guide_start_pin_note_title: "Important Security Note on PIN:",
  guide_start_pin_note_desc:
    "PIN code is stored securely in local device storage. If you enter incorrect PIN 3 times, PIN mode is automatically disabled and you will be logged out to prevent brute-force attempts. Logging out of your account also removes PIN data automatically.",

  // Passkey & TOTP Authenticator Guides
  guide_passkey_concept_lead:
    "Passkey (FIDO2 / WebAuthn standard) is the most secure passwordless login solution today, providing absolute Anti-Phishing protection.",
  guide_passkey_concept_card1_title: "Absolute Anti-Phishing",
  guide_passkey_concept_card1_desc:
    "Passkeys are bound to the exact domain name of a website. Even if you visit a phishing site, Passkey will never authenticate.",
  guide_passkey_concept_card2_title: "Asymmetric Key Pair Security",
  guide_passkey_concept_card2_desc:
    "Each Passkey consists of a public key sent to the site and a private key stored safely in your encrypted {APP_NAME} vault.",

  guide_passkey_gmig_lead:
    "Migrate 2FA codes from Google Authenticator to {APP_NAME}.",
  guide_passkey_gmig_step1_title: "1. Open Google Authenticator App",
  guide_passkey_gmig_step1_desc: "Open Google Authenticator on your phone.",
  guide_passkey_gmig_step2_title: "2. Open Transfer Codes Menu",
  guide_passkey_gmig_step2_desc:
    "Tap the top menu icon and select Transfer codes.",
  guide_passkey_gmig_step3_title: "3. Select Export Codes",
  guide_passkey_gmig_step3_desc: "Select Export codes.",
  guide_passkey_gmig_step4_title: "4. Select Codes to Export",
  guide_passkey_gmig_step4_desc:
    "Check the 2FA codes you wish to transfer to {APP_NAME}.",
  guide_passkey_gmig_step5_title: "5. Scan Migration QR Code into {APP_NAME}",
  guide_passkey_gmig_step5_desc:
    "The export QR code displays. Open {APP_NAME} → {settings_header} → {settings_vault_options_label} → {settings_tools_google_auth} to scan or upload the QR image.",

  // Autofill & Password Generator Guides
  guide_auto_lead:
    "Automatically detect forms and autofill Username / Password on websites.",
  guide_auto_card1_title: "{APP_NAME} Icon in Input Fields",
  guide_auto_card1_desc:
    "Clicking any login field on a website displays the {APP_NAME} icon, allowing 1-click account selection and instant autofill.",
  guide_auto_card2_title: "Auto-Submit Forms",
  guide_auto_card2_desc:
    "Enable Auto-Submit after autofill in {settings_header} → {settings_autofill_options_label} for seamless 1-click logins.",

  guide_pwdgen_lead:
    "Generate high-security random passwords or passphrases resistant to brute-force attacks.",
  guide_pwdgen_step1_title: "1. Password Generator Location",
  guide_pwdgen_step1_desc:
    "Open {APP_NAME} → select the {nav_generator} tab on the navigation bar (or click the Generator icon when editing an item).",
  guide_pwdgen_step2_title: "2. Random Password Mode",
  guide_pwdgen_step2_length:
    "Custom Length: Adjust password length from 5 to 128 characters (16+ characters recommended).",
  guide_pwdgen_step2_charset:
    "Character Sets: Toggle Uppercase (A-Z), Lowercase (a-z), Numbers (0-9), and Special Symbols (!@#$%^...).",
  guide_pwdgen_step2_ambiguous:
    "Avoid Ambiguous Characters: Toggle to exclude confusing characters like I, l, 1, O, 0.",
  guide_pwdgen_step3_title: "3. Passphrase Mode",
  guide_pwdgen_step3_desc:
    "Generate passphrases combining multiple words into memorable yet highly secure passwords. Choose word counts (3-20), separator character (-), capitalize words, and insert numbers.",
  guide_pwdgen_step4_title: "4. Password Strength Meter",
  guide_pwdgen_step4_desc:
    "The strength indicator visually rates security from Weak, Good, Strong, to Fantastic.",

  guide_hist_lead: "History of recently generated passwords.",
  guide_hist_card_title: "View Generated Password History",
  guide_hist_card_desc:
    "All passwords generated using the Generator are stored in temporary history so you can retrieve them if forgotten before saving.",

  // Sync & Import/Export Data Guides
  guide_sync_lead:
    "Private two-way cloud data synchronization between devices and your personal GitHub Gist.",
  guide_sync_card1_title: "Automatic Data Merge",
  guide_sync_card1_desc:
    "When syncing across multiple devices, {APP_NAME} automatically compares edit timestamps to merge the latest account data without data loss.",
  guide_sync_card2_title: "Private Personal Cloud Storage",
  guide_sync_card2_desc:
    "Vault data is stored in your personal GitHub Gist under full encryption. Anyone viewing it on GitHub will only see meaningless cipher text.",

  guide_imp_csv_lead:
    "Import login passwords from Browser and Bitwarden CSV files into {APP_NAME}.",
  guide_imp_csv_step1_title:
    "1. Import CSV file from Web Browsers (Chrome, Firefox, Edge, Brave, Safari)",
  guide_imp_csv_step1_desc:
    "Export a CSV file from your web browser password settings. {APP_NAME} automatically parses and imports all login credentials into your vault.",
  guide_imp_csv_step2_title: "2. Import CSV file from Bitwarden",
  guide_imp_csv_step2_desc:
    "Export a CSV file from Bitwarden to migrate to {APP_NAME}. The app imports passwords, notes, and automatically recreates matching Folder structures.",
  guide_imp_csv_step3_title: "3. Steps in the Application",
  guide_imp_csv_step3_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_vault_options_label} → {vault_options_import}. Select your file format (Browser CSV or Bitwarden CSV), pick your file, and click Confirm Import.",

  guide_imp_json_lead:
    "Restore 100% complete vault structure from a JSON backup file.",
  guide_imp_json_step1_title: "1. Import Feature Location",
  guide_imp_json_step1_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_vault_options_label} → {vault_options_import}.",
  guide_imp_json_step2_title: "2. Select JSON File Format",
  guide_imp_json_step2_desc:
    "In the file format selector, choose {APP_NAME} / Bitwarden JSON (.json).",
  guide_imp_json_step3_title: "3. Upload JSON File & Preview Results",
  guide_imp_json_step3_desc:
    "Select your JSON file from your computer. {APP_NAME} displays a Preview window showing the number of items about to be imported.",
  guide_imp_json_step4_title:
    "4. Full Restoration of All 5 Data Types & Folders",
  guide_imp_json_step4_desc:
    "JSON files restore 100% of all 5 data types: Logins, Secure Notes, Credit Cards, Identities, and SSH Keys alongside Folders, Custom Fields, and 2FA TOTP codes.",
  guide_imp_json_step5_title: "5. Automatic Data & Folder Merge",
  guide_imp_json_step5_desc:
    "The app automatically merges folders with duplicate names, eliminates duplicates, and retains the newest data entries.",

  guide_exp_csv_lead:
    "Export password entries to a CSV file for viewing or application migration.",
  guide_exp_csv_step1_title: "1. Access Export Feature",
  guide_exp_csv_step1_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_vault_options_label} → {vault_options_export}.",
  guide_exp_csv_step2_title:
    "2. Enter {login_master_password} for Security Verification",
  guide_exp_csv_step2_desc:
    "For security reasons, the app prompts for your {login_master_password} to verify access before generating the CSV file.",
  guide_exp_csv_step3_title: "3. Choose CSV File Format",
  guide_exp_csv_step3_browser:
    "Browser CSV: Basic format for direct import into Google Chrome, Firefox, Edge, Safari, Brave.",
  guide_exp_csv_step3_bitwarden:
    "Bitwarden CSV: Comprehensive export including item fields and Folder structures.",
  guide_exp_csv_step4_title: "4. Plaintext CSV Security Warning",
  guide_exp_csv_step4_desc:
    "CSV files contain unencrypted passwords (including only Logins & Secure Notes, excluding Passkeys and SSH Keys). Keep the file safe or delete it after migration.",

  guide_exp_json_lead:
    "Create a full backup of your entire password vault in JSON format.",
  guide_exp_json_step1_title: "1. Backup 100% Vault Structure",
  guide_exp_json_step1_desc:
    "JSON backup captures all 5 item types (Logins, Secure Notes, Cards, Identities, SSH Keys), Folders, Favorites, and Custom Fields.",
  guide_exp_json_step2_title: "2. Encrypted or Unencrypted Export Options",
  guide_exp_json_step2_desc:
    "Encrypted JSON is recommended so your backup remains protected by your {login_master_password}. Others cannot read it without your {login_master_password}.",
  guide_exp_json_step3_title: "3. Steps to Export JSON Backup",
  guide_exp_json_step3_desc:
    "Open {APP_NAME} → navigate to {settings_header} → {settings_vault_options_label} → {vault_options_export} → enter {login_master_password} → choose JSON format and click Download JSON Backup.",

  // Extension Downloads Guide
  guide_item_download_extension: "Download Extension",
  guide_dl_ext_lead:
    "Install the {APP_NAME} Extension on your browser to enjoy Autofill, FIDO2 Passkeys, and Auto-Lock.",
  guide_dl_ext_firefox_title: "Firefox Browser (Firefox Add-on)",
  guide_dl_ext_firefox_desc:
    "Download and install the official {APP_NAME} extension from Mozilla Firefox Add-ons Store.",
  guide_dl_ext_edge_title: "Microsoft Edge Browser (Edge Add-on)",
  guide_dl_ext_edge_desc:
    "Download and install the official {APP_NAME} extension from Microsoft Edge Add-ons Store.",
  guide_dl_ext_btn: "Install Extension",

  // Web Version Guide
  guide_item_web_version: "Web Version",
  guide_web_ver_lead:
    "Access your {APP_NAME} vault directly in any web browser without installing an extension.",
  guide_web_ver_btn: "Open {APP_NAME} Web",
  guide_web_ver_advantages_title: "Flexible Access Anywhere",
  guide_web_ver_advantages_desc:
    "Ideal when using public computers, guest devices, or browser environments where installing extensions is restricted.",
  guide_web_ver_limits_title: "Limitations on the Web Version",
  guide_web_ver_limit_autofill_title: "No Autofill Support",
  guide_web_ver_limit_autofill_desc:
    "The Web version cannot automatically fill credentials into login forms on other websites.",
  guide_web_ver_limit_passkey_title: "Limited Passkey / FIDO2 Support",
  guide_web_ver_limit_passkey_desc:
    "Cannot act as the browser's default Passkey manager for authenticating on external websites.",
  guide_web_ver_limit_capture_title: "No Automatic Login Capture",
  guide_web_ver_limit_capture_desc:
    "Cannot automatically detect and prompt to save new credentials when you log in on websites.",

  // Guide Gist Token Steps
  guide_token_desc:
    "To sync your data, {APP_NAME} stores your encrypted vault in your personal GitHub Gists. You need to create a Token with the 'gist' scope.",
  guide_token_step1_title: "Step 1: Set Name and Expiration",
  guide_token_step1_desc:
    "Log in to GitHub and click the green button below to open the token creation page. Give it a descriptive note (e.g., '{APP_NAME}') and select 'No expiration' so sync doesn't break later.",
  guide_token_step2_title: "Step 2: Check 'gist' Scope",
  guide_token_step2_desc:
    "Find and select the 'gist' checkbox (to sync your vault). This scope only permits {APP_NAME} to access Gists, and doesn't grant access to any of your private repositories.",
  guide_token_step3_title: "Step 3: Generate Token",
  guide_token_step3_desc:
    "Scroll to the bottom of the page and click the green 'Generate token' button to create your token.",
  guide_token_step4_title: "Step 4: Copy and Paste into Settings",
  guide_token_step4_desc:
    "Copy the generated token (a string starting with ghp_). Then open {APP_NAME}, select 'Use Token (PAT)', paste it into the token field, and click Save.",
  guide_token_important_note: "Important Note:",
  guide_token_note_desc:
    " NEVER share this token with anyone. The extension stores the token locally on your computer and sends it directly to GitHub without any intermediary servers.",

  // Guide Passkey Registration Steps
  guide_pk_reg_desc:
    "To start using passwordless login, follow this 3-step guide to save a new Passkey into your vault.",
  guide_pk_reg_step1_title: "Step 1: Click Register on Website",
  guide_pk_reg_step1_desc:
    "When you are on a website's security settings page (e.g., Google, GitHub, webauthn.me), click the register passkey button (often 'Add a passkey' or similar).",
  guide_pk_reg_step2_title: "Step 2: Choose Account to Store",
  guide_pk_reg_step2_desc:
    "{APP_NAME} will automatically intercept the request and show a popup. Select an existing matching account in your vault to link, or click 'Create new account' to save it separately.",
  guide_pk_reg_step3_title: "Step 3: Confirm Saving Passkey",
  guide_pk_reg_step3_desc:
    "After selecting your option, click 'Save Passkey' to store the encrypted private credential. The extension will automatically sync it to GitHub Gist if sync is configured.",

  // Guide Passkey Login Steps
  guide_pk_login_desc:
    "Once a Passkey is stored, you no longer need to type passwords or 2FA codes. The login process is simple and takes just 2 steps:",
  guide_pk_login_step1_title: "Step 1: Choose Login with Passkey",
  guide_pk_login_step1_desc:
    "On the website's login page, select the option to log in using a Passkey (often represented by a key icon or Face ID symbol).",
  guide_pk_login_step2_title: "Step 2: Select Account on Popup",
  guide_pk_login_step2_desc:
    "The {APP_NAME} popup will list saved Passkeys compatible with this website. Select the corresponding account and click 'Confirm Login' to gain instant access.",

  // Guide TOTP Steps
  guide_totp_step1_title: "Step 1: Scan 2FA QR Code on Website",
  guide_totp_step1_desc:
    "When a website (e.g., Google, GitHub, Facebook) displays a QR code for two-factor authentication setup, open {APP_NAME} and click the camera/QR scan icon next to the TOTP field to scan it. If you cannot scan the QR code or the website only provides a text key (Secret Key), you can copy that text key and paste it manually into the TOTP field and save.",
  guide_totp_step2_title: "Step 2: Automatically Save & Display OTP Codes",
  guide_totp_step2_desc:
    "After scanning, the secret key is decoded and saved. {APP_NAME} will start generating 6-digit authentication codes that refresh every 30 seconds. Click on the code to copy it, then paste it directly into the website's verification box.",

  // Guide FAQ Tab
  guide_faq_subtitle:
    "Find answers to common questions about {APP_NAME}'s sync, security, and passwords.",
  guide_faq_q1_title: "Is my {login_master_password} safe?",
  guide_faq_q1_desc:
    "Extremely safe. {APP_NAME} utilizes Zero-Knowledge encryption. Your {login_master_password} is only used to derive encryption keys locally in your browser and is never stored or transmitted over the internet.",
  guide_faq_q2_title: "What if I forget my {login_master_password}?",
  guide_faq_q2_desc:
    "There is no way to recover your {login_master_password}. If forgotten, you will have to reset the extension and start over. Please memorize or write down your {login_master_password} and store it in a safe place.",
  guide_faq_q3_title: "Can I sync my passwords across multiple computers?",
  guide_faq_q3_desc:
    "Yes. Simply install {APP_NAME} on the other computer, sign in with the same GitHub account (or paste the same token), and enter the EXACT {login_master_password} you used on your first computer. Your vault will load and decrypt automatically.",
  guide_faq_q4_title: "Is storing my vault in a Secret Gist really private?",
  guide_faq_q4_desc:
    "Yes. Secret Gists are not indexed by search engines and do not appear on your public GitHub profile page. Even if someone happens to guess the direct Gist URL, they will only see meaningless encrypted cipher text. Without your {login_master_password}, it is impossible to decrypt.",

  // Welcome View
  welcome_feat_security_title: "Zero-Knowledge Encryption",
  welcome_feat_security_desc:
    "Your data is encrypted locally using your {login_master_password} before syncing to your private GitHub Gist. No one else can read your data.",
  welcome_feat_passkeys_title: "Passwordless Passkeys (FIDO2)",
  welcome_feat_passkeys_desc:
    "Register and authenticate securely with modern WebAuthn/Passkeys, avoiding traditional passwords.",
  welcome_feat_totp_title: "Dynamic TOTP Codes",
  welcome_feat_totp_desc:
    "Store and generate 2-factor authentication codes automatically refreshing every 30 seconds.",
  welcome_security_notice_title: "IMPORTANT SECURITY NOTICE",
  welcome_warning_bold:
    "Forgetting your {login_master_password} results in PERMANENT DATA LOSS with NO recovery.",
  welcome_warning_sub:
    "We do not store your password on any server, and storage providers only see your vault data as meaningless encrypted cipher text. (Note: You can still change your {login_master_password} anytime in Settings if needed).",
  welcome_checkbox_label:
    "I understand and agree that if I forget my {login_master_password}, I accept losing all my data permanently.",
  welcome_btn_continue: "Get Started",
  welcome_btn_next: "Next",
  welcome_btn_prev: "Back",

  // URI Match Detection
  match_mode_default: "Default ({mode})",
  match_mode_domain: "Base domain",
  match_mode_host: "Host",
  match_mode_starts_with: "Starts with",
  match_mode_exact: "Exact",
  match_mode_regex: "Regular expression",
  match_mode_never: "Never",
  match_warning_modal_title: "Security Warning",
  match_warning_modal_msg:
    "'{mode}' is an advanced option with increased risk of exposing credentials if configured improperly.",
  match_warning_inline:
    "Warning: '{mode}' is an advanced option with increased risk of exposing credentials.",
  match_detection_label: "Match detection",
  match_detection_desc:
    "URI match detection is how {APP_NAME} identifies autofill suggestions.",
  match_mode_header_advanced: "Advanced options",
  match_warning_learn_more: "Learn more about match detection",

  // Tools Page
  select_search_placeholder: "Search...",
  select_no_results: "No results found",
  settings_tools_google_auth: "Google Authenticator Decoder Tool",
  settings_tools_google_auth_sub:
    "Decode offline export QR, display raw otpauth:// URIs and link to Vault",
  google_tool_paste_label: "Paste offline export string or upload QR image:",
  google_tool_btn_parse: "Decode & Parse",
  google_tool_btn_upload_qr: "Upload QR Code Image",
  import_google_migration_invalid:
    "Invalid Google Authenticator QR or migration data",
  google_migration_subtitle:
    "Found {count} 2FA account(s). Choose how to import each account:",
  google_migration_raw_uri: "Raw URI",
  google_migration_action_link: "Attach to existing Vault item",
  google_migration_action_create: "Create new Vault item",
  google_migration_action_skip: "Skip / Do not import",
  google_migration_save_batch: "Save & Import ({count})",
  google_migration_save_success:
    "Successfully imported/updated {count} 2FA account(s)",
};
