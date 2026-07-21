import { z } from "zod";
import {
  getAllSettings,
  getGithubToken,
  GithubUserSchema,
  updateSettings,
} from "@/core/storage.ts";
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
  if (!token) return err("toast_error");

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
    return err("toast_error");
  }

  const parsed = GithubUserSchema.safeParse(parseRes.value);
  if (!parsed.success) {
    return err("toast_error");
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
    return err("toast_error");
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
    return err("toast_error");
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
  const settings = await getAllSettings();
  let gistId = settings.gistId;

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

  const updateSettingsRes = await updateSettings({
    gistId,
    lastSync: Date.now(),
  });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }
  return ok();
}

export async function downloadFromGist(): Promise<
  Result<{ content: string; updatedAt: number }, TranslationKey>
> {
  const settings = await getAllSettings();
  let gistId = settings.gistId;

  if (!gistId) {
    const findRes = await findGistId();
    if (findRes.isErr()) {
      return err(findRes.error);
    }
    gistId = findRes.value;
    if (!gistId) {
      return err("toast_error");
    }
    const updateSettingsRes = await updateSettings({ gistId });
    if (updateSettingsRes.isErr()) {
      return err(updateSettingsRes.error);
    }
  }

  const dataRes = await githubRequest(`/gists/${gistId}`);
  if (dataRes.isErr()) {
    return err(dataRes.error);
  }
  const parsed = GistSchema.safeParse(dataRes.value);
  if (!parsed.success) {
    return err("toast_error");
  }
  const gist = parsed.data;
  const file = gist.files[GIST_FILE_NAME];
  if (!file) return err("toast_error");

  let content = "";
  if (file.content) {
    content = file.content;
  } else {
    const fetchRes = await fetchText(file.raw_url, { cache: "no-store" });
    if (fetchRes.isErr()) {
      return err(fetchRes.error);
    }
    content = fetchRes.value;
  }

  const updatedAt = new Date(gist.updated_at).getTime();
  const updateSettingsRes = await updateSettings({ lastSync: Date.now() });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }

  return ok({
    content,
    updatedAt,
  });
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
