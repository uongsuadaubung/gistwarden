import {
  asFolderId,
  asVaultItemId,
  parseCSV,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { bitwardenCsvExportStrategy } from "../packages/ui/src/features/sync/strategies/bitwarden-csv-export-strategy.ts";
import { browserCsvExportStrategy } from "../packages/ui/src/features/sync/strategies/browser-csv-export-strategy.ts";
import { jsonExportStrategy } from "../packages/ui/src/features/sync/strategies/json-export-strategy.ts";
import { assert, assertEquals, test } from "./assert.ts";

const exportToBrowserCsv = (items: VaultItem[]) =>
  browserCsvExportStrategy.export(items).fileContent;
const exportToBitwardenCsv = (items: VaultItem[], folders: any[] = []) =>
  bitwardenCsvExportStrategy.export(items, folders).fileContent;

test("Export CSV - Browser CSV format", () => {
  const items: VaultItem[] = [
    {
      id: asVaultItemId("1"),
      type: VaultItemType.Login,
      name: "Google, Inc.",
      notes: "Line1\nLine2",
      favorite: false,
      reprompt: 0,
      fields: [],
      login: {
        username: "user1",
        password: 'password"123',
        uris: [{ uri: "https://google.com" }],
        fido2Credentials: [],
        passwordRevisionDate: null,
        passwordHistory: [],
      },
      creationDate: "2024-01-01T00:00:00Z",
      revisionDate: "2024-01-01T00:00:00Z",
    },
    {
      id: asVaultItemId("2"),
      type: VaultItemType.Login,
      name: "GitHub",
      notes: "",
      favorite: false,
      reprompt: 0,
      fields: [],
      login: {
        username: "user2",
        password: "password2",
        uris: [{ uri: "https://github.com" }],
        fido2Credentials: [],
        passwordRevisionDate: null,
        passwordHistory: [],
      },
      creationDate: "2024-01-01T00:00:00Z",
      revisionDate: "2024-01-01T00:00:00Z",
    },
  ];

  const csv = exportToBrowserCsv(items);
  const rows = parseCSV(csv);
  assertEquals(rows.length, 3); // Header + 2 login rows
  assertEquals(rows[0], ["name", "url", "username", "password", "note"]);
  assertEquals(rows[1], [
    "Google, Inc.",
    "https://google.com",
    "user1",
    'password"123',
    "Line1\nLine2",
  ]);
  assertEquals(rows[2], [
    "GitHub",
    "https://github.com",
    "user2",
    "password2",
    "",
  ]);
});

test("Export CSV - Bitwarden CSV format", () => {
  const items: VaultItem[] = [
    {
      id: asVaultItemId("3"),
      type: VaultItemType.Login,
      name: "Google",
      notes: "Note 1",
      favorite: true,
      reprompt: 1,
      fields: [
        { type: 0, name: "custom1", value: "value1" },
        { type: 0, name: "custom2", value: 'value"2' },
      ],
      login: {
        username: "user1",
        password: "pass1",
        uris: [{ uri: "https://google.com" }],
        totp: "secret123",
        fido2Credentials: [],
        passwordRevisionDate: null,
        passwordHistory: [],
      },
      creationDate: "2024-01-01T00:00:00Z",
      revisionDate: "2024-01-01T00:00:00Z",
    },
    {
      id: asVaultItemId("4"),
      type: VaultItemType.SecureNote,
      name: "Note Name",
      notes: "Note Content",
      favorite: false,
      reprompt: 0,
      fields: [],
      creationDate: "2024-01-01T00:00:00Z",
      revisionDate: "2024-01-01T00:00:00Z",
    },
  ];

  const csv = exportToBitwardenCsv(items);
  const rows = parseCSV(csv);

  assertEquals(rows.length, 3); // Header + Login + Note
  assertEquals(rows[0], [
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
  ]);

  // Login row verification
  const loginRow = rows[1];
  assert(loginRow);
  assertEquals(loginRow[0], "");
  assertEquals(loginRow[1], "1");
  assertEquals(loginRow[2], "login");
  assertEquals(loginRow[3], "Google");
  assertEquals(loginRow[4], "Note 1");
  assertEquals(loginRow[5], 'custom1:value1\ncustom2:value"2');
  assertEquals(loginRow[6], "1");
  assertEquals(loginRow[7], "");
  assertEquals(loginRow[8], "https://google.com");
  assertEquals(loginRow[9], "user1");
  assertEquals(loginRow[10], "pass1");
  assertEquals(loginRow[11], "secret123");

  // Note row verification
  const noteRow = rows[2];
  assert(noteRow);
  assertEquals(noteRow[0], "");
  assertEquals(noteRow[1], "0");
  assertEquals(noteRow[2], "note");
  assertEquals(noteRow[3], "Note Name");
  assertEquals(noteRow[4], "Note Content");
  assertEquals(noteRow[5], "");
  assertEquals(noteRow[6], "0");
  assertEquals(noteRow[7], "");
  assertEquals(noteRow[8], "");
  assertEquals(noteRow[9], "");
  assertEquals(noteRow[10], "");
  assertEquals(noteRow[11], "");
});

test("Export JSON - Validate JSON format, structure, and items", () => {
  const folders = [
    { id: asFolderId("folder_1"), name: "Công Việc" },
    { id: asFolderId("folder_2"), name: "Cá Nhân" },
  ];

  const items: VaultItem[] = [
    {
      id: asVaultItemId("item_1"),
      type: VaultItemType.Login,
      name: "GitHub Corp",
      notes: "Dev account",
      favorite: true,
      reprompt: 0,
      folderId: asFolderId("folder_1"),
      fields: [{ type: 0, name: "env", value: "prod" }],
      login: {
        username: "dev_user",
        password: "secret_password",
        totp: "TOTP_SECRET",
        uris: [{ uri: "https://github.com" }],
        fido2Credentials: [],
        passwordRevisionDate: null,
        passwordHistory: [],
      },
      creationDate: "2024-01-01T00:00:00Z",
      revisionDate: "2024-01-01T00:00:00Z",
    },
    {
      id: asVaultItemId("item_2"),
      type: VaultItemType.SecureNote,
      name: "Server Key Note",
      notes: "AAAA-BBBB-CCCC",
      favorite: false,
      reprompt: 0,
      folderId: asFolderId("folder_2"),
      fields: [],
      creationDate: "2024-01-01T00:00:00Z",
      revisionDate: "2024-01-01T00:00:00Z",
    },
  ];

  const exportResult = jsonExportStrategy.export(items, folders);
  assertEquals(exportResult.mimeType, "application/json");
  assert(exportResult.fileName.endsWith(".json"));

  const parsed = JSON.parse(exportResult.fileContent);
  assertEquals(parsed.encrypted, false);
  assertEquals(parsed.folders.length, 2);
  assertEquals(parsed.items.length, 2);

  assertEquals(parsed.folders[0].name, "Công Việc");
  assertEquals(parsed.items[0].name, "GitHub Corp");
  assertEquals(parsed.items[0].login.username, "dev_user");
  assertEquals(parsed.items[1].name, "Server Key Note");
  assertEquals(parsed.items[1].notes, "AAAA-BBBB-CCCC");
});
