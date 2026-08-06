use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(from = "u64", into = "u64")]
#[repr(u64)]
pub enum ItemType {
    #[default]
    Login = 1,
    SecureNote = 2,
    Card = 3,
    Identity = 4,
    SshKey = 5,
}

impl From<u64> for ItemType {
    fn from(val: u64) -> Self {
        match val {
            2 => ItemType::SecureNote,
            3 => ItemType::Card,
            4 => ItemType::Identity,
            5 => ItemType::SshKey,
            _ => ItemType::Login,
        }
    }
}

impl From<ItemType> for u64 {
    fn from(item: ItemType) -> Self {
        item as u64
    }
}

impl From<&str> for ItemType {
    fn from(s: &str) -> Self {
        match s.trim().to_lowercase().as_str() {
            "2" | "note" | "securenote" => ItemType::SecureNote,
            "3" | "card" => ItemType::Card,
            "4" | "identity" => ItemType::Identity,
            "5" | "sshkey" | "ssh_key" => ItemType::SshKey,
            _ => ItemType::Login,
        }
    }
}

impl fmt::Display for ItemType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            ItemType::Login => "login",
            ItemType::SecureNote => "secureNote",
            ItemType::Card => "card",
            ItemType::Identity => "identity",
            ItemType::SshKey => "sshKey",
        };
        write!(f, "{}", s)
    }
}

impl From<String> for ItemType {
    fn from(s: String) -> Self {
        ItemType::from(s.as_str())
    }
}

impl ItemType {
    pub fn create_item(
        self,
        id: String,
        name: String,
        notes: Option<String>,
        timestamp: Option<String>,
    ) -> VaultItem {
        match self {
            ItemType::Login => VaultItem::new_login(id, name, None, None, None, notes, timestamp),
            ItemType::SecureNote => VaultItem::new_secure_note(id, name, notes, timestamp),
            ItemType::Card => VaultItem::new_card(id, name, CardDetails::default(), notes, timestamp),
            ItemType::Identity => VaultItem::new_identity(id, name, IdentityDetails::default(), notes, timestamp),
            ItemType::SshKey => VaultItem::new_ssh_key(id, name, SshKeyDetails::default(), notes, timestamp),
        }
    }
}

fn default_item_type() -> ItemType {
    ItemType::Login
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: String,
    pub name: String,
}

impl fmt::Display for Folder {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)
    }
}

impl From<(&str, &str)> for Folder {
    fn from((id, name): (&str, &str)) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
        }
    }
}

impl From<(String, String)> for Folder {
    fn from((id, name): (String, String)) -> Self {
        Self { id, name }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VaultField {
    #[serde(rename = "type", default)]
    pub field_type: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

impl From<(&str, &str)> for VaultField {
    fn from((name, value): (&str, &str)) -> Self {
        Self {
            field_type: 0,
            name: if name.is_empty() { None } else { Some(name.to_string()) },
            value: if value.is_empty() { None } else { Some(value.to_string()) },
        }
    }
}

impl From<(String, String)> for VaultField {
    fn from((name, value): (String, String)) -> Self {
        Self {
            field_type: 0,
            name: if name.is_empty() { None } else { Some(name) },
            value: if value.is_empty() { None } else { Some(value) },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LoginUri {
    pub uri: String,
    #[serde(rename = "match", default, skip_serializing_if = "Option::is_none")]
    pub match_mode: Option<u8>,
}

impl fmt::Display for LoginUri {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.uri)
    }
}

impl AsRef<str> for LoginUri {
    fn as_ref(&self) -> &str {
        &self.uri
    }
}

impl From<&str> for LoginUri {
    fn from(uri: &str) -> Self {
        Self {
            uri: uri.to_string(),
            match_mode: None,
        }
    }
}

impl From<String> for LoginUri {
    fn from(uri: String) -> Self {
        Self {
            uri,
            match_mode: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PasswordHistory {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_used_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Fido2Credential {
    pub credential_id: String,
    pub key_type: String,
    pub key_algorithm: String,
    pub key_curve: String,
    pub key_value: String,
    pub rp_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_handle: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_name: Option<String>,
    #[serde(default)]
    pub counter: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rp_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_display_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub discoverable: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub creation_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LoginDetails {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub totp: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub uris: Option<Vec<LoginUri>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fido2_credentials: Option<Vec<Fido2Credential>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub password_revision_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub password_history: Option<Vec<PasswordHistory>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CardDetails {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cardholder_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub number: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exp_month: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exp_year: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct IdentityDetails {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub middle_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub company: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssn: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub passport_number: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub license_number: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub address1: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub address2: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub address3: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub city: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub postal_code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub country: Option<String>,
}

impl LoginDetails {
    pub fn new(username: Option<String>, password: Option<String>) -> Self {
        Self {
            username,
            password,
            totp: None,
            uris: None,
            fido2_credentials: None,
            password_revision_date: None,
            password_history: None,
        }
    }

    pub fn has_totp(&self) -> bool {
        self.totp.as_ref().map_or(false, |t| !t.trim().is_empty())
    }

    pub fn get_totp(&self) -> Option<&str> {
        self.totp.as_deref().filter(|t| !t.trim().is_empty())
    }

    pub fn add_uri(&mut self, uri: LoginUri) {
        self.uris.get_or_insert_with(Vec::new).push(uri);
    }
}

impl IdentityDetails {
    pub fn full_name(&self) -> String {
        let parts: Vec<&str> = [
            self.first_name.as_deref(),
            self.middle_name.as_deref(),
            self.last_name.as_deref(),
        ]
        .into_iter()
        .flatten()
        .filter(|s| !s.trim().is_empty())
        .collect();

        parts.join(" ")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SshKeyDetails {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub private_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub public_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub key_fingerprint: Option<String>,
}

impl SshKeyDetails {
    pub fn new(
        private_key: Option<String>,
        public_key: Option<String>,
        key_fingerprint: Option<String>,
    ) -> Self {
        Self {
            private_key,
            public_key,
            key_fingerprint,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VaultItem {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub folder_id: Option<String>,
    #[serde(rename = "type", default = "default_item_type")]
    pub item_type: ItemType,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub favorite: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reprompt: Option<u64>,
    #[serde(default)]
    pub fields: Vec<VaultField>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub creation_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revision_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub login: Option<LoginDetails>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub card: Option<CardDetails>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub identity: Option<IdentityDetails>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_key: Option<SshKeyDetails>,
}

impl Folder {
    pub fn new(id: String, name: String) -> Self {
        Self { id, name }
    }
}

impl VaultField {
    pub fn new(field_type: u32, name: Option<String>, value: Option<String>) -> Self {
        Self {
            field_type,
            name,
            value,
        }
    }
}

impl LoginUri {
    pub fn new(uri: String, match_mode: Option<u8>) -> Self {
        Self { uri, match_mode }
    }
}

impl VaultItem {
    pub fn new_login(
        id: String,
        name: String,
        username: Option<String>,
        password: Option<String>,
        uris: Option<Vec<LoginUri>>,
        notes: Option<String>,
        timestamp: Option<String>,
    ) -> Self {
        Self {
            id,
            organization_id: None,
            folder_id: None,
            item_type: ItemType::Login,
            name,
            notes,
            favorite: Some(false),
            reprompt: Some(0),
            fields: Vec::new(),
            creation_date: timestamp.clone(),
            revision_date: timestamp,
            login: Some(LoginDetails {
                username,
                password,
                totp: None,
                uris,
                fido2_credentials: None,
                password_revision_date: None,
                password_history: None,
            }),
            card: None,
            identity: None,
            ssh_key: None,
        }
    }

    pub fn new_secure_note(
        id: String,
        name: String,
        notes: Option<String>,
        timestamp: Option<String>,
    ) -> Self {
        Self {
            id,
            organization_id: None,
            folder_id: None,
            item_type: ItemType::SecureNote,
            name,
            notes,
            favorite: Some(false),
            reprompt: Some(0),
            fields: Vec::new(),
            creation_date: timestamp.clone(),
            revision_date: timestamp,
            login: None,
            card: None,
            identity: None,
            ssh_key: None,
        }
    }

    pub fn new_card(
        id: String,
        name: String,
        card: CardDetails,
        notes: Option<String>,
        timestamp: Option<String>,
    ) -> Self {
        Self {
            id,
            organization_id: None,
            folder_id: None,
            item_type: ItemType::Card,
            name,
            notes,
            favorite: Some(false),
            reprompt: Some(0),
            fields: Vec::new(),
            creation_date: timestamp.clone(),
            revision_date: timestamp,
            login: None,
            card: Some(card),
            identity: None,
            ssh_key: None,
        }
    }

    pub fn new_identity(
        id: String,
        name: String,
        identity: IdentityDetails,
        notes: Option<String>,
        timestamp: Option<String>,
    ) -> Self {
        Self {
            id,
            organization_id: None,
            folder_id: None,
            item_type: ItemType::Identity,
            name,
            notes,
            favorite: Some(false),
            reprompt: Some(0),
            fields: Vec::new(),
            creation_date: timestamp.clone(),
            revision_date: timestamp,
            login: None,
            card: None,
            identity: Some(identity),
            ssh_key: None,
        }
    }

    pub fn new_ssh_key(
        id: String,
        name: String,
        ssh_key: SshKeyDetails,
        notes: Option<String>,
        timestamp: Option<String>,
    ) -> Self {
        Self {
            id,
            organization_id: None,
            folder_id: None,
            item_type: ItemType::SshKey,
            name,
            notes,
            favorite: Some(false),
            reprompt: Some(0),
            fields: Vec::new(),
            creation_date: timestamp.clone(),
            revision_date: timestamp,
            login: None,
            card: None,
            identity: None,
            ssh_key: Some(ssh_key),
        }
    }

    pub fn with_folder_id(mut self, folder_id: Option<String>) -> Self {
        self.folder_id = folder_id;
        self
    }

    pub fn with_favorite(mut self, favorite: bool) -> Self {
        self.favorite = Some(favorite);
        self
    }

    pub fn with_reprompt(mut self, reprompt: u64) -> Self {
        self.reprompt = Some(reprompt);
        self
    }

    pub fn with_fields(mut self, fields: Vec<VaultField>) -> Self {
        self.fields = fields;
        self
    }

    pub fn is_login(&self) -> bool {
        self.item_type == ItemType::Login
    }

    pub fn is_secure_note(&self) -> bool {
        self.item_type == ItemType::SecureNote
    }

    pub fn is_card(&self) -> bool {
        self.item_type == ItemType::Card
    }

    pub fn is_identity(&self) -> bool {
        self.item_type == ItemType::Identity
    }

    pub fn is_ssh_key(&self) -> bool {
        self.item_type == ItemType::SshKey
    }

    pub fn get_username(&self) -> Option<&str> {
        self.login.as_ref().and_then(|l| l.username.as_deref())
    }

    pub fn get_password(&self) -> Option<&str> {
        self.login.as_ref().and_then(|l| l.password.as_deref())
    }

    pub fn get_totp(&self) -> Option<&str> {
        self.login.as_ref().and_then(|l| l.get_totp())
    }

    pub fn get_notes(&self) -> Option<&str> {
        self.notes.as_deref().filter(|n| !n.trim().is_empty())
    }

    pub fn get_primary_uri(&self) -> Option<&str> {
        self.login
            .as_ref()
            .and_then(|l| l.uris.as_ref())
            .and_then(|u| u.first())
            .map(|u| u.uri.as_str())
    }

    pub fn get_field_value(&self, target_name: &str) -> Option<&str> {
        self.fields.iter().find_map(|f| {
            if f.name.as_deref() == Some(target_name) {
                f.value.as_deref()
            } else {
                None
            }
        })
    }
}

pub trait VaultItemExt {
    fn username(&self) -> Option<&str>;
    fn password(&self) -> Option<&str>;
    fn totp(&self) -> Option<&str>;
    fn notes(&self) -> Option<&str>;
    fn primary_uri(&self) -> Option<&str>;
}

impl VaultItemExt for VaultItem {
    fn username(&self) -> Option<&str> {
        self.get_username()
    }
    fn password(&self) -> Option<&str> {
        self.get_password()
    }
    fn totp(&self) -> Option<&str> {
        self.get_totp()
    }
    fn notes(&self) -> Option<&str> {
        self.get_notes()
    }
    fn primary_uri(&self) -> Option<&str> {
        self.get_primary_uri()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VaultPayload {
    #[serde(default)]
    pub folders: Vec<Folder>,
    #[serde(default)]
    pub items: Vec<VaultItem>,
    #[serde(default)]
    pub trash: Vec<serde_json::Value>,
}
