import { describe, expect, it } from "bun:test";
import { isValidOauthRedirectUrl } from "../apps/worker/src/routes/oauth.ts";

describe("OAuth Security - Open Redirect Protection", () => {
  it("allows valid Chrome extension WebAuthFlow URLs", () => {
    expect(
      isValidOauthRedirectUrl(
        "https://abcdefghijklmnop.chromiumapp.org/oauth2",
      ),
    ).toBe(true);
    expect(isValidOauthRedirectUrl("https://myapp123.chromiumapp.org/")).toBe(
      true,
    );
  });

  it("allows valid Firefox extension WebAuthFlow URLs", () => {
    expect(
      isValidOauthRedirectUrl(
        "https://12345678-abcd-ef01-2345-6789abcdef01.extensions.allizom.org/",
      ),
    ).toBe(true);
  });

  it("allows localhost for local development", () => {
    expect(
      isValidOauthRedirectUrl("http://localhost:8787/oauth/callback"),
    ).toBe(true);
    expect(isValidOauthRedirectUrl("http://127.0.0.1:3000/callback")).toBe(
      true,
    );
  });

  it("allows official GitHub Pages Web App", () => {
    expect(
      isValidOauthRedirectUrl("https://uongsuadaubung.github.io/gistwarden/"),
    ).toBe(true);
  });

  it("blocks arbitrary external websites from receiving OAuth tokens", () => {
    expect(isValidOauthRedirectUrl("https://evil.com/steal-token")).toBe(false);
    expect(isValidOauthRedirectUrl("https://attacker.org")).toBe(false);
    expect(isValidOauthRedirectUrl("https://google.com/search")).toBe(false);
    expect(isValidOauthRedirectUrl("https://fakechromiumapp.org")).toBe(false);
    expect(isValidOauthRedirectUrl("https://chromiumapp.org.evil.com")).toBe(
      false,
    );
  });

  it("blocks non-http/https protocols", () => {
    expect(isValidOauthRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(
      isValidOauthRedirectUrl("data:text/html,<script>alert(1)</script>"),
    ).toBe(false);
    expect(isValidOauthRedirectUrl("")).toBe(false);
  });
});
