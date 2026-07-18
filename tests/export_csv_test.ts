import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  exportToBitwardenCsv,
  exportToBrowserCsv,
} from "@/shared/import-export.ts";
import { parseCSV } from "@/shared/csv-parser.ts";
import { type VaultItem, VaultItemType } from "@/shared/types.ts";

Deno.test("Export CSV - Browser CSV format", () => {
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

  const csv = exportToBrowserCsv(items);
  const rows = parseCSV(csv);
  assertEquals(rows.length, 2); // Header + 1 login row (note is ignored)
  assertEquals(rows[0], ["name", "url", "username", "password", "note"]);

  const loginRow = rows[1];
  assertEquals(loginRow[0], "Google, Inc.");
  assertEquals(loginRow[1], "https://google.com");
  assertEquals(loginRow[2], "user1");
  assertEquals(loginRow[3], 'password"123');
  assertEquals(loginRow[4], "Line1\nLine2");
});

Deno.test("Export CSV - Bitwarden CSV format", () => {
  const items: VaultItem[] = [
    {
      id: "1",
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
      creationDate: "",
      revisionDate: "",
    },
    {
      id: "2",
      type: VaultItemType.SecureNote,
      name: "Note Name",
      notes: "Note Content",
      favorite: false,
      reprompt: 0,
      fields: [],
      creationDate: "",
      revisionDate: "",
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
    "login_uri",
    "login_username",
    "login_password",
    "login_totp",
  ]);

  // Login row verification
  const loginRow = rows[1];
  assertEquals(loginRow[0], "");
  assertEquals(loginRow[1], "1");
  assertEquals(loginRow[2], "login");
  assertEquals(loginRow[3], "Google");
  assertEquals(loginRow[4], "Note 1");
  assertEquals(loginRow[5], 'custom1:value1\ncustom2:value"2');
  assertEquals(loginRow[6], "1");
  assertEquals(loginRow[7], "https://google.com");
  assertEquals(loginRow[8], "user1");
  assertEquals(loginRow[9], "pass1");
  assertEquals(loginRow[10], "secret123");

  // Note row verification
  const noteRow = rows[2];
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
});
