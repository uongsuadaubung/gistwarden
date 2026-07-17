export default {
  // Common buttons & notifications
  btn_save: "Save",
  btn_cancel: "Cancel",
  btn_delete: "Delete",
  btn_edit: "Edit",
  btn_create: "Create",
  btn_close: "Close",
  btn_copy: "Copy",
  btn_copied: "Copied!",
  confirm_title: "Confirmation",
  dialog_loading: "Processing...",
  toast_success: "Success!",
  toast_error: "An error occurred!",

  // Login Page
  login_title_locked: "Vault is Locked",
  login_title_setup: "Configure GitHub Gist Cloud Storage",
  login_method_oauth: "Login with GitHub (OAuth)",
  login_method_pat: "Use Token (PAT)",
  login_placeholder_pat: "Enter your GitHub Personal Access Token...",
  login_pat_help:
    "Token needs <strong>gist</strong> scope. The extension will create a secret Gist to store your encrypted vault.",
  login_oauth_help:
    "Connect securely to your GitHub account to sync your vault automatically via your private Cloudflare Worker Proxy.",
  login_oauth_hide: "Hide OAuth Configuration",
  login_oauth_show: "Show OAuth Configuration",
  login_oauth_alert_save: "OAuth configuration saved!",
  login_loading_auth: "Authenticating...",
  login_loading_connect: "Connecting...",
  login_loading_unlock: "Unlocking...",
  login_btn_save_token: "Connect GitHub (PAT)",
  login_btn_oauth: "Sign in with GitHub",
  login_oauth_config: "OAuth Configuration",
  login_oauth_client_id: "GitHub App Client ID",
  login_oauth_worker_url: "Cloudflare Worker Proxy URL",
  login_btn_save_config: "Save Configuration",
  login_master_password: "Master Password",
  login_placeholder_mp: "Enter your Master Password...",
  login_btn_unlock: "Unlock",
  login_forgot_password: "Forgot Master Password?",
  login_reset_token: "Change GitHub Account",
  login_error_empty_pat: "Please enter your Personal Access Token",
  login_error_invalid_token: "Invalid token or connection error",
  login_error_any: "An error occurred",
  login_error_oauth_missing_config:
    "Please open 'OAuth Configuration' to enter Client ID and Worker URL before logging in.",
  login_error_oauth_no_token: "Did not receive access token from GitHub",
  login_error_oauth_fail: "OAuth Login failed",
  login_error_empty_mp: "Please enter your Master Password",
  login_error_wrong_mp: "Incorrect Master Password",
  login_error_unlock_fail: "Unlock failed",
  login_forgot_password_title: "Forgot Master Password",
  login_forgot_password_msg:
    "{APP_NAME} uses end-to-end encryption (Zero-Knowledge). The Master Password is never sent or stored on any server, hence there is <strong style='color: var(--error);'>NO WAY</strong> to recover or reset it.<br/><br/>To start over, the system will <strong>LOG OUT</strong> and <strong>CLEAR LOCAL DATA</strong>.<br/><br/>If you want to continue using this GitHub account, the system will open the GitHub Gist page containing the old vault so you can <strong>BACK UP</strong> the data or <strong style='color: var(--error);'>MANUALLY DELETE</strong> this Gist on GitHub before logging in again.<br/><br/>Are you sure you want to log out and open the old Gist page?",
  app_loading: "Loading {APP_NAME}...",

  // Vault Page
  vault_search_placeholder: "Search accounts...",
  vault_empty_title: "No accounts yet",
  vault_empty_subtitle:
    "Your vault is empty. Click the + button below to add a new account.",
  vault_btn_sync: "Sync",
  vault_btn_settings: "Settings",
  vault_btn_generator: "Generator",
  vault_btn_add: "Add New",
  vault_popout_title: "Open in separate window",
  vault_lock_title: "Lock vault",
  vault_suggested_items: "Suggested for this website",
  vault_all_items: "All Accounts",
  vault_search_results: "Search Results",
  vault_no_search_matches: "No matching accounts found",
  vault_menu_all: "All Items",
  vault_menu_logins: "Logins",
  vault_menu_notes: "Secure Notes",
  vault_menu_favorites: "Favorites",
  vault_item_login: "Login",
  vault_item_note: "Secure Note",
  vault_syncing: "Syncing...",
  vault_sync_error: "Sync Error",
  vault_no_username: "No username",
  vault_copy_notes: "Copy Secure Note",
  vault_copy_options: "Copy Options",
  vault_menu_unfavorite: "Remove from Favorites",
  vault_menu_more: "More options",
  vault_importing: "Importing vault data...",
  btn_clone: "Clone",
  vault_item_clone_suffix: "Copy",

  // Item Edit / Add Page
  edit_title_add_login: "Add Login",
  edit_title_edit_login: "Edit Login",
  edit_title_add_note: "Add Secure Note",
  edit_title_edit_note: "Edit Secure Note",
  edit_label_name: "Name",
  edit_placeholder_name: "e.g., Facebook, Google...",
  edit_label_username: "Username",
  edit_placeholder_username: "Username or email...",
  edit_label_password: "Password",
  edit_placeholder_password: "Account password...",
  edit_label_totp: "Authenticator Key (TOTP)",
  edit_placeholder_totp: "Paste secret key (Base32) or otpauth:// URI...",
  edit_label_website: "Website URI",
  edit_placeholder_website: "https://example.com",
  edit_label_notes: "Notes",
  edit_placeholder_notes: "Enter notes here...",
  edit_section_additional_options: "Additional options",
  edit_section_item_details: "Item details",
  edit_label_fields: "Custom Fields",
  edit_field_type_text: "Text",
  edit_field_type_hidden: "Hidden",
  edit_field_name_placeholder: "Field Name",
  edit_field_val_placeholder: "Field Value",
  edit_btn_add_field: "Add Custom Field",
  edit_label_passkeys: "Passkeys (WebAuthn)",
  edit_passkey_creation_date: "Created: {date}",
  edit_passkey_counter: "Counter: {count}",
  edit_passkey_rp_id: "Domain (RP ID): {rpId}",
  edit_passkey_username: "Username: {name}",
  edit_passkey_user_handle: "User Handle: {handle}",
  edit_passkey_discoverable: "Discoverable: {val}",
  edit_passkey_yes: "Yes",
  edit_passkey_no: "No",
  edit_error_empty_name: "Please enter a name",
  edit_error_save_failed: "Failed to save item",
  edit_confirm_delete_title: "Delete Item",
  edit_confirm_delete_msg:
    "Are you sure you want to delete '{name}'? This action cannot be undone.",
  edit_error_delete_failed: "Failed to delete item",
  edit_label_type: "Type",
  edit_type_login: "Login",
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

  // Item Detail Page
  detail_title_login: "Login Details",
  detail_title_note: "Secure Note Details",
  detail_totp_copied: "TOTP code copied",
  detail_totp_error: "ERROR CODE",
  detail_copy_username: "Copy username",
  detail_copy_password: "Copy password",
  detail_copy_totp: "Copy TOTP code",
  detail_copied: "Copied!",
  detail_passkey_webauthn: "Passkey (WebAuthn)",
  detail_fields: "Custom Fields",
  detail_creation_date: "Created",
  detail_revision_date: "Modified",
  detail_section_login: "Login Credentials",
  detail_no_value: "None",
  detail_section_security: "Security & OTP",
  detail_totp_label: "Current Authenticator Code (TOTP)",
  detail_section_autofill: "Auto-fill Options",
  detail_visit_website: "Visit website",

  // Settings Page
  settings_header: "Settings",
  settings_change_mp: "Change Master Password",
  settings_export: "Export Vault (JSON)",
  settings_clear_vault: "Clear Vault (Reset)",
  settings_logout: "Logout GitHub Account",
  settings_label_language: "Language / Ngôn ngữ",
  settings_lang_vi: "Tiếng Việt",
  settings_lang_en: "English",
  settings_github_account: "GitHub Account",
  settings_connected_as: "Connected as {user}",
  settings_gist_id: "Gist ID",
  settings_last_sync: "Last Synced",
  settings_sync_never: "Never",
  settings_label_oauth: "Auth Mechanism",
  settings_version: "Version: {ver}",
  settings_theme_label: "Theme",
  settings_theme_sub: "Current: {theme}",
  settings_theme_dark: "Dark",
  settings_theme_light: "Light",
  settings_vault_options_label: "Vault Options",
  settings_vault_options_sub: "Sync, import and export data",
  settings_change_mp_title: "Change Master Password",
  settings_change_mp_sub: "Re-encrypt vault with new password",
  settings_lock_sub: "Re-open with Master Password",
  settings_clear_vault_sub: "Permanently delete all vault data",
  settings_logout_sub: "Disconnect and remove Gist configuration",
  settings_open_gist_title: "Open storage Gist on GitHub",
  settings_change_mp_current: "Current Master Password",
  settings_change_mp_new: "New Master Password",
  settings_change_mp_confirm: "Confirm New Master Password",
  settings_change_mp_btn: "Change Password",
  settings_error_mp_wrong_current: "Current Master Password is incorrect",
  settings_error_mp_empty_new: "New Master Password cannot be empty",
  settings_error_mp_mismatch: "Password confirmation does not match",
  settings_error_mp_fail: "Failed to change password",
  settings_error_fields_required: "Please fill in all fields",
  settings_mp_success: "Master Password changed successfully!",
  settings_export_title: "Export Vault Data",
  settings_export_placeholder: "Enter Master Password to export...",
  settings_export_btn: "Decrypt & Download",
  settings_export_success: "Backup file downloaded!",
  settings_clear_vault_title: "Clear Vault",
  settings_clear_vault_msg:
    "Are you sure you want to delete ALL items in the vault? This action cannot be undone and all data on GitHub Gist will be deleted.",
  settings_clear_vault_confirm_title: "Confirm Permanent Deletion",
  settings_clear_vault_confirm_msg:
    "FINAL CONFIRMATION: Permanently delete all account data?",
  settings_clear_vault_placeholder: "Enter Master Password to confirm...",
  settings_clear_vault_btn: "PERMANENTLY DELETE",
  settings_clear_vault_success: "All vault accounts deleted successfully!",
  settings_clear_vault_fail: "Failed to clear vault",
  settings_logout_title: "Logout",
  settings_logout_msg:
    "Are you sure you want to disconnect your GitHub account? This will remove all local configurations.",
  settings_logout_success: "Logged out successfully",
  vault_sync_success: "Vault synced successfully!",
  vault_import_success:
    "Successfully imported {count} accounts! The vault has been synced to Gist.",
  vault_import_error_invalid: "Invalid file format or validation failed",
  vault_import_error_fail: "Failed to import JSON file",
  vault_export_error_fail: "Failed to export JSON file",
  vault_options_sync_manual: "Manual Sync",
  vault_options_import: "Import Accounts (Import JSON)",
  vault_options_import_sub: "Supports accounts.json or exported Bitwarden file",
  vault_options_export: "Export Accounts (Export JSON)",
  vault_options_export_sub: "Save current accounts list to JSON file",

  // Password Generator View
  gen_title: "Password Generator",
  gen_label_length: "Length",
  gen_opt_uppercase: "Uppercase (A-Z)",
  gen_opt_lowercase: "Lowercase (a-z)",
  gen_opt_numbers: "Numbers (0-9)",
  gen_opt_symbols: "Special Characters (!@#...)",
  gen_opt_avoid_ambiguous: "Avoid ambiguous characters (O, 0, l, 1)",
  gen_error_charset_empty: "Choose at least one character type!",
  gen_btn_generate: "Generate Password",
  gen_btn_copy: "Copy",

  // FIDO2 Prompt View
  fido2_title: "Passkey Authentication",
  fido2_rp: "Website: {rp}",
  fido2_username: "Account: {user}",
  fido2_btn_approve: "Approve",
  fido2_btn_deny: "Deny",
  fido2_unlock_required: "Unlock vault to use Passkeys",
  fido2_error_no_request: "No pending authentication requests found.",
  fido2_error_load_failed: "Failed to load authentication request",
  fido2_error_save_failed: "Failed to save Passkey to vault",
  fido2_error_create_failed: "Failed to create Passkey",
  fido2_error_counter_update_failed: "Failed to update Passkey counter",
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
    "Unlock {APP_NAME} with Master Password to continue Passkey authentication.",
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
  nav_settings: "Settings",

  // Guide Page
  settings_user_guide: "User Guide",
  settings_user_guide_sub:
    "Learn how to use, security architecture, and FIDO2 Passkeys",
  guide_title: "{APP_NAME} User Guide",
  guide_welcome: "Welcome to {APP_NAME}!",
  guide_subtitle:
    "Personal password vault, Zero-Knowledge encrypted, synced to GitHub Gist.",
  guide_close_page: "Close Guide",
  guide_quick_action_desc:
    "Open GitHub Gist to manage your password database files.",
  guide_open_github_btn: "Open GitHub Gist",
  guide_tab_general: "General",
  guide_tab_gist: "GitHub Gist Sync",
  guide_tab_security: "Security Architecture",
  guide_tab_passkey: "Using Passkeys (FIDO2)",
  guide_tab_totp: "TOTP (2FA) Codes",
  guide_tab_import_export: "Import / Export Data",
  guide_tab_faq: "FAQ",

  // Guide Gist Token Steps
  guide_token_title: "How to Create a GitHub Token for Sync",
  guide_token_desc:
    "To sync your data, {APP_NAME} stores your encrypted vault in your personal GitHub Gists. You need to create a Token with the 'gist' scope.",
  guide_token_step1_title: "Step 1: Set Name and Expiration",
  guide_token_step1_desc:
    "Log in to GitHub and click the green button below to open the token creation page. Give it a descriptive note (e.g., '{APP_NAME}') and select 'No expiration' so sync doesn't break later.",
  guide_token_step1_btn: "Open GitHub Token Creation Page",
  guide_token_step1_img_info: "Name the Token and choose expiration time",
  guide_token_step2_title: "Step 2: Check the 'gist' Scope",
  guide_token_step2_desc:
    "Find and select the 'gist' checkbox. This scope only permits {APP_NAME} to read/write Gists, and doesn't grant access to any of your code repositories.",
  guide_token_step2_img_info: "Ensure 'gist' scope is checked",
  guide_token_step3_title: "Step 3: Generate Token",
  guide_token_step3_desc:
    "Scroll to the bottom of the page and click the green 'Generate token' button to create your token.",
  guide_token_step3_img_info:
    "Click 'Generate token' at the bottom of the page",
  guide_token_step4_title: "Step 4: Copy and Paste into Settings",
  guide_token_step4_desc:
    "Copy the generated token (a string starting with ghp_). Then open {APP_NAME}, select 'Use Token (PAT)', paste it into the token field, and click Save.",
  guide_token_step4_img_info: "Copy token and paste it into the settings page",
  guide_token_important_note: "Important Note:",
  guide_token_note_desc:
    " NEVER share this token with anyone. The extension stores the token locally on your computer and sends it directly to GitHub without any intermediary servers.",

  // Guide Passkey Registration Steps
  guide_pk_reg_title: "How to Register a New Passkey",
  guide_pk_reg_desc:
    "To start using passwordless login, follow this 3-step guide to save a new Passkey into your vault.",
  guide_pk_reg_step1_title: "Step 1: Click Register on Website",
  guide_pk_reg_step1_desc:
    "When you are on a website's security settings page (e.g., Google, GitHub, webauthn.me), click the register passkey button (often 'Add a passkey' or similar).",
  guide_pk_reg_step1_img_info: "Passkey registration request on the website",
  guide_pk_reg_step2_title: "Step 2: Choose Account to Store",
  guide_pk_reg_step2_desc:
    "{APP_NAME} will automatically intercept the request and show a popup. Select an existing matching account in your vault to link, or click 'Create new account' to save it separately.",
  guide_pk_reg_step2_img_info: "Select account or choose to create a new one",
  guide_pk_reg_step3_title: "Step 3: Confirm Saving Passkey",
  guide_pk_reg_step3_desc:
    "After selecting your option, click 'Save Passkey' to store the encrypted private credential. The extension will automatically sync it to GitHub Gist if sync is configured.",
  guide_pk_reg_step3_img_info: "Confirm saving passkey successfully",

  // Guide Passkey Login Steps
  guide_pk_login_title: "How to Log In with a Passkey",
  guide_pk_login_desc:
    "Once a Passkey is stored, you no longer need to type passwords or 2FA codes. The login process is simple and takes just 2 steps:",
  guide_pk_login_step1_title: "Step 1: Choose Login with Passkey",
  guide_pk_login_step1_desc:
    "On the website's login page, select the option to log in using a Passkey (often represented by a key icon or Face ID symbol).",
  guide_pk_login_step1_img_info: "Click log in with passkey on the website",
  guide_pk_login_step2_title: "Step 2: Select Account on Popup",
  guide_pk_login_step2_desc:
    "The {APP_NAME} popup will list saved Passkeys compatible with this website. Select the corresponding account and click 'Confirm Login' to gain instant access.",
  guide_pk_login_step2_img_info:
    "Select the corresponding Passkey account to log in",

  // Guide TOTP Steps
  guide_totp_step1_title: "Step 1: Scan 2FA QR Code on Website",
  guide_totp_step1_desc:
    "When a website (e.g., Google, GitHub, Facebook) displays a QR code for two-factor authentication setup, open {APP_NAME} and click the camera/QR scan icon next to the TOTP field to scan it. If you cannot scan the QR code or the website only provides a text key (Secret Key), you can copy that text key and paste it manually into the TOTP field and save.",
  guide_totp_step1_img_info: "Click the QR code scan icon in the app",
  guide_totp_step2_title: "Step 2: Automatically Save & Display OTP Codes",
  guide_totp_step2_desc:
    "After scanning, the secret key is decoded and saved. {APP_NAME} will start generating 6-digit authentication codes that refresh every 30 seconds. Click on the code to copy it, then paste it directly into the website's verification box.",
  guide_totp_step2_img_info:
    "Verification code is generated automatically with a one-click copy button",

  // Guide Security Tab
  guide_sec_title: "Security Architecture",
  guide_sec_subtitle:
    "To protect your personal information, {APP_NAME} is built with optimal security mechanisms to keep your data safe at all times.",
  guide_sec_card1_title: "Zero-Knowledge Encryption",
  guide_sec_card1_desc:
    "All your passwords and notes are encrypted on your device before syncing. Your Master Password runs locally in your browser and is NEVER sent anywhere. No one (neither us nor GitHub) can read your passwords.",
  guide_sec_card2_title: "Extremely Powerful Password Protection",
  guide_sec_card2_desc:
    "{APP_NAME} uses the most modern and secure encryption technologies available today to protect your vault, effectively preventing any attempts to brute-force or guess your Master Password, even using supercomputers.",
  guide_sec_card3_title: "100% Secure Cloud Sync",
  guide_sec_card3_desc:
    "Your vault data stored on your personal GitHub Gist is completely encrypted into meaningless characters. This data can only be decrypted and read when you enter the correct Master Password on the app.",

  // Guide General Tab
  guide_gen_title: "3 Quick Start Steps",
  guide_gen_step1_title: "Set Master Password",
  guide_gen_step1_desc:
    "Create a highly secure Master Password to encrypt your entire vault locally. Do not forget this password, as it cannot be recovered.",
  guide_gen_step2_title: "Connect GitHub Sync",
  guide_gen_step2_desc:
    "Log in quickly via OAuth or paste a Personal Access Token (PAT) with 'gist' scope to let {APP_NAME} sync your encrypted vault automatically.",
  guide_gen_step3_title: "Start Using Safely",
  guide_gen_step3_desc:
    "Start storing accounts, secure notes, auto-filling logins, and simulating/storing Passkeys (FIDO2) securely right inside your browser.",

  // Guide Import / Export Tab
  guide_ie_title: "Import / Export Data",
  guide_ie_subtitle:
    "{APP_NAME} is fully compatible with data exports from Bitwarden. You can easily migrate your vault data to {APP_NAME}.",
  guide_ie_import_title: "Importing from Bitwarden",
  guide_ie_import_step1_title: "Step 1: Export JSON from Bitwarden",
  guide_ie_import_step1_desc:
    "Open Bitwarden -> Go to Settings -> Export Vault -> Choose '.json (unencrypted)' format and download it to your computer.",
  guide_ie_import_step2_title: "Step 2: Load into {APP_NAME}",
  guide_ie_import_step2_desc:
    "Open {APP_NAME} -> Settings -> Import Accounts (Import JSON) -> Select the JSON file you downloaded in Step 1.",
  guide_ie_import_step3_title: "Step 3: Encrypt and Sync",
  guide_ie_import_step3_desc:
    "The system will encrypt all imported accounts using your Master Password and push them directly to GitHub Gist. You should delete the unencrypted Bitwarden JSON file from your disk immediately for security.",
  guide_ie_export_title: "Exporting Local Backups",
  guide_ie_export_desc:
    "To have an offline backup copy in case you lose access to your GitHub account:",
  guide_ie_export_step1:
    "Go to {APP_NAME} Settings -> Choose 'Export Accounts (Export JSON)'.",
  guide_ie_export_step2:
    "Enter your Master Password to decrypt the local database.",
  guide_ie_export_step3:
    "Click 'Decrypt & Download' to save the unencrypted `accounts.json` file. Protect this file carefully as it contains all passwords in clear text!",

  // Guide FAQ Tab
  guide_faq_title: "Frequently Asked Questions",
  guide_faq_subtitle:
    "Find answers to common questions about {APP_NAME}'s sync, security, and passwords.",
  guide_faq_q1_title: "❓ Is my Master Password safe?",
  guide_faq_q1_desc:
    "Extremely safe. {APP_NAME} utilizes Zero-Knowledge encryption. Your Master Password is only used to derive encryption keys locally in your browser and is never stored or transmitted over the internet.",
  guide_faq_q2_title: "❓ What if I forget my Master Password?",
  guide_faq_q2_desc:
    "There is no way to recover your Master Password. If forgotten, you will have to reset the extension and start over. Please memorize or write down your Master Password and store it in a safe place.",
  guide_faq_q3_title: "❓ Can I sync my passwords across multiple computers?",
  guide_faq_q3_desc:
    "Yes. Simply install {APP_NAME} on the other computer, sign in with the same GitHub account (or paste the same token), and enter the EXACT Master Password you used on your first computer. Your vault will load and decrypt automatically.",
  guide_faq_q4_title: "❓ Is storing my vault in a Secret Gist really private?",
  guide_faq_q4_desc:
    "Yes. Secret Gists are not indexed by search engines and do not appear on your public GitHub profile page. Even if someone happens to guess the direct Gist URL, they will only see meaningless encrypted cipher text. Without your Master Password, it is impossible to decrypt.",

  // Guide Passkey Headers & sub-tabs
  guide_pk_header_title: "Using Passkeys (FIDO2)",
  guide_pk_header_desc:
    "{APP_NAME} supports simulating and managing passwordless login keys (Passkeys / WebAuthn) to replace traditional passwords.",
  guide_pk_subtab_reg: "📝 Registration Guide",
  guide_pk_subtab_login: "🔑 Login Guide",

  // Guide TOTP Headers
  guide_totp_header_title: "Using Two-Factor Authentication (TOTP / 2FA)",
  guide_totp_header_desc:
    "{APP_NAME} supports storing two-factor authentication (TOTP) codes to secure your accounts. The codes refresh automatically every 30 seconds.",
};
