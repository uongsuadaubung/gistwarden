import { z } from "zod";
import {
  getAccountSettings,
  getGithubToken,
  updateAccountSettings,
} from "@/core/storage.ts";
import { GithubUserSchema } from "@/core/storage-schemas.ts";
import { APP_NAME } from "@/core/constants.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { fetchText } from "@/core/fetch-utils.ts";
import { safeJsonParse } from "@/core/json-utils.ts";

const GITHUB_API_BASE = "https://api.github.com";

const GIST_DESCRIPTION = `${APP_NAME.toLowerCase()}_vault`;
const GIST_FILE_NAME = `${APP_NAME.toLowerCase()}.json`;

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
): Promise<Result<unknown, TranslationKey>> {
  const token = await getGithubToken();
  if (!token) return err("github_error_missing_token");

  const res = await fetchText(`${GITHUB_API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Authorization": `token ${token}`,
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

export async function findGistId(): Promise<Result<string, TranslationKey>> {
  const reqRes = await githubRequest("/gists");
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
): Promise<Result<GistType, TranslationKey>> {
  const reqRes = await githubRequest("/gists", {
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
  });
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
): Promise<Result<unknown, TranslationKey>> {
  return await githubRequest(`/gists/${gistId}`, {
    method: "PATCH",
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      files: {
        [GIST_FILE_NAME]: {
          content,
        },
      },
    }),
  });
}

export async function uploadToGist(
  content: string,
): Promise<Result<void, TranslationKey>> {
  const settingsRes = await getAccountSettings();
  if (settingsRes.isErr()) return err(settingsRes.error);
  let gistId = settingsRes.value.gistId;

  if (!gistId) {
    const findRes = await findGistId();
    if (findRes.isErr()) {
      return err(findRes.error);
    }
    gistId = findRes.value;
  }

  if (gistId) {
    const updateRes = await updateGist(gistId, content);
    if (updateRes.isErr()) {
      return err(updateRes.error);
    }
  } else {
    const createRes = await createGist(content);
    if (createRes.isErr()) {
      return err(createRes.error);
    }
    gistId = createRes.value.id;
  }

  const updateSettingsRes = await updateAccountSettings({
    gistId,
    lastSync: Date.now(),
  });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }
  return ok();
}

export async function downloadFromGist(): Promise<
  Result<string, TranslationKey>
> {
  const settingsRes = await getAccountSettings();
  let gistId = settingsRes.isOk() ? settingsRes.value.gistId : "";

  // 1. Nếu đã có gistId -> Tải trực tiếp qua Raw Gist CDN URL (Không tiêu tốn Rate Limit)
  if (gistId) {
    const publicRes = await downloadFromGistPublic(gistId);
    if (publicRes.isOk()) {
      await updateAccountSettings({ lastSync: Date.now() });
      return ok(publicRes.value);
    }
  }

  // 2. Nếu chưa có gistId -> Dùng API để tìm Gist ID trên GitHub
  const findRes = await findGistId();
  if (findRes.isErr()) {
    return err(findRes.error);
  }
  gistId = findRes.value;
  if (!gistId) {
    return err("github_error_gist_not_found");
  }

  const updateSettingsRes = await updateAccountSettings({ gistId });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }

  const downloadRes = await downloadFromGistPublic(gistId);
  if (downloadRes.isOk()) {
    await updateAccountSettings({ lastSync: Date.now() });
  }
  return downloadRes;
}

/**
 * Tải trực tiếp dữ liệu từ Raw Gist CDN URL không qua GitHub REST API.
 * Giúp tối ưu tốc độ và không tiêu tốn giới hạn Rate Limit 60 lượt/giờ.
 */
async function downloadFromGistPublic(
  gistId: string,
): Promise<Result<string, TranslationKey>> {
  if (!gistId) return err("github_error_missing_gist_id");

  const cacheBuster = `_t=${Date.now()}`;
  const rawCdnUrl =
    `https://gist.githubusercontent.com/raw/${gistId}/${GIST_FILE_NAME}?${cacheBuster}`;
  const rawRes = await fetchText(rawCdnUrl, { cache: "no-store" });

  if (rawRes.isErr()) {
    return err(rawRes.error);
  }
  if (!rawRes.value.trim()) {
    return err("github_error_gist_file_missing");
  }

  return ok(rawRes.value);
}

export async function deleteGist(
  gistId: string,
): Promise<Result<void, TranslationKey>> {
  const reqRes = await githubRequest(`/gists/${gistId}`, {
    method: "DELETE",
  });
  if (reqRes.isErr()) {
    return err(reqRes.error);
  }
  return ok();
}
