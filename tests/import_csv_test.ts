import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseCSV } from "@/core/csv-parser.ts";
import {
  parseAndValidateBitwardenCsv,
  parseAndValidateBrowserCsv,
} from "@/features/sync/csv-import.ts";
import { type VaultItem, VaultItemType } from "@/core/types.ts";

Deno.test("CSV Parser - RFC 4180 parsing", () => {
  // 1. Simple parsing
  const simpleCsv =
    `url,username,password\nhttps://google.com,manh,kien\nhttps://facebook.com,kien,manh`;
  const parsedSimple = parseCSV(simpleCsv);
  assertEquals(parsedSimple.length, 3);
  assertEquals(parsedSimple[0], ["url", "username", "password"]);
  assertEquals(parsedSimple[1], ["https://google.com", "manh", "kien"]);
  assertEquals(parsedSimple[2], ["https://facebook.com", "kien", "manh"]);

  // 2. Quoted fields and commas inside quotes
  const quotedCsv =
    `"url","username","password","note"\n"https://google.com","manh","kien","some, note with, commas"\n"https://facebook.com","kien","manh",""`;
  const parsedQuoted = parseCSV(quotedCsv);
  assertEquals(parsedQuoted.length, 3);
  assertEquals(parsedQuoted[1][3], "some, note with, commas");
  assertEquals(parsedQuoted[2][3], "");

  // 3. Escaped quotes inside quotes
  const escapedQuotesCsv = `name,note\n"Edge","this is a ""special"" note"`;
  const parsedEscaped = parseCSV(escapedQuotesCsv);
  assertEquals(parsedEscaped.length, 2);
  assertEquals(parsedEscaped[1][1], 'this is a "special" note');

  // 4. Multiline notes
  const multilineCsv = `name,note\n"JetBrains","line1\nline2\nline3"`;
  const parsedMultiline = parseCSV(multilineCsv);
  assertEquals(parsedMultiline.length, 2);
  assertEquals(parsedMultiline[1][1], "line1\nline2\nline3");
});

Deno.test("Browser CSV import mapping & validation", () => {
  const existingItems: VaultItem[] = [];

  // 1. Firefox CSV format
  const firefoxCsv =
    `"url","username","password","httpRealm","formActionOrigin","guid"\n"https://facebook.com/login","kien","manh",,"","{guid-123}"\n"chrome://FirefoxAccounts","9a36","{""key"":""val""}",,,`;
  const resFirefox = parseAndValidateBrowserCsv(firefoxCsv, existingItems);
  assertEquals(resFirefox.isOk(), true);
  if (resFirefox.isOk()) {
    const val = resFirefox.value;
    assertEquals(val.importedCount, 2);
    const item1 = val.combinedItems[0];
    const item2 = val.combinedItems[1];
    if (
      item1.type === VaultItemType.Login && item2.type === VaultItemType.Login
    ) {
      assertEquals(item1.name, "facebook.com"); // Domain name extracted
      assertEquals(item1.login.username, "kien");
      assertEquals(item1.login.password, "manh");
      assertEquals(item1.login.uris?.[0]?.uri, "https://facebook.com/login");

      assertEquals(item2.name, "FirefoxAccounts"); // Chrome-like uri parsed
      assertEquals(item2.login.username, "9a36");
    } else {
      throw new Error("Expected item1 and item2 to be of Login type");
    }
  }

  // 2. Chrome / Edge CSV format
  const chromeCsv =
    `name,url,username,password,note\nfacebook.com,https://facebook.com/,kien,manh,my note\ngoogle.com,https://google.com/,manh,kien,`;
  const resChrome = parseAndValidateBrowserCsv(chromeCsv, existingItems);
  assertEquals(resChrome.isOk(), true);
  if (resChrome.isOk()) {
    const val = resChrome.value;
    assertEquals(val.importedCount, 2);
    const item1 = val.combinedItems[0];
    if (item1.type === VaultItemType.Login) {
      assertEquals(item1.name, "facebook.com");
      assertEquals(item1.notes, "my note");
      assertEquals(item1.login.username, "kien");
      assertEquals(item1.login.password, "manh");
    } else {
      throw new Error("Expected item1 to be of Login type");
    }
  }

  // 3. Missing mandatory columns
  const invalidCsv = `name,username,password\ngoogle.com,manh,kien`;
  const resInvalid = parseAndValidateBrowserCsv(invalidCsv, existingItems);
  assertEquals(resInvalid.isErr(), true);
  if (resInvalid.isErr()) {
    assertEquals(resInvalid.error, "import_error_browser_invalid");
  }
});

Deno.test("Bitwarden CSV import mapping & validation", () => {
  const existingItems: VaultItem[] = [];

  const bitwardenCsv =
    `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp\n,1,login,127.0.0.1,,"field1:value1\nfield2:value2",1,http://127.0.0.1:8000/admin,uongsuadaubung,12345,\n,,note,My Secure Note,some note contents,"pin:4321",0,,,,,`;
  const resBw = parseAndValidateBitwardenCsv(bitwardenCsv, existingItems);
  assertEquals(resBw.isOk(), true);
  if (resBw.isOk()) {
    const val = resBw.value;
    assertEquals(val.importedCount, 2);

    // Login item
    const item1 = val.combinedItems[0];
    const item2 = val.combinedItems[1];
    if (
      item1.type === VaultItemType.Login &&
      item2.type === VaultItemType.SecureNote
    ) {
      assertEquals(item1.name, "127.0.0.1");
      assertEquals(item1.favorite, true);
      assertEquals(item1.reprompt, 1);
      assertEquals(item1.login.username, "uongsuadaubung");
      assertEquals(item1.login.password, "12345");
      assertEquals(item1.fields.length, 2);
      assertEquals(item1.fields[0].name, "field1");
      assertEquals(item1.fields[0].value, "value1");
      assertEquals(item1.fields[1].name, "field2");
      assertEquals(item1.fields[1].value, "value2");

      // Secure Note item
      assertEquals(item2.name, "My Secure Note");
      assertEquals(item2.notes, "some note contents");
      assertEquals(item2.favorite, false);
      assertEquals(item2.reprompt, 0);
      assertEquals(item2.fields.length, 1);
      assertEquals(item2.fields[0].name, "pin");
      assertEquals(item2.fields[0].value, "4321");
    } else {
      throw new Error("Expected item1 to be Login and item2 to be SecureNote");
    }
  }

  // Invalid headers
  const invalidBwCsv = `folder,favorite,name,notes\n,,My Note,some note`;
  const resBwInvalid = parseAndValidateBitwardenCsv(
    invalidBwCsv,
    existingItems,
  );
  assertEquals(resBwInvalid.isErr(), true);
});
