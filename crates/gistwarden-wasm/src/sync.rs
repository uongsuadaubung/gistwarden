use serde_json::Value;
use std::collections::HashMap;

fn parse_timestamp(date_str: Option<&str>) -> u64 {
    date_str
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.timestamp_millis().max(0) as u64)
        .unwrap_or(0)
}

pub fn merge_vault_payload_values(
    local: Value,
    remote: Value,
    last_sync_timestamp: u64,
) -> Value {
    let local_folders = local
        .get("folders")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let remote_folders = remote
        .get("folders")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    // 1. Merge Folders
    let mut folder_map: HashMap<String, Value> = HashMap::new();
    for f in &local_folders {
        if let (Some(id), Some(_)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            folder_map.insert(id.to_string(), f.clone());
        }
    }
    for f in &remote_folders {
        if let (Some(id), Some(_)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            folder_map.entry(id.to_string()).or_insert_with(|| f.clone());
        }
    }

    let mut merged_folders: Vec<Value> = folder_map.into_values().collect();
    merged_folders.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });

    // 2. Merge Trash
    let local_trash = local
        .get("trash")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let remote_trash = remote
        .get("trash")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let mut trash_map: HashMap<String, Value> = HashMap::new();
    for t_item in local_trash.into_iter().chain(remote_trash) {
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

    // 3. Merge Vault Items
    let local_items = local
        .get("items")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let remote_items = remote
        .get("items")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let mut local_map: HashMap<String, Value> = HashMap::new();
    for item in &local_items {
        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
            local_map.insert(id.to_string(), item.clone());
        }
    }

    let mut item_map: HashMap<String, Value> = HashMap::new();

    for remote_item in &remote_items {
        let id = match remote_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let Some(local_item) = local_map.get(&id) {
            let local_rev_time =
                parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if local_rev_time >= remote_rev_time {
                item_map.insert(id, local_item.clone());
            } else {
                item_map.insert(id, remote_item.clone());
            }
        } else {
            let remote_creation_time =
                parse_timestamp(remote_item.get("creationDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if last_sync_timestamp == 0
                || remote_creation_time > last_sync_timestamp
                || remote_rev_time > last_sync_timestamp
            {
                item_map.insert(id, remote_item.clone());
            }
        }
    }

    for local_item in &local_items {
        let id = match local_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let std::collections::hash_map::Entry::Vacant(entry) = item_map.entry(id.clone()) {
            let remote_item = remote_items
                .iter()
                .find(|r| r.get("id").and_then(|v| v.as_str()) == Some(&id));
            if remote_item.is_none() {
                let local_creation_time =
                    parse_timestamp(local_item.get("creationDate").and_then(|v| v.as_str()));
                let local_rev_time =
                    parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));

                if last_sync_timestamp == 0
                    || local_creation_time > last_sync_timestamp
                    || local_rev_time > last_sync_timestamp
                {
                    entry.insert(local_item.clone());
                }
            }
        }
    }

    // Filter candidate items against trash
    let mut final_items: Vec<Value> = Vec::new();
    for (id, item) in item_map {
        if let Some(trash_entry) = trash_map.get(&id) {
            let del_time =
                parse_timestamp(trash_entry.get("deletedDate").and_then(|v| v.as_str()));
            let rev_time = parse_timestamp(item.get("revisionDate").and_then(|v| v.as_str()));
            if del_time >= rev_time {
                continue;
            } else {
                trash_map.remove(&id);
            }
        }
        final_items.push(item);
    }

    final_items.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });

    let result_trash: Vec<Value> = trash_map.into_values().collect();

    serde_json::json!({
        "folders": merged_folders,
        "items": final_items,
        "trash": result_trash,
    })
}

pub fn merge_vault_payload(
    local_json: &str,
    remote_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    let local: Value = serde_json::from_str(local_json).map_err(|e| e.to_string())?;
    let remote: Value = serde_json::from_str(remote_json).map_err(|e| e.to_string())?;
    let merged = merge_vault_payload_values(local, remote, last_sync_timestamp);
    serde_json::to_string(&merged).map_err(|e| e.to_string())
}

pub fn merge_folders_values(
    local: Vec<Value>,
    remote: Vec<Value>,
) -> Vec<Value> {
    let mut folder_map: HashMap<String, Value> = HashMap::new();
    for f in &local {
        if let (Some(id), Some(_)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            folder_map.insert(id.to_string(), f.clone());
        }
    }
    for f in &remote {
        if let (Some(id), Some(_)) = (
            f.get("id").and_then(|v| v.as_str()),
            f.get("name").and_then(|v| v.as_str()),
        ) {
            folder_map.entry(id.to_string()).or_insert_with(|| f.clone());
        }
    }

    let mut merged_folders: Vec<Value> = folder_map.into_values().collect();
    merged_folders.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });
    merged_folders
}

pub fn merge_folders(
    local_folders_json: &str,
    remote_folders_json: &str,
) -> Result<String, String> {
    let local: Vec<Value> = serde_json::from_str(local_folders_json).map_err(|e| e.to_string())?;
    let remote: Vec<Value> = serde_json::from_str(remote_folders_json).map_err(|e| e.to_string())?;
    let merged = merge_folders_values(local, remote);
    serde_json::to_string(&merged).map_err(|e| e.to_string())
}

pub fn merge_vault_items_values(
    local_items: Vec<Value>,
    remote_items: Vec<Value>,
    last_sync_timestamp: u64,
) -> Vec<Value> {
    let mut local_map: HashMap<String, Value> = HashMap::new();
    for item in &local_items {
        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
            local_map.insert(id.to_string(), item.clone());
        }
    }

    let mut item_map: HashMap<String, Value> = HashMap::new();

    for remote_item in &remote_items {
        let id = match remote_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let Some(local_item) = local_map.get(&id) {
            let local_rev_time =
                parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if local_rev_time >= remote_rev_time {
                item_map.insert(id, local_item.clone());
            } else {
                item_map.insert(id, remote_item.clone());
            }
        } else {
            let remote_creation_time =
                parse_timestamp(remote_item.get("creationDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if last_sync_timestamp == 0
                || remote_creation_time > last_sync_timestamp
                || remote_rev_time > last_sync_timestamp
            {
                item_map.insert(id, remote_item.clone());
            }
        }
    }

    for local_item in &local_items {
        let id = match local_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let std::collections::hash_map::Entry::Vacant(entry) = item_map.entry(id.clone()) {
            let remote_item = remote_items
                .iter()
                .find(|r| r.get("id").and_then(|v| v.as_str()) == Some(&id));
            if remote_item.is_none() {
                let local_creation_time =
                    parse_timestamp(local_item.get("creationDate").and_then(|v| v.as_str()));
                let local_rev_time =
                    parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));

                if last_sync_timestamp == 0
                    || local_creation_time > last_sync_timestamp
                    || local_rev_time > last_sync_timestamp
                {
                    entry.insert(local_item.clone());
                }
            }
        }
    }

    let mut merged_items: Vec<Value> = item_map.into_values().collect();
    merged_items.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });
    merged_items
}

pub fn merge_vault_items(
    local_items_json: &str,
    remote_items_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    let local_items: Vec<Value> = serde_json::from_str(local_items_json).map_err(|e| e.to_string())?;
    let remote_items: Vec<Value> = serde_json::from_str(remote_items_json).map_err(|e| e.to_string())?;
    let merged = merge_vault_items_values(local_items, remote_items, last_sync_timestamp);
    serde_json::to_string(&merged).map_err(|e| e.to_string())
}
