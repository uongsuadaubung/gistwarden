use crate::domain::get_hostname;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

/**
 * Phân tích cú pháp chuỗi CSV theo chuẩn RFC 4180 bằng Rust WASM.
 * Tự động xóa ký tự BOM (U+FEFF), xử lý ngoặc kép lồng nhau và xuống dòng trong trường dữ liệu.
 */
pub fn parse_csv(text: &str) -> Result<String, String> {
    if text.trim().is_empty() {
        return Ok("[]".to_string());
    }

    let text_no_bom = text.strip_prefix('\u{feff}').unwrap_or(text);
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .flexible(true)
        .from_reader(text_no_bom.as_bytes());

    let mut records: Vec<Vec<String>> = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| e.to_string())?;
        let row: Vec<String> = record.iter().map(|s| s.to_string()).collect();
        records.push(row);
    }

    serde_json::to_string(&records).map_err(|e| e.to_string())
}

/**
 * Xuất mảng 2 chiều string[][] thành chuỗi định dạng CSV chuẩn RFC 4180 bằng Rust WASM.
 */
pub fn unparse_csv(rows_json: &str) -> Result<String, String> {
    let rows: Vec<Vec<String>> = serde_json::from_str(rows_json).map_err(|e| e.to_string())?;
    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(Vec::new());

    for row in rows {
        writer.write_record(&row).map_err(|e| e.to_string())?;
    }

    let bytes = writer.into_inner().map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

pub fn export_to_browser_csv(items_json: &str) -> Result<String, String> {
    let items: Vec<Value> = serde_json::from_str(items_json).map_err(|e| e.to_string())?;
    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(Vec::new());

    writer
        .write_record(&["name", "url", "username", "password", "note"])
        .map_err(|e| e.to_string())?;

    for item in items {
        let item_type = item.get("type").and_then(|v| v.as_u64()).unwrap_or(0);
        if item_type == 1 {
            // LoginVaultItem
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let notes = item.get("notes").and_then(|v| v.as_str()).unwrap_or("");

            let mut uri = "";
            let mut username = "";
            let mut password = "";

            if let Some(login) = item.get("login") {
                if let Some(uris) = login.get("uris").and_then(|u| u.as_array()) {
                    if let Some(first_uri) = uris.first() {
                        uri = first_uri.get("uri").and_then(|v| v.as_str()).unwrap_or("");
                    }
                }
                username = login.get("username").and_then(|v| v.as_str()).unwrap_or("");
                password = login.get("password").and_then(|v| v.as_str()).unwrap_or("");
            }

            writer
                .write_record(&[name, uri, username, password, notes])
                .map_err(|e| e.to_string())?;
        }
    }

    let bytes = writer.into_inner().map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

pub fn export_to_bitwarden_csv(items_json: &str, folders_json: &str) -> Result<String, String> {
    let items: Vec<Value> = serde_json::from_str(items_json).map_err(|e| e.to_string())?;
    let folders: Vec<Value> = serde_json::from_str(folders_json).unwrap_or_default();

    let mut folder_map: HashMap<String, String> = HashMap::new();
    for f in folders {
        if let (Some(id), Some(name)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            folder_map.insert(id.to_string(), name.to_string());
        }
    }

    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(Vec::new());

    writer
        .write_record(&[
            "folder",
            "favorite",
            "type",
            "name",
            "notes",
            "fields",
            "reprompt",
            "archivedDate",
            "login_uri",
            "login_username",
            "login_password",
            "login_totp",
        ])
        .map_err(|e| e.to_string())?;

    for item in items {
        let item_type = item.get("type").and_then(|v| v.as_u64()).unwrap_or(0);
        if item_type == 1 || item_type == 2 {
            // 1: Login, 2: SecureNote
            let type_str = if item_type == 1 { "login" } else { "note" };
            let favorite_str = if item.get("favorite").and_then(|v| v.as_bool()).unwrap_or(false) {
                "1"
            } else {
                "0"
            };
            let reprompt_str = if item.get("reprompt").and_then(|v| v.as_u64()).unwrap_or(0) == 1 {
                "1"
            } else {
                "0"
            };

            let folder_id = item.get("folderId").and_then(|v| v.as_str()).unwrap_or("");
            let folder_name = folder_map.get(folder_id).map(|s| s.as_str()).unwrap_or("");

            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let notes = item.get("notes").and_then(|v| v.as_str()).unwrap_or("");

            let fields_str = if let Some(fields) = item.get("fields").and_then(|f| f.as_array()) {
                fields
                    .iter()
                    .map(|f_obj| {
                        let fname = f_obj.get("name").and_then(|v| v.as_str()).unwrap_or("");
                        let fval = f_obj.get("value").and_then(|v| v.as_str()).unwrap_or("");
                        format!("{}:{}", fname, fval)
                    })
                    .collect::<Vec<String>>()
                    .join("\n")
            } else {
                String::new()
            };

            let mut uri = String::new();
            let mut username = String::new();
            let mut password = String::new();
            let mut totp = String::new();

            if item_type == 1 {
                if let Some(login) = item.get("login") {
                    if let Some(uris) = login.get("uris").and_then(|u| u.as_array()) {
                        if let Some(first_uri) = uris.first() {
                            uri = first_uri.get("uri").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        }
                    }
                    username = login.get("username").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    password = login.get("password").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    totp = login.get("totp").and_then(|v| v.as_str()).unwrap_or("").to_string();
                }
            }

            writer
                .write_record(&[
                    folder_name,
                    favorite_str,
                    type_str,
                    name,
                    notes,
                    &fields_str,
                    reprompt_str,
                    "",
                    &uri,
                    &username,
                    &password,
                    &totp,
                ])
                .map_err(|e| e.to_string())?;
        }
    }

    let bytes = writer.into_inner().map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

pub fn get_iso_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn parse_browser_csv_import(csv_text: &str) -> Result<String, String> {
    if csv_text.trim().is_empty() {
        return Err("vault_import_csv_error_fail".into());
    }

    let text_no_bom = csv_text.strip_prefix('\u{feff}').unwrap_or(csv_text);
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .flexible(true)
        .from_reader(text_no_bom.as_bytes());

    let mut rows: Vec<Vec<String>> = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|_| "vault_import_csv_error_fail".to_string())?;
        let row: Vec<String> = record.iter().map(|s| s.to_string()).collect();
        rows.push(row);
    }

    if rows.len() < 2 {
        return Err("vault_import_csv_error_fail".into());
    }

    let headers: Vec<String> = rows[0]
        .iter()
        .map(|h| h.trim().to_lowercase().replace(['\'', '"'], ""))
        .collect();

    let url_idx = headers.iter().position(|h| h == "url");
    let username_idx = headers.iter().position(|h| h == "username");
    let password_idx = headers.iter().position(|h| h == "password");
    let name_idx = headers.iter().position(|h| h == "name");
    let note_idx = headers.iter().position(|h| h == "note" || h == "notes");

    let (url_i, username_i, password_i) = match (url_idx, username_idx, password_idx) {
        (Some(u), Some(un), Some(p)) => (u, un, p),
        _ => return Err("import_error_browser_invalid".into()),
    };

    let now_ts = get_iso_timestamp();

    let mut new_vault_items: Vec<Value> = Vec::new();

    for r in 1..rows.len() {
        let row = &rows[r];
        if row.is_empty() || (row.len() == 1 && row[0].is_empty()) {
            continue;
        }

        let url_val = row.get(url_i).map(|s| s.as_str()).unwrap_or("");
        let username_val = row.get(username_i).map(|s| s.as_str()).unwrap_or("");
        let password_val = row.get(password_i).map(|s| s.as_str()).unwrap_or("");
        let mut name_val = name_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");
        let note_val = note_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");

        if url_val.is_empty() && username_val.is_empty() && password_val.is_empty() {
            continue;
        }

        let domain_extracted = get_hostname(url_val);
        if name_val.is_empty() {
            if !domain_extracted.is_empty() {
                name_val = &domain_extracted;
            } else {
                name_val = "Chưa đặt tên login";
            }
        }

        let uris = if !url_val.is_empty() {
            serde_json::json!([{ "uri": url_val, "match": serde_json::Value::Null }])
        } else {
            serde_json::json!([])
        };

        let item_id = Uuid::new_v4().to_string();

        let item = serde_json::json!({
            "id": item_id,
            "organizationId": serde_json::Value::Null,
            "folderId": serde_json::Value::Null,
            "type": 1, // VaultItemType.Login
            "name": name_val,
            "notes": note_val,
            "favorite": false,
            "reprompt": 0,
            "fields": [],
            "login": {
                "username": username_val,
                "password": password_val,
                "totp": "",
                "uris": uris,
                "fido2Credentials": [],
                "passwordRevisionDate": serde_json::Value::Null,
                "passwordHistory": []
            },
            "creationDate": now_ts,
            "revisionDate": now_ts
        });

        new_vault_items.push(item);
    }

    let result = serde_json::json!({
        "importedCount": new_vault_items.len(),
        "newItems": new_vault_items,
    });

    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub fn parse_bitwarden_csv_import(
    csv_text: &str,
    existing_folders_json: &str,
) -> Result<String, String> {
    if csv_text.trim().is_empty() {
        return Err("vault_import_csv_error_fail".into());
    }

    let text_no_bom = csv_text.strip_prefix('\u{feff}').unwrap_or(csv_text);
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .flexible(true)
        .from_reader(text_no_bom.as_bytes());

    let mut rows: Vec<Vec<String>> = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|_| "vault_import_csv_error_fail".to_string())?;
        let row: Vec<String> = record.iter().map(|s| s.to_string()).collect();
        rows.push(row);
    }

    if rows.len() < 2 {
        return Err("vault_import_csv_error_fail".into());
    }

    let headers: Vec<String> = rows[0]
        .iter()
        .map(|h| h.trim().to_lowercase().replace(['\'', '"'], ""))
        .collect();

    let folder_idx = headers.iter().position(|h| h == "folder");
    let type_idx = headers.iter().position(|h| h == "type");
    let name_idx = headers.iter().position(|h| h == "name");
    let notes_idx = headers.iter().position(|h| h == "notes");
    let favorite_idx = headers.iter().position(|h| h == "favorite");
    let reprompt_idx = headers.iter().position(|h| h == "reprompt");
    let fields_idx = headers.iter().position(|h| h == "fields");
    let uri_idx = headers.iter().position(|h| h == "login_uri");
    let username_idx = headers.iter().position(|h| h == "login_username");
    let password_idx = headers.iter().position(|h| h == "login_password");
    let totp_idx = headers.iter().position(|h| h == "login_totp");

    if type_idx.is_none() || name_idx.is_none() || (uri_idx.is_none() && username_idx.is_none() && password_idx.is_none()) {
        return Err("import_error_bitwarden_invalid".into());
    }

    let existing_folders: Vec<Value> = serde_json::from_str(existing_folders_json).unwrap_or_default();
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

    let now_ts = get_iso_timestamp();

    let mut new_vault_items: Vec<Value> = Vec::new();

    for r in 1..rows.len() {
        let row = &rows[r];
        if row.is_empty() || (row.len() == 1 && row[0].is_empty()) {
            continue;
        }

        let folder_name_val = folder_idx.and_then(|i| row.get(i)).map(|s| s.trim()).unwrap_or("");
        let mut folder_id_val: Option<String> = None;

        if !folder_name_val.is_empty() {
            let key = folder_name_val.to_lowercase();
            if let Some(existing_folder) = folder_map.get(&key) {
                folder_id_val = existing_folder.get("id").and_then(|v| v.as_str()).map(|s| s.to_string());
            } else {
                let new_id = Uuid::new_v4().to_string();
                let new_folder = serde_json::json!({
                    "id": new_id,
                    "name": folder_name_val,
                });
                folder_map.insert(key, new_folder.clone());
                combined_folders.push(new_folder);
                folder_id_val = Some(new_id);
            }
        }

        let type_val = type_idx.and_then(|i| row.get(i)).map(|s| s.trim().to_lowercase()).unwrap_or_default();
        let name_val = name_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");
        let notes_val = notes_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");
        let favorite_val = favorite_idx.and_then(|i| row.get(i)).map(|s| s == "1" || s == "true").unwrap_or(false);
        let reprompt_val = reprompt_idx.and_then(|i| row.get(i)).map(|s| if s == "1" || s == "true" { 1 } else { 0 }).unwrap_or(0);

        let mut custom_fields: Vec<Value> = Vec::new();
        if let Some(f_i) = fields_idx {
            if let Some(fields_str) = row.get(f_i) {
                for line in fields_str.lines() {
                    if let Some(colon_idx) = line.find(':') {
                        if colon_idx > 0 {
                            let fname = line[..colon_idx].trim();
                            let fval = line[colon_idx + 1..].trim();
                            custom_fields.push(serde_json::json!({
                                "name": fname,
                                "value": fval,
                                "type": 0
                            }));
                        }
                    }
                }
            }
        }

        let uri_val = uri_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");
        let username_val = username_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");
        let password_val = password_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");
        let totp_val = totp_idx.and_then(|i| row.get(i)).map(|s| s.as_str()).unwrap_or("");

        let uris = if !uri_val.is_empty() {
            serde_json::json!([{ "uri": uri_val, "match": serde_json::Value::Null }])
        } else {
            serde_json::json!([])
        };

        let is_note = type_val == "note" || type_val == "securenote";
        let domain_extracted = get_hostname(uri_val);

        let final_name = if !name_val.is_empty() {
            name_val.to_string()
        } else if is_note {
            "Chưa đặt tên note".to_string()
        } else if !domain_extracted.is_empty() {
            domain_extracted
        } else {
            "Chưa đặt tên login".to_string()
        };

        let item_id = Uuid::new_v4().to_string();

        let item = if is_note {
            serde_json::json!({
                "id": item_id,
                "organizationId": serde_json::Value::Null,
                "folderId": folder_id_val,
                "type": 2, // VaultItemType.SecureNote
                "name": final_name,
                "notes": notes_val,
                "favorite": favorite_val,
                "reprompt": reprompt_val,
                "fields": custom_fields,
                "creationDate": now_ts,
                "revisionDate": now_ts
            })
        } else {
            serde_json::json!({
                "id": item_id,
                "organizationId": serde_json::Value::Null,
                "folderId": folder_id_val,
                "type": 1, // VaultItemType.Login
                "name": final_name,
                "notes": notes_val,
                "favorite": favorite_val,
                "reprompt": reprompt_val,
                "fields": custom_fields,
                "login": {
                    "username": username_val,
                    "password": password_val,
                    "totp": totp_val,
                    "uris": uris,
                    "fido2Credentials": [],
                    "passwordRevisionDate": serde_json::Value::Null,
                    "passwordHistory": []
                },
                "creationDate": now_ts,
                "revisionDate": now_ts
            })
        };

        new_vault_items.push(item);
    }

    let result = serde_json::json!({
        "importedCount": new_vault_items.len(),
        "newItems": new_vault_items,
        "combinedFolders": combined_folders,
    });

    serde_json::to_string(&result).map_err(|e| e.to_string())
}
