import { Hono } from "hono";
import type { AppContext } from "../types";

export const timeRouter = new Hono<AppContext>();

/**
 * GET /time
 * Used by GistWarden client to calculate clock drift/offset for TOTP generation
 */
timeRouter.get("/", (c) => {
  return c.json({
    unixtime: Math.floor(Date.now() / 1000),
    rfc2822: new Date().toUTCString(),
  });
});
