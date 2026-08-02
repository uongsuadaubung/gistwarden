/* tslint:disable */
/* eslint-disable */

export function aes_gcm_decrypt(ciphertext_and_tag: Uint8Array, key_bytes: Uint8Array, iv_bytes: Uint8Array): Uint8Array;

export function aes_gcm_encrypt(plaintext: Uint8Array, key_bytes: Uint8Array, iv_bytes: Uint8Array): Uint8Array;

export function batch_parse_hibp_response(response_text: string, suffixes_json: string): string;

export function cbor_byte_string(bytes: Uint8Array): Uint8Array;

export function cbor_encode_length(major_type: number, length: number): Uint8Array;

export function cbor_map_header(num_pairs: number): Uint8Array;

export function cbor_negative_int(n: number): Uint8Array;

export function cbor_positive_int(n: number): Uint8Array;

export function cbor_text_string(s: string): Uint8Array;

export function compress_deflate(data: Uint8Array): Uint8Array;

export function concat_bytes(chunks: Array<any>): Uint8Array;

export function decode_qr_code(width: number, height: number, rgba_bytes: Uint8Array): string;

export function decode_qr_from_bytes(image_bytes: Uint8Array): string;

export function decompress_deflate(data: Uint8Array): Uint8Array;

export function derive_key_argon2id(password: string, salt: Uint8Array, iterations?: number | null, memory_kib?: number | null, hash_length?: number | null): Uint8Array;

export function encode_cose_ec2_public_key(x: Uint8Array, y: Uint8Array): Uint8Array;

export function estimate_password_strength(password: string, user_inputs_json: string): string;

export function export_to_bitwarden_csv(items_json: string, folders_json: string): string;

export function export_to_browser_csv(items_json: string): string;

export function export_to_json(items_json: string, folders_json: string): string;

export function fast_xor(data: Uint8Array, key: Uint8Array): Uint8Array;

export function filter_matching_domain_items(items_json: string, domain_or_url: string, override_mode?: number | null): string;

export function filter_matching_domain_items_js(items_val: any, domain_or_url: string, override_mode?: number | null): any;

export function filter_vault_items_by_query(items_json: string, search_query: string, filter_type: string): string;

export function filter_vault_items_by_query_js(items_val: any, search_query: string, filter_type: string): any;

export function generate_assertion_signature_base(auth_data: Uint8Array, client_data_hash: Uint8Array): Uint8Array;

export function generate_auth_data(rp_id: string, counter: number, user_present: boolean, user_verified: boolean, credential_id?: Uint8Array | null, key_x?: Uint8Array | null, key_y?: Uint8Array | null): Uint8Array;

export function generate_passphrase(num_words: number, word_separator: string, capitalize: boolean, include_number: boolean, wordlist?: string[] | null): string;

export function generate_password(opts_val: any): string;

export function generate_random_bytes(length: number): Uint8Array;

export function generate_totp_code(secret_base32: string, timestamp_ms: bigint, period_secs: bigint): string;

export function get_base_domain(input: string): string;

export function get_hostname(input: string): string;

export function get_random_bounded_int(max: number): number;

export function greet(name: string): string;

export function hash_password_argon2id(password: string, salt: Uint8Array, iterations?: number | null, memory_kib?: number | null): string;

export function hmac_sha256(message: string, secret_key: string): string;

export function is_single_uri_match(opts_val: any): boolean;

export function merge_folders(local_folders_json: string, remote_folders_json: string): string;

export function merge_folders_js(local_val: any, remote_val: any): any;

export function merge_vault_items(local_items_json: string, remote_items_json: string, last_sync_timestamp: bigint): string;

export function merge_vault_items_js(local_val: any, remote_val: any, last_sync_timestamp: bigint): any;

export function merge_vault_payload(local_json: string, remote_json: string, last_sync_timestamp: bigint): string;

export function merge_vault_payload_js(local_val: any, remote_val: any, last_sync_timestamp: bigint): any;

export function p1363_to_der(signature: Uint8Array): Uint8Array;

export function pack_attestation_object(auth_data: Uint8Array): Uint8Array;

export function parse_bitwarden_csv_import(csv_text: string, existing_folders_json: string): string;

export function parse_browser_csv_import(csv_text: string): string;

export function parse_csv(text: string): string;

export function parse_hibp_response(response_text: string, suffix: string): number;

export function parse_json_import(json_text: string, existing_items_json: string, existing_folders_json: string): string;

export function parse_ssh_key(private_key_text: string): string[];

export function parse_totp_secret(raw_secret: string): string;

export function sha1_prefix_suffix(password: string): string;

export function unparse_csv(rows_json: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly aes_gcm_decrypt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly aes_gcm_encrypt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly batch_parse_hibp_response: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly cbor_byte_string: (a: number, b: number, c: number) => void;
    readonly cbor_encode_length: (a: number, b: number, c: number) => void;
    readonly cbor_map_header: (a: number, b: number) => void;
    readonly cbor_negative_int: (a: number, b: number) => void;
    readonly cbor_positive_int: (a: number, b: number) => void;
    readonly cbor_text_string: (a: number, b: number, c: number) => void;
    readonly compress_deflate: (a: number, b: number, c: number) => void;
    readonly concat_bytes: (a: number, b: number) => void;
    readonly decode_qr_code: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly decode_qr_from_bytes: (a: number, b: number, c: number) => void;
    readonly decompress_deflate: (a: number, b: number, c: number) => void;
    readonly derive_key_argon2id: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly encode_cose_ec2_public_key: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly estimate_password_strength: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly export_to_bitwarden_csv: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly export_to_browser_csv: (a: number, b: number, c: number) => void;
    readonly export_to_json: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly fast_xor: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly filter_matching_domain_items: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly filter_matching_domain_items_js: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly filter_vault_items_by_query: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly filter_vault_items_by_query_js: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly generate_assertion_signature_base: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly generate_auth_data: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
    readonly generate_passphrase: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly generate_password: (a: number, b: number) => void;
    readonly generate_random_bytes: (a: number, b: number) => void;
    readonly generate_totp_code: (a: number, b: number, c: number, d: bigint, e: bigint) => void;
    readonly get_base_domain: (a: number, b: number, c: number) => void;
    readonly get_hostname: (a: number, b: number, c: number) => void;
    readonly get_random_bounded_int: (a: number) => number;
    readonly greet: (a: number, b: number, c: number) => void;
    readonly hash_password_argon2id: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly hmac_sha256: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly is_single_uri_match: (a: number) => number;
    readonly merge_folders: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly merge_folders_js: (a: number, b: number, c: number) => void;
    readonly merge_vault_items: (a: number, b: number, c: number, d: number, e: number, f: bigint) => void;
    readonly merge_vault_items_js: (a: number, b: number, c: number, d: bigint) => void;
    readonly merge_vault_payload: (a: number, b: number, c: number, d: number, e: number, f: bigint) => void;
    readonly merge_vault_payload_js: (a: number, b: number, c: number, d: bigint) => void;
    readonly p1363_to_der: (a: number, b: number, c: number) => void;
    readonly pack_attestation_object: (a: number, b: number, c: number) => void;
    readonly parse_bitwarden_csv_import: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly parse_browser_csv_import: (a: number, b: number, c: number) => void;
    readonly parse_csv: (a: number, b: number, c: number) => void;
    readonly parse_hibp_response: (a: number, b: number, c: number, d: number) => number;
    readonly parse_json_import: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly parse_ssh_key: (a: number, b: number, c: number) => void;
    readonly parse_totp_secret: (a: number, b: number, c: number) => void;
    readonly sha1_prefix_suffix: (a: number, b: number, c: number) => void;
    readonly unparse_csv: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
