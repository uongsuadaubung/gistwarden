use crate::cbor::{generate_assertion_signature_base, generate_auth_data, pack_attestation_object};
use crate::errors::WasmError;
use crate::types::Fido2Credential;
use data_encoding::BASE64URL_NOPAD;
use p256::ecdsa::signature::Signer;
use p256::ecdsa::{Signature, SigningKey};
use p256::pkcs8::{DecodePrivateKey, EncodePrivateKey, EncodePublicKey};
use p256::SecretKey;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

fn base64_url_encode(bytes: &[u8]) -> String {
    BASE64URL_NOPAD.encode(bytes)
}

fn base64_url_decode(s: &str) -> Result<Vec<u8>, String> {
    let clean = s.trim().trim_end_matches('=');
    BASE64URL_NOPAD
        .decode(clean.as_bytes())
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())
}

fn parse_private_key(key_value: &str) -> Result<SecretKey, String> {
    let clean = key_value.trim();

    if clean.starts_with('{') && clean.ends_with('}') {
        if let Ok(jwk) = serde_json::from_str::<serde_json::Value>(clean) {
            if let Some(d_str) = jwk.get("d").and_then(|v| v.as_str()) {
                if let Ok(d_bytes) = base64_url_decode(d_str) {
                    if let Ok(sk) = SecretKey::from_slice(&d_bytes) {
                        return Ok(sk);
                    }
                }
            }
        }
    }

    let bytes = base64_url_decode(clean).or_else(|_| {
        data_encoding::BASE64
            .decode(clean.as_bytes())
            .map_err(|_| WasmError::Fido2AssertFailed.to_string())
    })?;

    if let Ok(sk) = SecretKey::from_pkcs8_der(&bytes) {
        return Ok(sk);
    }

    if let Ok(sk) = SecretKey::from_sec1_der(&bytes) {
        return Ok(sk);
    }

    if bytes.len() == 32 {
        if let Ok(sk) = SecretKey::from_slice(&bytes) {
            return Ok(sk);
        }
    }

    Err(WasmError::Fido2AssertFailed.to_string())
}

pub fn get_raw_credential_id(cred_id: &str) -> Vec<u8> {
    let clean = cred_id.trim();

    if let Some(stripped) = clean.strip_prefix("b64.") {
        if let Ok(bytes) = base64_url_decode(stripped) {
            return bytes;
        }
    }

    if clean.len() == 36 && clean.contains('-') {
        if let Ok(parsed_uuid) = uuid::Uuid::parse_str(clean) {
            return parsed_uuid.as_bytes().to_vec();
        }
    }

    if let Ok(bytes) = base64_url_decode(clean) {
        return bytes;
    }

    clean.as_bytes().to_vec()
}

#[derive(Debug, Deserialize)]
pub struct PasskeyUserOptions {
    pub id: serde_json::Value,
    pub name: String,
    #[serde(default, rename = "displayName")]
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PasskeyRpOptions {
    pub id: Option<String>,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct PasskeyRegisterOptionsDto {
    pub rp: PasskeyRpOptions,
    pub user: PasskeyUserOptions,
    pub challenge: String,
}

#[derive(Debug, Deserialize)]
pub struct PasskeyAllowedCredential {
    pub id: String,
    #[serde(rename = "type", default)]
    pub cred_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PasskeyAssertOptionsDto {
    pub challenge: String,
    #[serde(rename = "rpId")]
    pub rp_id: Option<String>,
    #[serde(rename = "userVerification")]
    pub user_verification: Option<String>,
    #[serde(rename = "allowCredentials")]
    pub allow_credentials: Option<Vec<PasskeyAllowedCredential>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyRegisterResultOutput {
    pub new_cred: Fido2Credential,
    pub result: serde_json::Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyAssertResultOutput {
    pub result: serde_json::Value,
    pub next_counter: u64,
    pub updated_credential: Fido2Credential,
}

pub fn generate_passkey_register_response(
    options_json: &str,
    origin: &str,
) -> Result<PasskeyRegisterResultOutput, String> {
    let options: PasskeyRegisterOptionsDto = serde_json::from_str(options_json)
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())?;

    let mut rng_bytes = [0u8; 32];
    getrandom::getrandom(&mut rng_bytes)
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    let secret_key = SecretKey::from_slice(&rng_bytes)
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    let signing_key = SigningKey::from(&secret_key);
    let verifying_key = signing_key.verifying_key();

    let pkcs8_der = secret_key
        .to_pkcs8_der()
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    let pkcs8_b64 = base64_url_encode(pkcs8_der.as_bytes());

    let public_key = p256::PublicKey::from(verifying_key);
    let spki_der = public_key
        .to_public_key_der()
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    let spki_b64 = base64_url_encode(spki_der.as_bytes());

    let encoded_point = verifying_key.to_sec1_point(false);
    let x_bytes = encoded_point.x().ok_or_else(|| WasmError::Fido2CreateFailed.to_string())?;
    let y_bytes = encoded_point.y().ok_or_else(|| WasmError::Fido2CreateFailed.to_string())?;

    let cred_id_raw = uuid::Uuid::new_v4().as_bytes().to_vec();
    let cred_id_b64 = base64_url_encode(&cred_id_raw);

    let creation_date = chrono::Utc::now().to_rfc3339();

    let user_handle_str = match &options.user.id {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Array(arr) => {
            let bytes: Vec<u8> = arr.iter().filter_map(|v| v.as_u64().map(|n| n as u8)).collect();
            base64_url_encode(&bytes)
        }
        _ => String::new(),
    };

    let raw_rp_id = options.rp.id.as_deref().unwrap_or(origin);
    let rp_id_val = crate::domain::get_hostname(raw_rp_id);

    let new_cred = Fido2Credential {
        credential_id: cred_id_b64.clone(),
        key_type: "public-key".to_string(),
        key_algorithm: "ECDSA".to_string(),
        key_curve: "P-256".to_string(),
        key_value: pkcs8_b64,
        rp_id: rp_id_val.to_string(),
        user_handle: if user_handle_str.is_empty() { None } else { Some(user_handle_str) },
        user_name: Some(options.user.name.clone()),
        counter: 0,
        rp_name: Some(options.rp.name.clone()),
        user_display_name: options.user.display_name.clone(),
        discoverable: Some(true),
        creation_date: Some(creation_date),
    };

    let auth_data = generate_auth_data(
        &rp_id_val,
        0,
        true,
        true,
        Some(&cred_id_raw),
        Some(x_bytes.as_slice()),
        Some(y_bytes.as_slice()),
    );

    let attestation_obj = pack_attestation_object(&auth_data)?;

    let client_data_json = serde_json::json!({
        "type": "webauthn.create",
        "challenge": options.challenge,
        "origin": origin,
        "crossOrigin": false,
    }).to_string();

    let result = serde_json::json!({
        "id": cred_id_b64,
        "rawId": cred_id_b64,
        "response": {
            "clientDataJSON": base64_url_encode(client_data_json.as_bytes()),
            "attestationObject": base64_url_encode(&attestation_obj),
            "publicKey": spki_b64,
            "publicKeyAlgorithm": -7, // ES256
            "authData": base64_url_encode(&auth_data),
        }
    });

    Ok(PasskeyRegisterResultOutput { new_cred, result })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MatchingPasskey {
    pub vault_item_id: String,
    pub vault_item_name: String,
    pub credential: Fido2Credential,
}

pub fn find_matching_fido2_credentials(
    vault_items_json: &str,
    rp_id: &str,
    allow_credentials_json: &str,
) -> Result<Vec<MatchingPasskey>, String> {
    let vault_items: Vec<crate::types::VaultItem> = serde_json::from_str(vault_items_json)
        .map_err(|e| format!("Failed to parse vault items: {}", e))?;

    let allow_credentials: Vec<PasskeyAllowedCredential> = if allow_credentials_json.trim().is_empty() {
        Vec::new()
    } else {
        serde_json::from_str(allow_credentials_json).unwrap_or_default()
    };

    let target_host = crate::domain::get_hostname(rp_id).to_lowercase();
    let target_base = crate::domain::get_base_domain(rp_id);

    let allowed_bytes_list: Vec<Vec<u8>> = allow_credentials
        .iter()
        .map(|a| get_raw_credential_id(&a.id))
        .collect();

    let mut domain_matches = Vec::new();
    let mut exact_allowed_matches = Vec::new();

    for item in vault_items {
        if item.item_type != crate::types::ItemType::Login {
            continue;
        }
        if let Some(ref login) = item.login {
            if let Some(ref creds) = login.fido2_credentials {
                for cred in creds {
                    let raw_rp_id = cred.rp_id.trim().to_lowercase();
                    let cred_host = crate::domain::get_hostname(&raw_rp_id).to_lowercase();
                    let cred_base = crate::domain::get_base_domain(&raw_rp_id);

                    let is_domain_match = (!cred_host.is_empty() && cred_host == target_host)
                        || raw_rp_id == target_host
                        || (!cred_base.is_empty() && cred_base == target_base);

                    if !is_domain_match {
                        continue;
                    }

                    let matching_item = MatchingPasskey {
                        vault_item_id: item.id.clone(),
                        vault_item_name: item.name.clone(),
                        credential: cred.clone(),
                    };

                    domain_matches.push(matching_item.clone());

                    if !allowed_bytes_list.is_empty() {
                        let raw_bytes = get_raw_credential_id(&cred.credential_id);
                        let ascii_bytes = cred.credential_id.trim().as_bytes().to_vec();

                        let is_allowed = allowed_bytes_list.iter().any(|allowed| {
                            allowed == &raw_bytes || allowed == &ascii_bytes
                        });

                        if is_allowed {
                            exact_allowed_matches.push(matching_item);
                        }
                    }
                }
            }
        }
    }

    if !allowed_bytes_list.is_empty() && !exact_allowed_matches.is_empty() {
        Ok(exact_allowed_matches)
    } else {
        Ok(domain_matches)
    }
}

pub fn find_matching_fido2_accounts(
    vault_items_json: &str,
    rp_id: &str,
    origin: &str,
) -> Result<Vec<crate::types::VaultItem>, String> {
    let vault_items: Vec<crate::types::VaultItem> = serde_json::from_str(vault_items_json)
        .map_err(|e| format!("Failed to parse vault items: {}", e))?;

    let target_host = crate::domain::get_hostname(rp_id).to_lowercase();
    let target_base = crate::domain::get_base_domain(rp_id);
    let target_origin_host = crate::domain::get_hostname(origin).to_lowercase();

    let mut matches = Vec::new();

    for item in vault_items {
        if item.item_type != crate::types::ItemType::Login {
            continue;
        }
        if let Some(ref login) = item.login {
            let mut matched = false;

            if let Some(ref uris) = login.uris {
                for uri_obj in uris {
                    let uri_host = crate::domain::get_hostname(&uri_obj.uri).to_lowercase();
                    let uri_base = crate::domain::get_base_domain(&uri_obj.uri);
                    if (!uri_host.is_empty() && (uri_host == target_host || uri_host == target_origin_host))
                        || (!uri_base.is_empty() && uri_base == target_base)
                    {
                        matched = true;
                        break;
                    }
                }
            }

            if !matched {
                if let Some(ref creds) = login.fido2_credentials {
                    for cred in creds {
                        let cred_rp = cred.rp_id.trim().to_lowercase();
                        let cred_host = crate::domain::get_hostname(&cred_rp).to_lowercase();
                        let cred_base = crate::domain::get_base_domain(&cred_rp);

                        if (!cred_host.is_empty() && cred_host == target_host)
                            || (!cred_base.is_empty() && cred_base == target_base)
                        {
                            matched = true;
                            break;
                        }
                    }
                }
            }

            if matched {
                matches.push(item);
            }
        }
    }

    Ok(matches)
}

pub fn generate_passkey_assert_response(
    options_json: &str,
    origin: &str,
    cred_json: &str,
) -> Result<PasskeyAssertResultOutput, String> {
    let options: PasskeyAssertOptionsDto = serde_json::from_str(options_json)
        .map_err(|_| WasmError::Fido2AssertFailed.to_string())?;
    let cred: Fido2Credential = serde_json::from_str(cred_json)
        .map_err(|_| WasmError::Fido2AssertFailed.to_string())?;

    let next_counter = cred.counter.saturating_add(1);

    let secret_key = parse_private_key(&cred.key_value)?;
    let signing_key = SigningKey::from(&secret_key);

    let client_data_json = serde_json::json!({
        "type": "webauthn.get",
        "challenge": options.challenge,
        "origin": origin,
        "crossOrigin": false,
    }).to_string();
    let client_data_hash = Sha256::digest(client_data_json.as_bytes());

    let raw_rp_id = options.rp_id.as_deref().unwrap_or(origin);
    let rp_id_clean = crate::domain::get_hostname(raw_rp_id);

    let user_verified = options.user_verification.as_deref() != Some("discouraged");

    let auth_data = generate_auth_data(
        &rp_id_clean,
        next_counter as u32,
        true,
        user_verified,
        None,
        None,
        None,
    );

    let sig_base = generate_assertion_signature_base(&auth_data, &client_data_hash);
    let signature: Signature = signing_key.sign(&sig_base);
    let der_signature = signature.to_der();

    let raw_cred_id = get_raw_credential_id(&cred.credential_id);
    let cred_id_b64_raw = base64_url_encode(&raw_cred_id);

    let b64_36 = base64_url_encode(cred.credential_id.as_bytes());
    let use_old_36_byte_format = options.allow_credentials.as_ref().map_or(false, |allowed_list| {
        allowed_list.iter().any(|allowed| allowed.id == b64_36)
    });

    let cred_id_b64 = if use_old_36_byte_format {
        b64_36
    } else if let Some(ref allowed_list) = options.allow_credentials {
        allowed_list
            .iter()
            .find(|allowed| allowed.id == cred_id_b64_raw || allowed.id == cred.credential_id)
            .map(|allowed| allowed.id.clone())
            .unwrap_or(cred_id_b64_raw)
    } else {
        cred_id_b64_raw
    };

    let result = serde_json::json!({
        "id": cred_id_b64,
        "rawId": cred_id_b64,
        "response": {
            "clientDataJSON": base64_url_encode(client_data_json.as_bytes()),
            "authenticatorData": base64_url_encode(&auth_data),
            "signature": base64_url_encode(der_signature.as_bytes()),
            "userHandle": cred.user_handle,
        }
    });

    let mut updated_credential = cred.clone();
    updated_credential.counter = next_counter;

    Ok(PasskeyAssertResultOutput {
        result,
        next_counter,
        updated_credential,
    })
}
