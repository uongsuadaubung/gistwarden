import { expect, test as bunTest } from "bun:test";

export function assert(value: unknown, msg?: string): asserts value {
  if (!value) {
    throw new Error(msg || `Expected truthy value, got ${String(value)}`);
  }
}

export function assertEquals(
  actual: unknown,
  expected: unknown,
  _msg?: string,
): void {
  expect(actual).toEqual(expected);
}

export function assertNotEquals(
  actual: unknown,
  expected: unknown,
  _msg?: string,
): void {
  expect(actual).not.toEqual(expected);
}

export function assertMatch(
  actual: string,
  regexp: RegExp,
  _msg?: string,
): void {
  expect(regexp.test(actual)).toBe(true);
}

export async function assertRejects(
  fn: () => Promise<unknown>,
  _errorClass?: unknown,
  _msgIncludes?: string,
): Promise<void> {
  let threw = false;
  try {
    await fn();
  } catch (_e) {
    threw = true;
  }
  if (!threw) {
    throw new Error("Expected function to reject, but it resolved.");
  }
}

export function test(
  name: string | { name: string },
  fn: () => void | Promise<void>,
): void {
  const testName = typeof name === "string" ? name : name.name;
  bunTest(testName, fn);
}
