let inMemoryDerivedKey: Uint8Array | null = null;

export function getSessionKeyInMemory(): Uint8Array | null {
  return inMemoryDerivedKey;
}

export function setSessionKeyInMemory(key: Uint8Array | null): void {
  inMemoryDerivedKey = key;
}

export function clearSessionKeyInMemory(): void {
  inMemoryDerivedKey = null;
}

export function isSessionKeyUnlocked(): boolean {
  return inMemoryDerivedKey !== null;
}

export const sessionManager = {
  getKey: getSessionKeyInMemory,
  setKey: setSessionKeyInMemory,
  clearKey: clearSessionKeyInMemory,
  isUnlocked: isSessionKeyUnlocked,
};
