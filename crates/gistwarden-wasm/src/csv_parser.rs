use crate::domain::get_hostname;
use crate::errors::WasmError;
use crate::types::{Folder, ItemType, LoginUri, VaultField, VaultItem};
use std::collections::HashMap;
use uuid::Uuid;

/**
 * Phân tích cú pháp chuỗi CSV theo chuẩn RFC 4180 bằng Rust WASM.
 * Tự động xóa ký tự BOM (U+FEFF), xử lý ngoặc kép lồng nhau và xuống dòng trong trường dữ liệu.
 */
pub fn read_csv_records(text: &str) -> Result<Vec<Vec<String>>, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let text_no_bom = trimmed.strip_prefix('\u{feff}').unwrap_or(trimmed);
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .flexible(true)
        .from_reader(text_no_bom.as_bytes());

    let mut records: Vec<Vec<String>> = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|_| WasmError::VaultImportCsvFail.to_string())?;
        let row: Vec<String> = record.iter().map(|s| s.to_string()).collect();
        records.push(row);
    }
    Ok(records)
}

pub fn parse_csv(text: &str) -> Result<String, String> {
    let records = read_csv_records(text)?;
    serde_json::to_string(&records).map_err(|_| WasmError::VaultImportCsvFail.to_string())
}

/**
 * Xuất mảng 2 chiều string[][] thành chuỗi định dạng CSV chuẩn RFC 4180 bằng Rust WASM.
 */
pub fn unparse_csv(rows_json: &str) -> Result<String, String> {
    let rows: Vec<Vec<String>> = serde_json::from_str(rows_json).map_err(|_| WasmError::VaultExportFail.to_string())?;
    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(Vec::new());

    for row in rows {
        writer.write_record(&row).map_err(|_| WasmError::VaultExportFail.to_string())?;
    }

    let bytes = writer.into_inner().map_err(|_| WasmError::VaultExportFail.to_string())?;
    String::from_utf8(bytes).map_err(|_| WasmError::VaultExportFail.to_string())
}

pub fn export_to_browser_csv(items_json: &str) -> Result<String, String> {
    let items: Vec<VaultItem> = serde_json::from_str(items_json).map_err(|_| WasmError::VaultExportFail.to_string())?;
    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(Vec::new());

    writer
        .write_record(["name", "url", "username", "password", "note"])
        .map_err(|_| WasmError::VaultExportFail.to_string())?;

    for item in items {
        if item.item_type == ItemType::Login {
            let name = &item.name;
            let notes = item.notes.as_deref().unwrap_or("");

            let mut uri = "";
            let mut username = "";
            let mut password = "";

            if let Some(ref login) = item.login {
                if let Some(first_uri) = login.uris.as_ref().and_then(|u| u.first()) {
                    uri = &first_uri.uri;
                }
                username = login.username.as_deref().unwrap_or("");
                password = login.password.as_deref().unwrap_or("");
            }

            writer
                .write_record([name, uri, username, password, notes])
                .map_err(|_| WasmError::VaultExportFail.to_string())?;
        }
    }

    let bytes = writer.into_inner().map_err(|_| WasmError::VaultExportFail.to_string())?;
    String::from_utf8(bytes).map_err(|_| WasmError::VaultExportFail.to_string())
}

pub fn export_to_bitwarden_csv(items_json: &str, folders_json: &str) -> Result<String, String> {
    let items: Vec<VaultItem> = serde_json::from_str(items_json).map_err(|_| WasmError::VaultExportFail.to_string())?;
    let folders: Vec<Folder> = serde_json::from_str(folders_json).unwrap_or_default();

    let mut folder_map: HashMap<String, String> = HashMap::new();
    for f in folders {
        if !f.id.is_empty() && !f.name.is_empty() {
            folder_map.insert(f.id, f.name);
        }
    }

    let mut writer = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(Vec::new());

    writer
        .write_record([
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
        .map_err(|_| WasmError::VaultExportFail.to_string())?;

    for item in items {
        let folder_id = item.folder_id.as_deref().unwrap_or("");
        let folder_name = folder_map.get(folder_id).map(|s| s.as_str()).unwrap_or("");

        let name = &item.name;
        let notes = item.notes.as_deref().unwrap_or("");
        let favorite_str = if item.favorite.unwrap_or(false) { "1" } else { "0" };
        let type_str = match item.item_type {
            ItemType::Login => "login",
            ItemType::SecureNote => "note",
            ItemType::Card => "card",
            ItemType::Identity => "identity",
            ItemType::SshKey => "sshkey",
        };

        let reprompt_str = if item.reprompt.unwrap_or(0) == 1 { "1" } else { "0" };

        let mut lines: Vec<String> = Vec::new();
        for f in &item.fields {
            let fn_str = f.name.as_deref().unwrap_or("");
            let fv_str = f.value.as_deref().unwrap_or("");
            if !fn_str.is_empty() {
                lines.push(format!("{}:{}", fn_str, fv_str));
            }
        }
        let fields_str = lines.join("\n");

        let mut uri = String::new();
        let mut username = String::new();
        let mut password = String::new();
        let mut totp = String::new();

        if item.item_type == ItemType::Login {
            if let Some(ref login) = item.login {
                if let Some(first_uri) = login.uris.as_ref().and_then(|u| u.first()) {
                    uri = first_uri.uri.clone();
                }
                username = login.username.clone().unwrap_or_default();
                password = login.password.clone().unwrap_or_default();
                totp = login.totp.clone().unwrap_or_default();
            }
        }

        writer
            .write_record([
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
            .map_err(|_| WasmError::VaultExportFail.to_string())?;
    }

    let bytes = writer.into_inner().map_err(|_| WasmError::VaultExportFail.to_string())?;
    String::from_utf8(bytes).map_err(|_| WasmError::VaultExportFail.to_string())
}

pub fn get_iso_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn get_cell<'a>(row: &'a [String], idx: Option<usize>) -> &'a str {
    idx.and_then(|i| row.get(i)).map(|s| s.trim()).unwrap_or("")
}

fn get_opt_cell(row: &[String], idx: Option<usize>) -> Option<String> {
    let val = get_cell(row, idx);
    if val.is_empty() { None } else { Some(val.to_string()) }
}

pub fn parse_browser_csv_import(csv_text: &str) -> Result<String, String> {
    let rows = read_csv_records(csv_text)?;
    if rows.len() < 2 {
        return Err(WasmError::VaultImportCsvFail.to_string());
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
        _ => return Err(WasmError::ImportBrowserInvalid.to_string()),
    };

    let now_ts = get_iso_timestamp();
    let mut new_vault_items: Vec<VaultItem> = Vec::new();

    for row in rows.iter().skip(1) {
        if row.is_empty() || (row.len() == 1 && row[0].is_empty()) {
            continue;
        }

        let url_val = get_cell(row, Some(url_i));
        let username_val = get_cell(row, Some(username_i));
        let password_val = get_cell(row, Some(password_i));
        let raw_name = get_cell(row, name_idx);

        if url_val.is_empty() && username_val.is_empty() && password_val.is_empty() {
            continue;
        }

        let domain_extracted = get_hostname(url_val);
        let name_val = if !raw_name.is_empty() {
            raw_name.to_string()
        } else {
            domain_extracted
        };

        let uris = if !url_val.is_empty() {
            Some(vec![LoginUri::from(url_val)])
        } else {
            None
        };

        let item = VaultItem::new_login(
            Uuid::new_v4().to_string(),
            name_val,
            get_opt_cell(row, Some(username_i)),
            get_opt_cell(row, Some(password_i)),
            uris,
            get_opt_cell(row, note_idx),
            Some(now_ts.clone()),
        );

        new_vault_items.push(item);
    }

    let result = serde_json::json!({
        "importedCount": new_vault_items.len(),
        "newItems": new_vault_items,
    });

    serde_json::to_string(&result).map_err(|_| WasmError::VaultImportCsvFail.to_string())
}

pub fn parse_bitwarden_csv_import(
    csv_text: &str,
    existing_folders_json: &str,
) -> Result<String, String> {
    let rows = read_csv_records(csv_text)?;
    if rows.len() < 2 {
        return Err(WasmError::VaultImportCsvFail.to_string());
    }

    let headers: Vec<String> = rows[0]
        .iter()
        .map(|h| h.trim().to_lowercase().replace(['\'', '"'], ""))
        .collect();

    let folder_idx = headers.iter().position(|h| h == "folder");
    let favorite_idx = headers.iter().position(|h| h == "favorite");
    let type_idx = headers.iter().position(|h| h == "type");
    let name_idx = headers.iter().position(|h| h == "name");
    let notes_idx = headers.iter().position(|h| h == "notes" || h == "note");
    let fields_idx = headers.iter().position(|h| h == "fields");
    let reprompt_idx = headers.iter().position(|h| h == "reprompt");
    let uri_idx = headers.iter().position(|h| h == "login_uri" || h == "uri" || h == "url");
    let username_idx = headers.iter().position(|h| h == "login_username" || h == "username");
    let password_idx = headers.iter().position(|h| h == "login_password" || h == "password");
    let totp_idx = headers.iter().position(|h| h == "login_totp" || h == "totp");

    if type_idx.is_none() || name_idx.is_none() || (uri_idx.is_none() && username_idx.is_none() && password_idx.is_none()) {
        return Err(WasmError::ImportBitwardenInvalid.to_string());
    }

    let existing_folders: Vec<Folder> = serde_json::from_str(existing_folders_json).unwrap_or_default();
    let mut folder_map: HashMap<String, Folder> = HashMap::new();
    let mut combined_folders: Vec<Folder> = Vec::new();

    for f in existing_folders {
        if !f.id.is_empty() && !f.name.is_empty() {
            let key = f.name.to_lowercase().trim().to_string();
            folder_map.insert(key, f.clone());
            combined_folders.push(f);
        }
    }

    let now_ts = get_iso_timestamp();
    let mut new_vault_items: Vec<VaultItem> = Vec::new();

    for row in rows.iter().skip(1) {
        if row.is_empty() || (row.len() == 1 && row[0].is_empty()) {
            continue;
        }

        let folder_val = get_cell(row, folder_idx);
        let favorite_val = get_cell(row, favorite_idx) == "1" || get_cell(row, favorite_idx).to_lowercase() == "true";
        let type_val = get_cell(row, type_idx);
        let name_val = get_cell(row, name_idx);
        let notes_val = get_cell(row, notes_idx);
        let fields_raw = get_cell(row, fields_idx);
        let reprompt_val = if get_cell(row, reprompt_idx) == "1" { 1 } else { 0 };
        let uri_val = get_cell(row, uri_idx);
        let username_val = get_cell(row, username_idx);
        let password_val = get_cell(row, password_idx);
        let totp_val = get_cell(row, totp_idx);

        let folder_id_val = if !folder_val.is_empty() {
            let key = folder_val.to_lowercase();
            if let Some(existing_folder) = folder_map.get(&key) {
                Some(existing_folder.id.clone())
            } else {
                let new_id = Uuid::new_v4().to_string();
                let new_folder = Folder::new(new_id.clone(), folder_val.to_string());
                folder_map.insert(key, new_folder.clone());
                combined_folders.push(new_folder);
                Some(new_id)
            }
        } else {
            None
        };

        let mut custom_fields: Vec<VaultField> = Vec::new();
        if !fields_raw.is_empty() {
            for line in fields_raw.lines() {
                let line_trim = line.trim();
                if line_trim.is_empty() {
                    continue;
                }
                if let Some((f_name, f_val)) = line_trim.split_once(':') {
                    custom_fields.push(VaultField::from((f_name.trim(), f_val.trim())));
                }
            }
        }

        let item_type = ItemType::from(type_val);
        let domain_extracted = get_hostname(uri_val);

        let final_name = if !name_val.is_empty() {
            name_val.to_string()
        } else if !domain_extracted.is_empty() {
            domain_extracted
        } else {
            String::new()
        };

        let item_id = Uuid::new_v4().to_string();

        let mut item = item_type
            .create_item(
                item_id,
                final_name,
                if notes_val.is_empty() { None } else { Some(notes_val.to_string()) },
                Some(now_ts.clone()),
            )
            .with_folder_id(folder_id_val)
            .with_favorite(favorite_val)
            .with_reprompt(reprompt_val)
            .with_fields(custom_fields);

        if item_type == ItemType::Login {
            if let Some(ref mut login) = item.login {
                if !username_val.is_empty() {
                    login.username = Some(username_val.to_string());
                }
                if !password_val.is_empty() {
                    login.password = Some(password_val.to_string());
                }
                if !totp_val.is_empty() {
                    login.totp = Some(totp_val.to_string());
                }
                if !uri_val.is_empty() {
                    login.uris = Some(vec![LoginUri::from(uri_val)]);
                }
            }
        }

        new_vault_items.push(item);
    }

    let result = serde_json::json!({
        "importedCount": new_vault_items.len(),
        "newItems": new_vault_items,
        "combinedFolders": combined_folders,
    });

    serde_json::to_string(&result).map_err(|_| WasmError::VaultImportCsvFail.to_string())
}
