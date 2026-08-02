use crate::csv_parser::get_iso_timestamp;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

pub fn parse_json_import(
    json_text: &str,
    existing_items_json: &str,
    existing_folders_json: &str,
) -> Result<String, String> {
    if json_text.trim().is_empty() {
        return Err("vault_import_error_invalid".into());
    }

    let parsed: Value = serde_json::from_str(json_text).map_err(|_| "vault_import_error_invalid".to_string())?;

    let existing_items: Vec<Value> = serde_json::from_str(existing_items_json).unwrap_or_default();
    let existing_folders: Vec<Value> = serde_json::from_str(existing_folders_json).unwrap_or_default();

    let raw_items = if parsed.is_array() {
        parsed.as_array().cloned().unwrap_or_default()
    } else if let Some(items) = parsed.get("items").and_then(|v| v.as_array()) {
        items.clone()
    } else {
        return Err("vault_import_error_invalid".into());
    };

    let imported_folders = parsed
        .get("folders")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let now_iso = get_iso_timestamp();

    // 1. Process imported folders
    let mut folder_map: HashMap<String, Value> = HashMap::new();
    let mut combined_folders: Vec<Value> = Vec::new();

    for f in existing_folders {
        if let (Some(_id), Some(name)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            let key = name.to_lowercase().trim().to_string();
            folder_map.insert(key, f.clone());
            combined_folders.push(f);
        }
    }

    for f in imported_folders {
        if let (Some(id), Some(name)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            let key = name.to_lowercase().trim().to_string();
            if let std::collections::hash_map::Entry::Vacant(entry) = folder_map.entry(key) {
                let folder_obj = serde_json::json!({
                    "id": id,
                    "name": name,
                });
                entry.insert(folder_obj.clone());
                combined_folders.push(folder_obj);
            }
        }
    }

    // 2. Process imported items
    let mut new_vault_items: Vec<Value> = Vec::new();

    for raw_item in raw_items {
        let item_type = raw_item.get("type").and_then(|v| v.as_u64()).unwrap_or(1);
        let id = raw_item
            .get("id")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let folder_id = raw_item.get("folderId").and_then(|v| v.as_str()).map(|s| Value::String(s.to_string())).unwrap_or(Value::Null);
        let name = raw_item.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let fallback_name = match item_type {
            2 => "Chưa đặt tên note",
            3 => "Chưa đặt tên card",
            4 => "Chưa đặt tên danh tính",
            _ => "Chưa đặt tên",
        };
        let final_name = if !name.is_empty() { name } else { fallback_name };

        let notes = raw_item.get("notes").and_then(|v| v.as_str()).unwrap_or("");
        let favorite = raw_item.get("favorite").and_then(|v| v.as_bool()).unwrap_or(false);
        let reprompt = raw_item.get("reprompt").and_then(|v| v.as_u64()).unwrap_or(0);
        let fields = raw_item.get("fields").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        let creation_date = raw_item.get("creationDate").and_then(|v| v.as_str()).unwrap_or(&now_iso);
        let revision_date = raw_item.get("revisionDate").and_then(|v| v.as_str()).unwrap_or(&now_iso);

        let mut item = serde_json::json!({
            "id": id,
            "organizationId": Value::Null,
            "folderId": folder_id,
            "type": item_type,
            "name": final_name,
            "notes": notes,
            "favorite": favorite,
            "reprompt": reprompt,
            "fields": fields,
            "creationDate": creation_date,
            "revisionDate": revision_date,
        });

        if item_type == 1 {
            // Login
            let login_src = raw_item.get("login");
            let username = login_src.and_then(|l| l.get("username")).and_then(|v| v.as_str()).unwrap_or("");
            let password = login_src.and_then(|l| l.get("password")).and_then(|v| v.as_str()).unwrap_or("");
            let totp = login_src.and_then(|l| l.get("totp")).and_then(|v| v.as_str()).unwrap_or("");
            let uris = login_src.and_then(|l| l.get("uris")).and_then(|v| v.as_array()).cloned().unwrap_or_default();
            let fido2 = login_src.and_then(|l| l.get("fido2Credentials")).and_then(|v| v.as_array()).cloned().unwrap_or_default();

            item["login"] = serde_json::json!({
                "username": username,
                "password": password,
                "totp": totp,
                "uris": uris,
                "fido2Credentials": fido2,
                "passwordRevisionDate": Value::Null,
                "passwordHistory": []
            });
        } else if item_type == 3 {
            // Card
            let card_src = raw_item.get("card");
            item["card"] = serde_json::json!({
                "cardholderName": card_src.and_then(|c| c.get("cardholderName")).and_then(|v| v.as_str()).unwrap_or(""),
                "brand": card_src.and_then(|c| c.get("brand")).and_then(|v| v.as_str()).unwrap_or(""),
                "number": card_src.and_then(|c| c.get("number")).and_then(|v| v.as_str()).unwrap_or(""),
                "expMonth": card_src.and_then(|c| c.get("expMonth")).and_then(|v| v.as_str()).unwrap_or(""),
                "expYear": card_src.and_then(|c| c.get("expYear")).and_then(|v| v.as_str()).unwrap_or(""),
                "code": card_src.and_then(|c| c.get("code")).and_then(|v| v.as_str()).unwrap_or(""),
            });
        } else if item_type == 4 {
            // Identity
            let id_src = raw_item.get("identity");
            item["identity"] = serde_json::json!({
                "title": id_src.and_then(|i| i.get("title")).and_then(|v| v.as_str()).unwrap_or(""),
                "firstName": id_src.and_then(|i| i.get("firstName")).and_then(|v| v.as_str()).unwrap_or(""),
                "middleName": id_src.and_then(|i| i.get("middleName")).and_then(|v| v.as_str()).unwrap_or(""),
                "lastName": id_src.and_then(|i| i.get("lastName")).and_then(|v| v.as_str()).unwrap_or(""),
                "username": id_src.and_then(|i| i.get("username")).and_then(|v| v.as_str()).unwrap_or(""),
                "company": id_src.and_then(|i| i.get("company")).and_then(|v| v.as_str()).unwrap_or(""),
                "ssn": id_src.and_then(|i| i.get("ssn")).and_then(|v| v.as_str()).unwrap_or(""),
                "passportNumber": id_src.and_then(|i| i.get("passportNumber")).and_then(|v| v.as_str()).unwrap_or(""),
                "licenseNumber": id_src.and_then(|i| i.get("licenseNumber")).and_then(|v| v.as_str()).unwrap_or(""),
                "email": id_src.and_then(|i| i.get("email")).and_then(|v| v.as_str()).unwrap_or(""),
                "phone": id_src.and_then(|i| i.get("phone")).and_then(|v| v.as_str()).unwrap_or(""),
                "address1": id_src.and_then(|i| i.get("address1")).and_then(|v| v.as_str()).unwrap_or(""),
                "address2": id_src.and_then(|i| i.get("address2")).and_then(|v| v.as_str()).unwrap_or(""),
                "address3": id_src.and_then(|i| i.get("address3")).and_then(|v| v.as_str()).unwrap_or(""),
                "city": id_src.and_then(|i| i.get("city")).and_then(|v| v.as_str()).unwrap_or(""),
                "state": id_src.and_then(|i| i.get("state")).and_then(|v| v.as_str()).unwrap_or(""),
                "postalCode": id_src.and_then(|i| i.get("postalCode")).and_then(|v| v.as_str()).unwrap_or(""),
                "country": id_src.and_then(|i| i.get("country")).and_then(|v| v.as_str()).unwrap_or(""),
            });
        }

        new_vault_items.push(item);
    }

    // 3. Merge Items
    let mut existing_map: HashMap<String, Value> = HashMap::new();
    let mut final_items = existing_items.clone();

    for item in &existing_items {
        let item_type = item.get("type").and_then(|v| v.as_u64()).unwrap_or(1);
        let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("");
        if item_type == 1 {
            let mut key = format!("||{}", name);
            if let Some(login) = item.get("login") {
                let username = login.get("username").and_then(|v| v.as_str()).unwrap_or("");
                if let Some(first_uri) = login.get("uris").and_then(|u| u.as_array()).and_then(|uris| uris.first()) {
                    let main_uri = first_uri.get("uri").and_then(|v| v.as_str()).unwrap_or("");
                    if !main_uri.is_empty() {
                        key = format!("{}|{}", main_uri, username);
                    }
                }
            }
            existing_map.insert(key, item.clone());
        } else {
            existing_map.insert(format!("||{}", name), item.clone());
        }
    }

    let mut added_count = 0;

    for new_item in new_vault_items {
        let item_type = new_item.get("type").and_then(|v| v.as_u64()).unwrap_or(1);
        let name = new_item.get("name").and_then(|v| v.as_str()).unwrap_or("");

        let key = if item_type == 1 {
            let mut k = format!("||{}", name);
            if let Some(login) = new_item.get("login") {
                let username = login.get("username").and_then(|v| v.as_str()).unwrap_or("");
                if let Some(first_uri) = login.get("uris").and_then(|u| u.as_array()).and_then(|uris| uris.first()) {
                    let main_uri = first_uri.get("uri").and_then(|v| v.as_str()).unwrap_or("");
                    if !main_uri.is_empty() {
                        k = format!("{}|{}", main_uri, username);
                    }
                }
            }
            k
        } else {
            format!("||{}", name)
        };

        if let std::collections::hash_map::Entry::Vacant(entry) = existing_map.entry(key.clone()) {
            final_items.push(new_item.clone());
            entry.insert(new_item);
            added_count += 1;
        } else if item_type == 1 {
            let new_fido = new_item.get("login").and_then(|l| l.get("fido2Credentials")).and_then(|f| f.as_array()).filter(|arr| !arr.is_empty());
            let target_login = final_items.iter_mut().find(|i| {
                let i_type = i.get("type").and_then(|v| v.as_u64()).unwrap_or(1);
                if i_type != 1 { return false; }
                let i_name = i.get("name").and_then(|v| v.as_str()).unwrap_or("");
                let mut i_k = format!("||{}", i_name);
                if let Some(l) = i.get("login") {
                    let un = l.get("username").and_then(|v| v.as_str()).unwrap_or("");
                    if let Some(first_uri) = l.get("uris").and_then(|u| u.as_array()).and_then(|uris| uris.first()) {
                        let mu = first_uri.get("uri").and_then(|v| v.as_str()).unwrap_or("");
                        if !mu.is_empty() { i_k = format!("{}|{}", mu, un); }
                    }
                }
                i_k == key
            }).and_then(|i| i.get_mut("login"));

            if let Some((new_fido, login_obj)) = new_fido.zip(target_login) {
                let mut merged_fido: Vec<Value> = login_obj
                    .get("fido2Credentials")
                    .and_then(|f| f.as_array())
                    .cloned()
                    .unwrap_or_default();

                for nf in new_fido {
                    if let Some(cred_id) = nf.get("credentialId").and_then(|v| v.as_str()) {
                        let exists = merged_fido.iter().any(|ef| {
                            ef.get("credentialId").and_then(|v| v.as_str()) == Some(cred_id)
                        });
                        if !exists {
                            merged_fido.push(nf.clone());
                        }
                    }
                }
                login_obj["fido2Credentials"] = serde_json::Value::Array(merged_fido);
            }
        }
    }

    let result = serde_json::json!({
        "importedCount": added_count,
        "combinedItems": final_items,
        "combinedFolders": combined_folders,
    });

    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub fn export_to_json(items_json: &str, folders_json: &str) -> Result<String, String> {
    let items: Vec<Value> = serde_json::from_str(items_json).map_err(|e| e.to_string())?;
    let folders: Vec<Value> = serde_json::from_str(folders_json).unwrap_or_default();

    let mut export_items: Vec<Value> = Vec::new();

    for item in items {
        let item_type = item.get("type").and_then(|v| v.as_u64()).unwrap_or(1);
        let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("");
        let folder_id = item.get("folderId").and_then(|v| v.as_str()).map(|s| Value::String(s.to_string())).unwrap_or(Value::Null);
        let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let notes = item.get("notes").and_then(|v| v.as_str()).unwrap_or("");
        let favorite = item.get("favorite").and_then(|v| v.as_bool()).unwrap_or(false);
        let reprompt = item.get("reprompt").and_then(|v| v.as_u64()).unwrap_or(0);
        let fields = item.get("fields").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        let creation_date = item.get("creationDate").and_then(|v| v.as_str()).unwrap_or("");
        let revision_date = item.get("revisionDate").and_then(|v| v.as_str()).unwrap_or("");

        let mut base = serde_json::json!({
            "id": id,
            "folderId": folder_id,
            "type": item_type,
            "name": name,
            "notes": notes,
            "favorite": favorite,
            "reprompt": reprompt,
            "fields": fields,
            "creationDate": creation_date,
            "revisionDate": revision_date,
        });

        if item_type == 1 {
            // Login
            let login_src = item.get("login");
            let username = login_src.and_then(|l| l.get("username")).and_then(|v| v.as_str()).unwrap_or("");
            let password = login_src.and_then(|l| l.get("password")).and_then(|v| v.as_str()).unwrap_or("");
            let totp = login_src.and_then(|l| l.get("totp")).and_then(|v| v.as_str()).unwrap_or("");
            let uris = login_src.and_then(|l| l.get("uris")).and_then(|v| v.as_array()).cloned().unwrap_or_default();
            let fido2 = login_src.and_then(|l| l.get("fido2Credentials")).and_then(|v| v.as_array()).cloned().unwrap_or_default();
            let pw_rev = login_src.and_then(|l| l.get("passwordRevisionDate")).and_then(|v| v.as_str()).map(|s| Value::String(s.to_string())).unwrap_or(Value::Null);
            let pw_hist = login_src.and_then(|l| l.get("passwordHistory")).and_then(|v| v.as_array()).cloned().unwrap_or_default();

            base["login"] = serde_json::json!({
                "username": username,
                "password": password,
                "totp": totp,
                "uris": uris,
                "fido2Credentials": fido2,
                "passwordRevisionDate": pw_rev,
                "passwordHistory": pw_hist,
            });
        } else if item_type == 3 {
            // Card
            let card_src = item.get("card");
            base["card"] = serde_json::json!({
                "cardholderName": card_src.and_then(|c| c.get("cardholderName")).and_then(|v| v.as_str()).unwrap_or(""),
                "brand": card_src.and_then(|c| c.get("brand")).and_then(|v| v.as_str()).unwrap_or(""),
                "number": card_src.and_then(|c| c.get("number")).and_then(|v| v.as_str()).unwrap_or(""),
                "expMonth": card_src.and_then(|c| c.get("expMonth")).and_then(|v| v.as_str()).unwrap_or(""),
                "expYear": card_src.and_then(|c| c.get("expYear")).and_then(|v| v.as_str()).unwrap_or(""),
                "code": card_src.and_then(|c| c.get("code")).and_then(|v| v.as_str()).unwrap_or(""),
            });
        } else if item_type == 4 {
            // Identity
            let id_src = item.get("identity");
            base["identity"] = serde_json::json!({
                "title": id_src.and_then(|i| i.get("title")).and_then(|v| v.as_str()).unwrap_or(""),
                "firstName": id_src.and_then(|i| i.get("firstName")).and_then(|v| v.as_str()).unwrap_or(""),
                "middleName": id_src.and_then(|i| i.get("middleName")).and_then(|v| v.as_str()).unwrap_or(""),
                "lastName": id_src.and_then(|i| i.get("lastName")).and_then(|v| v.as_str()).unwrap_or(""),
                "username": id_src.and_then(|i| i.get("username")).and_then(|v| v.as_str()).unwrap_or(""),
                "company": id_src.and_then(|i| i.get("company")).and_then(|v| v.as_str()).unwrap_or(""),
                "ssn": id_src.and_then(|i| i.get("ssn")).and_then(|v| v.as_str()).unwrap_or(""),
                "passportNumber": id_src.and_then(|i| i.get("passportNumber")).and_then(|v| v.as_str()).unwrap_or(""),
                "licenseNumber": id_src.and_then(|i| i.get("licenseNumber")).and_then(|v| v.as_str()).unwrap_or(""),
                "email": id_src.and_then(|i| i.get("email")).and_then(|v| v.as_str()).unwrap_or(""),
                "phone": id_src.and_then(|i| i.get("phone")).and_then(|v| v.as_str()).unwrap_or(""),
                "address1": id_src.and_then(|i| i.get("address1")).and_then(|v| v.as_str()).unwrap_or(""),
                "address2": id_src.and_then(|i| i.get("address2")).and_then(|v| v.as_str()).unwrap_or(""),
                "address3": id_src.and_then(|i| i.get("address3")).and_then(|v| v.as_str()).unwrap_or(""),
                "city": id_src.and_then(|i| i.get("city")).and_then(|v| v.as_str()).unwrap_or(""),
                "state": id_src.and_then(|i| i.get("state")).and_then(|v| v.as_str()).unwrap_or(""),
                "postalCode": id_src.and_then(|i| i.get("postalCode")).and_then(|v| v.as_str()).unwrap_or(""),
                "country": id_src.and_then(|i| i.get("country")).and_then(|v| v.as_str()).unwrap_or(""),
            });
        } else if item_type == 5 {
            // SshKey
            let ssh_src = item.get("sshKey");
            base["sshKey"] = serde_json::json!({
                "privateKey": ssh_src.and_then(|s| s.get("privateKey")).and_then(|v| v.as_str()).unwrap_or(""),
                "publicKey": ssh_src.and_then(|s| s.get("publicKey")).and_then(|v| v.as_str()).unwrap_or(""),
                "keyFingerprint": ssh_src.and_then(|s| s.get("keyFingerprint")).and_then(|v| v.as_str()).unwrap_or(""),
            });
        } else {
            // SecureNote
            base["secureNote"] = serde_json::json!({ "type": 0 });
        }

        export_items.push(base);
    }

    let payload = serde_json::json!({
        "encrypted": false,
        "folders": folders,
        "items": export_items,
    });

    serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())
}
