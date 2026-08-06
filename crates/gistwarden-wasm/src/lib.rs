// High-performance Rust WASM module for Gistwarden
pub mod cbor;
pub mod crypto;
pub mod csv_parser;
pub mod domain;
pub mod errors;
pub mod fido2;
pub mod generator;
pub mod json_parser;
pub mod matcher;
pub mod qr;
pub mod ssh;
pub mod strength;
pub mod sync;
pub mod totp;
pub mod types;
pub mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    utils::greet(name)
}

#[wasm_bindgen]
pub fn fast_xor(data: &[u8], key: &[u8]) -> Vec<u8> {
    crypto::fast_xor(data, key)
}

#[wasm_bindgen]
pub fn parse_totp_secret(raw_secret: &str) -> String {
    totp::parse_totp_secret(raw_secret)
}

#[wasm_bindgen]
pub fn generate_totp_code(
    secret_base32: &str,
    timestamp_ms: u64,
    period_secs: u64,
) -> Result<String, String> {
    totp::generate_totp_code(secret_base32, timestamp_ms, period_secs)
}

#[wasm_bindgen]
pub fn derive_key_argon2id(
    password: &str,
    salt: &[u8],
    iterations: Option<u32>,
    memory_kib: Option<u32>,
    hash_length: Option<usize>,
) -> Result<Vec<u8>, String> {
    crypto::derive_key_argon2id(password, salt, iterations, memory_kib, hash_length)
}

#[wasm_bindgen]
pub fn hash_password_argon2id(
    password: &str,
    salt: &[u8],
    iterations: Option<u32>,
    memory_kib: Option<u32>,
) -> Result<String, String> {
    crypto::hash_password_argon2id(password, salt, iterations, memory_kib)
}

#[wasm_bindgen]
pub fn aes_gcm_encrypt(
    plaintext: &[u8],
    key_bytes: &[u8],
    iv_bytes: &[u8],
) -> Result<Vec<u8>, String> {
    crypto::aes_gcm_encrypt(plaintext, key_bytes, iv_bytes)
}

#[wasm_bindgen]
pub fn aes_gcm_decrypt(
    ciphertext_and_tag: &[u8],
    key_bytes: &[u8],
    iv_bytes: &[u8],
) -> Result<Vec<u8>, String> {
    crypto::aes_gcm_decrypt(ciphertext_and_tag, key_bytes, iv_bytes)
}

#[wasm_bindgen]
pub fn generate_random_bytes(length: usize) -> Result<Vec<u8>, String> {
    crypto::generate_random_bytes(length)
}

#[wasm_bindgen]
pub fn compress_deflate(data: &[u8]) -> Result<Vec<u8>, String> {
    crypto::compress_deflate(data)
}

#[wasm_bindgen]
pub fn decompress_deflate(data: &[u8]) -> Result<Vec<u8>, String> {
    crypto::decompress_deflate(data)
}

#[wasm_bindgen]
pub fn sha1_prefix_suffix(password: &str) -> Result<String, String> {
    crypto::sha1_prefix_suffix(password)
}

#[wasm_bindgen]
pub fn hmac_sha256(message: &str, secret_key: &str) -> Result<String, String> {
    crypto::hmac_sha256(message, secret_key)
}

#[wasm_bindgen]
pub fn p1363_to_der(signature: &[u8]) -> Result<Vec<u8>, String> {
    crypto::p1363_to_der(signature)
}

#[wasm_bindgen]
pub fn parse_ssh_key(private_key_text: &str) -> Result<Vec<String>, String> {
    ssh::parse_ssh_key(private_key_text)
}

#[wasm_bindgen]
pub fn generate_auth_data(
    rp_id: &str,
    counter: u32,
    user_present: bool,
    user_verified: bool,
    credential_id: Option<Vec<u8>>,
    key_x: Option<Vec<u8>>,
    key_y: Option<Vec<u8>>,
) -> Vec<u8> {
    cbor::generate_auth_data(
        rp_id,
        counter,
        user_present,
        user_verified,
        credential_id.as_deref(),
        key_x.as_deref(),
        key_y.as_deref(),
    )
}

#[wasm_bindgen]
pub fn generate_assertion_signature_base(auth_data: &[u8], client_data_hash: &[u8]) -> Vec<u8> {
    cbor::generate_assertion_signature_base(auth_data, client_data_hash)
}

#[wasm_bindgen]
pub fn get_random_bounded_int(max: u32) -> u32 {
    generator::get_random_bounded_int(max)
}

#[wasm_bindgen]
pub fn generate_password(opts_val: JsValue) -> Result<String, String> {
    let opts: generator::PasswordOptions =
        serde_wasm_bindgen::from_value(opts_val).map_err(|_| errors::WasmError::GenCharsetEmpty.to_string())?;
    generator::generate_password(&opts)
}

#[wasm_bindgen]
pub fn generate_passphrase(
    num_words: usize,
    word_separator: &str,
    capitalize: bool,
    include_number: bool,
    wordlist: Option<Vec<String>>,
) -> Result<String, String> {
    generator::generate_passphrase(
        num_words,
        word_separator,
        capitalize,
        include_number,
        wordlist,
    )
}

#[wasm_bindgen]
pub fn get_hostname(input: &str) -> String {
    domain::get_hostname(input)
}

#[wasm_bindgen]
pub fn get_base_domain(input: &str) -> String {
    domain::get_base_domain(input)
}

#[wasm_bindgen]
pub fn is_single_uri_match(opts_val: JsValue) -> bool {
    let opts: matcher::UriMatchOptionsOwned =
        serde_wasm_bindgen::from_value(opts_val).unwrap_or_default();
    let borrowed_opts = matcher::UriMatchOptions {
        stored_uri: &opts.stored_uri,
        current_url: &opts.current_url,
        match_mode: opts.match_mode,
        override_mode: opts.override_mode,
        target_host: opts.target_host.as_deref(),
        item_host: opts.item_host.as_deref(),
        target_base: opts.target_base.as_deref(),
        item_base: opts.item_base.as_deref(),
    };
    matcher::is_single_uri_match(&borrowed_opts)
}

#[wasm_bindgen]
pub fn filter_vault_items_by_query(
    items_json: &str,
    search_query: &str,
    filter_type: &str,
) -> Result<String, String> {
    matcher::filter_vault_items_by_query(items_json, search_query, filter_type)
}

#[wasm_bindgen]
pub fn decode_qr_code(width: u32, height: u32, rgba_bytes: &[u8]) -> Result<String, String> {
    qr::decode_qr_code(width, height, rgba_bytes)
}

#[wasm_bindgen]
pub fn decode_qr_from_bytes(image_bytes: &[u8]) -> Result<String, String> {
    qr::decode_qr_from_bytes(image_bytes)
}

#[wasm_bindgen]
pub fn parse_csv(text: &str) -> Result<String, String> {
    csv_parser::parse_csv(text)
}

#[wasm_bindgen]
pub fn unparse_csv(rows_json: &str) -> Result<String, String> {
    csv_parser::unparse_csv(rows_json)
}

#[wasm_bindgen]
pub fn export_to_browser_csv(items_json: &str) -> Result<String, String> {
    csv_parser::export_to_browser_csv(items_json)
}

#[wasm_bindgen]
pub fn export_to_bitwarden_csv(items_json: &str, folders_json: &str) -> Result<String, String> {
    csv_parser::export_to_bitwarden_csv(items_json, folders_json)
}

#[wasm_bindgen]
pub fn parse_browser_csv_import(csv_text: &str) -> Result<String, String> {
    csv_parser::parse_browser_csv_import(csv_text)
}

#[wasm_bindgen]
pub fn parse_bitwarden_csv_import(
    csv_text: &str,
    existing_folders_json: &str,
) -> Result<String, String> {
    csv_parser::parse_bitwarden_csv_import(csv_text, existing_folders_json)
}

#[wasm_bindgen]
pub fn estimate_password_strength(
    password: &str,
    user_inputs_json: &str,
) -> Result<String, String> {
    strength::estimate_password_strength(password, user_inputs_json)
}

#[wasm_bindgen]
pub fn merge_vault_payload(
    local_json: &str,
    remote_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    sync::merge_vault_payload(local_json, remote_json, last_sync_timestamp)
}

#[wasm_bindgen]
pub fn merge_folders(
    local_folders_json: &str,
    remote_folders_json: &str,
) -> Result<String, String> {
    sync::merge_folders(local_folders_json, remote_folders_json)
}

#[wasm_bindgen]
pub fn merge_vault_items(
    local_items_json: &str,
    remote_items_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    sync::merge_vault_items(local_items_json, remote_items_json, last_sync_timestamp)
}

#[wasm_bindgen]
pub fn parse_json_import(
    json_text: &str,
    existing_items_json: &str,
    existing_folders_json: &str,
) -> Result<String, String> {
    json_parser::parse_json_import(json_text, existing_items_json, existing_folders_json)
}

#[wasm_bindgen]
pub fn export_to_json(items_json: &str, folders_json: &str) -> Result<String, String> {
    json_parser::export_to_json(items_json, folders_json)
}

#[wasm_bindgen]
pub fn filter_matching_domain_items(
    items_json: &str,
    domain_or_url: &str,
    override_mode: Option<u8>,
) -> Result<String, String> {
    matcher::filter_matching_domain_items(items_json, domain_or_url, override_mode)
}



fn to_js_value<T: serde::Serialize>(val: &T) -> Result<JsValue, JsValue> {
    let serializer = serde_wasm_bindgen::Serializer::json_compatible();
    val.serialize(&serializer).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn filter_matching_domain_items_js(
    items_val: JsValue,
    domain_or_url: &str,
    override_mode: Option<u8>,
) -> Result<JsValue, JsValue> {
    let items: Vec<types::VaultItem> = serde_wasm_bindgen::from_value(items_val)?;
    let filtered = matcher::filter_matching_domain_items_values(items, domain_or_url, override_mode);
    to_js_value(&filtered)
}

#[wasm_bindgen]
pub fn filter_vault_items_by_query_js(
    items_val: JsValue,
    search_query: &str,
    filter_type: &str,
) -> Result<JsValue, JsValue> {
    let items: Vec<types::VaultItem> = serde_wasm_bindgen::from_value(items_val)?;
    let filtered = matcher::filter_vault_items_by_query_values(items, search_query, filter_type);
    to_js_value(&filtered)
}

#[wasm_bindgen]
pub fn merge_vault_payload_js(
    local_val: JsValue,
    remote_val: JsValue,
    last_sync_timestamp: u64,
) -> Result<JsValue, JsValue> {
    let local_payload: types::VaultPayload = serde_wasm_bindgen::from_value(local_val)?;
    let remote_payload: types::VaultPayload = serde_wasm_bindgen::from_value(remote_val)?;
    let res_val = sync::merge_vault_payload_values(local_payload, remote_payload, last_sync_timestamp);
    to_js_value(&res_val)
}

#[wasm_bindgen]
pub fn merge_folders_js(
    local_val: JsValue,
    remote_val: JsValue,
) -> Result<JsValue, JsValue> {
    let local_folders: Vec<types::Folder> = serde_wasm_bindgen::from_value(local_val)?;
    let remote_folders: Vec<types::Folder> = serde_wasm_bindgen::from_value(remote_val)?;
    let merged = sync::merge_folders_values(local_folders, remote_folders);
    to_js_value(&merged)
}

#[wasm_bindgen]
pub fn merge_vault_items_js(
    local_val: JsValue,
    remote_val: JsValue,
    last_sync_timestamp: u64,
) -> Result<JsValue, JsValue> {
    let local_items: Vec<types::VaultItem> = serde_wasm_bindgen::from_value(local_val)?;
    let remote_items: Vec<types::VaultItem> = serde_wasm_bindgen::from_value(remote_val)?;
    let merged = sync::merge_vault_items_values(local_items, remote_items, last_sync_timestamp);
    to_js_value(&merged)
}

#[wasm_bindgen]
pub fn parse_hibp_response(response_text: &str, suffix: &str) -> u32 {
    matcher::parse_hibp_response(response_text, suffix)
}

#[wasm_bindgen]
pub fn batch_parse_hibp_response(response_text: &str, suffixes_json: &str) -> String {
    matcher::batch_parse_hibp_response(response_text, suffixes_json)
}

#[wasm_bindgen]
pub fn generate_passkey_register_response_js(options_json: &str, origin: &str) -> Result<JsValue, JsValue> {
    let out = fido2::generate_passkey_register_response(options_json, origin)
        .map_err(|e| JsValue::from_str(&e))?;
    to_js_value(&out)
}

#[wasm_bindgen]
pub fn generate_passkey_assert_response_js(options_json: &str, origin: &str, cred_json: &str) -> Result<JsValue, JsValue> {
    let out = fido2::generate_passkey_assert_response(options_json, origin, cred_json)
        .map_err(|e| JsValue::from_str(&e))?;
    to_js_value(&out)
}

#[wasm_bindgen]
pub fn find_matching_fido2_credentials_js(vault_items_json: &str, rp_id: &str, allow_credentials_json: &str) -> Result<JsValue, JsValue> {
    let out = fido2::find_matching_fido2_credentials(vault_items_json, rp_id, allow_credentials_json)
        .map_err(|e| JsValue::from_str(&e))?;
    to_js_value(&out)
}

#[wasm_bindgen]
pub fn find_matching_fido2_accounts_js(vault_items_json: &str, rp_id: &str, origin: &str) -> Result<JsValue, JsValue> {
    let out = fido2::find_matching_fido2_accounts(vault_items_json, rp_id, origin)
        .map_err(|e| JsValue::from_str(&e))?;
    to_js_value(&out)
}
