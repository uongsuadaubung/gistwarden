use crate::errors::WasmError;
use crate::types::{Folder, VaultItem, VaultPayload};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

fn parse_timestamp(date_str: Option<&str>) -> u64 {
    date_str
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.timestamp_millis().max(0) as u64)
        .unwrap_or(0)
}

pub fn merge_vault_payload_values(
    local: VaultPayload,
    remote: VaultPayload,
    last_sync_timestamp: u64,
) -> VaultPayload {
    // 1. Merge Folders
    let merged_folders = merge_folders_values(local.folders, remote.folders);

    // 2. Merge Trash
    let mut trash_map: HashMap<String, Value> = HashMap::new();
    for t_item in local.trash.into_iter().chain(remote.trash) {
        let item_id = match t_item
            .get("item")
            .and_then(|i| i.get("id"))
            .and_then(|v| v.as_str())
            .or_else(|| t_item.get("id").and_then(|v| v.as_str()))
        {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let Some(existing) = trash_map.get(&item_id) {
            let existing_del_time =
                parse_timestamp(existing.get("deletedDate").and_then(|v| v.as_str()));
            let new_del_time =
                parse_timestamp(t_item.get("deletedDate").and_then(|v| v.as_str()));
            if new_del_time > existing_del_time {
                trash_map.insert(item_id, t_item);
            }
        } else {
            trash_map.insert(item_id, t_item);
        }
    }

    // 3. Merge Vault Items using shared merge_vault_items_values
    let candidate_items = merge_vault_items_values(local.items, remote.items, last_sync_timestamp);

    // Filter candidate items against trash
    let mut final_items: Vec<VaultItem> = Vec::with_capacity(candidate_items.len());
    for item in candidate_items {
        let id = &item.id;
        if let Some(trash_entry) = trash_map.get(id) {
            let del_time =
                parse_timestamp(trash_entry.get("deletedDate").and_then(|v| v.as_str()));
            let rev_time = parse_timestamp(item.revision_date.as_deref());
            if del_time >= rev_time {
                continue;
            } else {
                trash_map.remove(id);
            }
        }
        final_items.push(item);
    }

    final_items.sort_by(|a, b| crate::utils::cmp_ignore_case(&a.name, &b.name));

    let result_trash: Vec<Value> = trash_map.into_values().collect();

    VaultPayload {
        folders: merged_folders,
        items: final_items,
        trash: result_trash,
    }
}

pub fn merge_vault_payload(
    local_json: &str,
    remote_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    let local: VaultPayload = serde_json::from_str(local_json).map_err(|_| WasmError::SyncInvalidFormat.to_string())?;
    let remote: VaultPayload = serde_json::from_str(remote_json).map_err(|_| WasmError::SyncInvalidFormat.to_string())?;
    let merged = merge_vault_payload_values(local, remote, last_sync_timestamp);
    serde_json::to_string(&merged).map_err(|_| WasmError::SyncInvalidFormat.to_string())
}

pub fn merge_folders_values(
    local: Vec<Folder>,
    remote: Vec<Folder>,
) -> Vec<Folder> {
    let mut folder_map: HashMap<String, Folder> = HashMap::new();
    for f in local {
        if !f.id.is_empty() && !f.name.is_empty() {
            folder_map.insert(f.id.clone(), f);
        }
    }
    for f in remote {
        if !f.id.is_empty() && !f.name.is_empty() {
            folder_map.entry(f.id.clone()).or_insert(f);
        }
    }

    let mut merged_folders: Vec<Folder> = folder_map.into_values().collect();
    merged_folders.sort_by(|a, b| crate::utils::cmp_ignore_case(&a.name, &b.name));
    merged_folders
}

pub fn merge_folders(
    local_folders_json: &str,
    remote_folders_json: &str,
) -> Result<String, String> {
    let local: Vec<Folder> = serde_json::from_str(local_folders_json).map_err(|_| WasmError::SyncInvalidFormat.to_string())?;
    let remote: Vec<Folder> = serde_json::from_str(remote_folders_json).map_err(|_| WasmError::SyncInvalidFormat.to_string())?;
    let merged = merge_folders_values(local, remote);
    serde_json::to_string(&merged).map_err(|_| WasmError::SyncInvalidFormat.to_string())
}

pub fn merge_vault_items_values(
    local_items: Vec<VaultItem>,
    remote_items: Vec<VaultItem>,
    last_sync_timestamp: u64,
) -> Vec<VaultItem> {
    let mut local_map: HashMap<String, VaultItem> = HashMap::with_capacity(local_items.len());
    for item in local_items {
        if !item.id.is_empty() {
            local_map.insert(item.id.clone(), item);
        }
    }

    let mut item_map: HashMap<String, VaultItem> = HashMap::new();
    let mut remote_ids: HashSet<String> = HashSet::with_capacity(remote_items.len());

    for remote_item in remote_items {
        if remote_item.id.is_empty() {
            continue;
        }
        let id = remote_item.id.clone();
        remote_ids.insert(id.clone());

        if let Some(local_item) = local_map.remove(&id) {
            let local_rev_time = parse_timestamp(local_item.revision_date.as_deref());
            let remote_rev_time = parse_timestamp(remote_item.revision_date.as_deref());

            if local_rev_time >= remote_rev_time {
                item_map.insert(id, local_item);
            } else {
                item_map.insert(id, remote_item);
            }
        } else {
            let remote_creation_time = parse_timestamp(remote_item.creation_date.as_deref());
            let remote_rev_time = parse_timestamp(remote_item.revision_date.as_deref());

            if last_sync_timestamp == 0
                || remote_creation_time > last_sync_timestamp
                || remote_rev_time > last_sync_timestamp
            {
                item_map.insert(id, remote_item);
            }
        }
    }

    for (id, local_item) in local_map {
        if !remote_ids.contains(&id) {
            let local_creation_time = parse_timestamp(local_item.creation_date.as_deref());
            let local_rev_time = parse_timestamp(local_item.revision_date.as_deref());

            if last_sync_timestamp == 0
                || local_creation_time > last_sync_timestamp
                || local_rev_time > last_sync_timestamp
            {
                item_map.insert(id, local_item);
            }
        }
    }

    let mut merged_items: Vec<VaultItem> = item_map.into_values().collect();
    merged_items.sort_by(|a, b| crate::utils::cmp_ignore_case(&a.name, &b.name));
    merged_items
}

pub fn merge_vault_items(
    local_items_json: &str,
    remote_items_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    let local_items: Vec<VaultItem> = serde_json::from_str(local_items_json).map_err(|_| WasmError::SyncInvalidFormat.to_string())?;
    let remote_items: Vec<VaultItem> = serde_json::from_str(remote_items_json).map_err(|_| WasmError::SyncInvalidFormat.to_string())?;
    let merged = merge_vault_items_values(local_items, remote_items, last_sync_timestamp);
    serde_json::to_string(&merged).map_err(|_| WasmError::SyncInvalidFormat.to_string())
}
