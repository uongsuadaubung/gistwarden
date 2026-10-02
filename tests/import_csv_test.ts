import {
  asFolderId,
  FieldType,
  isLoginItem,
  LoginLinkedId,
  parseCSV,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { bitwardenCsvImportStrategy } from "../packages/ui/src/features/sync/strategies/bitwarden-csv-import-strategy.ts";
import { browserCsvImportStrategy } from "../packages/ui/src/features/sync/strategies/browser-csv-import-strategy.ts";
import { jsonExportStrategy } from "../packages/ui/src/features/sync/strategies/json-export-strategy.ts";
import { jsonImportStrategy } from "../packages/ui/src/features/sync/strategies/json-import-strategy.ts";
import { assert, assertEquals, test } from "./assert.ts";

const parseAndValidateBrowserCsv = (
  csvString: string,
  existingItems: VaultItem[],
) => browserCsvImportStrategy.parseAndValidate(csvString, existingItems);
const parseAndValidateBitwardenCsv = (
  csvString: string,
  existingItems: VaultItem[],
  existingFolders: any[] = [],
) =>
  bitwardenCsvImportStrategy.parseAndValidate(
    csvString,
    existingItems,
    existingFolders,
  );

test("CSV Parser - RFC 4180 parsing", () => {
  // 1. Simple parsing
  const simpleCsv = `url,username,password\nhttps://google.com,manh,kien\nhttps://facebook.com,kien,manh`;
  const parsedSimple = parseCSV(simpleCsv);
  assertEquals(parsedSimple.length, 3);
  assertEquals(parsedSimple[0], ["url", "username", "password"]);
  assertEquals(parsedSimple[1], ["https://google.com", "manh", "kien"]);
  assertEquals(parsedSimple[2], ["https://facebook.com", "kien", "manh"]);

  // 2. Quoted fields and commas inside quotes
  const quotedCsv = `"url","username","password","note"\n"https://google.com","manh","kien","some, note with, commas"\n"https://facebook.com","kien","manh",""`;
  const parsedQuoted = parseCSV(quotedCsv);
  assertEquals(parsedQuoted.length, 3);
  assert(parsedQuoted[1]);
  assert(parsedQuoted[2]);
  assertEquals(parsedQuoted[1][3], "some, note with, commas");
  assertEquals(parsedQuoted[2][3], "");

  // 3. Escaped quotes inside quotes
  const escapedQuotesCsv = `name,note\n"Edge","this is a ""special"" note"`;
  const parsedEscaped = parseCSV(escapedQuotesCsv);
  assertEquals(parsedEscaped.length, 2);
  assert(parsedEscaped[1]);
  assertEquals(parsedEscaped[1][1], 'this is a "special" note');
});

test("CSV Import - Parse different password manager exports", () => {
  const existingItems: VaultItem[] = [];

  // 1. Firefox CSV format
  const firefoxCsv = `url,username,password,httpRealm,formActionOrigin,guid
"https://facebook.com/login","kien","manh",,,"{123}"
"android://9a36@chrome/","9a36","secret",,,"{456}"`;

  const resFirefox = parseAndValidateBrowserCsv(firefoxCsv, existingItems);
  assertEquals(resFirefox.isOk(), true);
  if (resFirefox.isOk()) {
    const val = resFirefox.value;
    assertEquals(val.importedCount, 2);
    const item1 = val.combinedItems[0];
    const item2 = val.combinedItems[1];
    assert(item1);
    assert(item2);
    if (isLoginItem(item1) && isLoginItem(item2)) {
      assertEquals(item1.name, "facebook.com"); // Domain name extracted
      assertEquals(item1.login.username, "kien");
      assertEquals(item1.login.password, "manh");
      assertEquals(item1.login.uris?.[0]?.uri, "https://facebook.com/login");

      assertEquals(item2.name, "chrome"); // Chrome-like uri parsed
      assertEquals(item2.login.username, "9a36");
    } else {
      throw new Error("Expected item1 and item2 to be of Login type");
    }
  }

  // 2. Chrome / Edge CSV format
  const chromeCsv = `name,url,username,password,note
"Facebook","https://facebook.com","kien","manh","some notes"`;

  const resChrome = parseAndValidateBrowserCsv(chromeCsv, existingItems);
  assertEquals(resChrome.isOk(), true);
  if (resChrome.isOk()) {
    const val = resChrome.value;
    assertEquals(val.importedCount, 1);
    const item1 = val.combinedItems[0];
    assert(item1);
    if (isLoginItem(item1)) {
      assertEquals(item1.name, "Facebook");
      assertEquals(item1.login.username, "kien");
      assertEquals(item1.login.password, "manh");
      assertEquals(item1.notes, "some notes");
    } else {
      throw new Error("Expected item1 to be of Login type");
    }
  }

  // 3. Bitwarden CSV format
  const bitwardenCsv = `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
"Social",1,"login","Facebook","Notes","pin: 1234",0,"https://facebook.com","uongsuadaubung","12345","TOTPSECRET"`;

  const resBw = parseAndValidateBitwardenCsv(bitwardenCsv, existingItems);
  assertEquals(resBw.isOk(), true);
  if (resBw.isOk()) {
    const val = resBw.value;
    // Login item
    const item1 = val.combinedItems[0];
    assert(item1);
    if (isLoginItem(item1)) {
      assertEquals(item1.name, "Facebook");
      assertEquals(item1.favorite, true);
      assertEquals(item1.login.username, "uongsuadaubung");
      assertEquals(item1.login.password, "12345");
    }
  }
});

test("JSON Import - Parse valid JSON export and combine with existing vault items", () => {
  const existingFolders = [{ id: asFolderId("f1"), name: "Công Việc" }];
  const existingItems: VaultItem[] = [];

  const validJsonPayload = JSON.stringify({
    encrypted: false,
    folders: [{ id: "f2", name: "Cá Nhân" }],
    items: [
      {
        id: "item_new_1",
        type: VaultItemType.Login,
        name: "Twitter Corp",
        notes: "Account twitter",
        favorite: true,
        reprompt: 0,
        login: {
          username: "twitter_user",
          password: "twitter_password",
          uris: [{ uri: "https://twitter.com" }],
        },
      },
      {
        id: "item_new_2",
        type: VaultItemType.SecureNote,
        name: "Private Note Import",
        notes: "Private Note Content",
        favorite: false,
        reprompt: 0,
      },
    ],
  });

  const importRes = jsonImportStrategy.parseAndValidate(
    validJsonPayload,
    existingItems,
    existingFolders,
  );
  assert(importRes.isOk(), "Valid JSON import should succeed");

  if (importRes.isOk()) {
    const val = importRes.value;
    assertEquals(val.importedCount, 2);
    assertEquals(val.combinedItems.length, 2);
    assertEquals(val.combinedFolders.length, 2);
    assertEquals(val.combinedItems[0]?.name, "Twitter Corp");
    assertEquals(val.combinedItems[1]?.name, "Private Note Import");
  }
});

test("Import Failure - Return safe error for malformed/corrupted CSV & JSON", () => {
  const existingItems: VaultItem[] = [];

  // 1. Malformed JSON string
  const malformedJson = "{ invalid json syntax, missing quotes }";
  const jsonRes = jsonImportStrategy.parseAndValidate(
    malformedJson,
    existingItems,
  );
  assert(jsonRes.isErr(), "Malformed JSON should return error");
  assertEquals(jsonRes.error, "vault_import_error_invalid");

  // 2. JSON without items array
  const noItemsJson = JSON.stringify({ encrypted: false, foo: "bar" });
  const noItemsRes = jsonImportStrategy.parseAndValidate(
    noItemsJson,
    existingItems,
  );
  assert(noItemsRes.isErr(), "JSON without items array should return error");
  assertEquals(noItemsRes.error, "vault_import_error_invalid");
});

test("Bitwarden JSON Custom Fields - Import & Export with Linked, Checkbox, Text, Hidden", () => {
  const bitwardenJson = JSON.stringify({
    encrypted: false,
    folders: [],
    items: [
      {
        id: "bw_item_1",
        type: VaultItemType.Login,
        name: "Test Bitwarden Fields",
        notes: "",
        favorite: false,
        fields: [
          {
            type: FieldType.Text,
            name: "text_field",
            value: "text_val",
          },
          {
            type: FieldType.Hidden,
            name: "hidden_field",
            value: "hidden_secret",
          },
          {
            type: FieldType.Boolean,
            name: "checkbox_field",
            value: "true",
          },
          {
            type: FieldType.Linked,
            name: "linked_user",
            linkedId: LoginLinkedId.Username,
          },
          {
            type: FieldType.Linked,
            name: "linked_pass",
            linkedId: LoginLinkedId.Password,
          },
          {
            type: FieldType.Linked,
            name: "linked_2fa",
            linkedId: LoginLinkedId.Totp,
          },
        ],
        login: {
          username: "my_user",
          password: "my_password",
          totp: "JBSWY3DPEHPK3PXP",
          uris: [{ uri: "https://example.com" }],
        },
      },
    ],
  });

  const importRes = jsonImportStrategy.parseAndValidate(bitwardenJson, []);
  assert(
    importRes.isOk(),
    "Bitwarden custom fields JSON should import successfully",
  );

  if (importRes.isOk()) {
    const importedItem = importRes.value.combinedItems[0];
    assert(importedItem !== undefined, "Item should exist");
    assertEquals(importedItem?.fields.length, 6);

    assertEquals(importedItem?.fields[0]?.type, FieldType.Text);
    assertEquals(importedItem?.fields[0]?.name, "text_field");
    assertEquals(importedItem?.fields[0]?.value, "text_val");

    assertEquals(importedItem?.fields[1]?.type, FieldType.Hidden);
    assertEquals(importedItem?.fields[1]?.name, "hidden_field");
    assertEquals(importedItem?.fields[1]?.value, "hidden_secret");

    assertEquals(importedItem?.fields[2]?.type, FieldType.Boolean);
    assertEquals(importedItem?.fields[2]?.name, "checkbox_field");
    assertEquals(importedItem?.fields[2]?.value, "true");

    assertEquals(importedItem?.fields[3]?.type, FieldType.Linked);
    assertEquals(importedItem?.fields[3]?.name, "linked_user");
    assertEquals(importedItem?.fields[3]?.value, "username");
    assertEquals(importedItem?.fields[3]?.linkedId, LoginLinkedId.Username);

    assertEquals(importedItem?.fields[4]?.type, FieldType.Linked);
    assertEquals(importedItem?.fields[4]?.name, "linked_pass");
    assertEquals(importedItem?.fields[4]?.value, "password");
    assertEquals(importedItem?.fields[4]?.linkedId, LoginLinkedId.Password);

    assertEquals(importedItem?.fields[5]?.type, FieldType.Linked);
    assertEquals(importedItem?.fields[5]?.name, "linked_2fa");
    assertEquals(importedItem?.fields[5]?.value, "totp");
    assertEquals(importedItem?.fields[5]?.linkedId, LoginLinkedId.Totp);

    // Test Export
    const exportRes = jsonExportStrategy.export(
      importRes.value.combinedItems,
      [],
    );
    const exportedObj = JSON.parse(exportRes.fileContent);
    const exportedFields = exportedObj.items[0].fields;

    assertEquals(exportedFields.length, 6);
    assertEquals(exportedFields[0], {
      type: FieldType.Text,
      name: "text_field",
      value: "text_val",
      linkedId: null,
    });
    assertEquals(exportedFields[1], {
      type: FieldType.Hidden,
      name: "hidden_field",
      value: "hidden_secret",
      linkedId: null,
    });
    assertEquals(exportedFields[2], {
      type: FieldType.Boolean,
      name: "checkbox_field",
      value: "true",
      linkedId: null,
    });
    assertEquals(exportedFields[3], {
      type: FieldType.Linked,
      name: "linked_user",
      value: null,
      linkedId: LoginLinkedId.Username,
    });
    assertEquals(exportedFields[4], {
      type: FieldType.Linked,
      name: "linked_pass",
      value: null,
      linkedId: LoginLinkedId.Password,
    });
    assertEquals(exportedFields[5], {
      type: FieldType.Linked,
      name: "linked_2fa",
      value: null,
      linkedId: LoginLinkedId.Totp,
    });
  }
});
