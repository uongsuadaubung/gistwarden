import { z } from "zod";
import {
  APP_NAME,
  safeJsonParse,
  safeParseUrl,
  type TranslationKey,
} from "@gistwarden/domain";
import { err, ok, Result } from "neverthrow";
import { fetchText } from "./fetch-utils.ts";
import type { SyncOptions, SyncResult } from "./sync-provider-types.ts";

const GITHUB_API_BASE = "https://api.github.com";

const GIST_DESCRIPTION = `${APP_NAME.toLowerCase()}_vault`;
const GIST_FILE_NAME = `${APP_NAME.toLowerCase()}.json`;

const GithubUserSchema = z.object({
  login: z.string(),
  avatar_url: z.string(),
});

const GistFileSchema = z.object({
  content: z.string().optional(),
  raw_url: z.string(),
});

const GistSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  updated_at: z.string(),
  files: z.record(z.string(), GistFileSchema),
});

const GistArraySchema = z.array(GistSchema);

export type GistType = z.infer<typeof GistSchema>;

async function githubRequest(
  path: string,
  options: RequestInit = {},
  authToken?: string,
): Promise<Result<unknown, TranslationKey>> {
  if (!authToken) return err("github_error_missing_token");

  const res = await fetchText(`${GITHUB_API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Authorization": `token ${authToken}`,
      "Accept": "application/vnd.github.v3+json",
      ...(options.headers || {}),
    },
  });

  if (res.isErr()) {
    return err(res.error);
  }

  const text = res.value;
  if (!text.trim()) {
    return ok(null);
  }

  return safeJsonParse(text);
}

export async function validateToken(
  token: string,
): Promise<Result<{ username: string; avatarUrl: string }, TranslationKey>> {
  const fetchRes = await fetchText(`${GITHUB_API_BASE}/user`, {
    cache: "no-store",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (fetchRes.isErr()) {
    return err("login_error_invalid_token");
  }

  const parseRes = safeJsonParse(fetchRes.value);
  if (parseRes.isErr()) {
    return err("github_error_user_parse_failed");
  }

  const parsed = GithubUserSchema.safeParse(parseRes.value);
  if (!parsed.success) {
    return err("github_error_user_parse_failed");
  }

  return ok({
    username: parsed.data.login,
    avatarUrl: parsed.data.avatar_url,
  });
}

export async function findGistId(
  token: string,
): Promise<Result<string, TranslationKey>> {
  const reqRes = await githubRequest("/gists", {}, token);
  if (reqRes.isErr()) {
    return err(reqRes.error);
  }
  const parsed = GistArraySchema.safeParse(reqRes.value);
  if (!parsed.success) {
    return err("github_error_gist_parse_failed");
  }
  const target = parsed.data.find(
    (g) => g.description === GIST_DESCRIPTION && GIST_FILE_NAME in g.files,
  );
  return ok(target ? target.id : "");
}

export async function createGist(
  content: string,
  token: string,
): Promise<Result<GistType, TranslationKey>> {
  const reqRes = await githubRequest(
    "/gists",
    {
      method: "POST",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: {
          [GIST_FILE_NAME]: {
            content,
          },
        },
      }),
    },
    token,
  );
  if (reqRes.isErr()) {
    return err(reqRes.error);
  }
  const parsed = GistSchema.safeParse(reqRes.value);
  if (!parsed.success) {
    return err("github_error_create_gist_failed");
  }
  return ok(parsed.data);
}

export async function updateGist(
  gistId: string,
  content: string,
  token: string,
): Promise<Result<unknown, TranslationKey>> {
  return await githubRequest(
    `/gists/${gistId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        files: {
          [GIST_FILE_NAME]: {
            content,
          },
        },
      }),
    },
    token,
  );
}

export async function uploadToGist(
  content: string,
  apiOpts?: SyncOptions,
): Promise<Result<SyncResult, TranslationKey>> {
  const token = apiOpts?.token;
  if (!token) return err("github_error_missing_token");

  let gistId = apiOpts?.gistId;

  if (!gistId) {
    const findRes = await findGistId(token);
    if (findRes.isErr()) {
      return err(findRes.error);
    }
    gistId = findRes.value;
  }

  if (gistId) {
    const updateRes = await updateGist(gistId, content, token);
    if (updateRes.isErr()) {
      return err(updateRes.error);
    }
  } else {
    const createRes = await createGist(content, token);
    if (createRes.isErr()) {
      return err(createRes.error);
    }
    gistId = createRes.value.id;
  }

  return ok({ gistId });
}

export async function getGist(
  gistId: string,
  token?: string,
): Promise<Result<string, TranslationKey>> {
  if (!gistId) return err("github_error_missing_gist_id");

  const reqRes = await githubRequest(`/gists/${gistId}`, {}, token);
  if (reqRes.isErr()) {
    return err(reqRes.error);
  }

  const parsed = GistSchema.safeParse(reqRes.value);
  if (!parsed.success) {
    return err("github_error_gist_parse_failed");
  }

  const file = parsed.data.files[GIST_FILE_NAME];
  if (!file) {
    return err("github_error_gist_file_missing");
  }

  if (file.content) {
    return ok(file.content);
  }

  if (file.raw_url) {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }
    const rawRes = await fetchText(file.raw_url, {
      cache: "no-store",
      headers,
    });
    if (rawRes.isOk() && rawRes.value.trim()) {
      return ok(rawRes.value);
    }
  }

  return err("github_error_gist_file_missing");
}

/**
 * Tải trực tiếp dữ liệu từ Raw Gist CDN URL với Token xác thực.
 * Giúp tối ưu tốc độ và không tiêu tốn giới hạn Rate Limit REST API (5000 lượt/giờ).
 */
export async function downloadFromGistPublic(
  gistId: string,
  username?: string,
  token?: string,
): Promise<Result<string, TranslationKey>> {
  if (!gistId) return err("github_error_missing_gist_id");

  const cacheBuster = `_t=${Date.now()}`;

  // Định dạng CDN URL chuẩn của GitHub: https://gist.githubusercontent.com/{username}/{gistId}/raw/gistwarden-vault.json
  const rawCdnUrl = username
    ? `https://gist.githubusercontent.com/${username}/${gistId}/raw/${GIST_FILE_NAME}?${cacheBuster}`
    : `https://gist.githubusercontent.com/raw/${gistId}/${GIST_FILE_NAME}?${cacheBuster}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const rawRes = await fetchText(rawCdnUrl, {
    cache: "no-store",
    headers,
  });

  if (rawRes.isErr() || !rawRes.value.trim()) {
    return err("github_error_gist_file_missing");
  }

  return ok(rawRes.value);
}

export async function downloadFromGist(
  apiOpts?: SyncOptions,
): Promise<Result<SyncResult, TranslationKey>> {
  const token = apiOpts?.token;
  let gistId = apiOpts?.gistId || "";
  const username = apiOpts?.username || "";

  // 1. Nếu đã có gistId -> Thử tải qua Raw Gist CDN URL trước
  if (gistId) {
    const publicRes = await downloadFromGistPublic(gistId, username, token);
    if (publicRes.isOk()) {
      return ok({ content: publicRes.value, gistId });
    }

    // Nếu CDN thất bại, thử dùng REST API với gistId hiện tại
    const getRes = await getGist(gistId, token);
    if (getRes.isOk()) {
      return ok({ content: getRes.value, gistId });
    }
  }

  // 2. Nếu chưa có gistId hoặc gistId cũ bị xóa -> Tìm Gist ID mới qua REST API
  if (!token) {
    return err("github_error_missing_token");
  }

  const findRes = await findGistId(token);
  if (findRes.isErr()) {
    return err(findRes.error);
  }
  gistId = findRes.value;
  if (!gistId) {
    return err("github_error_gist_not_found");
  }

  const downloadRes = await getGist(gistId, token);
  if (downloadRes.isOk()) {
    return ok({ content: downloadRes.value, gistId });
  }
  return err(downloadRes.error);
}

export async function deleteGist(
  gistId: string,
  token?: string,
): Promise<Result<void, TranslationKey>> {
  const reqRes = await githubRequest(
    `/gists/${gistId}`,
    {
      method: "DELETE",
    },
    token,
  );
  if (reqRes.isErr()) {
    return err(reqRes.error);
  }
  return ok();
}

/**
 * Launch WebAuthFlow for GitHub OAuth and extract the access token from the redirect URL.
 */
export function launchGithubOauthFlow(
  clientId: string,
): Promise<Result<string, TranslationKey>> {
  return new Promise((resolve) => {
    if (
      typeof chrome === "undefined" ||
      !chrome.identity ||
      !chrome.identity.launchWebAuthFlow
    ) {
      resolve(err("login_error_oauth_fail"));
      return;
    }

    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=gist&state=${
        encodeURIComponent(redirectUri)
      }`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          resolve(err("login_error_oauth_fail"));
          return;
        }

        const urlRes = safeParseUrl(redirectUrl);
        if (urlRes.isErr()) {
          resolve(err("login_error_oauth_fail"));
          return;
        }

        const token = urlRes.value.searchParams.get("token");
        if (!token) {
          resolve(err("login_error_oauth_no_token"));
          return;
        }

        resolve(ok(token));
      },
    );
  });
}
