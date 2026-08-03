import { assertEquals, test } from "./assert.ts";
import {
  exportToBitwardenCsv,
  exportToBrowserCsv,
} from "../packages/ui/src/features/sync/csv-export.ts";
import {
  CustomFieldType,
  type Folder,
  parseCSV,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";

test("Export CSV - Browser CSV format", async () => {
  const items: VaultItem[] = [
    {
      id: "1",
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
      creationDate: "",
      revisionDate: "",
    },
    {
      id: "2",
      type: VaultItemType.SecureNote,
      name: "My Note",
      notes: "note content",
      favorite: true,
      reprompt: 0,
      fields: [],
      creationDate: "",
      revisionDate: "",
    },
  ];

  const csv = await exportToBrowserCsv(items);
  const rows = await parseCSV(csv);
  assertEquals(rows.length, 2); // Header + 1 login row (note is ignored)
  assertEquals(rows[0], ["name", "url", "username", "password", "note"]);

  const loginRow = rows[1]!;
  assertEquals(loginRow[0], "Google, Inc.");
  assertEquals(loginRow[1], "https://google.com");
  assertEquals(loginRow[2], "user1");
  assertEquals(loginRow[3], 'password"123');
  assertEquals(loginRow[4], "Line1\nLine2");
});

test("Export CSV - Bitwarden CSV format", async () => {
  const items: VaultItem[] = [
    {
      id: "1",
      type: VaultItemType.Login,
      name: "Google",
      notes: "Note 1",
      favorite: true,
      reprompt: 0,
      fields: [
        { type: CustomFieldType.Text, name: "custom1", value: "value1" },
        { type: CustomFieldType.Text, name: "custom2", value: 'value"2' },
      ],
      creationDate: "2026-01-01T00:00:00Z",
      revisionDate: "2026-01-01T00:00:00Z",
      login: {
        username: "user1",
        password: "pass1",
        totp: "secret123",
        uris: [{ uri: "https://google.com", match: 1 }],
      },
      folderId: "1",
    },
    {
      id: "2",
      type: VaultItemType.SecureNote,
      name: "Note Name",
      notes: "Note Content",
      favorite: false,
      reprompt: 0,
      fields: [],
      creationDate: "2026-01-01T00:00:00Z",
      revisionDate: "2026-01-01T00:00:00Z",
      folderId: null,
    },
  ];

  const folders: Folder[] = [{ id: "1", name: "Folder 1" }];

  const csv = await exportToBitwardenCsv(items, folders);
  const rows = await parseCSV(csv);
  assertEquals(rows.length, 3); // Header + 2 items
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
  const loginRow = rows[1]!;
  assertEquals(loginRow[0], "Folder 1");
  assertEquals(loginRow[1], "1");
  assertEquals(loginRow[2], "login");
  assertEquals(loginRow[3], "Google");
  assertEquals(loginRow[4], "Note 1");
  assertEquals(loginRow[5], 'custom1:value1\ncustom2:value"2');
  assertEquals(loginRow[6], "0");
  assertEquals(loginRow[7], "");
  assertEquals(loginRow[8], "https://google.com");
  assertEquals(loginRow[9], "user1");
  assertEquals(loginRow[10], "pass1");
  assertEquals(loginRow[11], "secret123");

  // Note row verification
  const noteRow = rows[2]!;
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
