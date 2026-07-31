import { createSignal } from "solid-js";

export function createSessionStorageSignal<T>(
  key: string,
  defaultValue: T,
  serialize: (val: T) => string,
  deserialize: (raw: string) => T,
): [get: () => T, set: (val: T) => void] {
  const stored = sessionStorage.getItem(key);
  const initial = stored !== null ? deserialize(stored) : defaultValue;
  const [signal, setSignal] = createSignal<T>(initial);

  const setSessionSignal = (val: T) => {
    setSignal(() => val);
    sessionStorage.setItem(key, serialize(val));
  };

  return [signal, setSessionSignal];
}

export function createSessionSignal(
  key: string,
  defaultValue: string,
): [get: () => string, set: (val: string) => void];
export function createSessionSignal(
  key: string,
  defaultValue: boolean,
): [get: () => boolean, set: (val: boolean) => void];
export function createSessionSignal(
  key: string,
  defaultValue: string | boolean,
) {
  if (typeof defaultValue === "boolean") {
    return createSessionStorageSignal<boolean>(
      key,
      defaultValue,
      String,
      (raw) => raw === "true",
    );
  }
  return createSessionStorageSignal<string>(
    key,
    defaultValue,
    String,
    (raw) => raw,
  );
}
