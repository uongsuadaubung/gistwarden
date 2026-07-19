import { z } from "zod";
import {
  getAllSettings,
  getGithubToken,
  GithubUserSchema,
  updateSettings,
} from "@/shared/storage.ts";
import { APP_NAME } from "@/shared/constants.ts";

const GITHUB_API_BASE = "https://api.github.com";
const GIST_DESCRIPTION = `${APP_NAME.toLowerCase()}_vault`;
const GIST_FILE_NAME = `${APP_NAME.toLowerCase()}.json`;

const GithubErrorSchema = z.object({
  message: z.string().optional(),
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
): Promise<unknown> {
  const token = await getGithubToken();
  if (!token) throw new Error("GitHub Token is not configured");

  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errMsg = "GitHub API Error";
    try {
      const rawError = await response.json();
      const parsed = GithubErrorSchema.safeParse(rawError);
      if (parsed.success && parsed.data.message) {
        errMsg = parsed.data.message;
      }
    } catch (_e) {
      // Ignored
    }
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function validateToken(
  token: string,
): Promise<
  { success: boolean; username?: string; avatarUrl?: string; error?: string }
> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      cache: "no-store",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Invalid GitHub Token" };
    }

    const data = await response.json();
    const parsed = GithubUserSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid GitHub user profile data format",
      };
    }
    return {
      success: true,
      username: parsed.data.login,
      avatarUrl: parsed.data.avatar_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function findGistId(): Promise<string> {
  const raw = await githubRequest("/gists");
  const gists = GistArraySchema.parse(raw);
  const target = gists.find(
    (g) => g.description === GIST_DESCRIPTION && GIST_FILE_NAME in g.files,
  );
  return target ? target.id : "";
}

export async function createGist(content: string): Promise<GistType> {
  const raw = await githubRequest("/gists", {
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
  return GistSchema.parse(raw);
}

export async function updateGist(
  gistId: string,
  content: string,
): Promise<unknown> {
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAllSettings();
    let gistId = settings.gistId;

    if (!gistId) {
      gistId = await findGistId();
    }

    if (gistId) {
      await updateGist(gistId, content);
    } else {
      const gist = await createGist(content);
      gistId = gist.id;
    }

    await updateSettings({ gistId, lastSync: Date.now() });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function downloadFromGist(): Promise<
  { success: boolean; content?: string; updatedAt?: number; error?: string }
> {
  try {
    const settings = await getAllSettings();
    let gistId = settings.gistId;

    if (!gistId) {
      gistId = await findGistId();
      if (!gistId) {
        return {
          success: false,
          error: `${APP_NAME} vault not found on GitHub`,
        };
      }
      await updateSettings({ gistId });
    }

    const data = await githubRequest(`/gists/${gistId}`);
    const gist = GistSchema.parse(data);
    const file = gist.files[GIST_FILE_NAME];
    if (!file) throw new Error(`${APP_NAME} file not found in Gist`);

    const content = file.content ||
      await fetch(file.raw_url, { cache: "no-store" }).then((r) => r.text());

    const updatedAt = new Date(gist.updated_at).getTime();
    await updateSettings({ lastSync: Date.now() });

    return {
      success: true,
      content,
      updatedAt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteGist(
  gistId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await githubRequest(`/gists/${gistId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
