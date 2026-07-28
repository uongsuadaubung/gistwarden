let inMemoryDerivedKey: CryptoKey | null = null;

export function getSessionKeyInMemory(): CryptoKey | null {
  return inMemoryDerivedKey;
}

export function setSessionKeyInMemory(key: CryptoKey | null): void {
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
