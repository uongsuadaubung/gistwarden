use crate::csv_parser::get_iso_timestamp;
use crate::errors::WasmError;
use crate::types::{Folder, VaultItem, VaultItemExt};
use serde::Deserialize;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Deserialize)]
struct JsonImportPayload {
    #[serde(default)]
    items: Vec<VaultItem>,
    #[serde(default)]
    folders: Vec<Folder>,
}

fn get_item_key_parts(item: &VaultItem) -> (&str, &str, &str) {
    if item.is_login() {
        let uri = item.primary_uri().unwrap_or("");
        if !uri.is_empty() {
            return (uri, item.username().unwrap_or(""), item.name.as_str());
        }
    }
    ("", "", item.name.as_str())
}

pub fn parse_json_import(
    json_text: &str,
    existing_items_json: &str,
    existing_folders_json: &str,
) -> Result<String, String> {
    let trimmed = json_text.trim();
    if trimmed.is_empty() {
        return Err(WasmError::VaultImportInvalid.to_string());
    }

    let existing_items: Vec<VaultItem> =
        serde_json::from_str(existing_items_json).unwrap_or_default();
    let existing_folders: Vec<Folder> =
        serde_json::from_str(existing_folders_json).unwrap_or_default();

    // 1-pass strongly typed deserialization to avoid double deserialization & Value tree allocation
    let (imported_items, imported_folders) = if trimmed.starts_with('[') {
        let items: Vec<VaultItem> =
            serde_json::from_str(trimmed).map_err(|_| WasmError::VaultImportInvalid.to_string())?;
        (items, Vec::new())
    } else {
        let payload: JsonImportPayload =
            serde_json::from_str(trimmed).map_err(|_| WasmError::VaultImportInvalid.to_string())?;
        (payload.items, payload.folders)
    };

    let now_iso = get_iso_timestamp();

    // 1. Process imported folders
    let mut folder_map: HashMap<String, Folder> = HashMap::new();
    let mut combined_folders: Vec<Folder> = Vec::new();

    for f in existing_folders {
        if !f.id.is_empty() && !f.name.is_empty() {
            let key = f.name.trim().to_lowercase();
            folder_map.insert(key, f.clone());
            combined_folders.push(f);
        }
    }

    for f in imported_folders {
        if !f.id.is_empty() && !f.name.is_empty() {
            let key = f.name.trim().to_lowercase();
            if let std::collections::hash_map::Entry::Vacant(entry) = folder_map.entry(key) {
                entry.insert(f.clone());
                combined_folders.push(f);
            }
        }
    }

    // 2. Process imported items
    let mut new_vault_items: Vec<VaultItem> = Vec::with_capacity(imported_items.len());

    for mut item in imported_items {
        if item.id.is_empty() {
            item.id = Uuid::new_v4().to_string();
        }

        // Locale-agnostic core: do not inject hardcoded presentation labels
        if item.creation_date.as_deref().unwrap_or("").is_empty() {
            item.creation_date = Some(now_iso.clone());
        }
        if item.revision_date.as_deref().unwrap_or("").is_empty() {
            item.revision_date = Some(now_iso.clone());
        }

        new_vault_items.push(item);
    }

    // 3. Merge Items using zero-allocation tuple slice keys
    let mut key_to_index: HashMap<(String, String, String), usize> = HashMap::new();
    let mut final_items = existing_items;

    for (idx, item) in final_items.iter().enumerate() {
        let (u, un, n) = get_item_key_parts(item);
        key_to_index.insert((u.to_string(), un.to_string(), n.to_string()), idx);
    }

    let mut added_count = 0;

    for new_item in new_vault_items {
        let (u, un, n) = get_item_key_parts(&new_item);
        let lookup_key = (u.to_string(), un.to_string(), n.to_string());

        if let Some(&existing_idx) = key_to_index.get(&lookup_key) {
            let existing_item = &final_items[existing_idx];
            let existing_date = existing_item.revision_date.as_deref().unwrap_or("");
            let new_date = new_item.revision_date.as_deref().unwrap_or("");

            if new_date > existing_date {
                final_items[existing_idx] = new_item;
            }
        } else {
            let new_idx = final_items.len();
            final_items.push(new_item);
            key_to_index.insert(lookup_key, new_idx);
            added_count += 1;
        }
    }

    let result = serde_json::json!({
        "importedCount": added_count,
        "combinedItems": final_items,
        "combinedFolders": combined_folders,
    });

    serde_json::to_string(&result).map_err(|_| WasmError::VaultImportInvalid.to_string())
}

pub fn export_to_json(items_json: &str, folders_json: &str) -> Result<String, String> {
    let items: Vec<VaultItem> =
        serde_json::from_str(items_json).map_err(|_| WasmError::VaultExportFail.to_string())?;
    let folders: Vec<Folder> = serde_json::from_str(folders_json).unwrap_or_default();

    let payload = serde_json::json!({
        "encrypted": false,
        "folders": folders,
        "items": items,
    });

    serde_json::to_string_pretty(&payload).map_err(|_| WasmError::VaultExportFail.to_string())
}
