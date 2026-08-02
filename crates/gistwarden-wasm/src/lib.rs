pub mod cbor;
pub mod crypto;
pub mod csv_parser;
pub mod domain;
pub mod generator;
pub mod json_parser;
pub mod matcher;
pub mod qr;
pub mod ssh;
pub mod strength;
pub mod sync;
pub mod totp;
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
pub fn pack_attestation_object(auth_data: &[u8]) -> Vec<u8> {
    cbor::pack_attestation_object(auth_data)
}

#[wasm_bindgen]
pub fn encode_cose_ec2_public_key(x: &[u8], y: &[u8]) -> Vec<u8> {
    cbor::encode_cose_ec2_public_key(x, y)
}

#[wasm_bindgen]
pub fn cbor_encode_length(major_type: u8, length: usize) -> Vec<u8> {
    cbor::cbor_encode_length(major_type, length)
}

#[wasm_bindgen]
pub fn cbor_text_string(s: &str) -> Vec<u8> {
    cbor::cbor_text_string(s)
}

#[wasm_bindgen]
pub fn cbor_byte_string(bytes: &[u8]) -> Vec<u8> {
    cbor::cbor_byte_string(bytes)
}

#[wasm_bindgen]
pub fn cbor_map_header(num_pairs: usize) -> Vec<u8> {
    cbor::cbor_map_header(num_pairs)
}

#[wasm_bindgen]
pub fn cbor_positive_int(n: usize) -> Vec<u8> {
    cbor::cbor_positive_int(n)
}

#[wasm_bindgen]
pub fn cbor_negative_int(n: usize) -> Vec<u8> {
    cbor::cbor_negative_int(n)
}

#[wasm_bindgen]
pub fn concat_bytes(chunks: js_sys::Array) -> Vec<u8> {
    cbor::concat_bytes(chunks)
}

#[wasm_bindgen]
pub fn get_random_bounded_int(max: u32) -> u32 {
    generator::get_random_bounded_int(max)
}

#[wasm_bindgen]
pub fn generate_password(
    length: usize,
    uppercase: bool,
    lowercase: bool,
    numbers: bool,
    specials: bool,
    avoid_ambiguous: bool,
    min_numbers: usize,
    min_specials: usize,
) -> Result<String, String> {
    generator::generate_password(
        length,
        uppercase,
        lowercase,
        numbers,
        specials,
        avoid_ambiguous,
        min_numbers,
        min_specials,
    )
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
pub fn is_single_uri_match(
    stored_uri: &str,
    current_url: &str,
    match_mode: Option<u8>,
    override_mode: Option<u8>,
    target_host: &str,
    item_host: &str,
    target_base: &str,
    item_base: &str,
) -> bool {
    matcher::is_single_uri_match(
        stored_uri,
        current_url,
        match_mode,
        override_mode,
        target_host,
        item_host,
        target_base,
        item_base,
    )
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

#[wasm_bindgen]
pub fn parse_hibp_response(response_text: &str, suffix: &str) -> u32 {
    matcher::parse_hibp_response(response_text, suffix)
}
