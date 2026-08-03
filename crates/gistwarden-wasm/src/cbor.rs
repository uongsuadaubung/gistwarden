use crate::errors::WasmError;
use ciborium::Value;
use wasm_bindgen::JsCast;

pub fn concat_bytes(chunks: js_sys::Array) -> Vec<u8> {
    let iter = chunks.iter().filter_map(|val| val.dyn_into::<js_sys::Uint8Array>().ok());
    let mut out = Vec::new();
    for arr in iter {
        let prev_len = out.len();
        let chunk_len = arr.length() as usize;
        out.resize(prev_len + chunk_len, 0);
        arr.copy_to(&mut out[prev_len..]);
    }
    out
}

pub fn cbor_encode_length(major_type: u8, length: usize) -> Vec<u8> {
    let mt = major_type << 5;
    match length {
        0..=23 => vec![mt | (length as u8)],
        24..=255 => vec![mt | 24, length as u8],
        256..=65535 => {
            let b = (length as u16).to_be_bytes();
            vec![mt | 25, b[0], b[1]]
        }
        _ => {
            let b = (length as u32).to_be_bytes();
            vec![mt | 26, b[0], b[1], b[2], b[3]]
        }
    }
}

pub fn cbor_text_string(s: &str) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    let val = Value::Text(s.to_string());
    ciborium::into_writer(&val, &mut buf).map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    Ok(buf)
}

pub fn cbor_byte_string(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    let val = Value::Bytes(bytes.to_vec());
    ciborium::into_writer(&val, &mut buf).map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    Ok(buf)
}

pub fn cbor_map_header(num_pairs: usize) -> Vec<u8> {
    cbor_encode_length(5, num_pairs)
}

pub fn cbor_positive_int(n: usize) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    let val = Value::Integer((n as u64).into());
    ciborium::into_writer(&val, &mut buf).map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    Ok(buf)
}

pub fn cbor_negative_int(n: usize) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    let neg_val: i128 = -1 - (n as i128);
    let ciborium_int = ciborium::value::Integer::try_from(neg_val)
        .map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    let val = Value::Integer(ciborium_int);
    ciborium::into_writer(&val, &mut buf).map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    Ok(buf)
}

pub fn pack_attestation_object(auth_data: &[u8]) -> Result<Vec<u8>, String> {
    let map = Value::Map(vec![
        (Value::Text("fmt".to_string()), Value::Text("none".to_string())),
        (Value::Text("attStmt".to_string()), Value::Map(vec![])),
        (Value::Text("authData".to_string()), Value::Bytes(auth_data.to_vec())),
    ]);

    let mut buf = Vec::new();
    ciborium::into_writer(&map, &mut buf).map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    Ok(buf)
}

pub fn encode_cose_ec2_public_key(x: &[u8], y: &[u8]) -> Result<Vec<u8>, String> {
    use coset::{iana, AsCborValue, CoseKeyBuilder};

    let key = CoseKeyBuilder::new_ec2_pub_key(
        iana::EllipticCurve::P_256,
        x.to_vec(),
        y.to_vec(),
    )
    .algorithm(iana::Algorithm::ES256)
    .build();

    let mut buf = Vec::new();
    let cbor_val = key.to_cbor_value().map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    ciborium::into_writer(&cbor_val, &mut buf).map_err(|_| WasmError::Fido2CreateFailed.to_string())?;
    Ok(buf)
}

pub const AAGUID: &[u8; 16] = b"LazyPasskeyGist1";

pub fn generate_auth_data(
    rp_id: &str,
    counter: u32,
    user_present: bool,
    user_verified: bool,
    credential_id: Option<&[u8]>,
    key_x: Option<&[u8]>,
    key_y: Option<&[u8]>,
) -> Vec<u8> {
    let mut auth_data = Vec::with_capacity(37 + credential_id.map_or(0, |c| c.len() + 16 + 2 + 77));

    // 1. rpIdHash (32-byte SHA-256)
    use sha2::{Digest, Sha256};
    let rp_id_hash = Sha256::digest(rp_id.as_bytes());
    auth_data.extend_from_slice(&rp_id_hash);

    // 2. flags (1 byte) according to W3C WebAuthn Spec
    let mut flags: u8 = 0;
    if user_present {
        flags |= 0x01; // UP (User Present)
    }
    if user_verified {
        flags |= 0x04; // UV (User Verified)
    }
    if credential_id.is_some() && key_x.is_some() && key_y.is_some() {
        flags |= 0x40; // AT (Attested Credential Data)
    }
    flags |= 0x08; // BE (Backup Eligibility)
    flags |= 0x10; // BS (Backup State)
    auth_data.push(flags);

    // 3. signCount (4-byte big-endian)
    auth_data.extend_from_slice(&counter.to_be_bytes());

    // 4. attestedCredentialData (if creating credential)
    if let (Some(cred_id), Some(x), Some(y)) = (credential_id, key_x, key_y) {
        auth_data.extend_from_slice(AAGUID);
        let cred_len = cred_id.len() as u16;
        auth_data.extend_from_slice(&cred_len.to_be_bytes());
        auth_data.extend_from_slice(cred_id);
        if let Ok(cose_bytes) = encode_cose_ec2_public_key(x, y) {
            auth_data.extend_from_slice(&cose_bytes);
        }
    }

    auth_data
}

pub fn generate_assertion_signature_base(auth_data: &[u8], client_data_hash: &[u8]) -> Vec<u8> {
    let mut sig_base = Vec::with_capacity(auth_data.len() + client_data_hash.len());
    sig_base.extend_from_slice(auth_data);
    sig_base.extend_from_slice(client_data_hash);
    sig_base
}
