// Regression test: t() must HTML-escape interpolation params (security fix).
// Attacker-controlled values (e.g. WebAuthn rp.name) must never inject markup
// into SafeHtml/DOMParser-rendered extension pages.
import { describe, expect, it } from "bun:test";
import { setLanguage, t } from "@gistwarden/domain";

describe("i18n security - param escaping", () => {
  it("escapes HTML in interpolation params", () => {
    setLanguage("en");
    const out = t("fido2_register_subtitle_new", {
      rp: `<img src=x onerror="alert(1)">`,
      user: "victim",
    });
    expect(out).not.toContain("<img");
    expect(out).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("keeps trusted template markup intact", () => {
    const out = t("fido2_register_subtitle_new", { rp: "example.com", user: "u" });
    expect(out).toContain("<strong>example.com</strong>");
  });

  it("escapes quotes and ampersands", () => {
    const out = t("fido2_assert_no_match", { rp: `a&b"c'd` });
    expect(out).toContain("a&amp;b&quot;c&#39;d");
  });
});
