import { assertEquals, test } from "./assert.ts";
import { isLoginItem, parseCSV, type VaultItem } from "@gistwarden/domain";
import {
  parseAndValidateBitwardenCsv,
  parseAndValidateBrowserCsv,
} from "../packages/ui/src/features/sync/csv-import.ts";

test("CSV Parser - RFC 4180 parsing", () => {
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
  assertEquals(parsedQuoted[1]![3], "some, note with, commas");
  assertEquals(parsedQuoted[2]![3], "");

  // 3. Escaped quotes inside quotes
  const escapedQuotesCsv = `name,note\n"Edge","this is a ""special"" note"`;
  const parsedEscaped = parseCSV(escapedQuotesCsv);
  assertEquals(parsedEscaped.length, 2);
  assertEquals(parsedEscaped[1]![1], 'this is a "special" note');
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
    const item1 = val.combinedItems[0]!;
    const item2 = val.combinedItems[1]!;
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
    const item1 = val.combinedItems[0]!;
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
  const bitwardenCsv =
    `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
"Social",1,"login","Facebook","Notes","pin: 1234",0,"https://facebook.com","uongsuadaubung","12345","TOTPSECRET"`;

  const resBw = parseAndValidateBitwardenCsv(bitwardenCsv, existingItems);
  assertEquals(resBw.isOk(), true);
  if (resBw.isOk()) {
    const val = resBw.value;
    // Login item
    const item1 = val.combinedItems[0]!;
    if (isLoginItem(item1)) {
      assertEquals(item1.name, "Facebook");
      assertEquals(item1.favorite, true);
      assertEquals(item1.login.username, "uongsuadaubung");
      assertEquals(item1.login.password, "12345");
      assertEquals(item1.login.totp, "TOTPSECRET");
    } else {
      throw new Error("Expected item1 to be Login");
    }
  }
});
