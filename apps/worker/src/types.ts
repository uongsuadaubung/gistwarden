/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare D1 Database types fallback
 * Ensures zero TypeScript compilation errors whether @cloudflare/workers-types is installed or not.
 */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump?(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
  exec?(query: string): Promise<unknown>;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export interface AuthUser {
  userId: string;
  username: string;
}

export interface AppContext {
  Bindings: Env;
  Variables: {
    user?: AuthUser;
  };
}

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
  updated_at: string;
}

export interface VaultRow {
  user_id: string;
  salt: string;
  iv: string;
  ciphertext: string;
  updated_at: string;
}
