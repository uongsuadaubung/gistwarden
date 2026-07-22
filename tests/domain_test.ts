import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getBaseDomain, getHostname } from "@/core/domain-utils.ts";

Deno.test("Domain Utils - getHostname", () => {
  assertEquals(
    getHostname("https://auth.github.com/login?foo=bar"),
    "auth.github.com",
  );
  assertEquals(
    getHostname("http://www.google.com.vn:8080/search"),
    "google.com.vn",
  );
  assertEquals(getHostname("localhost:3000"), "localhost");
  assertEquals(getHostname("http://127.0.0.1:8080/api"), "127.0.0.1");
});

Deno.test("Domain Utils - getBaseDomain via tldts Public Suffix List", () => {
  assertEquals(getBaseDomain("auth.github.com"), "github.com");
  assertEquals(
    getBaseDomain("https://sub.google.com.vn/path"),
    "google.com.vn",
  );
  assertEquals(getBaseDomain("google.com.vn"), "google.com.vn");
  assertEquals(getBaseDomain("school.sub.k12.wa.us"), "sub.k12.wa.us");
  assertEquals(getBaseDomain("sub.github.io"), "github.io");
  assertEquals(getBaseDomain("localhost"), "localhost");
  assertEquals(getBaseDomain("http://127.0.0.1:8080"), "127.0.0.1");
  assertEquals(getBaseDomain(""), "");
});
