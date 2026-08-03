use crate::errors::WasmError;
use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Algorithm, Argon2, Params, Version,
};
use flate2::{read::ZlibDecoder, write::ZlibEncoder, Compression};
use hmac::{Hmac, Mac};
use sha1::{Digest as Sha1Digest, Sha1};
use sha2::Sha256;
use std::io::{Read, Write};

type HmacSha256 = Hmac<Sha256>;

pub fn aes_gcm_encrypt(plaintext: &[u8], key_bytes: &[u8], iv_bytes: &[u8]) -> Result<Vec<u8>, String> {
    if key_bytes.len() != 32 || iv_bytes.len() != 12 {
        return Err(WasmError::CryptoEncryptFailed.to_string());
    }
    let cipher = Aes256Gcm::new_from_slice(key_bytes).map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
    let nonce = Nonce::from_slice(iv_bytes);
    cipher.encrypt(nonce, plaintext).map_err(|_| WasmError::CryptoEncryptFailed.to_string())
}

pub fn aes_gcm_decrypt(ciphertext_and_tag: &[u8], key_bytes: &[u8], iv_bytes: &[u8]) -> Result<Vec<u8>, String> {
    if key_bytes.len() != 32 || iv_bytes.len() != 12 {
        return Err(WasmError::CryptoEncryptFailed.to_string());
    }
    let cipher = Aes256Gcm::new_from_slice(key_bytes).map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
    let nonce = Nonce::from_slice(iv_bytes);
    cipher.decrypt(nonce, ciphertext_and_tag).map_err(|_| WasmError::CryptoEncryptFailed.to_string())
}

pub fn generate_random_bytes(length: usize) -> Result<Vec<u8>, String> {
    let mut buf = vec![0u8; length];
    getrandom::getrandom(&mut buf).map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
    Ok(buf)
}

pub fn compress_deflate(data: &[u8]) -> Result<Vec<u8>, String> {
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(data)
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
    encoder
        .finish()
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())
}

pub fn decompress_deflate(data: &[u8]) -> Result<Vec<u8>, String> {
    if data.len() >= 2 && data[0] == 0x78 {
        let mut decoder = ZlibDecoder::new(data);
        let mut decompressed = Vec::new();
        decoder
            .read_to_end(&mut decompressed)
            .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
        Ok(decompressed)
    } else {
        Err(WasmError::CryptoEncryptFailed.to_string())
    }
}

pub const ARGON2_DEFAULT_ITERATIONS: u32 = 3;
pub const ARGON2_DEFAULT_MEMORY_KIB: u32 = 65536; // 64MB
pub const ARGON2_DEFAULT_HASH_LEN: usize = 32;

pub fn fast_xor(data: &[u8], key: &[u8]) -> Vec<u8> {
    if key.is_empty() {
        return data.to_vec();
    }
    let mut result = Vec::with_capacity(data.len());
    result.extend(data.iter().zip(key.iter().cycle()).map(|(&d, &k)| d ^ k));
    result
}

pub fn derive_key_argon2id(
    password: &str,
    salt: &[u8],
    iterations: Option<u32>,
    memory_kib: Option<u32>,
    hash_length: Option<usize>,
) -> Result<Vec<u8>, String> {
    let iters = iterations.unwrap_or(ARGON2_DEFAULT_ITERATIONS);
    let mem = memory_kib.unwrap_or(ARGON2_DEFAULT_MEMORY_KIB);
    let len = hash_length.unwrap_or(ARGON2_DEFAULT_HASH_LEN);

    let params = Params::new(mem, iters, 1, Some(len))
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut output = vec![0u8; len];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut output)
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;

    Ok(output)
}

pub fn hash_password_argon2id(
    password: &str,
    salt: &[u8],
    iterations: Option<u32>,
    memory_kib: Option<u32>,
) -> Result<String, String> {
    let iters = iterations.unwrap_or(ARGON2_DEFAULT_ITERATIONS);
    let mem = memory_kib.unwrap_or(ARGON2_DEFAULT_MEMORY_KIB);

    let params = Params::new(mem, iters, 1, Some(32))
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let salt_string = SaltString::encode_b64(salt)
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt_string)
        .map_err(|_| WasmError::CryptoEncryptFailed.to_string())?;

    Ok(password_hash.to_string())
}

pub fn sha1_prefix_suffix(password: &str) -> Result<String, String> {
    let mut hasher = Sha1::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    let hex = data_encoding::HEXUPPER.encode(&result);
    if hex.len() >= 5 {
        Ok(format!("{}:{}", &hex[..5], &hex[5..]))
    } else {
        Ok(hex)
    }
}

pub fn hmac_sha256(message: &str, secret_key: &str) -> Result<String, String> {
    if secret_key.is_empty() {
        return Err(WasmError::CryptoHmacFailed.to_string());
    }

    let mut mac = <HmacSha256 as Mac>::new_from_slice(secret_key.as_bytes())
        .map_err(|_| WasmError::CryptoHmacFailed.to_string())?;
    mac.update(message.as_bytes());
    let result = mac.finalize().into_bytes();
    Ok(data_encoding::BASE64.encode(&result))
}

pub fn p1363_to_der(signature: &[u8]) -> Result<Vec<u8>, String> {
    let sig = p256::ecdsa::Signature::from_slice(signature)
        .map_err(|_| WasmError::CryptoInvalidSignature.to_string())?;
    Ok(sig.to_der().as_bytes().to_vec())
}
